const messageService = require('../services/message.service');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants');
const { getConnectedUsers } = require('../socket/socketManager');

/**
 * @route   POST /api/messages/send
 * @desc    Send a message to another user
 * @access  Private
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, message } = req.body;

  const result = await messageService.sendMessage(req.userId, receiverId, message);

  successResponse(res, result, 'Message sent', HTTP_STATUS.CREATED);
});

/**
 * @route   GET /api/messages/history/:userId
 * @desc    Get message history with a specific user (undelivered only in relay model)
 * @access  Private
 */
const getHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 30;

  const result = await messageService.getHistory(req.userId, userId, page, limit);

  successResponse(res, result, 'Message history retrieved');
});

/**
 * @route   PUT /api/messages/edit/:messageId
 * @desc    Edit a message
 * @access  Private
 */
const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Message content is required',
    });
  }

  const updatedMessage = await messageService.editMessage(messageId, req.userId, message);

  // Broadcast to participants via Socket.IO
  const io = req.app.get('io');
  if (io) {
    const senderId = updatedMessage.sender._id.toString();
    const receiverId = updatedMessage.receiver._id.toString();
    const eventPayload = {
      messageId: updatedMessage._id.toString(),
      chatId: updatedMessage.chatId.toString(),
      message: updatedMessage.message,
      senderId,
      receiverId,
      edited: true,
    };

    io.to(senderId).emit('messageEdited', eventPayload);
    io.to(receiverId).emit('messageEdited', eventPayload);

    // If receiver is offline, queue the event for reconnection delivery
    const connectedUsers = getConnectedUsers();
    if (!connectedUsers.has(receiverId)) {
      await messageService.savePendingEvent(receiverId, 'messageEdited', messageId, eventPayload);
    }
    // If sender is offline (edited via another device?), queue for them too
    if (!connectedUsers.has(senderId)) {
      await messageService.savePendingEvent(senderId, 'messageEdited', messageId, eventPayload);
    }
  }

  successResponse(res, updatedMessage, 'Message edited successfully');
});

/**
 * @route   POST /api/messages/delete/:messageId
 * @desc    Delete a message (for me or everyone)
 * @access  Private
 */
const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { deleteType } = req.body; // 'me' or 'everyone'

  if (!deleteType || !['me', 'everyone'].includes(deleteType)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "deleteType must be 'me' or 'everyone'",
    });
  }

  const updatedMessage = await messageService.deleteMessage(messageId, req.userId, deleteType);

  // Broadcast to participants if deleted for everyone
  if (deleteType === 'everyone') {
    const io = req.app.get('io');
    if (io) {
      const senderId = updatedMessage.sender._id.toString();
      const receiverId = updatedMessage.receiver._id.toString();
      const eventPayload = {
        messageId: updatedMessage._id.toString(),
        chatId: updatedMessage.chatId.toString(),
        senderId,
        receiverId,
        deleted: true,
      };

      io.to(senderId).emit('messageDeleted', eventPayload);
      io.to(receiverId).emit('messageDeleted', eventPayload);

      // If receiver is offline, queue the event for reconnection delivery
      const connectedUsers = getConnectedUsers();
      if (!connectedUsers.has(receiverId)) {
        await messageService.savePendingEvent(receiverId, 'messageDeleted', messageId, eventPayload);
      }
      if (!connectedUsers.has(senderId)) {
        await messageService.savePendingEvent(senderId, 'messageDeleted', messageId, eventPayload);
      }
    }
  }

  successResponse(res, { messageId, deleteType }, 'Message deleted successfully');
});

module.exports = {
  sendMessage,
  getHistory,
  editMessage,
  deleteMessage,
};

