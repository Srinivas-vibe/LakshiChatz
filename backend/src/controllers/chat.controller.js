const chatService = require('../services/chat.service');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/chat/list
 * @desc    Get all conversations for current user
 * @access  Private
 */
const getChatList = asyncHandler(async (req, res) => {
  const chats = await chatService.getChatList(req.userId);

  successResponse(res, { chats }, 'Chat list retrieved');
});

/**
 * @route   GET /api/chat/:userId
 * @desc    Get or create a chat with a specific user
 * @access  Private
 */
const getChatWithUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Get or create the chat
  const chat = await chatService.getOrCreateChat(req.userId, userId);

  successResponse(res, { chat }, 'Chat retrieved');
});

module.exports = {
  getChatList,
  getChatWithUser,
};
