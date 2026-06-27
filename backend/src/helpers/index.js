/**
 * Format user object for API responses.
 * Strips sensitive fields and normalizes output.
 * @param {Object} user - Mongoose user document.
 * @returns {Object} Sanitized user object.
 */
const formatUserResponse = (user) => {
  if (!user) {
    return null;
  }

  const userObj = user.toObject ? user.toObject() : { ...user };

  return {
    _id: userObj._id,
    username: userObj.username,
    displayName: userObj.displayName,
    bio: userObj.bio || '',
    profilePicture: userObj.profilePicture || '',
    isOnline: userObj.isOnline || false,
    lastSeen: userObj.lastSeen,
    createdAt: userObj.createdAt,
    updatedAt: userObj.updatedAt,
  };
};

/**
 * Generate a deterministic chat room ID from two user IDs.
 * Sorts IDs alphabetically so the same pair always generates the same room.
 * @param {string} userId1 - First user's ID.
 * @param {string} userId2 - Second user's ID.
 * @returns {string} Deterministic room identifier.
 */
const generateChatRoomId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

/**
 * Sanitize a string input by trimming and removing potential XSS.
 * @param {string} input - Raw input string.
 * @returns {string} Sanitized string.
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return '';
  }
  return input
    .trim()
    .replace(/[<>]/g, '') // Basic XSS prevention
    .replace(/\s+/g, ' '); // Collapse multiple whitespace
};

module.exports = {
  formatUserResponse,
  generateChatRoomId,
  sanitizeInput,
};
