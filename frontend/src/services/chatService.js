import api from './api';

/**
 * Chat API service.
 */
const chatService = {
  /**
   * Get the current user's chat list.
   * @returns {Promise<Object[]>} Array of chat documents.
   */
  getChatList: async () => {
    const response = await api.get('/chat/list');
    return response.data.data.chats;
  },

  /**
   * Get or create a chat with a specific user.
   * @param {string} userId - The other user's ID.
   * @returns {Promise<Object>} Chat document.
   */
  getChatWithUser: async (userId) => {
    const response = await api.get(`/chat/${userId}`);
    return response.data.data.chat;
  },
};

export default chatService;
