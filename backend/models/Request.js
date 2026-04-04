/**
 * Request Model
 * NGO requests for specific donations
 */

const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'NGO ID is required'],
    },
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: [true, 'Donation ID is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'fulfilled'],
      default: 'pending',
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    urgencyLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    requiredBy: {
      type: Date,
    },
    beneficiaryCount: {
      type: Number,
      min: 1,
      default: 10,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
requestSchema.index({ ngoId: 1, status: 1 });
requestSchema.index({ donationId: 1, status: 1 });
requestSchema.index({ createdAt: -1 });

// Prevent duplicate requests from same NGO for same donation
requestSchema.index(
  { ngoId: 1, donationId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'approved'] } } }
);

// ─── Populate on find ─────────────────────────────────────────────────────────
requestSchema.pre(/^find/, function (next) {
  this.populate({ path: 'ngoId', select: 'name email phone ngoDetails avatar' })
      .populate({ path: 'donationId', select: 'foodName foodType quantity expiryTime location address status images' });
  next();
});

module.exports = mongoose.model('Request', requestSchema);
