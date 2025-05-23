import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initializeSocket = () => {
  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080";
  // Don't create multiple connections
  if (socket) return socket;

  // Create socket connection
  socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  return socket;
};

export const connectSocket = (token: string) => {
  const socket = initializeSocket();
  socket.auth = { token };

  // Connect if not connected
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

export default socket;
