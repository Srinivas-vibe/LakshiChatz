import api from './api';

/**
 * Authentication API service.
 */
const authService = {
  /**
   * Register a new user.
   * @param {string} username
   * @param {string} displayName
   * @param {string} password
   * @returns {Promise<{user: Object, token: string}>}
   */
  register: async (username, displayName, password) => {
    const response = await api.post('/auth/register', {
      username,
      displayName,
      password,
    });
    return response.data.data;
  },

  /**
   * Login an existing user.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{user: Object, token: string}>}
   */
  login: async (username, password) => {
    const response = await api.post('/auth/login', {
      username,
      password,
    });
    return response.data.data;
  },
};

export default authService;
