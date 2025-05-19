import { create } from 'zustand';
import axios from 'axios';
import { Message } from '@/hooks/useMock';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Types
export interface User {
  _id: string;
  username: string;
  email: string;
  name: string;
  status: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  image: string;
}

interface UsersResponse {
  statusCode: number;
  data: {
    success: boolean;
    users: User[];
    pagination: {
      total: number;
    }
  };
  message: string;
  success: boolean;
}

interface UserStore {
  users: User[];
  totalUsers: number;
  loading: boolean;
  error: string | null;
  chatMessages: Record<string, Message[]>; // to store messages
  chatOrderCache: string[];               //  to store chat order
  unreadCounts: Record<string, number>; //  to track unread messages
  
  fetchAllUsers: () => Promise<void>;
  clearError: () => void;
  updateChatMessages: (chatId: string, messages: Message[], isIncoming?: boolean) => void;
  updateChatOrder: (chatId: string) => void;
  markChatAsRead: (chatId: string) => void;
}

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Create the user store
export const useUserStore = create<UserStore>()((set) => ({
  users: [],
  totalUsers: 0,
  loading: false,
  error: null,
  chatMessages: {}, // Initialize empty messages object
  chatOrderCache: [], // Initialize empty order cache
  unreadCounts: {}, // Initialize empty unread counts

  fetchAllUsers: async () => {
    try {
      set({ loading: true, error: null });
      const response = await api.get<UsersResponse>('/user/all-users');
      if (response.data.success) {
        set({
          users: response.data.data.users,
          totalUsers: response.data.data.pagination.total,
          loading: false,
        });
      } else {
        set({ error: response.data.message, loading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      set({ error: errorMessage, loading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  // New function to update messages for a specific chat
  updateChatMessages: (chatId, messages, isIncoming = false) => {
    set((state) => {
      const newState: Partial<UserStore> = {
        chatMessages: {
          ...state.chatMessages,
          [chatId]: messages
        }
      };
      
      // If it's an incoming message and not the current active chat, increment unread count
      if (isIncoming) {
        newState.unreadCounts = {
          ...state.unreadCounts,
          [chatId]: (state.unreadCounts[chatId] || 0) + 1
        };
      }
      
      return newState;
    });
  },

  // New function to update chat order
  updateChatOrder: (chatId) => {
    set((state) => {
      // First get the users in current order
      const usersCopy = [...state.users];
      const currentUserIndex = usersCopy.findIndex(user => user._id === chatId);
      
      if (currentUserIndex >= 0) {
        // Move the selected chat user to top
        const currentUser = usersCopy.splice(currentUserIndex, 1)[0];
        const newUsers = [currentUser, ...usersCopy];
        
        // Update chat order cache
        const newChatOrderCache = [
          chatId,
          ...state.chatOrderCache.filter(id => id !== chatId)
        ];
        
        return {
          users: newUsers,
          chatOrderCache: newChatOrderCache
        };
      }
      
      return state;
    });
  },

  // Add a function to mark chats as read
  markChatAsRead: (chatId) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatId]: 0
      }
    }));
  }
}));

export default useUserStore;