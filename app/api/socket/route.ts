import { Server as NetServer } from 'http';
import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Global variable to hold our Socket.io instance
let io: SocketIOServer | undefined;

// Socket.io event handlers
function initSocketServer(server: NetServer) {
  if (io) return io;

  // Create a new Socket.io server
  io = new SocketIOServer(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    }
  });

  // Socket.io connection handler
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle joining a conversation
    socket.on('join-conversation', (conversationId: string) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
    });

    // Handle leaving a conversation
    socket.on('leave-conversation', (conversationId: string) => {
      socket.leave(conversationId);
      console.log(`Socket ${socket.id} left conversation: ${conversationId}`);
    });

    // Handle sending a message
    socket.on('send-message', ({ conversationId, message }) => {
      // Broadcast the message to all users in the conversation
      io?.to(conversationId).emit('new-message', message);
    });

    // Handle typing indicators
    socket.on('typing', ({ conversationId, userId }) => {
      socket.broadcast.to(conversationId).emit('user-typing', { userId });
    });

    // Handle when a user stops typing
    socket.on('stop-typing', ({ conversationId, userId }) => {
      socket.broadcast.to(conversationId).emit('user-stop-typing', { userId });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export async function GET(req: NextRequest) {
  // Check if the user is authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  // For Socket.io implementation, we can't directly use this endpoint
  // Socket.io will be initialized via middleware or a custom server setup
  return new Response('Socket.io server is running', { status: 200 });
} 