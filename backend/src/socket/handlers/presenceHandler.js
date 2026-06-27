const { SOCKET_EVENTS } = require('../../constants');
const userService = require('../../services/user.service');

/**
 * Handle presence (online/offline) socket events.
 * @param {Object} io - Socket.IO server instance.
 * @param {Object} socket - Connected socket instance.
 * @param {Object} connectedUsers - Map of userId → socketId.
 */
const registerPresenceHandlers = (io, socket, connectedUsers) => {
  /**
   * Handle user coming online.
   * Updates DB, adds to connected users map, broadcasts to all.
   */
  const handleOnline = async () => {
    try {
      // Update user status in database
      await userService.setOnlineStatus(socket.userId, true, socket.id);

      // Add to connected users map
      connectedUsers.set(socket.userId, socket.id);

      // Broadcast to all connected clients that this user is online
      socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, {
        userId: socket.userId,
        username: socket.username,
      });

      // Send current online users list to the connecting user
      const onlineUserIds = Array.from(connectedUsers.keys());
      socket.emit(SOCKET_EVENTS.ONLINE, {
        onlineUsers: onlineUserIds,
      });

      console.log(`🟢 User online: ${socket.username} (${socket.userId})`);
    } catch (error) {
      console.error('Presence online error:', error.message);
    }
  };

  /**
   * Handle user going offline.
   * Updates DB, removes from connected users map, broadcasts to all.
   */
  const handleOffline = async () => {
    try {
      // Update user status in database
      await userService.setOnlineStatus(socket.userId, false);

      // Remove from connected users map
      connectedUsers.delete(socket.userId);

      // Broadcast to all connected clients that this user is offline
      socket.broadcast.emit(SOCKET_EVENTS.USER_OFFLINE, {
        userId: socket.userId,
        username: socket.username,
        lastSeen: new Date(),
      });

      console.log(`🔴 User offline: ${socket.username} (${socket.userId})`);
    } catch (error) {
      console.error('Presence offline error:', error.message);
    }
  };

  // Set online on connection
  handleOnline();

  // Handle explicit disconnect
  socket.on(SOCKET_EVENTS.DISCONNECT, handleOffline);
};

module.exports = registerPresenceHandlers;
