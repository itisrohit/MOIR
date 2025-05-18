import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore, User } from '@/store/mockStore';

// Define a Message type
export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
}

// Define types needed for the chat components
export interface ChatItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  online: boolean;
  unread: number;
  messages: Message[];  // Changed from empty array to Message[]
}

export interface ChatData {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  messages: Message[];  // Changed from empty array to Message[]
}

export function useMock(initialChatId: string | null = null) {
  // Get everything from the store
  const { 
    users, 
    fetchAllUsers, 
    error, 
    chatMessages: storeChatMessages,
    unreadCounts, // Add this
    chatOrderCache,
    updateChatMessages,
    updateChatOrder,
    markChatAsRead // Add this
  } = useUserStore();
  
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [internalLoading, setInternalLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [lastSimulatedMessage, setLastSimulatedMessage] = useState<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentLoadingRef = useRef<boolean>(internalLoading);

  // Update ref whenever internalLoading changes
  useEffect(() => {
    currentLoadingRef.current = internalLoading;
  }, [internalLoading]);

  // Add a safety timeout to prevent infinite loading
  useEffect(() => {
    // Force exit loading state after 3 seconds if stuck
    timeoutRef.current = setTimeout(() => {
      if (currentLoadingRef.current) { // Use the ref here
        console.log("Forcing exit from loading state after timeout");
        setInternalLoading(false);
      }
    }, 3000);
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch users on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Only fetch users if we don't have them yet
        if (users.length === 0) {
          await fetchAllUsers();
        } else if (chatOrderCache.length > 0) {
          // If we already have a chat order, apply it to users without re-fetching
          const orderedUsers = reorderUsersByCache(users, chatOrderCache);
          useUserStore.setState({ users: orderedUsers });
        }
        setInternalLoading(false);
      } catch (err) {
        console.error("Error fetching users:", err);
        setInternalLoading(false);
      }
    };
    
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAllUsers, users.length]);

  // Helper function to reorder users based on cache
  const reorderUsersByCache = (allUsers: User[], orderCache: string[]): User[] => {
    if (orderCache.length === 0) return allUsers;
    
    // Create a copy to manipulate
    const usersCopy = [...allUsers];
    const result: User[] = [];
    
    // First add users in the order specified by cache
    for (const userId of orderCache) {
      const index = usersCopy.findIndex(user => user._id === userId);
      if (index !== -1) {
        result.push(usersCopy.splice(index, 1)[0]);
      }
    }
    
    // Then add any remaining users
    return [...result, ...usersCopy];
  };

  // Force exit loading when users are available
  useEffect(() => {
    if (users.length > 0) {
      setInternalLoading(false);
    }
  }, [users]);

  // Convert users to chat list format - now using store's messages
  const chatList: ChatItem[] = users.map((user: User) => {
    const messages = storeChatMessages[user._id] || [];
    const lastMessage = messages.length > 0 ? 
      messages[messages.length - 1].text : 
      "No messages yet";
      
    return {
      id: user._id,
      name: user.name,
      avatar: user.image,
      lastMessage,
      timestamp: messages.length > 0 ? 
        messages[messages.length - 1].time : 
        new Date(user.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      online: user.status === "online",
      unread: unreadCounts[user._id] || 0, // Use the unread count from store
      messages: messages
    };
  });

  // Set initial selected chat if initialChatId is provided
  useEffect(() => {
    console.log("initialChatId:", initialChatId);
    console.log("users loaded:", users.length);
    console.log("isInitialized:", isInitialized);
    
    if (initialChatId && users.length > 0 && !isInitialized) {
      console.log("Looking for chat with id:", initialChatId);
      const chat = chatList.find(chat => chat.id === initialChatId);
      console.log("Found chat:", chat);
      
      if (chat) {
        setSelectedChat(chat);
      } else {
        console.log("Chat not found, still setting initialized to true");
      }
      setIsInitialized(true);
    } else if (users.length > 0 && !isInitialized) {
      setIsInitialized(true);
    }
  }, [initialChatId, users, chatList, isInitialized]);

  // Handle selecting a chat - update to use replace
  const handleSelectChat = (chat: ChatItem) => {
    setChatLoading(true);
    setSelectedChat(chat);
    router.replace(`/v/chat/${chat.id}`); // Using replace as requested
    
    // Mark chat as read when selected
    if (unreadCounts[chat.id] > 0) {
      markChatAsRead(chat.id);
    }
    
    setTimeout(() => {
      setChatLoading(false);
    }, 500);
  };

  // Handle back button - update to use replace
  const handleBackButton = () => {
    setSelectedChat(null);
    router.replace("/v/chat"); // Changed from push to replace
  };

  // Wrap updateMessages in useCallback
  const updateMessagesCallback = useCallback((chatId: string, messages: Message[], isIncoming = false) => {
    updateChatMessages(chatId, messages, isIncoming);
  }, [updateChatMessages]);
  
  // Wrap updateOrder in useCallback
  const updateOrderCallback = useCallback((chatId: string) => {
    updateChatOrder(chatId);
  }, [updateChatOrder]);

  // Generate a simulated response - now using store
  useEffect(() => {
    if (!selectedChat) return;
    
    const messages = storeChatMessages[selectedChat.id] || [];
    const lastMessage = messages[messages.length - 1];
    
    // If the last message was from the user, simulate a response
    if (lastMessage && lastMessage.sender === 'me') {
      // Store a reference to our timeout
      const timer = setTimeout(() => {
        console.log("Generating response for:", lastMessage.text); // Add logging
        
        // Create a response message
        const responseMessage: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          text: `Thanks for your message: "${lastMessage.text}"`,
          sender: 'other',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        // Get current messages and add the new one
        const currentMessages = storeChatMessages[selectedChat.id] || [];
        const updatedMessages = [...currentMessages, responseMessage];
        
        console.log("Updating with response:", responseMessage); // Add logging
        
        // Use the callback versions
        updateMessagesCallback(selectedChat.id, updatedMessages);
        updateOrderCallback(selectedChat.id);
      }, 1000);
      
      // Make sure to clear the timeout when the component unmounts or the dependency changes
      return () => clearTimeout(timer);
    }
  }, [storeChatMessages, selectedChat, updateMessagesCallback, updateOrderCallback]);

  // Handle sending a message - now using store
  const handleSendMessage = useCallback((message: string) => {
    if (!selectedChat) return;
    
    // Create a new message
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text: message,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Get existing messages from the store
    const currentMessages = storeChatMessages[selectedChat.id] || [];
    const updatedMessages = [...currentMessages, newMessage];
    
    // Use the callback versions
    updateMessagesCallback(selectedChat.id, updatedMessages);
    updateOrderCallback(selectedChat.id);
  }, [selectedChat, storeChatMessages, updateMessagesCallback, updateOrderCallback]);

  // Create chat data object from selected chat - now using store messages
  const chatData: ChatData | undefined = selectedChat ? {
    id: selectedChat.id,
    name: selectedChat.name,
    avatar: selectedChat.avatar,
    online: selectedChat.online,
    messages: storeChatMessages[selectedChat.id] || []
  } : undefined;

  // Add this useEffect to periodically simulate messages from random chats
  useEffect(() => {
    // Don't run this in tests or during SSR
    if (typeof window === 'undefined') return;
    
    // Generate random messages every 15-25 seconds
    const interval = setInterval(() => {
      if (users.length === 0) return;
      
      // Don't send messages too frequently
      const now = Date.now();
      if (now - lastSimulatedMessage < 15000) return;
      
      // Pick a random user that isn't the currently selected chat
      const availableUsers = users.filter(user => !selectedChat || user._id !== selectedChat.id);
      if (availableUsers.length === 0) return;
      
      const randomIndex = Math.floor(Math.random() * availableUsers.length);
      const randomUser = availableUsers[randomIndex];
      
      // Create a random message
      const messages = [
        "Hey there! Just checking in.",
        "Did you get my email from yesterday?",
        "Are we still meeting tomorrow?",
        "I wanted to ask you about that project.",
        "Have you seen the latest update?",
        "Can we talk when you're free?",
        "Just saying hi! 👋",
        "Thought you might find this interesting.",
        "Let me know when you're available to chat.",
        "Hope you're having a good day!"
      ];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      const newMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        text: randomMessage,
        sender: 'other',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      // Update the messages for this user
      const currentMessages = storeChatMessages[randomUser._id] || [];
      const updatedMessages = [...currentMessages, newMessage];
      
      // Update messages in the store
      updateChatMessages(randomUser._id, updatedMessages, true); // Add true for isIncoming
      
      // Update chat order to move this chat to the top
      updateChatOrder(randomUser._id);
      
      // Update timestamp to prevent too frequent messages
      setLastSimulatedMessage(now);
      
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [users, selectedChat, storeChatMessages, updateChatMessages, updateChatOrder, lastSimulatedMessage]);

  return {
    chatList,
    selectedChat,
    chatData,
    loading: internalLoading,
    chatLoading,
    error,
    isInitialized,
    handleSelectChat,
    handleBackButton,
    handleSendMessage
  };
}

export default useMock;