import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import type { ChatItem, ChatData } from '@/store/chatStore';

// Create a global variable outside the component to persist across renders
// This ensures our initialization state survives component remounts
const GLOBAL_INITIALIZED = { value: false };

export function useChat(initialChatId: string | null = null) {
  const { 
    chatList, 
    chatMessages, 
    selectedChatId,
    unreadCounts,      
    error,  
    fetchChatList, 
    setSelectedChat, 
    sendMessage,
    markChatAsRead,
    updateChatOrder,
  } = useChatStore();
  
  // Use the global initialization state
  const hasInitializedRef = useRef<boolean>(GLOBAL_INITIALIZED.value);
  const [internalLoading, setInternalLoading] = useState(!GLOBAL_INITIALIZED.value);
  const [chatLoading, setChatLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(GLOBAL_INITIALIZED.value);
  const router = useRouter();
  
  // Safety timeout refs
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentLoadingRef = useRef<boolean>(internalLoading);

  // Update ref whenever internalLoading changes
  useEffect(() => {
    currentLoadingRef.current = internalLoading;
  }, [internalLoading]);

  // Safety timeout
  useEffect(() => {
    if (internalLoading) {
      timeoutRef.current = setTimeout(() => {
        if (currentLoadingRef.current) {
          console.log("Forcing exit from loading state after timeout");
          setInternalLoading(false);
          GLOBAL_INITIALIZED.value = true;
        }
      }, 3000);
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [internalLoading]);

  // Initialize only once globally
  useEffect(() => {
    const initialize = async () => {
      try {
        if (!hasInitializedRef.current) {
          console.log("Initializing chat, fetching chat list (once)...");
          await fetchChatList();
          
          // If we have an initialChatId from props, respect that over stored state
          // This ensures URL-based navigation works correctly
          if (initialChatId) {
            console.log("Setting initial chat ID from URL:", initialChatId);
            setSelectedChat(initialChatId);
          } else if (window.location.pathname === '/v/chat') {
            // Reset selected chat when at root chat URL
            console.log("At root chat URL, resetting selected chat");
            setSelectedChat(null);
          }
          
          hasInitializedRef.current = true;
          GLOBAL_INITIALIZED.value = true;
          setIsInitialized(true);
          setInternalLoading(false);
        }
      } catch (err) {
        console.error("Error initializing chat:", err);
        setInternalLoading(false);
      }
    };
    
    initialize();
  }, [fetchChatList, initialChatId, setSelectedChat]);

  // Force exit loading when chatList is available
  useEffect(() => {
    if (chatList.length > 0 && !isInitialized) {
      setInternalLoading(false);
      setIsInitialized(true);
      GLOBAL_INITIALIZED.value = true;
    }
  }, [chatList, isInitialized]);

  // Selected chat data memoized
  const selectedChat = useMemo(() => 
    chatList.find(chat => chat.id === selectedChatId),
    [chatList, selectedChatId]
  );

  // Chat data for the selected chat
  const chatData: ChatData | undefined = useMemo(() => {
    if (!selectedChat) return undefined;
    
    const messages = chatMessages[selectedChat.id] || [];
    const lastMessage = messages.length > 0 ? 
      messages[messages.length - 1].text : 
      selectedChat.lastMessage || "No messages yet";
    
    return {
      id: selectedChat.id,
      name: selectedChat.name,
      avatar: selectedChat.avatar,
      online: selectedChat.online,
      messages: messages,
      otherUserId: selectedChat.otherUserId,
      lastMessage
    };
  }, [selectedChat, chatMessages]);

  // Optimized chat selection
  const handleSelectChat = useCallback((chat: ChatItem) => {
    console.log("Selecting chat:", chat.id);
    
    // Only show loading if we don't already have messages for this chat
    const hasMessages = chatMessages[chat.id]?.length > 0;
    
    // Set loading only if needed
    if (!hasMessages) {
      setChatLoading(true);
    }
    
    // Update chat selection in store - messages will only be fetched if needed
    setSelectedChat(chat.id);
    
    // Use router.replace for better navigation without remounting
    router.replace(`/v/chat/${chat.id}`);
    
    // Mark as read if needed
    if (unreadCounts[chat.id] > 0) {
      markChatAsRead(chat.id);
    }
    
    // Remove loading state after a short delay if needed
    if (!hasMessages) {
      setTimeout(() => {
        setChatLoading(false);
      }, 300);
    }
  }, [setSelectedChat, router, markChatAsRead, unreadCounts, chatMessages]);

  return {
    chatList,
    selectedChat,
    chatData,
    loading: internalLoading,
    chatLoading,
    error, 
    isInitialized,
    handleSelectChat,
    handleBackButton: useCallback(() => {
      setSelectedChat(null);
      router.replace("/v/chat");
    }, [setSelectedChat, router]),
    handleSendMessage: useCallback((message: string) => {
      if (selectedChatId) {
        sendMessage(selectedChatId, message);
        updateChatOrder(selectedChatId);
      }
    }, [selectedChatId, sendMessage, updateChatOrder])
  };
}

export default useChat;