const { SOCKET_EVENTS } = require('../../constants');

/**
 * Handle typing indicator socket events.
 * @param {Object} io - Socket.IO server instance.
 * @param {Object} socket - Connected socket instance.
 * @param {Object} connectedUsers - Map of userId → socketId.
 */
const registerTypingHandlers = (io, socket, connectedUsers) => {
  /**
   * Handle typing event.
   * Forwards typing indicator to the target user.
   *
   * Payload: { receiverId }
   */
  socket.on(SOCKET_EVENTS.TYPING, (data) => {
    const { receiverId } = data;

    if (!receiverId) {
      return;
    }

    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit(SOCKET_EVENTS.TYPING, {
        userId: socket.userId,
        username: socket.username,
      });
    }
  });

  /**
   * Handle stop typing event.
   * Forwards stop typing indicator to the target user.
   *
   * Payload: { receiverId }
   */
  socket.on(SOCKET_EVENTS.STOP_TYPING, (data) => {
    const { receiverId } = data;

    if (!receiverId) {
      return;
    }

    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit(SOCKET_EVENTS.STOP_TYPING, {
        userId: socket.userId,
      });
    }
  });
};

module.exports = registerTypingHandlers;
