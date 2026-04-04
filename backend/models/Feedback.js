/**
 * Feedback Model
 * Ratings and comments from users after donations/pickups
 */

const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    // Who gave the feedback
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    // Who is being reviewed
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Target user ID is required'],
    },
    // Related donation (optional)
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      default: null,
    },
    // Related pickup (optional)
    pickupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pickup',
      default: null,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    // Feedback category
    category: {
      type: String,
      enum: ['donor_review', 'ngo_review', 'volunteer_review', 'platform_review'],
      required: true,
    },
    tags: [
      {
        type: String,
        enum: [
          'on_time',
          'fresh_food',
          'good_quantity',
          'professional',
          'helpful',
          'fast_delivery',
          'poor_quality',
          'late',
          'other',
        ],
      },
    ],
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    // Admin moderation
    isHidden: {
      type: Boolean,
      default: false,
    },
    hiddenReason: {
      type: String,
      trim: true,
    },
    // Reply from target user
    reply: {
      text: { type: String, maxlength: 500 },
      repliedAt: { type: Date },
    },
  },
  { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
feedbackSchema.index({ targetUserId: 1, createdAt: -1 });
feedbackSchema.index({ userId: 1 });
feedbackSchema.index({ donationId: 1 });
feedbackSchema.index({ rating: 1 });

// Prevent duplicate feedback for same donation/pickup pair
feedbackSchema.index(
  { userId: 1, donationId: 1 },
  { unique: true, sparse: true }
);

// ─── Populate on find ─────────────────────────────────────────────────────────
feedbackSchema.pre(/^find/, function (next) {
  this.populate({ path: 'userId', select: 'name avatar role' })
      .populate({ path: 'targetUserId', select: 'name avatar role' });
  next();
});

// ─── Static: Average rating for a user ───────────────────────────────────────
feedbackSchema.statics.getAverageRating = async function (userId) {
  const result = await this.aggregate([
    { $match: { targetUserId: userId, isHidden: false } },
    { $group: { _id: '$targetUserId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  return result[0] || { avgRating: 0, count: 0 };
};

module.exports = mongoose.model('Feedback', feedbackSchema);
