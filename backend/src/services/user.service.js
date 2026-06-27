const User = require('../models/User');
const { HTTP_STATUS } = require('../constants');
const { formatUserResponse } = require('../helpers');

class UserService {
  /**
   * Search users by username or display name.
   * Supports partial matching, case-insensitive.
   * Excludes the current user from results.
   *
   * @param {string} query - Search query string.
   * @param {string} currentUserId - Current user's ID to exclude from results.
   * @param {number} [limit=20] - Maximum number of results.
   * @returns {Promise<Object[]>} Array of matching users.
   */
  async searchUsers(query, currentUserId, limit = 20) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const sanitizedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { username: { $regex: sanitizedQuery, $options: 'i' } },
        { displayName: { $regex: sanitizedQuery, $options: 'i' } },
      ],
    })
      .select('username displayName profilePicture isOnline lastSeen')
      .limit(limit)
      .lean();

    return users;
  }

  /**
   * Get a user's profile by ID.
   * @param {string} userId - The user's MongoDB _id.
   * @returns {Promise<Object>} User profile.
   * @throws {Error} If user not found.
   */
  async getProfile(userId) {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return formatUserResponse(user);
  }

  /**
   * Update a user's profile.
   * @param {string} userId - The user's MongoDB _id.
   * @param {Object} updates - Fields to update.
   * @param {string} [updates.displayName] - New display name.
   * @param {string} [updates.bio] - New bio.
   * @param {string} [updates.profilePicture] - New profile picture URL.
   * @returns {Promise<Object>} Updated user profile.
   * @throws {Error} If user not found.
   */
  async updateProfile(userId, updates) {
    const allowedFields = ['displayName', 'bio', 'profilePicture'];
    const sanitizedUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      const error = new Error('No valid fields to update');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      error.code = 'NO_UPDATE_FIELDS';
      throw error;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: sanitizedUpdates },
      { new: true, runValidators: true },
    );

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return formatUserResponse(user);
  }

  /**
   * Set user's online status.
   * @param {string} userId - The user's MongoDB _id.
   * @param {boolean} isOnline - Online status.
   * @param {string} [socketId=''] - Socket ID (empty when offline).
   */
  async setOnlineStatus(userId, isOnline, socketId = '') {
    const update = {
      isOnline,
      socketId,
    };

    if (!isOnline) {
      update.lastSeen = new Date();
    }

    await User.findByIdAndUpdate(userId, { $set: update });
  }
}

module.exports = new UserService();
