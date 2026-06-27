const Chat = require('../models/Chat');
const { HTTP_STATUS } = require('../constants');

class ChatService {
  /**
   * Find an existing chat or create a new one between two users.
   * @param {string} userId1 - First user's ObjectId.
   * @param {string} userId2 - Second user's ObjectId.
   * @returns {Promise<Object>} The chat document.
   */
  async getOrCreateChat(userId1, userId2) {
    if (userId1.toString() === userId2.toString()) {
      const error = new Error('Cannot create a chat with yourself');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      error.code = 'SELF_CHAT';
      throw error;
    }

    const chat = await Chat.findOrCreate(userId1, userId2);

    // Populate participants for the response
    await chat.populate('participants', 'username displayName profilePicture isOnline lastSeen');

    return chat;
  }

  /**
   * Get all chats for a user, sorted by most recent activity.
   * @param {string} userId - The user's ObjectId.
   * @returns {Promise<Object[]>} Array of chat documents with populated fields.
   */
  async getChatList(userId) {
    const chats = await Chat.getUserChats(userId);
    return chats;
  }

  /**
   * Get a specific chat between current user and another user.
   * @param {string} currentUserId - Current user's ObjectId.
   * @param {string} otherUserId - Other user's ObjectId.
   * @returns {Promise<Object|null>} The chat document or null.
   */
  async getChatByUserId(currentUserId, otherUserId) {
    if (currentUserId.toString() === otherUserId.toString()) {
      const error = new Error('Cannot get a chat with yourself');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      error.code = 'SELF_CHAT';
      throw error;
    }

    const sortedParticipants = [currentUserId, otherUserId].sort();

    const chat = await Chat.findOne({
      participants: { $all: sortedParticipants, $size: 2 },
    })
      .populate('participants', 'username displayName profilePicture isOnline lastSeen')
      .populate('lastMessage.sender', 'username displayName');

    return chat;
  }

  /**
   * Update the last message in a chat and increment unread count for receiver.
   * @param {string} chatId - The chat's ObjectId.
   * @param {string} senderId - The sender's ObjectId.
   * @param {string} receiverId - The receiver's ObjectId.
   * @param {string} messageText - The message text.
   */
  async updateLastMessage(chatId, senderId, receiverId, messageText) {
    const truncatedText = messageText.length > 100
      ? messageText.substring(0, 100) + '...'
      : messageText;

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: {
        text: truncatedText,
        sender: senderId,
        timestamp: new Date(),
      },
      [`unreadCount.${receiverId}`]: await this.getUnreadCount(chatId, receiverId) + 1,
      updatedAt: new Date(),
    });
  }

  /**
   * Get unread count for a user in a specific chat.
   * @param {string} chatId - The chat's ObjectId.
   * @param {string} userId - The user's ObjectId.
   * @returns {Promise<number>} Unread message count.
   */
  async getUnreadCount(chatId, userId) {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return 0;
    }
    return chat.unreadCount.get(userId.toString()) || 0;
  }

  /**
   * Reset unread count for a user in a specific chat.
   * @param {string} chatId - The chat's ObjectId.
   * @param {string} userId - The user's ObjectId.
   */
  async resetUnreadCount(chatId, userId) {
    await Chat.findByIdAndUpdate(chatId, {
      [`unreadCount.${userId}`]: 0,
    });
  }
}

module.exports = new ChatService();
