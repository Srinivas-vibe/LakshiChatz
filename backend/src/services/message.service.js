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
        deleted: false,
      })
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'username displayName profilePicture')
        .populate('receiver', 'username displayName profilePicture')
        .lean(),
      Message.countDocuments({
        chatId: chat._id,
        deleted: false,
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
}

module.exports = new MessageService();
