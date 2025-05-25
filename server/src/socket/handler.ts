import { Server } from 'socket.io';
import { SOCKET_EVENTS } from './events';
import { updateUserOnlineStatus } from './services/user.service';
import { AuthenticatedSocket } from './middleware';
import { notifyConversationParticipants, notifyUser } from './service';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';
import { Types } from 'mongoose';

// Store typing status: { conversationId: { userId: boolean } }
const typingUsers = new Map<string, Record<string, boolean>>();

export const registerSocketHandlers = (io: Server) => {
  io.on(SOCKET_EVENTS.CONNECTION, (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.user?._id}`);
    
    // Update user status to online
    if (socket.user?._id) {
      const userId = socket.user._id.toString();
      updateUserOnlineStatus(userId, true)
        .catch(console.error);
    }
    
    // Handle typing indicators
    socket.on(SOCKET_EVENTS.USER_TYPING, async (data: { conversationId: string, isTyping: boolean }) => {
      try {
        const { conversationId, isTyping } = data;
        const userId = socket.user?._id.toString();
        if (!userId) return;
        
        // Initialize conversation in typing map if needed
        if (!typingUsers.has(conversationId)) {
          typingUsers.set(conversationId, {});
        }
        
        // Get users typing in this conversation
        const conversationTyping = typingUsers.get(conversationId)!;
        
        // Only notify others if status actually changed
        const statusChanged = conversationTyping[userId] !== isTyping;
        
        if (statusChanged) {
          conversationTyping[userId] = isTyping;
          
          // Find conversation to get participants
          const conversation = await Conversation.findById(conversationId);
          if (conversation) {
            // Notify other participants about typing status change
            notifyConversationParticipants(
              conversation.participants,
              userId,
              SOCKET_EVENTS.USER_TYPING,
              {
                conversationId,
                userId,
                isTyping
              }
            );
          }
        }
      } catch (error) {
        console.error("Error handling typing indicator:", error);
      }
    });
    
    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      if (socket.user?._id) {
        const userId = socket.user._id.toString();
        updateUserOnlineStatus(userId, false)
          .catch(console.error);
      }
    });
    
    // Handle read receipts
    socket.on(SOCKET_EVENTS.MESSAGE_READ, async (data) => {
      try {
        const { conversationId } = data;
        const userId = socket.user?._id.toString();
        if (!userId) return;
        
        // Find conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: { $in: [userId] }
        });
        
        if (!conversation) return;
        
        // Find other participant
        const otherParticipantId = conversation.participants.find(
          p => p.toString() !== userId
        );
        
        // Add null check before using
        if (!otherParticipantId) {
          console.error(`Could not find other participant in conversation ${conversationId}`);
          return;
        }
        
        // Get unread messages from this conversation sent by the other participant
        const messages = await Message.find({
          conversationId,
          sender: otherParticipantId, // Now safe to use
          read: false
        });
        
        // Update message read status in database
        if (messages.length > 0) {
          await Message.updateMany(
            { 
              conversationId, 
              sender: otherParticipantId,
              read: false
            },
            { read: true }
          );
          
          // Get message IDs to send back in acknowledgment
          const messageIds = messages.map(msg => (msg._id as unknown as Types.ObjectId).toString());
          
          // Send read receipt back to sender
          notifyUser(otherParticipantId.toString(), SOCKET_EVENTS.MESSAGE_READ_ACK, {
            conversationId,
            messageIds,
            readBy: userId
          });
        }
        
        // Continue with existing code to mark the conversation as read...
        const req: any = { 
          user: { _id: userId },
          params: { conversationId }  // Add this line
        };
        const res: any = { 
          status: () => ({ json: () => {} }) 
        };
        
        // Use the markMessagesAsRead function from the controller
        const markMessagesAsReadFn = require('../controllers/conversation.controller').markMessagesAsRead;
        await markMessagesAsReadFn(req, res, () => {});
        
        console.log(`Marked messages as read in conversation ${conversationId} for user ${userId}`);
      } catch (error) {
        console.error("Error processing read receipts:", error);
      }
    });
  });
};