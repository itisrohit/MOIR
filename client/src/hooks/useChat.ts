import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import { useSocket } from '@/hooks/useSocket'; 
import type { ChatItem, ChatData } from '@/store/chatStore';

// Create a global variable outside the component to persist across renders
// This ensures our initialization state survives component remounts
const GLOBAL_INITIALIZED = { value: false };

export function useChat(initialChatId: string | null = null) {
  const { 
    chatList, 
    chatMessages, 
    selectedChatId,   
    error,  
    fetchChatList, 
    setSelectedChat, 
    sendMessage,
    updateChatOrder,
  } = useChatStore();
  
  // Add useSocket hook to access markMessagesAsRead and the socket
  const { markMessagesAsRead } = useSocket();
  
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

  // Update your chat selection logic
  const handleSelectChat = useCallback((chat: ChatItem) => {
    console.log("Selecting chat:", chat.id);
    
    // Check if we already have messages and history for this chat
    const hasMessages = chatMessages[chat.id]?.length > 0;
    const historyFullyLoaded = useChatStore.getState().fullHistoryLoaded[chat.id];
    const needsFetching = !hasMessages || !historyFullyLoaded;
    
    // Only show loading if we need to fetch messages
    if (needsFetching) {
      setChatLoading(true);
    }
    
    // Update chat selection in store - this will trigger fetching messages
    setSelectedChat(chat.id);
    
    // Use router.replace for better navigation without remounting
    router.replace(`/v/chat/${chat.id}`);
    
    // Mark messages as read (both in store and via socket)
    markMessagesAsRead(chat.id);
    
    // Only set a timeout to clear loading if we actually set it
    if (needsFetching) {
      setTimeout(() => {
        setChatLoading(false);
      }, 500);
    }
  }, [setSelectedChat, router, markMessagesAsRead, chatMessages]);

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