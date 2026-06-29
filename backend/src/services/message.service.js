const Message = require('../models/Message');
const Chat = require('../models/Chat');
const chatService = require('./chat.service');
const { MESSAGE_STATUS, PAGINATION, HTTP_STATUS } = require('../constants');

class MessageService {
  /**
   * Send a message from one user to another.
   * Creates/finds the chat, creates the message, and updates the chat's last message.
   *
   * @param {string} senderId - Sender's ObjectId.
   * @param {string} receiverId - Receiver's ObjectId.
   * @param {string} text - Message content.
   * @returns {Promise<{message: Object, chat: Object}>} Created message and updated chat.
   */
  async sendMessage(senderId, receiverId, text) {
    if (senderId.toString() === receiverId.toString()) {
      const error = new Error('Cannot send a message to yourself');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      error.code = 'SELF_MESSAGE';
      throw error;
    }

    // Find or create the chat between sender and receiver
    const chat = await chatService.getOrCreateChat(senderId, receiverId);

    // Create the message
    const message = await Message.create({
      chatId: chat._id,
      sender: senderId,
      receiver: receiverId,
      message: text.trim(),
      status: MESSAGE_STATUS.SENT,
      sentAt: new Date(),
    });

    // Update the chat's last message and increment unread count for receiver
    await chatService.updateLastMessage(chat._id, senderId, receiverId, text);

    // Populate sender info for the response
    await message.populate('sender', 'username displayName profilePicture');
    await message.populate('receiver', 'username displayName profilePicture');

    return { message, chat };
  }

  /**
   * Get paginated message history for a chat between two users.
   *
   * @param {string} currentUserId - Current user's ObjectId.
   * @param {string} otherUserId - Other user's ObjectId.
   * @param {number} [page=1] - Page number.
   * @param {number} [limit=30] - Messages per page.
   * @returns {Promise<{messages: Object[], pagination: Object}>}
   */
  async getHistory(currentUserId, otherUserId, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT) {
    // Clamp limit
    limit = Math.min(limit, PAGINATION.MAX_LIMIT);

    // Find the chat
    const sortedParticipants = [currentUserId, otherUserId].sort();
    const chat = await Chat.findOne({
      participants: { $all: sortedParticipants, $size: 2 },
    });

    if (!chat) {
      return {
        messages: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({
        chatId: chat._id,
        deletedForUsers: { $ne: currentUserId },
      })
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'username displayName profilePicture')
        .populate('receiver', 'username displayName profilePicture')
        .lean(),
      Message.countDocuments({
        chatId: chat._id,
        deletedForUsers: { $ne: currentUserId },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  /**
   * Mark messages as delivered for a user.
   * Updates all 'sent' messages where the user is the receiver.
   *
   * @param {string} userId - The receiver's ObjectId.
   * @param {string} [chatId] - Optional specific chat to mark. If omitted, marks all.
   * @returns {Promise<string[]>} Array of updated message IDs.
   */
  async markAsDelivered(userId, chatId = null) {
    const query = {
      receiver: userId,
      status: MESSAGE_STATUS.SENT,
    };

    if (chatId) {
      query.chatId = chatId;
    }

    const now = new Date();
    const result = await Message.updateMany(query, {
      $set: {
        status: MESSAGE_STATUS.DELIVERED,
        deliveredAt: now,
      },
    });

    if (result.modifiedCount > 0) {
      // Get the IDs of updated messages for notification
      const updatedMessages = await Message.find({
        receiver: userId,
        status: MESSAGE_STATUS.DELIVERED,
        deliveredAt: now,
        ...(chatId ? { chatId } : {}),
      }).select('_id sender chatId');

      return updatedMessages;
    }

    return [];
  }

  /**
   * Mark all messages in a chat as read for a user.
   * Updates 'sent' and 'delivered' messages where the user is the receiver.
   *
   * @param {string} chatId - The chat's ObjectId.
   * @param {string} userId - The reader's ObjectId.
   * @returns {Promise<Object[]>} Array of updated messages with sender info.
   */
  async markAsRead(chatId, userId) {
    const now = new Date();

    // Find messages to update before updating them
    const messagesToUpdate = await Message.find({
      chatId,
      receiver: userId,
      status: { $in: [MESSAGE_STATUS.SENT, MESSAGE_STATUS.DELIVERED] },
    }).select('_id sender');

    if (messagesToUpdate.length === 0) {
      return [];
    }

    // Update all unread messages in this chat for this user
    await Message.updateMany(
      {
        chatId,
        receiver: userId,
        status: { $in: [MESSAGE_STATUS.SENT, MESSAGE_STATUS.DELIVERED] },
      },
      {
        $set: {
          status: MESSAGE_STATUS.READ,
          readAt: now,
        },
      },
    );

    // Reset unread count for this user in this chat
    await chatService.resetUnreadCount(chatId, userId);

    return messagesToUpdate;
  }

  /**
   * Get undelivered messages for a user (for reconnection recovery).
   * @param {string} userId - The user's ObjectId.
   * @returns {Promise<Object[]>} Array of undelivered messages.
   */
  async getUndeliveredMessages(userId) {
    const messages = await Message.find({
      receiver: userId,
      status: MESSAGE_STATUS.SENT,
    })
      .sort({ sentAt: 1 })
      .populate('sender', 'username displayName profilePicture')
      .lean();

    return messages;
  }

  /**
   * Edit a message's content.
   * Only the sender can edit, and only within 30 minutes.
   *
   * @param {string} messageId - Message ObjectId.
   * @param {string} userId - Requesting user's ObjectId.
   * @param {string} newText - New message content.
   * @returns {Promise<Object>} Updated message.
   */
  async editMessage(messageId, userId, newText, receiverId, chatId) {
    const message = await Message.findById(messageId);

    if (!message) {
      if (!receiverId || !chatId) {
        const error = new Error('Message not found on server. receiverId and chatId are required for relay');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        error.code = 'MESSAGE_NOT_FOUND_RELAY';
        throw error;
      }
      return {
        _id: messageId,
        message: newText.trim(),
        chatId: chatId,
        sender: { _id: userId },
        receiver: { _id: receiverId },
        edited: true,
      };
    }

    if (message.sender.toString() !== userId.toString()) {
      const error = new Error('Unauthorized to edit this message');
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      error.code = 'UNAUTHORIZED';
      throw error;
    }

    if (message.deleted) {
      const error = new Error('Cannot edit a deleted message');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      error.code = 'ALREADY_DELETED';
      throw error;
    }

    // 30 minutes validation
    const timeElapsedMs = Date.now() - new Date(message.sentAt).getTime();
    const limitMs = 30 * 60 * 1000;
    if (timeElapsedMs > limitMs) {
      const error = new Error('Message can only be edited within 30 minutes of sending');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      error.code = 'EDIT_TIMEOUT';
      throw error;
    }

    message.message = newText.trim();
    message.edited = true;
    await message.save();

    await message.populate('sender', 'username displayName profilePicture');
    await message.populate('receiver', 'username displayName profilePicture');

    return message;
  }

  /**
   * Delete a message.
   * Supports 'me' (delete for current user) and 'everyone' (delete for both).
   * Only sender can delete for everyone.
   *
   * @param {string} messageId - Message ObjectId.
   * @param {string} userId - Requesting user's ObjectId.
   * @param {string} deleteType - 'me' or 'everyone'.
   * @returns {Promise<Object>} Updated/deleted message.
   */
  async deleteMessage(messageId, userId, deleteType, receiverId, chatId) {
    const message = await Message.findById(messageId);

    if (!message) {
      if (deleteType === 'me') {
        return { _id: messageId };
      }
      if (!receiverId || !chatId) {
        const error = new Error('Message not found on server. receiverId and chatId are required for relay');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        error.code = 'MESSAGE_NOT_FOUND_RELAY';
        throw error;
      }
      return {
        _id: messageId,
        chatId: chatId,
        sender: { _id: userId },
        receiver: { _id: receiverId },
        deleted: true,
      };
    }

    if (deleteType === 'everyone') {
      if (message.sender.toString() !== userId.toString()) {
        const error = new Error('Only the sender can delete this message for everyone');
        error.statusCode = HTTP_STATUS.FORBIDDEN;
        error.code = 'UNAUTHORIZED';
        throw error;
      }

      message.message = 'This message was deleted';
      message.deleted = true;
      await message.save();
    } else if (deleteType === 'me') {
      // Add user to deletedForUsers array if not already present
      if (!message.deletedForUsers.includes(userId)) {
        message.deletedForUsers.push(userId);
        await message.save();
      }
    } else {
      const error = new Error('Invalid delete type');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      error.code = 'INVALID_DELETE_TYPE';
      throw error;
    }

    await message.populate('sender', 'username displayName profilePicture');
    await message.populate('receiver', 'username displayName profilePicture');

    return message;
  }

  /**
   * Delete a delivered message from MongoDB (called after client ACK).
   * This is the core of the relay model — once the client has saved
   * the message locally, we don't need it in the DB anymore.
   *
   * @param {string} messageId - Message ObjectId.
   */
  async deleteDeliveredMessage(messageId) {
    await Message.findByIdAndDelete(messageId);
  }

  /**
   * Bulk delete messages that have been delivered/read and are older than the threshold.
   * Safety net cleanup for any messages that weren't ACK'd individually.
   *
   * @param {number} [maxAgeHours=24] - Delete delivered messages older than this.
   */
  async cleanupOldMessages(maxAgeHours = 24) {
    const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

    // Delete delivered/read messages older than threshold
    const deliveredResult = await Message.deleteMany({
      status: { $in: [MESSAGE_STATUS.DELIVERED, MESSAGE_STATUS.READ] },
      sentAt: { $lt: cutoffDate },
    });

    // Delete all messages older than 30 days regardless of status (hard limit)
    const hardCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldResult = await Message.deleteMany({
      sentAt: { $lt: hardCutoff },
    });

    const totalDeleted = (deliveredResult.deletedCount || 0) + (oldResult.deletedCount || 0);
    if (totalDeleted > 0) {
      console.log(`🧹 Cleaned up ${totalDeleted} old messages from MongoDB`);
    }

    return totalDeleted;
  }

  /**
   * Save a pending event for an offline user.
   * When the user reconnects, these events will be delivered.
   *
   * @param {string} targetUserId - The offline user's ID.
   * @param {string} eventType - 'messageEdited' or 'messageDeleted'.
   * @param {string} messageId - The message's server ID.
   * @param {Object} payload - Event payload data.
   */
  async savePendingEvent(targetUserId, eventType, messageId, payload) {
    const PendingEvent = require('../models/PendingEvent');
    await PendingEvent.create({
      targetUserId,
      eventType,
      messageId,
      payload,
    });
  }

  /**
   * Get all pending events for a user (on reconnection).
   * @param {string} userId - The user's ObjectId.
   * @returns {Promise<Object[]>} Array of pending events.
   */
  async getPendingEvents(userId) {
    const PendingEvent = require('../models/PendingEvent');
    return PendingEvent.find({ targetUserId: userId }).sort({ createdAt: 1 }).lean();
  }

  /**
   * Clear all pending events for a user (after delivery).
   * @param {string} userId - The user's ObjectId.
   */
  async clearPendingEvents(userId) {
    const PendingEvent = require('../models/PendingEvent');
    await PendingEvent.deleteMany({ targetUserId: userId });
  }
}

module.exports = new MessageService();
