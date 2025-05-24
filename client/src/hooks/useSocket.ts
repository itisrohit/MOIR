import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, getSocket } from '@/socket/socket';
import { EVENTS } from '@/socket/socketEvents';
import { useAuthStore } from '@/store/authStore';
import { useChatStore, Message } from '@/store/chatStore'; // Import Message type here

interface MessageData {
  id: string;
  text: string;
  conversationId: string;
  sender: string;
  time: string;
  createdAt: string;
  read?: boolean;
}

interface UserStatusEvent {
  userId: string;
}

interface ChatUpdateEvent {
  id: string;
  lastMessage: string;
  timestamp: string;
  updatedAt: string;
}

interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

interface ReadReceiptEvent {
  conversationId: string;
  messageIds: string[];
  readBy?: string;
}

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, isAuthenticated } = useAuthStore();
  const { 
    updateChatOnlineStatus, 
    addNewMessage, 
    updateLastMessageInfo, 
    setUserTyping,
    markChatAsRead 
  } = useChatStore();
  
  // Connect socket when authenticated
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;
    
    console.log("Connecting socket in component");
    socketRef.current = connectSocket(accessToken);
    
    return () => {
      console.log("Component unmounting, managing socket connection");
      disconnectSocket(true); // Track component unmount but don't force disconnect
    };
  }, [isAuthenticated, accessToken]);
  
  // Register event handlers
  useEffect(() => {
    // Always use the global socket to ensure consistent event handling
    const socket = getSocket();
    if (!socket) {
      console.log("No socket available for event registration");
      return;
    }
    
    console.log("Registering socket event handlers");
    
    const messageHandler = (messageData: MessageData) => {
      console.log('Message received:', messageData);
      const { conversationId } = messageData;
      
      // Get current state to check for active chat
      const state = useChatStore.getState();
      const isActiveChat = state.selectedChatId === conversationId;
      const currentUserId = useAuthStore.getState().user?._id;
      
      // Transform the message to match our Message type
      const transformedMessage: Message = {
        id: messageData.id,
        text: messageData.text,
        // Correctly map the sender to either "me" or "other"
        sender: messageData.sender === currentUserId ? "me" : "other",
        time: messageData.time,
        read: messageData.read,
      };
      
      // Add read status flag to message if it's in the active chat
      const messageWithReadFlag = {
        ...transformedMessage,
        _isInActiveChat: isActiveChat 
      };
      
      // Check for duplicates
      const currentMessages = state.chatMessages[conversationId] || [];
      const messageExists = currentMessages.some(msg => msg.id === messageData.id);
      
      if (!messageExists) {
        // Add the message with the read flag
        addNewMessage(conversationId, messageWithReadFlag);
        console.log('Message added to store, active chat:', isActiveChat);
        
        // If this is the active chat, mark as read
        if (isActiveChat) {
          markChatAsRead(conversationId);
          
          setTimeout(() => {
            const currentSocket = getSocket();
            if (currentSocket) {
              console.log('Marking messages as read for active chat:', conversationId);
              currentSocket.emit(EVENTS.MESSAGE_READ, { conversationId });
            }
          }, 300);
        }
      } else {
        console.log('Duplicate message ignored:', messageData.id);
      }
    };
    
    // Create named handlers for better cleanup
    const onlineHandler = ({ userId }: UserStatusEvent) => {
      console.log('User online:', userId);
      updateChatOnlineStatus(userId, true);
    };
    
    const offlineHandler = ({ userId }: UserStatusEvent) => {
      console.log('User offline:', userId);
      updateChatOnlineStatus(userId, false);
    };
    
    const messageUpdateHandler = (data: ChatUpdateEvent) => {
      console.log('Chat update:', data);
      updateLastMessageInfo(data);
    };
    
    const typingHandler = ({ conversationId, userId, isTyping }: TypingEvent) => {
      console.log('🔵 TYPING EVENT RECEIVED:', {
        conversationId,
        userId,
        isTyping,
        currentUserId: useAuthStore.getState().user?._id,
        selectedId: useChatStore.getState().selectedChatId
      });
      setUserTyping(conversationId, userId, isTyping);
    };
    
    // Register all handlers
    socket.on(EVENTS.MESSAGE_RECEIVE, messageHandler);
    socket.on(EVENTS.USER_ONLINE, onlineHandler);
    socket.on(EVENTS.USER_OFFLINE, offlineHandler);
    socket.on(EVENTS.CHAT_MESSAGE_UPDATE, messageUpdateHandler);
    socket.on(EVENTS.USER_TYPING, typingHandler);
    
    // Add this new handler for read receipts
    const readReceiptHandler = ({ conversationId, messageIds }: ReadReceiptEvent) => {
      console.log('Messages marked as read by recipient:', messageIds);
      useChatStore.getState().updateMessageReadStatus(conversationId, messageIds);
    };
    
    // Register the handler
    socket.on(EVENTS.MESSAGE_READ_ACK, readReceiptHandler);
    
    // Clean up event handlers
    return () => {
      console.log("Cleaning up socket event handlers");
      socket.off(EVENTS.MESSAGE_RECEIVE, messageHandler);
      socket.off(EVENTS.USER_ONLINE, onlineHandler);
      socket.off(EVENTS.USER_OFFLINE, offlineHandler);
      socket.off(EVENTS.CHAT_MESSAGE_UPDATE, messageUpdateHandler);
      socket.off(EVENTS.USER_TYPING, typingHandler);
      socket.off(EVENTS.MESSAGE_READ_ACK, readReceiptHandler);
    };
  }, [updateChatOnlineStatus, addNewMessage, updateLastMessageInfo, setUserTyping, markChatAsRead]);
  
  // Function to send typing status
  const sendTypingStatus = useCallback((conversationId: string, isTyping: boolean) => {
    if (!socketRef.current) return;
    
    console.log('Sending typing status:', isTyping, 'for', conversationId);
    socketRef.current.emit(EVENTS.USER_TYPING, {
      conversationId,
      isTyping
    });
  }, []);
  
  // Function to mark messages as read
  const markMessagesAsRead = useCallback((conversationId: string) => {
    if (!socketRef.current) return;
    
    console.log('Marking messages as read in:', conversationId);
    socketRef.current.emit(EVENTS.MESSAGE_READ, {
      conversationId
    });
    
    // Also update local state
    markChatAsRead(conversationId);
  }, [markChatAsRead]);

  return {
    socket: socketRef.current,
    sendTypingStatus,
    markMessagesAsRead 
  };
};

export default useSocket;