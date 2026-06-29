import { getDatabase } from './localDb';

/**
 * Message database operations.
 * All chat message CRUD against local SQLite.
 */
const messageDb = {
  /**
   * Save a message to local storage.
   * Uses INSERT OR REPLACE to handle duplicates (same server_id).
   * @param {Object} message - Message object from server/socket.
   * @param {string} chatPartnerId - The chat partner's user ID.
   */
  saveMessage: async (message, chatPartnerId) => {
    const db = await getDatabase();
    const serverId = message._id || message.server_id;
    const senderId = message.sender?._id || message.sender;
    const receiverId = message.receiver?._id || message.receiver;

    await db.runAsync(
      `INSERT OR REPLACE INTO messages
        (server_id, chat_partner_id, sender_id, receiver_id, message, status, sent_at, delivered_at, read_at, edited, deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        serverId,
        chatPartnerId,
        senderId,
        receiverId,
        message.message || '',
        message.status || 'sent',
        message.sentAt || new Date().toISOString(),
        message.deliveredAt || null,
        message.readAt || null,
        message.edited ? 1 : 0,
        message.deleted ? 1 : 0,
      ]
    );
  },

  /**
   * Save multiple messages in a single transaction.
   * @param {Object[]} messages - Array of message objects.
   * @param {string} chatPartnerId - The chat partner's user ID.
   */
  saveMessages: async (messages, chatPartnerId) => {
    if (!messages || messages.length === 0) return;

    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      for (const message of messages) {
        const serverId = message._id || message.server_id;
        const senderId = message.sender?._id || message.sender;
        const receiverId = message.receiver?._id || message.receiver;

        await db.runAsync(
          `INSERT OR REPLACE INTO messages
            (server_id, chat_partner_id, sender_id, receiver_id, message, status, sent_at, delivered_at, read_at, edited, deleted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            serverId,
            chatPartnerId,
            senderId,
            receiverId,
            message.message || '',
            message.status || 'sent',
            message.sentAt || new Date().toISOString(),
            message.deliveredAt || null,
            message.readAt || null,
            message.edited ? 1 : 0,
            message.deleted ? 1 : 0,
          ]
        );
      }
    });
  },

  /**
   * Get paginated messages for a chat partner.
   * Returns messages in chronological order (oldest first).
   * @param {string} chatPartnerId - The chat partner's user ID.
   * @param {number} [page=1] - Page number.
   * @param {number} [limit=30] - Messages per page.
   * @returns {Promise<{messages: Object[], pagination: Object}>}
   */
  getMessages: async (chatPartnerId, page = 1, limit = 30) => {
    const db = await getDatabase();
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await db.getFirstAsync(
      'SELECT COUNT(*) as total FROM messages WHERE chat_partner_id = ?',
      [chatPartnerId]
    );
    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Get messages — we want the most recent page, in chronological order
    // For page 1 (most recent), we get the last `limit` messages
    // For page 2, we skip the last `limit` and get the next `limit`, etc.
    const rows = await db.getAllAsync(
      `SELECT * FROM messages
       WHERE chat_partner_id = ?
       ORDER BY sent_at DESC
       LIMIT ? OFFSET ?`,
      [chatPartnerId, limit, offset]
    );

    // Reverse to chronological order and map to the format the app expects
    const messages = rows.reverse().map(mapRowToMessage);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  },

  /**
   * Edit a message locally.
   * @param {string} serverId - The message's server ID.
   * @param {string} newText - The new message text.
   */
  editMessage: async (serverId, newText) => {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE messages SET message = ?, edited = 1 WHERE server_id = ?',
      [newText, serverId]
    );
  },

  /**
   * Delete a message for the current user (remove from local DB).
   * @param {string} serverId - The message's server ID.
   */
  deleteMessageForMe: async (serverId) => {
    const db = await getDatabase();
    await db.runAsync(
      'DELETE FROM messages WHERE server_id = ?',
      [serverId]
    );
  },

  /**
   * Mark a message as deleted for everyone (keep row, update text).
   * @param {string} serverId - The message's server ID.
   */
  deleteMessageForEveryone: async (serverId) => {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE messages SET message = '🚫 This message was deleted', deleted = 1
       WHERE server_id = ?`,
      [serverId]
    );
  },

  /**
   * Update message status (sent → delivered → read).
   * @param {string} chatPartnerId - The chat partner's user ID.
   * @param {string} newStatus - The new status.
   * @param {Object} [extra] - Extra fields like deliveredAt, readAt.
   */
  updateMessageStatus: async (chatPartnerId, newStatus, extra = {}) => {
    const db = await getDatabase();
    const statusOrder = { sent: 0, delivered: 1, read: 2 };
    const statusNum = statusOrder[newStatus] || 0;

    // Only upgrade status, never downgrade
    let sql = 'UPDATE messages SET status = ?';
    const params = [newStatus];

    if (extra.deliveredAt) {
      sql += ', delivered_at = ?';
      params.push(extra.deliveredAt);
    }
    if (extra.readAt) {
      sql += ', read_at = ?';
      params.push(extra.readAt);
    }

    // Use CASE to only upgrade
    sql += ` WHERE chat_partner_id = ? AND (
      CASE status
        WHEN 'sent' THEN 0
        WHEN 'delivered' THEN 1
        WHEN 'read' THEN 2
        ELSE 0
      END
    ) < ?`;
    params.push(chatPartnerId, statusNum);

    await db.runAsync(sql, params);
  },

  /**
   * Get the last message for a chat partner (for chat list preview).
   * @param {string} chatPartnerId - The chat partner's user ID.
   * @returns {Promise<Object|null>}
   */
  getLastMessage: async (chatPartnerId) => {
    const db = await getDatabase();
    const row = await db.getFirstAsync(
      `SELECT * FROM messages
       WHERE chat_partner_id = ?
       ORDER BY sent_at DESC
       LIMIT 1`,
      [chatPartnerId]
    );

    return row ? mapRowToMessage(row) : null;
  },

  /**
   * Count unread messages from a partner (where current user is receiver and status != read).
   * @param {string} chatPartnerId - The chat partner's user ID.
   * @param {string} currentUserId - The current user's ID.
   * @returns {Promise<number>}
   */
  getUnreadCount: async (chatPartnerId, currentUserId) => {
    const db = await getDatabase();
    const result = await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM messages
       WHERE chat_partner_id = ? AND receiver_id = ? AND status != 'read' AND deleted = 0`,
      [chatPartnerId, currentUserId]
    );
    return result?.count || 0;
  },

  /**
   * Check if a message exists locally by server ID.
   * @param {string} serverId - The message's server ID.
   * @returns {Promise<boolean>}
   */
  messageExists: async (serverId) => {
    const db = await getDatabase();
    const result = await db.getFirstAsync(
      'SELECT 1 FROM messages WHERE server_id = ? LIMIT 1',
      [serverId]
    );
    return !!result;
  },

  /**
   * Delete all messages for a chat partner.
   * @param {string} chatPartnerId - The chat partner's user ID.
   */
  deleteAllMessages: async (chatPartnerId) => {
    const db = await getDatabase();
    await db.runAsync(
      'DELETE FROM messages WHERE chat_partner_id = ?',
      [chatPartnerId]
    );
  },
};

/**
 * Map a SQLite row to the message object format expected by the app.
 * @param {Object} row - SQLite row.
 * @returns {Object} Message object.
 */
function mapRowToMessage(row) {
  return {
    _id: row.server_id,
    chatId: null, // Not needed locally
    sender: row.sender_id,
    receiver: row.receiver_id,
    message: row.message,
    status: row.status,
    sentAt: row.sent_at,
    deliveredAt: row.delivered_at,
    readAt: row.read_at,
    edited: row.edited === 1,
    deleted: row.deleted === 1,
  };
}

export default messageDb;
