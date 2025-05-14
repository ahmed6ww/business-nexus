const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const cookie = require('cookie');
const jwt = require('next-auth/jwt');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000; // Next.js server
const socketPort = 3001; // Socket.IO server
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store active connections
const activeConnections = new Map();

async function startServer() {
  try {
    await app.prepare();
    
    // Create HTTP server for Next.js
    const nextServer = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
    
    // Create HTTP server for Socket.IO
    const socketServer = createServer();
    const io = new Server(socketServer, {
      cors: {
        origin: process.env.NEXTAUTH_URL || `http://${hostname}:${port}`,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });
    
    // Socket.IO authentication middleware
    io.use(async (socket, next) => {
      try {
        const cookies = cookie.parse(socket.handshake.headers.cookie || '');
        const sessionToken = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'];
        
        if (!sessionToken) {
          return next(new Error('Authentication error: No session token found'));
        }
        
        // Verify token
        const secret = process.env.NEXTAUTH_SECRET;
        const token = await jwt.decode({ token: sessionToken, secret });
        
        if (!token || !token.sub) {
          return next(new Error('Authentication error: Invalid session token'));
        }
        
        // Set user on socket
        socket.userId = token.sub;
        socket.user = {
          id: token.sub,
          name: token.name || null,
          email: token.email || null,
        };
        
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });
    
    // Socket.IO connection handler
    io.on('connection', (socket) => {
      const userId = socket.userId;
      console.log(`User connected: ${userId} (${socket.id})`);
      
      // Store the socket connection
      if (!activeConnections.has(userId)) {
        activeConnections.set(userId, new Set());
      }
      activeConnections.get(userId).add(socket.id);
      
      // Join user to their own channel
      socket.join(`user:${userId}`);
      
      // Handle joining conversation rooms
      socket.on('join-conversation', (conversationId) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`User ${userId} joined conversation ${conversationId}`);
      });
      
      // Handle leaving conversation rooms
      socket.on('leave-conversation', (conversationId) => {
        socket.leave(`conversation:${conversationId}`);
        console.log(`User ${userId} left conversation ${conversationId}`);
      });
      
      // Handle sending messages
      socket.on('send-message', async (data) => {
        const { conversationId, message } = data;
        
        // Emit to all in the conversation
        io.to(`conversation:${conversationId}`).emit(
          `conversation:${conversationId}:new-message`, 
          message
        );
        
        // Also emit to all conversations (for UI updates in conversation list)
        io.emit('new-message-notification', {
          conversationId,
          message,
        });
      });
      
      // Handle read receipts
      socket.on('mark-messages-read', (data) => {
        const { conversationId } = data;
        
        // Emit to all in the conversation except sender
        socket.to(`conversation:${conversationId}`).emit(
          `conversation:${conversationId}:messages-read`,
          userId
        );
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId} (${socket.id})`);
        
        // Remove socket from stored connections
        if (activeConnections.has(userId)) {
          activeConnections.get(userId).delete(socket.id);
          
          // If no more connections, remove the user
          if (activeConnections.get(userId).size === 0) {
            activeConnections.delete(userId);
          }
        }
      });
    });
    
    // Start servers
    nextServer.listen(port, () => {
      console.log(`> Next.js server ready on http://${hostname}:${port}`);
    });
    
    socketServer.listen(socketPort, () => {
      console.log(`> Socket.IO server ready on http://${hostname}:${socketPort}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer(); 