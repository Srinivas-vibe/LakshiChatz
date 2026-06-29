import api from './api';

/**
 * Message API service.
 */
const messageService = {
  /**
   * Send a message to another user.
   * @param {string} receiverId - The receiver's user ID.
   * @param {string} message - The message content.
   * @returns {Promise<Object>} Created message document.
   */
  sendMessage: async (receiverId, message) => {
    const response = await api.post('/messages/send', {
      receiverId,
      message,
    });
    return response.data.data;
  },

  /**
   * Get paginated message history with a user.
   * @param {string} userId - The other user's ID.
   * @param {number} [page=1] - Page number.
   * @param {number} [limit=30] - Messages per page.
   * @returns {Promise<{messages: Object[], pagination: Object}>}
   */
  getHistory: async (userId, page = 1, limit = 30) => {
    const response = await api.get(`/messages/history/${userId}`, {
      params: { page, limit },
    });
    return response.data.data;
  },

  /**
   * Edit a message.
   * @param {string} messageId - The message ID.
   * @param {string} message - The new message content.
   * @returns {Promise<Object>} Updated message.
   */
  editMessage: async (messageId, message, receiverId, chatId) => {
    const response = await api.put(`/messages/edit/${messageId}`, {
      message,
      receiverId,
      chatId,
    });
    return response.data.data;
  },

  /**
   * Delete a message.
   * @param {string} messageId - The message ID.
   * @param {string} deleteType - 'me' or 'everyone'.
   * @returns {Promise<Object>} Response.
   */
  deleteMessage: async (messageId, deleteType, receiverId, chatId) => {
    const response = await api.post(`/messages/delete/${messageId}`, {
      deleteType,
      receiverId,
      chatId,
    });
    return response.data.data;
  },
};

export default messageService;
