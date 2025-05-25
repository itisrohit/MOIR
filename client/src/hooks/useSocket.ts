import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, getSocket } from '@/socket/socket';
import { EVENTS } from '@/socket/socketEvents';
import { useAuthStore } from '@/store/authStore';
import { useChatStore, Message } from '@/store/chatStore'; 
import { useFriendStore } from '@/store/friendStore';

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

// First, ensure the interfaces match exactly what the server sends
interface FriendRequestEvent {
  requestId: string;
  requester: {
    _id: string;
    name: string;
    username: string;
    image: string;
    status: string;
  };
  isRead: boolean;
}

interface FriendResponseEvent {
  friendshipId: string;
  accepted: boolean;
  user: {
    _id: string;
    name: string;
    username: string;
    image: string;
    status: string;
  };
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
      // Update chat store
      updateChatOnlineStatus(userId, true);
      // Update friend store as well
      useFriendStore.getState().updateFriendStatus(userId, true);
    };
    
    const offlineHandler = ({ userId }: UserStatusEvent) => {
      console.log('User offline:', userId);
      // Update chat store
      updateChatOnlineStatus(userId, false);
      // Update friend store as well
      useFriendStore.getState().updateFriendStatus(userId, false);
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
    
    // Friend-related event handlers
    const friendRequestHandler = (data: FriendRequestEvent) => {
      console.log('Friend request received:', data);
      try {
        // Validate the incoming data has the required fields
        if (!data.requestId || !data.requester || !data.requester._id) {
          console.error('Invalid friend request data received:', data);
          return;
        }

        // Transform to match the store's expected format
        const friendRequest = {
          id: data.requestId,
          user: data.requester,
          createdAt: new Date().toISOString(),
          isRead: !!data.isRead
        };
        
        // Update the friend store
        useFriendStore.getState().addFriendRequest(friendRequest);
        
        // Force a refresh of incoming requests to ensure UI updates
        setTimeout(() => {
          useFriendStore.getState().fetchFriendRequests('incoming');
        }, 500);
      } catch (error) {
        console.error('Error processing friend request:', error);
      }
    };

    const friendResponseHandler = (data: FriendResponseEvent) => {
      console.log('Friend request response received:', data);
      try {
        // Validate incoming data
        if (!data.friendshipId) {
          console.error('Invalid friend response data:', data);
          return;
        }
        
        // Update the friend request status
        useFriendStore.getState().updateFriendRequestStatus(
          data.friendshipId, 
          data.accepted
        );
        
        // If accepted, ensure friends list is refreshed
        if (data.accepted) {
          // Force fetch friends after a short delay to ensure server has updated
          setTimeout(() => {
            useFriendStore.getState().fetchFriends();
          }, 500);
        }
        
        // Always refresh outgoing requests to keep UI in sync
        setTimeout(() => {
          useFriendStore.getState().fetchFriendRequests('outgoing');
        }, 800);
      } catch (error) {
        console.error('Error processing friend response:', error);
      }
    };

    const friendRequestSeenHandler = ({ friendshipId }: { friendshipId: string }) => {
      console.log('Friend request seen:', friendshipId);
      if (!friendshipId) {
        console.error('Invalid friendshipId in seen event');
        return;
      }
      
      // Mark request as seen in store
      useFriendStore.getState().markRequestAsSeen(friendshipId);
      
      // Update incoming requests to reflect the change
      setTimeout(() => {
        useFriendStore.getState().fetchFriendRequests('incoming');
      }, 500);
    };

    const friendNotificationsClearedHandler = () => {
      console.log('Friend notifications cleared');
      // Update local state
      useFriendStore.getState().clearAllNotifications();
      
      // Refresh all requests to ensure UI sync
      setTimeout(() => {
        useFriendStore.getState().fetchFriendRequests();
      }, 500);
    };

    // Register the friend-related event handlers
    socket.on(EVENTS.FRIEND_REQUEST_SENT, friendRequestHandler);
    socket.on(EVENTS.FRIEND_REQUEST_RESPONDED, friendResponseHandler);
    socket.on(EVENTS.FRIEND_REQUEST_SEEN, friendRequestSeenHandler);
    socket.on(EVENTS.FRIEND_NOTIFICATIONS_CLEARED, friendNotificationsClearedHandler);
    
    // Clean up event handlers
    return () => {
      console.log("Cleaning up socket event handlers");
      socket.off(EVENTS.MESSAGE_RECEIVE, messageHandler);
      socket.off(EVENTS.USER_ONLINE, onlineHandler);
      socket.off(EVENTS.USER_OFFLINE, offlineHandler);
      socket.off(EVENTS.CHAT_MESSAGE_UPDATE, messageUpdateHandler);
      socket.off(EVENTS.USER_TYPING, typingHandler);
      socket.off(EVENTS.MESSAGE_READ_ACK, readReceiptHandler);
      socket.off(EVENTS.FRIEND_REQUEST_SENT, friendRequestHandler);
      socket.off(EVENTS.FRIEND_REQUEST_RESPONDED, friendResponseHandler);
      socket.off(EVENTS.FRIEND_REQUEST_SEEN, friendRequestSeenHandler);
      socket.off(EVENTS.FRIEND_NOTIFICATIONS_CLEARED, friendNotificationsClearedHandler);
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