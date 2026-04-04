/**
 * Notification Model
 * In-app notifications for all users
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'donation_posted',
        'donation_requested',
        'request_approved',
        'request_rejected',
        'pickup_assigned',
        'pickup_accepted',
        'pickup_completed',
        'donation_expired',
        'new_message',
        'feedback_received',
        'system_alert',
        'nearby_donation',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    // Reference data for deep-linking
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // Channel
    channels: [
      {
        type: String,
        enum: ['in_app', 'push', 'email', 'sms'],
      },
    ],
    // Priority
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
  },
  { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

// Auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('Notification', notificationSchema);
