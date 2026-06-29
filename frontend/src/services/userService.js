import api from './api';
import userCacheDb from '../database/userCacheDb';
import { getCachedImage } from '../utils/imageCache';

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
    const users = response.data.data.users;
    
    // Cache the returned users and their profile pictures
    if (users && users.length > 0) {
      await userCacheDb.cacheUsers(users);
      for (const user of users) {
        if (user.profilePicture) {
          // Pre-fetch/cache profile pictures in background
          getCachedImage(user.profilePicture).catch(() => {});
        }
      }
    }
    return users;
  },

  /**
   * Get the current user's profile.
   * @returns {Promise<Object>} User profile.
   */
  getMyProfile: async () => {
    const response = await api.get('/users/profile');
    const user = response.data.data.user;
    
    if (user) {
      await userCacheDb.cacheUser(user);
    }
    
    return user;
  },

  /**
   * Get a specific user's profile.
   * LOCAL-FIRST: Checks local cache before hitting the server.
   * @param {string} userId - The user's ID.
   * @returns {Promise<Object>} User profile.
   */
  getProfile: async (userId) => {
    // Check local cache first
    try {
      const cachedUser = await userCacheDb.getCachedUser(userId);
      if (cachedUser) {
        // Fetch fresh data in background to keep cache updated
        api.get(`/users/profile/${userId}`)
          .then((response) => {
            const user = response.data.data.user;
            if (user) userCacheDb.cacheUser(user);
          })
          .catch(() => {});
          
        return cachedUser;
      }
    } catch (e) {
      console.warn('Failed to read user from cache:', e.message);
    }

    // Fallback to server
    const response = await api.get(`/users/profile/${userId}`);
    const user = response.data.data.user;
    
    if (user) {
      await userCacheDb.cacheUser(user);
      if (user.profilePicture) {
        getCachedImage(user.profilePicture).catch(() => {});
      }
    }
    
    return user;
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
    const user = response.data.data.user;
    if (user) {
      await userCacheDb.cacheUser(user);
    }
    return user;
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
    const user = response.data.data.user;
    if (user) {
      await userCacheDb.cacheUser(user);
      // Pre-cache the new image
      if (user.profilePicture) {
        getCachedImage(user.profilePicture).catch(() => {});
      }
    }
    return user;
  },
};

export default userService;
