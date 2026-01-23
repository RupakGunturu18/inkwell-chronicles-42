const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
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

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes
const postRoutes = require('./routes/posts');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

app.use('/api/posts', postRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

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
