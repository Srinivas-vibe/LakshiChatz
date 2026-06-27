const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
      ],
      validate: {
        validator: function (v) {
          return v.length === 2;
        },
        message: 'A chat must have exactly 2 participants',
      },
    },
    lastMessage: {
      text: {
        type: String,
        default: '',
      },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
    // Map of userId (string) → unread count
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient lookup of user's chats
chatSchema.index({ participants: 1 });

// Compound index to prevent duplicate conversations between same users
// We sort participant IDs before saving to ensure consistency
chatSchema.index(
  { 'participants.0': 1, 'participants.1': 1 },
  { unique: true },
);

/**
 * Static method: Find or create a chat between two users.
 * Sorts participant IDs to maintain consistent ordering.
 * @param {string} userId1 - First user's ObjectId.
 * @param {string} userId2 - Second user's ObjectId.
 * @returns {Promise<Chat>}
 */
chatSchema.statics.findOrCreate = async function (userId1, userId2) {
  // Sort IDs to ensure consistent participant order
  const sortedParticipants = [userId1, userId2].sort();

  let chat = await this.findOne({
    participants: { $all: sortedParticipants, $size: 2 },
  });

  if (!chat) {
    chat = await this.create({
      participants: sortedParticipants,
      unreadCount: new Map([
        [userId1.toString(), 0],
        [userId2.toString(), 0],
      ]),
    });
  }

  return chat;
};

/**
 * Static method: Get all chats for a user, sorted by most recent.
 * @param {string} userId - The user's ObjectId.
 * @returns {Promise<Chat[]>}
 */
chatSchema.statics.getUserChats = function (userId) {
  return this.find({ participants: userId })
    .populate('participants', 'username displayName profilePicture isOnline lastSeen')
    .populate('lastMessage.sender', 'username displayName')
    .sort({ updatedAt: -1 });
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
