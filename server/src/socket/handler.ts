import { Server } from 'socket.io';
import { SOCKET_EVENTS } from './events';
import { User, UserStatus } from '../models/user.model';
import { AuthenticatedSocket } from './middleware';

export const registerSocketHandlers = (io: Server) => {
  io.on(SOCKET_EVENTS.CONNECTION, (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.user?._id}`);
    
    // Update user status to online
    if (socket.user?._id) {
      User.findByIdAndUpdate(
        socket.user._id,
        { status: UserStatus.ONLINE },
        { new: true }
      ).catch(console.error);
      
      // Broadcast to other users that this user is online
      socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, {
        userId: socket.user._id
      });
    }
    
    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
      console.log(`User disconnected: ${socket.user?._id}`);
      
      if (socket.user?._id) {
        await User.findByIdAndUpdate(
          socket.user._id,
          { status: UserStatus.OFFLINE },
          { new: true }
        ).catch(console.error);
        
        // Broadcast to other users that this user is offline
        socket.broadcast.emit(SOCKET_EVENTS.USER_OFFLINE, {
          userId: socket.user._id
        });
      }
    });
    
    // Add more event handlers as needed
  });
};