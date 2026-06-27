const messageService = require('../services/message.service');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants');

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
 * @desc    Get message history with a specific user
 * @access  Private
 */
const getHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 30;

  const result = await messageService.getHistory(req.userId, userId, page, limit);

  successResponse(res, result, 'Message history retrieved');
});

module.exports = {
  sendMessage,
  getHistory,
};
