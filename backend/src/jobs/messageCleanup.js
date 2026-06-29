const messageService = require('../services/message.service');

/**
 * Periodic message cleanup job.
 * Runs every hour to clean up old delivered messages from MongoDB.
 *
 * Rules:
 * - Messages with status 'delivered' or 'read' older than 24 hours → deleted
 * - All messages older than 30 days regardless of status → deleted
 *
 * This is a safety net for cases where the client ACK was missed.
 */
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

let cleanupTimer = null;

/**
 * Start the periodic cleanup job.
 */
const startMessageCleanup = () => {
  // Run initial cleanup after 5 minutes (let server stabilize first)
  setTimeout(async () => {
    try {
      await messageService.cleanupOldMessages(24);
    } catch (error) {
      console.error('Initial message cleanup error:', error.message);
    }
  }, 5 * 60 * 1000);

  // Then run every hour
  cleanupTimer = setInterval(async () => {
    try {
      await messageService.cleanupOldMessages(24);
    } catch (error) {
      console.error('Message cleanup error:', error.message);
    }
  }, CLEANUP_INTERVAL_MS);

  console.log('🧹 Message cleanup job started (runs every 1 hour)');
};

/**
 * Stop the periodic cleanup job.
 */
const stopMessageCleanup = () => {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
    console.log('🧹 Message cleanup job stopped');
  }
};

module.exports = {
  startMessageCleanup,
  stopMessageCleanup,
};
