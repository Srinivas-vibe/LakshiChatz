import * as SQLite from 'expo-sqlite';

/**
 * Local SQLite database for LakshiChatz.
 * Stores messages, chat metadata, and user cache on-device.
 * The server acts as a relay — once messages are delivered,
 * they are deleted from MongoDB and only exist here.
 */

const DB_NAME = 'lakshichatz.db';
let db = null;

/**
 * Get or open the SQLite database instance.
 * @returns {SQLiteDatabase} The database instance.
 */
export const getDatabase = async () => {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync(DB_NAME);

  // Enable WAL mode for better concurrent read/write performance
  await db.execAsync('PRAGMA journal_mode = WAL;');

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id TEXT UNIQUE,
      chat_partner_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'sent',
      sent_at TEXT NOT NULL,
      delivered_at TEXT,
      read_at TEXT,
      edited INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_partner
      ON messages (chat_partner_id, sent_at);
    CREATE INDEX IF NOT EXISTS idx_messages_server_id
      ON messages (server_id);

    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partner_id TEXT UNIQUE NOT NULL,
      partner_username TEXT,
      partner_display_name TEXT,
      partner_profile_picture TEXT,
      last_message_text TEXT DEFAULT '',
      last_message_sender_id TEXT,
      last_message_time TEXT,
      unread_count INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_chats_updated
      ON chats (updated_at DESC);

    CREATE TABLE IF NOT EXISTS user_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      username TEXT,
      display_name TEXT,
      profile_picture TEXT,
      bio TEXT DEFAULT '',
      is_online INTEGER DEFAULT 0,
      last_seen TEXT,
      cached_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pending_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      message_server_id TEXT NOT NULL,
      payload TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('📦 Local SQLite database initialized');
  return db;
};

/**
 * Close the database connection.
 */
export const closeDatabase = async () => {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log('📦 Local SQLite database closed');
  }
};

/**
 * Clear all local data (used on logout).
 */
export const clearAllData = async () => {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM messages;
    DELETE FROM chats;
    DELETE FROM user_cache;
    DELETE FROM pending_events;
  `);
  console.log('🗑️ All local data cleared');
};

export default { getDatabase, closeDatabase, clearAllData };
