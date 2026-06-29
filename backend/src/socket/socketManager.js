const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const getCorsOptions = require('../config/cors');
const { SOCKET_EVENTS } = require('../constants');
const registerMessageHandlers = require('./handlers/messageHandler');
const registerTypingHandlers = require('./handlers/typingHandler');
const registerPresenceHandlers = require('./handlers/presenceHandler');
const messageService = require('../services/message.service');
const User = require('../models/User');

// In-memory map of userId → socketId for fast lookups
const connectedUsers = new Map();

/**
 * Initialize Socket.IO server with authentication and event handlers.
 * @param {Object} httpServer - Node.js HTTP server instance.
 * @returns {Object} Socket.IO server instance.
 */
const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: getCorsOptions(),
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  /**
   * Socket authentication middleware.
   * Verifies JWT token before allowing connection.
   */
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('username displayName');

      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user info to socket
      socket.userId = user._id.toString();
      socket.username = user.username;
      socket.displayName = user.displayName;

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new Error('Token expired'));
      }
      return next(new Error('Authentication failed'));
    }
  });

  /**
   * Connection handler — fires for each authenticated socket.
   */
  io.on(SOCKET_EVENTS.CONNECTION, async (socket) => {
    console.log(`⚡ Socket connected: ${socket.username} (${socket.id})`);

    // Check if user already has a connection (handle multi-device)
    const existingSocketId = connectedUsers.get(socket.userId);
    if (existingSocketId && existingSocketId !== socket.id) {
      // Disconnect previous socket
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.disconnect(true);
      }
    }

    // Join personal room for targeted messages
    socket.join(socket.userId);

    // Register all event handlers
    registerPresenceHandlers(io, socket, connectedUsers);
    registerMessageHandlers(io, socket, connectedUsers);
    registerTypingHandlers(io, socket, connectedUsers);

    // Reconnection recovery: deliver pending messages
    try {
      const undeliveredMessages = await messageService.getUndeliveredMessages(socket.userId);
      if (undeliveredMessages.length > 0) {
        for (const msg of undeliveredMessages) {
          socket.emit(SOCKET_EVENTS.NEW_MESSAGE, {
            message: msg,
            chatId: msg.chatId,
          });
        }

        // Mark them as delivered
        await messageService.markAsDelivered(socket.userId);

        // Notify senders about delivery
        const senderIds = [...new Set(undeliveredMessages.map((m) => m.sender._id.toString()))];
        for (const senderId of senderIds) {
          const senderSocketId = connectedUsers.get(senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, {
              status: 'delivered',
              deliveredAt: new Date(),
              deliveredTo: socket.userId,
            });
          }
        }

        console.log(`📬 Delivered ${undeliveredMessages.length} pending messages to ${socket.username}`);
      }

      // Deliver pending edit/delete events that were queued while user was offline
      const pendingEvents = await messageService.getPendingEvents(socket.userId);
      if (pendingEvents.length > 0) {
        for (const event of pendingEvents) {
          socket.emit(event.eventType, event.payload);
        }

        // Clear pending events after delivery
        await messageService.clearPendingEvents(socket.userId);
        console.log(`📬 Delivered ${pendingEvents.length} pending events to ${socket.username}`);
      }
    } catch (error) {
      console.error('Reconnection recovery error:', error.message);
    }

    // Handle socket errors
    socket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error(`Socket error for ${socket.username}:`, error.message);
    });
  });

  console.log('🔌 Socket.IO initialized');

  return io;
};

/**
 * Get the connected users map (for external access).
 * @returns {Map} Map of userId → socketId.
 */
const getConnectedUsers = () => connectedUsers;

module.exports = {
  initializeSocket,
  getConnectedUsers,
};
