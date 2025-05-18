import { useState, useEffect, useRef } from 'react';
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
  const { users, fetchAllUsers, error } = useUserStore();
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [internalLoading, setInternalLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentLoadingRef = useRef<boolean>(internalLoading); // Move this to component level

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
  }, []); // Empty dependency array is now fine

  // Fetch users on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchAllUsers();
        setInternalLoading(false);
      } catch (err) {
        console.error("Error fetching users:", err);
        setInternalLoading(false);
      }
    };
    
    loadData();
  }, [fetchAllUsers]);

  // Force exit loading when users are available
  useEffect(() => {
    if (users.length > 0) {
      setInternalLoading(false);
    }
  }, [users]);

  // Convert users to chat list format
  const chatList: ChatItem[] = users.map((user: User) => {
    const messages = chatMessages[user._id] || [];
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
      unread: 0,
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
      // Set to initialized even if chat isn't found to avoid getting stuck
      setIsInitialized(true);
    } else if (users.length > 0 && !isInitialized) {
      // This ensures we initialize even without an initialChatId
      setIsInitialized(true);
    }
  }, [initialChatId, users, chatList, isInitialized]);

  // Handle selecting a chat - update to show loading state
  const handleSelectChat = (chat: ChatItem) => {
    setChatLoading(true); // Start loading state
    setSelectedChat(chat);
    router.push(`/v/chat/${chat.id}`);
    
    // Simulate a short loading delay to show skeleton
    setTimeout(() => {
      setChatLoading(false); // End loading state
    }, 500);
  };

  // Handle back button
  const handleBackButton = () => {
    setSelectedChat(null);
    router.push("/v/chat");
  };

  // Handle sending a message (now with actual message storage)
  const handleSendMessage = (message: string) => {
    if (!selectedChat) return;
    
    // Create a new message
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text: message,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Update messages for this chat
    setChatMessages(prev => {
      const chatId = selectedChat.id;
      const updatedMessages = [...(prev[chatId] || []), newMessage];
      
      return {
        ...prev,
        [chatId]: updatedMessages
      };
    });
  };

  // Generate a simulated response (optional - for a more realistic chat experience)
  useEffect(() => {
    if (!selectedChat) return;
    
    const messages = chatMessages[selectedChat.id] || [];
    const lastMessage = messages[messages.length - 1];
    
    // If the last message was from the user, simulate a response
    if (lastMessage && lastMessage.sender === 'me') {
      const timer = setTimeout(() => {
        // Create a response message
        const responseMessage: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          text: `Thanks for your message: "${lastMessage.text}"`,
          sender: 'other',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        // Add the response to messages
        setChatMessages(prev => {
          const chatId = selectedChat.id;
          const updatedMessages = [...(prev[chatId] || []), responseMessage];
          
          return {
            ...prev,
            [chatId]: updatedMessages
          };
        });
      }, 1000); // 1 second delay for "typing"
      
      return () => clearTimeout(timer);
    }
  }, [chatMessages, selectedChat]);

  // Create chat data object from selected chat
  const chatData: ChatData | undefined = selectedChat ? {
    id: selectedChat.id,
    name: selectedChat.name,
    avatar: selectedChat.avatar,
    online: selectedChat.online,
    messages: chatMessages[selectedChat.id] || []
  } : undefined;

  return {
    chatList,
    selectedChat,
    chatData,
    loading: internalLoading,
    chatLoading, // Add this to the returned object
    error,
    isInitialized,
    handleSelectChat,
    handleBackButton,
    handleSendMessage
  };
}

export default useMock;