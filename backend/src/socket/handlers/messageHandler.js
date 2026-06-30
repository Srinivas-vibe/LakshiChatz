const { SOCKET_EVENTS } = require('../../constants');
const messageService = require('../../services/message.service');

/**
 * Handle all message-related socket events.
 * @param {Object} io - Socket.IO server instance.
 * @param {Object} socket - Connected socket instance.
 * @param {Object} connectedUsers - Map of userId → socketId.
 */
const registerMessageHandlers = (io, socket, connectedUsers) => {
  /**
   * Handle new message event.
   * Saves message to DB and emits to receiver if online.
   *
   * Payload: { receiverId, message }
   */
  socket.on(SOCKET_EVENTS.MESSAGE, async (data) => {
    try {
      const { receiverId, message, localId } = data;
      const senderId = socket.userId;

      if (!receiverId || !message || !message.trim()) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          code: 'INVALID_MESSAGE',
          message: 'Receiver ID and message content are required',
        });
        return;
      }

      if (senderId === receiverId) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          code: 'SELF_MESSAGE',
          message: 'Cannot send a message to yourself',
        });
        return;
      }

      // Save message to database
      const result = await messageService.sendMessage(senderId, receiverId, message);

      // Emit to sender (confirmation with full message data)
      socket.emit(SOCKET_EVENTS.NEW_MESSAGE, {
        message: result.message,
        chatId: result.chat._id,
        localId,
      });

      // Emit to receiver if online
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit(SOCKET_EVENTS.NEW_MESSAGE, {
          message: result.message,
          chatId: result.chat._id,
        });

        // Auto-mark as delivered since receiver is connected
        await messageService.markAsDelivered(receiverId, result.chat._id);

        // Notify sender about delivery
        socket.emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, {
          messageId: result.message._id,
          chatId: result.chat._id,
          userId: receiverId,
          status: 'delivered',
          deliveredAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Socket message error:', error.message);
      socket.emit(SOCKET_EVENTS.ERROR, {
        code: 'MESSAGE_SEND_FAILED',
        message: 'Failed to send message',
      });
    }
  });

  /**
   * Handle message delivered acknowledgment.
   * Called when receiver's client confirms message receipt.
   *
   * Payload: { messageId, chatId, senderId }
   */
  socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, async (data) => {
    try {
      const { chatId, senderId } = data;

      // Mark messages as delivered (if still in DB)
      await messageService.markAsDelivered(socket.userId, chatId);

      // Notify the original sender regardless of DB result
      const senderSocketId = connectedUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, {
          chatId,
          userId: socket.userId,
          status: 'delivered',
          deliveredAt: new Date(),
        });
      } else {
        // Queue pending event if sender offline
        await messageService.savePendingEvent(senderId, SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, null, {
          chatId,
          userId: socket.userId,
          status: 'delivered',
          deliveredAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Socket delivery error:', error.message);
    }
  });

  /**
   * Handle message seen/read event.
   * Called when receiver opens the chat and reads messages.
   *
   * Payload: { chatId, senderId }
   */
  socket.on(SOCKET_EVENTS.MESSAGE_SEEN, async (data) => {
    try {
      const { chatId, senderId } = data;

      // Mark all messages in this chat as read (if still in DB)
      await messageService.markAsRead(chatId, socket.userId);

      // Notify the sender that their messages have been read
      const senderSocketId = connectedUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, {
          chatId,
          userId: socket.userId,
          status: 'read',
          readAt: new Date(),
          readBy: socket.userId,
        });
      } else {
        // Queue pending event if sender offline
        await messageService.savePendingEvent(senderId, SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, null, {
          chatId,
          userId: socket.userId,
          status: 'read',
          readAt: new Date(),
          readBy: socket.userId,
        });
      }
    } catch (error) {
      console.error('Socket seen error:', error.message);
    }
  });

  /**
   * Handle message received ACK.
   * Client emits this after saving the message to local SQLite.
   * Server then deletes the message from MongoDB (relay model).
   *
   * Payload: { messageId }
   */
  socket.on('messageReceived', async (data) => {
    try {
      const { messageId } = data;
      if (!messageId) return;

      // Delete the message from MongoDB since client has saved it locally
      await messageService.deleteDeliveredMessage(messageId);
    } catch (error) {
      console.error('Socket messageReceived ACK error:', error.message);
    }
  });
};

module.exports = registerMessageHandlers;
