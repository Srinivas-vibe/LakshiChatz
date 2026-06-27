import api from './api';

/**
 * User API service.
 */
const userService = {
  /**
   * Search users by username or display name.
   * @param {string} query - Search query.
   * @returns {Promise<Object[]>} Array of matching users.
   */
  searchUsers: async (query) => {
    const response = await api.get('/users/search', {
      params: { q: query },
    });
    return response.data.data.users;
  },

  /**
   * Get the current user's profile.
   * @returns {Promise<Object>} User profile.
   */
  getMyProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data.data.user;
  },

  /**
   * Get a specific user's profile.
   * @param {string} userId - The user's ID.
   * @returns {Promise<Object>} User profile.
   */
  getProfile: async (userId) => {
    const response = await api.get(`/users/profile/${userId}`);
    return response.data.data.user;
  },

  /**
   * Update the current user's profile.
   * @param {Object} data - Profile update data.
   * @param {string} [data.displayName] - New display name.
   * @param {string} [data.bio] - New bio.
   * @returns {Promise<Object>} Updated user profile.
   */
  updateProfile: async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data.data.user;
  },

  /**
   * Upload a profile picture.
   * @param {FormData} formData - FormData containing the file.
   * @returns {Promise<Object>} Updated user profile.
   */
  uploadProfilePicture: async (formData) => {
    const response = await api.post('/users/profile/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.user;
  },
};

export default userService;
