import { getDatabase } from './localDb';

/**
 * User profile cache database operations.
 * Caches user profiles locally to avoid repeated API calls.
 */
const userCacheDb = {
  /**
   * Cache a user profile.
   * @param {Object} user - User object.
   */
  cacheUser: async (user) => {
    if (!user || !user._id) return;

    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO user_cache
        (user_id, username, display_name, profile_picture, bio, is_online, last_seen, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))`,
      [
        user._id,
        user.username || '',
        user.displayName || '',
        user.profilePicture || '',
        user.bio || '',
        user.isOnline ? 1 : 0,
        user.lastSeen || null,
      ]
    );
  },

  /**
   * Cache multiple users at once.
   * @param {Object[]} users - Array of user objects.
   */
  cacheUsers: async (users) => {
    if (!users || users.length === 0) return;

    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      for (const user of users) {
        if (!user || !user._id) continue;
        await db.runAsync(
          `INSERT OR REPLACE INTO user_cache
            (user_id, username, display_name, profile_picture, bio, is_online, last_seen, cached_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))`,
          [
            user._id,
            user.username || '',
            user.displayName || '',
            user.profilePicture || '',
            user.bio || '',
            user.isOnline ? 1 : 0,
            user.lastSeen || null,
          ]
        );
      }
    });
  },

  /**
   * Get a cached user profile.
   * @param {string} userId - The user's ID.
   * @returns {Promise<Object|null>} Cached user or null.
   */
  getCachedUser: async (userId) => {
    const db = await getDatabase();
    const row = await db.getFirstAsync(
      'SELECT * FROM user_cache WHERE user_id = ?',
      [userId]
    );

    return row ? mapRowToUser(row) : null;
  },

  /**
   * Get multiple cached user profiles.
   * @param {string[]} userIds - Array of user IDs.
   * @returns {Promise<Object[]>} Array of cached users.
   */
  getCachedUsers: async (userIds) => {
    if (!userIds || userIds.length === 0) return [];

    const db = await getDatabase();
    const placeholders = userIds.map(() => '?').join(',');
    const rows = await db.getAllAsync(
      `SELECT * FROM user_cache WHERE user_id IN (${placeholders})`,
      userIds
    );

    return rows.map(mapRowToUser);
  },

  /**
   * Update online status for a user.
   * @param {string} userId - The user's ID.
   * @param {boolean} isOnline - Online status.
   * @param {string} [lastSeen] - Last seen timestamp.
   */
  updateOnlineStatus: async (userId, isOnline, lastSeen = null) => {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE user_cache SET is_online = ?, last_seen = COALESCE(?, last_seen)
       WHERE user_id = ?`,
      [isOnline ? 1 : 0, lastSeen, userId]
    );
  },

  /**
   * Remove stale cached entries older than maxAgeMs.
   * @param {number} [maxAgeMs=86400000] - Max age in ms (default: 24 hours).
   */
  clearStaleCache: async (maxAgeMs = 24 * 60 * 60 * 1000) => {
    const db = await getDatabase();
    const cutoffDate = new Date(Date.now() - maxAgeMs).toISOString();
    await db.runAsync(
      'DELETE FROM user_cache WHERE cached_at < ?',
      [cutoffDate]
    );
  },

  /**
   * Clear all cached users.
   */
  clearAll: async () => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM user_cache');
  },
};

/**
 * Map a SQLite row to the user object format expected by the app.
 * @param {Object} row - SQLite row.
 * @returns {Object} User object.
 */
function mapRowToUser(row) {
  return {
    _id: row.user_id,
    username: row.username,
    displayName: row.display_name,
    profilePicture: row.profile_picture,
    bio: row.bio,
    isOnline: row.is_online === 1,
    lastSeen: row.last_seen,
  };
}

export default userCacheDb;
