import { getDatabase } from './localDb';

/**
 * Chat list database operations.
 * Manages the local chat list metadata in SQLite.
 */
const chatDb = {
  /**
   * Create or update a chat entry.
   * @param {Object} partner - Partner user info.
   * @param {string} partner.id - Partner user ID.
   * @param {string} [partner.username] - Partner username.
   * @param {string} [partner.displayName] - Partner display name.
   * @param {string} [partner.profilePicture] - Partner profile picture URL.
   * @param {Object} [lastMessage] - Last message info.
   * @param {string} [lastMessage.text] - Message text.
   * @param {string} [lastMessage.senderId] - Sender ID.
   * @param {string} [lastMessage.time] - Message time.
   * @param {number} [unreadCount] - Unread count to set (optional, increments if not provided).
   */
  upsertChat: async (partner, lastMessage = null, unreadCount = null) => {
    const db = await getDatabase();

    // Check if chat exists
    const existing = await db.getFirstAsync(
      'SELECT id, unread_count FROM chats WHERE partner_id = ?',
      [partner.id]
    );

    if (existing) {
      // Update existing chat
      let sql = 'UPDATE chats SET updated_at = datetime("now")';
      const params = [];

      if (partner.username) {
        sql += ', partner_username = ?';
        params.push(partner.username);
      }
      if (partner.displayName) {
        sql += ', partner_display_name = ?';
        params.push(partner.displayName);
      }
      if (partner.profilePicture !== undefined) {
        sql += ', partner_profile_picture = ?';
        params.push(partner.profilePicture);
      }
      if (lastMessage) {
        sql += ', last_message_text = ?, last_message_sender_id = ?, last_message_time = ?';
        params.push(
          lastMessage.text || '',
          lastMessage.senderId || '',
          lastMessage.time || new Date().toISOString()
        );
      }
      if (unreadCount !== null) {
        sql += ', unread_count = ?';
        params.push(unreadCount);
      }

      sql += ' WHERE partner_id = ?';
      params.push(partner.id);

      await db.runAsync(sql, params);
    } else {
      // Create new chat
      await db.runAsync(
        `INSERT INTO chats
          (partner_id, partner_username, partner_display_name, partner_profile_picture,
           last_message_text, last_message_sender_id, last_message_time, unread_count, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`,
        [
          partner.id,
          partner.username || '',
          partner.displayName || '',
          partner.profilePicture || '',
          lastMessage?.text || '',
          lastMessage?.senderId || '',
          lastMessage?.time || new Date().toISOString(),
          unreadCount || 0,
        ]
      );
    }
  },

  /**
   * Get all chats sorted by most recent.
   * @returns {Promise<Object[]>} Array of chat objects formatted for the app.
   */
  getChatList: async () => {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      `SELECT * FROM chats
       ORDER BY last_message_time DESC`
    );

    return rows.map(mapRowToChat);
  },

  /**
   * Get a single chat by partner ID.
   * @param {string} partnerId - The partner's user ID.
   * @returns {Promise<Object|null>}
   */
  getChat: async (partnerId) => {
    const db = await getDatabase();
    const row = await db.getFirstAsync(
      'SELECT * FROM chats WHERE partner_id = ?',
      [partnerId]
    );

    return row ? mapRowToChat(row) : null;
  },

  /**
   * Increment unread count for a chat.
   * @param {string} partnerId - The partner's user ID.
   * @param {number} [increment=1] - How much to increment.
   */
  incrementUnread: async (partnerId, increment = 1) => {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE chats SET unread_count = unread_count + ? WHERE partner_id = ?',
      [increment, partnerId]
    );
  },

  /**
   * Reset unread count for a chat (mark as read).
   * @param {string} partnerId - The partner's user ID.
   */
  markChatRead: async (partnerId) => {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE chats SET unread_count = 0 WHERE partner_id = ?',
      [partnerId]
    );
  },

  /**
   * Delete a chat and all its associated messages.
   * @param {string} partnerId - The partner's user ID.
   */
  deleteChat: async (partnerId) => {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM messages WHERE chat_partner_id = ?', [partnerId]);
      await db.runAsync('DELETE FROM chats WHERE partner_id = ?', [partnerId]);
    });
  },

  /**
   * Update chat's last message preview.
   * @param {string} partnerId - The partner's user ID.
   * @param {string} text - Message text.
   * @param {string} senderId - Sender's user ID.
   * @param {string} time - Message time.
   */
  updateLastMessage: async (partnerId, text, senderId, time) => {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE chats SET
        last_message_text = ?,
        last_message_sender_id = ?,
        last_message_time = ?,
        updated_at = datetime("now")
       WHERE partner_id = ?`,
      [text, senderId, time, partnerId]
    );
  },
};

/**
 * Map a SQLite row to the chat object format expected by the app.
 * The app expects this format from the server's getChatList response.
 * @param {Object} row - SQLite row.
 * @returns {Object} Chat object.
 */
function mapRowToChat(row) {
  return {
    _id: `local_${row.partner_id}`,
    participants: [
      {
        _id: row.partner_id,
        username: row.partner_username,
        displayName: row.partner_display_name,
        profilePicture: row.partner_profile_picture,
      },
    ],
    lastMessage: {
      text: row.last_message_text || '',
      sender: row.last_message_sender_id
        ? { _id: row.last_message_sender_id }
        : null,
      timestamp: row.last_message_time,
    },
    unreadCount: {
      [row.partner_id]: row.unread_count || 0,
    },
    updatedAt: row.updated_at,
  };
}

export default chatDb;
