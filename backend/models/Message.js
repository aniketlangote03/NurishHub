/**
 * Message Model
 * Real-time chat messages between users
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver ID is required'],
    },
    text: {
      type: String,
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    // File/media attachment
    attachment: {
      url: { type: String },
      type: { type: String, enum: ['image', 'document', 'video'] },
      fileName: { type: String },
      size: { type: Number }, // in bytes
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'document', 'system'],
      default: 'text',
    },
    // Message status
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    readAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    // Reference to donation for context
    donationRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      default: null,
    },
    // Soft delete
    deletedBySender: {
      type: Boolean,
      default: false,
    },
    deletedByReceiver: {
      type: Boolean,
      default: false,
    },
    // For system messages (e.g. donation assigned)
    systemPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, status: 1 });
messageSchema.index({ createdAt: -1 });

// ─── Populate on find ─────────────────────────────────────────────────────────
messageSchema.pre(/^find/, function (next) {
  this.populate({ path: 'senderId', select: 'name avatar role' })
      .populate({ path: 'receiverId', select: 'name avatar role' });
  next();
});

// ─── Static: Get conversation between two users ───────────────────────────────
messageSchema.statics.getConversation = function (userId1, userId2, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  return this.find({
    $or: [
      { senderId: userId1, receiverId: userId2, deletedBySender: false },
      { senderId: userId2, receiverId: userId1, deletedByReceiver: false },
    ],
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// ─── Static: Get all conversations for a user ────────────────────────────────
messageSchema.statics.getConversationList = function (userId) {
  return this.aggregate([
    {
      $match: {
        $or: [{ senderId: userId }, { receiverId: userId }],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [{ $eq: ['$senderId', userId] }, '$receiverId', '$senderId'],
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$receiverId', userId] }, { $ne: ['$status', 'read'] }] },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
  ]);
};

module.exports = mongoose.model('Message', messageSchema);
