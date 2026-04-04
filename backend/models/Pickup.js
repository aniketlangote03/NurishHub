/**
 * Pickup Model
 * Tracks volunteer pickup assignments and status
 */

const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema(
  {
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Volunteer ID is required'],
    },
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: [true, 'Donation ID is required'],
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      default: null,
    },
    // Destination NGO
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: [
        'assigned',      // Just assigned to volunteer
        'accepted',      // Volunteer accepted the task
        'en_route_pickup', // Heading to donor
        'picked_up',     // Collected from donor
        'en_route_delivery', // Heading to NGO
        'delivered',     // Delivered to NGO
        'failed',        // Failed for some reason
        'cancelled',     // Cancelled
      ],
      default: 'assigned',
    },
    // Pickup location (from donation)
    pickupLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
      },
    },
    // Delivery location (NGO location)
    deliveryLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
      },
    },
    // Tracking timestamps
    acceptedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    // Distance in km
    estimatedDistance: { type: Number, default: null },
    // OTP for confirming pickup/delivery
    pickupOtp: {
      type: String,
      select: false,
    },
    deliveryOtp: {
      type: String,
      select: false,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    failureReason: {
      type: String,
      trim: true,
    },
    // Volunteer's real-time location during pickup
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    updatedByVolunteer: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
pickupSchema.index({ pickupLocation: '2dsphere' });
pickupSchema.index({ deliveryLocation: '2dsphere' });
pickupSchema.index({ currentLocation: '2dsphere' });
pickupSchema.index({ volunteerId: 1, status: 1 });
pickupSchema.index({ donationId: 1 });
pickupSchema.index({ createdAt: -1 });

// ─── Populate on find ─────────────────────────────────────────────────────────
pickupSchema.pre(/^find/, function (next) {
  this.populate({ path: 'volunteerId', select: 'name email phone avatar volunteerDetails' })
      .populate({ path: 'donationId', select: 'foodName quantity address expiryTime status location' })
      .populate({ path: 'ngoId', select: 'name email phone address' });
  next();
});

module.exports = mongoose.model('Pickup', pickupSchema);
