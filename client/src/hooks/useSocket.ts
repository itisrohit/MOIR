import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, getSocket } from '@/socket/socket';
import { EVENTS } from '@/socket/socketEvents';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';

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
    
    const messageHandler = (messageData: any) => {
      console.log('Message received:', messageData);
      const { conversationId } = messageData;
      
      // Get current state to check for active chat
      const state = useChatStore.getState();
      const isActiveChat = state.selectedChatId === conversationId;
      
      // Add read status flag to message if it's in the active chat
      const messageWithReadFlag = {
        ...messageData,
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
    const onlineHandler = ({ userId }: {userId: string}) => {
      console.log('User online:', userId);
      updateChatOnlineStatus(userId, true);
    };
    
    const offlineHandler = ({ userId }: {userId: string}) => {
      console.log('User offline:', userId);
      updateChatOnlineStatus(userId, false);
    };
    
    const messageUpdateHandler = (data: any) => {
      console.log('Chat update:', data);
      updateLastMessageInfo(data);
    };
    
    const typingHandler = ({ conversationId, userId, isTyping }: any) => {
      console.log('User typing:', userId, isTyping, 'in', conversationId);
      setUserTyping(conversationId, userId, isTyping);
    };
    
    // Register all handlers
    socket.on(EVENTS.MESSAGE_RECEIVE, messageHandler);
    socket.on(EVENTS.USER_ONLINE, onlineHandler);
    socket.on(EVENTS.USER_OFFLINE, offlineHandler);
    socket.on(EVENTS.CHAT_MESSAGE_UPDATE, messageUpdateHandler);
    socket.on(EVENTS.USER_TYPING, typingHandler);
    
    // Clean up event handlers
    return () => {
      console.log("Cleaning up socket event handlers");
      socket.off(EVENTS.MESSAGE_RECEIVE, messageHandler);
      socket.off(EVENTS.USER_ONLINE, onlineHandler);
      socket.off(EVENTS.USER_OFFLINE, offlineHandler);
      socket.off(EVENTS.CHAT_MESSAGE_UPDATE, messageUpdateHandler);
      socket.off(EVENTS.USER_TYPING, typingHandler);
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