const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
app.use(compression());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Simple request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.log(`[SLOW REQUEST] ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
  });
  next();
});

// MongoDB connection
mongoose.set('bufferCommands', false);

mongoose.connection.on('error', err => {
  console.log('MongoDB connection error:', err);
  if (err.name === 'MongooseServerSelectionError') {
    console.error('\n[CRITICAL] Could not connect to MongoDB Atlas.');
    console.error('This is likely an IP Whitelist issue. Please ensure your current IP is added to your Atlas cluster settings.');
    console.error('Visit: https://www.mongodb.com/docs/atlas/security-whitelist/\n');
  }
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB successfully connected');
});

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
})
  .catch(err => {
    // Initial connection error is handled by the 'error' listener as well
  });

// Routes
const postRoutes = require('./routes/posts');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const templateRoutes = require('./routes/template.routes');
const folderRoutes = require('./routes/folder.routes');

app.use('/api/posts', postRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/folders', folderRoutes);

// Socket.IO
const activeUsers = new Map(); // userId -> socketId

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    socket.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);

  // Store active user
  activeUsers.set(socket.userId, socket.id);

  // Notify others that user is online
  socket.broadcast.emit('user_online', { userId: socket.userId });

  // Join user's personal room
  socket.join(socket.userId);

  // Handle sending messages
  socket.on('send_message', async (data) => {
    const { receiverId, content } = data;

    // Emit to receiver if they're online
    const receiverSocketId = activeUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', {
        senderId: socket.userId,
        content,
        createdAt: new Date()
      });
    }
  });

  // Handle joining a conversation room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.userId} joined room ${roomId}`);
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { receiverId } = data;
    const receiverSocketId = activeUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', { userId: socket.userId });
    }
  });

  socket.on('stop_typing', (data) => {
    const { receiverId } = data;
    const receiverSocketId = activeUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_stop_typing', { userId: socket.userId });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
    activeUsers.delete(socket.userId);

    // Notify others that user is offline
    socket.broadcast.emit('user_offline', { userId: socket.userId });
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
