import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket } from '@/socket/socket';
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
    
    socketRef.current = connectSocket(accessToken);
    
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, accessToken]);
  
  // Register event handlers
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    
    // Handle other users coming online
    socket.on(EVENTS.USER_ONLINE, ({ userId }) => {
      console.log('User online:', userId);
      updateChatOnlineStatus(userId, true);
    });
    
    // Handle other users going offline
    socket.on(EVENTS.USER_OFFLINE, ({ userId }) => {
      console.log('User offline:', userId);
      updateChatOnlineStatus(userId, false);
    });
    
    // Handle incoming messages with IMPROVED read status handling
    socket.on(EVENTS.MESSAGE_RECEIVE, (messageData) => {
      console.log('Message received:', messageData);
      const { conversationId } = messageData;
      
      // Get current state to check for active chat
      const state = useChatStore.getState();
      const isActiveChat = state.selectedChatId === conversationId;
      
      // Add read status flag to message if it's in the active chat
      const messageWithReadFlag = {
        ...messageData,
        // This flag tells addNewMessage NOT to increment the unread count
        _isInActiveChat: isActiveChat 
      };
      
      // Check for duplicates
      const currentMessages = state.chatMessages[conversationId] || [];
      const messageExists = currentMessages.some(msg => msg.id === messageData.id);
      
      if (!messageExists) {
        // Add the message with the read flag
        addNewMessage(conversationId, messageWithReadFlag);
        
        // If this is the active chat, mark as read AFTER adding the message
        if (isActiveChat) {
          // Immediately mark as read in local state
          markChatAsRead(conversationId);
          
          // Send socket event with a small delay to avoid race conditions
          setTimeout(() => {
            console.log('Auto-marking message as read for active chat:', conversationId);
            if (socketRef.current) {
              socketRef.current.emit(EVENTS.MESSAGE_READ, {
                conversationId
              });
            }
          }, 300);
        }
      } else {
        console.log('Ignoring duplicate message:', messageData.id);
      }
    });
    
    // Handle chat updates (last message, timestamp, etc.)
    socket.on(EVENTS.CHAT_MESSAGE_UPDATE, (chatUpdateData) => {
      console.log('Chat update:', chatUpdateData);
      updateLastMessageInfo(chatUpdateData);
    });
    
    // Handle typing indicators
    socket.on(EVENTS.USER_TYPING, ({ conversationId, userId, isTyping }) => {
      console.log('User typing:', userId, isTyping, 'in', conversationId);
      setUserTyping(conversationId, userId, isTyping);
    });
    
    // Clean up event handlers
    return () => {
      socket.off(EVENTS.USER_ONLINE);
      socket.off(EVENTS.USER_OFFLINE);
      socket.off(EVENTS.MESSAGE_RECEIVE);
      socket.off(EVENTS.CHAT_MESSAGE_UPDATE);
      socket.off(EVENTS.USER_TYPING);
    };
  }, [updateChatOnlineStatus, addNewMessage, updateLastMessageInfo, setUserTyping]);
  
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