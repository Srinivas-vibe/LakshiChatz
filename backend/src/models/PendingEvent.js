const mongoose = require('mongoose');

/**
 * PendingEvent model.
 * Stores edit/delete events that need to be delivered to offline users.
 * Once the user comes online and receives the event, it's deleted.
 */
const pendingEventSchema = new mongoose.Schema(
  {
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: ['messageEdited', 'messageDeleted'],
      required: true,
    },
    messageId: {
      type: String,
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// Auto-expire pending events after 30 days (safety net)
pendingEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const PendingEvent = mongoose.model('PendingEvent', pendingEventSchema);

module.exports = PendingEvent;
