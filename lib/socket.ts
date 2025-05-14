import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';

// This should match the URL of your socket.io server
let socket: Socket | null = null;

export const initSocket = () => {
  if (!socket) {
    // Connect to the Socket.IO server
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket?.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
  }
  
  return socket;
};

export const useSocket = () => {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  useEffect(() => {
    // Initialize the socket
    const socket = initSocket();
    setSocketInstance(socket);

    // Cleanup function
    return () => {
      // We don't disconnect the socket on component unmount
      // as it should be reused across the app
    };
  }, []);

  return socketInstance;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
}; 