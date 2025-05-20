import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Types
export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
  createdAt?: string;
}

export interface ChatItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  online: boolean;
  unread: number;
  otherUserId: string;
  updatedAt: string;
  type: string;
}

export interface ChatData {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  messages: Message[];
  otherUserId: string;
  lastMessage?: string;
}

interface Conversation {
  id: string;
  participants: string[];
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  type: string;
}

interface ChatListResponse {
  statusCode: number;
  data: {
    success: boolean;
    data: ChatItem[];
  };
  message: string;
  success: boolean;
}

interface SendMessageResponse {
  statusCode: number;
  data: {
    success: boolean;
    data: {
      message: Message;
      conversationId: string;
      conversation: Conversation | null;
    }
  };
  message: string;
  success: boolean;
}

interface GetMessagesResponse {
  statusCode: number;
  data: {
    success: boolean;
    data: Message[];
  };
  message: string;
  success: boolean;
}

interface ChatStore {
  // State
  chatList: ChatItem[];
  chatMessages: Record<string, Message[]>;
  selectedChatId: string | null;
  loading: boolean;
  chatLoading: boolean;
  error: string | null;
  unreadCounts: Record<string, number>;
  chatOrderCache: string[];  // Added to match mockStore
  
  // Actions
  fetchChatList: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  setSelectedChat: (chatId: string | null) => void;
  markChatAsRead: (chatId: string) => void;
  clearError: () => void;
  updateChatOrder: (chatId: string) => void;  // Added to match mockStore
}

// Create the chat store
export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  chatList: [],
  chatMessages: {},
  selectedChatId: null,
  loading: false,
  chatLoading: false,
  error: null,
  unreadCounts: {},
  chatOrderCache: [],  // Added to match mockStore

  // Fetch chat list from API
  fetchChatList: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get<ChatListResponse>('/conversation/chatlist');
      
      if (response.data.success) {
        const chats = response.data.data.data;
        
        // Create unread counts from fetched chats
        const unreadCounts: Record<string, number> = {};
        chats.forEach(chat => {
          unreadCounts[chat.id] = chat.unread;
        });
        
        set({
          chatList: chats,
          unreadCounts,
          loading: false
        });
      } else {
        set({ error: response.data.message, loading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch chat list';
      set({ error: errorMessage, loading: false });
    }
  },

  // Fetch messages for a specific chat
  fetchMessages: async (chatId: string) => {
    try {
      set({ chatLoading: true, error: null });
      
      // Make API call to get messages for this chat
      const response = await api.get<GetMessagesResponse>(`/conversation/get/${chatId}`);
      
      if (response.data.success) {
        set(state => ({
          chatMessages: {
            ...state.chatMessages,
            [chatId]: response.data.data.data
          },
          chatLoading: false
        }));
      } else {
        set({ error: response.data.message, chatLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch messages';
      set({ error: errorMessage, chatLoading: false });
    }
  },

  // Send a message
  sendMessage: async (chatId: string, text: string) => {
    try {
      // First add the message optimistically to UI
      const tempId = `temp-${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        text,
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      // Update local state first for instant feedback
      set(state => {
        const currentMessages = state.chatMessages[chatId] || [];
        
        // Update messages
        return {
          chatMessages: {
            ...state.chatMessages,
            [chatId]: [...currentMessages, tempMessage]
          }
        };
      });
      
      // Then send to API
      const response = await api.post<SendMessageResponse>(
        `/conversation/send/${chatId}`,
        { text }
      );
      
      if (response.data.success) {
        // Update with the real message from the server response
        const sentMessage = response.data.data.data.message;
        
        set(state => {
          // Get current messages
          const currentMessages = state.chatMessages[chatId] || [];
          
          // Find and replace the temp message with the real one
          const updatedMessages = currentMessages.map(msg => 
            msg.id === tempId ? sentMessage : msg
          );
          
          // Update the chat list to show the latest message
          const updatedChatList = state.chatList.map(chat => {
            if (chat.id === chatId) {
              return {
                ...chat,
                lastMessage: text,
                timestamp: sentMessage.time,
                updatedAt: sentMessage.createdAt || new Date().toISOString()
              };
            }
            return chat;
          });
          
          // Sort chats by updatedAt
          updatedChatList.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          
          // Update chat order cache
          const newChatOrderCache = [
            chatId,
            ...state.chatOrderCache.filter(id => id !== chatId)
          ];
          
          return {
            chatMessages: {
              ...state.chatMessages,
              [chatId]: updatedMessages
            },
            chatList: updatedChatList,
            chatOrderCache: newChatOrderCache
          };
        });
        
        // Also update the chat order
        get().updateChatOrder(chatId);
        
      } else {
        set({ error: response.data.message });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      set({ error: errorMessage });
    }
  },

  // Set the selected chat
  setSelectedChat: (chatId: string | null) => {
    // First set the selected chat ID to update the UI immediately
    set({ selectedChatId: chatId });

    // Then handle message loading and read states
    if (chatId) {
      // Mark as read
      set(state => ({
        unreadCounts: {
          ...state.unreadCounts,
          [chatId]: 0
        },
        // Also update the chatList
        chatList: state.chatList.map(chat => 
          chat.id === chatId 
            ? { ...chat, unread: 0 } 
            : chat
        )
      }));

      // Only fetch messages if we don't already have them cached
      if (!get().chatMessages[chatId] || get().chatMessages[chatId].length === 0) {
        get().fetchMessages(chatId);
      }
    }
  },

  // Mark a chat as read
  markChatAsRead: (chatId: string) => {
    set(state => ({
      // Update the unreadCounts object
      unreadCounts: {
        ...state.unreadCounts,
        [chatId]: 0
      },
      // ALSO update the unread count in the chatList items
      chatList: state.chatList.map(chat => 
        chat.id === chatId 
          ? { ...chat, unread: 0 } 
          : chat
      )
    }));
    
  },
  
  // Update chat order - similar to mockStore's updateChatOrder
  updateChatOrder: (chatId: string) => {
    set(state => {
      const chatList = [...state.chatList];
      const currentChatIndex = chatList.findIndex(chat => chat.id === chatId);
      
      if (currentChatIndex >= 0) {
        // Move the selected chat to top
        const currentChat = chatList.splice(currentChatIndex, 1)[0];
        const newChatList = [currentChat, ...chatList];
        
        // Update chat order cache
        const newChatOrderCache = [
          chatId,
          ...state.chatOrderCache.filter(id => id !== chatId)
        ];
        
        return {
          chatList: newChatList,
          chatOrderCache: newChatOrderCache
        };
      }
      
      return state;
    });
  },

  // Clear any errors
  clearError: () => {
    set({ error: null });
  }
}));

export default useChatStore;