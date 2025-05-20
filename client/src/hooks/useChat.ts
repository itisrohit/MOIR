import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import type { ChatItem, ChatData } from '@/store/chatStore';

export function useChat(initialChatId: string | null = null) {
  const { 
    chatList, 
    chatMessages, 
    selectedChatId,
    unreadCounts,      
    chatOrderCache,
    error,  
    fetchChatList, 
    setSelectedChat, 
    sendMessage,
    markChatAsRead,
    updateChatOrder,
    
  } = useChatStore();
  
  // Add states to match useMock
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [internalLoading, setInternalLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const router = useRouter();
  
  // Refs for safety timeouts (like in useMock)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentLoadingRef = useRef<boolean>(internalLoading);

  // Update ref whenever internalLoading changes (like in useMock)
  useEffect(() => {
    currentLoadingRef.current = internalLoading;
  }, [internalLoading]);

  // Add a safety timeout to prevent infinite loading (like in useMock)
  useEffect(() => {
    // Force exit loading state after 3 seconds if stuck
    timeoutRef.current = setTimeout(() => {
      if (currentLoadingRef.current) {
        console.log("Forcing exit from loading state after timeout");
        setInternalLoading(false);
      }
    }, 3000);
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Initialize: fetch chat list and set initial chat if provided
  useEffect(() => {
    const initialize = async () => {
      try {
        if (!isInitialized) {
          console.log("Initializing chat, fetching chat list...");
          await fetchChatList();
          
          if (initialChatId) {
            console.log("Setting initial chat ID:", initialChatId);
            setSelectedChat(initialChatId);
          }
          
          setIsInitialized(true);
          setInternalLoading(false);
        }
      } catch (err) {
        console.error("Error initializing chat:", err);
        setInternalLoading(false);
      }
    };
    
    initialize();
  }, [fetchChatList, initialChatId, isInitialized, setSelectedChat]);

  // Force exit loading when chatList is available (like in useMock)
  useEffect(() => {
    if (chatList.length > 0) {
      setInternalLoading(false);
    }
  }, [chatList]);

  // Log chat selection for debugging (like in useMock)
  useEffect(() => {
    console.log("selectedChatId:", selectedChatId);
    console.log("chats loaded:", chatList.length);
    console.log("isInitialized:", isInitialized);
    console.log("chatOrderCache:", chatOrderCache); // Log the cache for debugging
    console.log("unreadCounts:", unreadCounts);     // Log unread counts for debugging
    
    if (selectedChatId && chatList.length > 0) {
      const current = chatList.find(chat => chat.id === selectedChatId);
      console.log("Current selected chat:", current);
      if (current) {
        console.log("Last message:", current.lastMessage);
      }
    }
  }, [selectedChatId, chatList, isInitialized, chatOrderCache, unreadCounts]);

  // Selected chat data
  const selectedChat = useMemo(() => 
    chatList.find(chat => chat.id === selectedChatId),
    [chatList, selectedChatId]
  );

  // Chat data for the selected chat
  const chatData: ChatData | undefined = useMemo(() => {
    if (!selectedChat) return undefined;
    
    // Get messages for this chat
    const messages = chatMessages[selectedChat.id] || [];
    
    // Get the last message
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
      lastMessage // Add lastMessage to chatData
    };
  }, [selectedChat, chatMessages]);

  // Handle selecting a chat - with explicit unreadCounts check
  const handleSelectChat = useCallback((chat: ChatItem) => {
    console.log("Selecting chat:", chat.id, "with last message:", chat.lastMessage);
    setChatLoading(true);
    setSelectedChat(chat.id);
    router.replace(`/v/chat/${chat.id}`);
    
    // Check unread count and mark as read if needed
    if (unreadCounts[chat.id] > 0) {
      console.log(`Marking chat ${chat.id} as read (unread count: ${unreadCounts[chat.id]})`);
      markChatAsRead(chat.id);
    }
    
    // Add delay for loading animation like in useMock
    setTimeout(() => {
      setChatLoading(false);
    }, 500);
  }, [setSelectedChat, router, markChatAsRead, unreadCounts]);

  // Handle going back
  const handleBackButton = useCallback(() => {
    console.log("Going back to chat list");
    setSelectedChat(null);
    router.replace("/v/chat");
  }, [setSelectedChat, router]);

  // Handle sending a message with explicit chat order update
  const handleSendMessage = useCallback((message: string) => {
    if (selectedChatId) {
      console.log("Sending message:", message, "to chat:", selectedChatId);
      sendMessage(selectedChatId, message);
      
      // Update last message in UI immediately for better UX
      const selectedChatIndex = chatList.findIndex(chat => chat.id === selectedChatId);
      if (selectedChatIndex !== -1) {
        console.log(`Updating lastMessage for chat ${selectedChatId} to: ${message}`);
      }
      
      // Explicitly update chat order when sending a message
      console.log(`Updating chat order for ${selectedChatId}`);
      updateChatOrder(selectedChatId);
    }
  }, [selectedChatId, sendMessage, updateChatOrder, chatList]);

  // Return the same interface as useMock, including unreadCounts
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

export default useChat;