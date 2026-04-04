/**
 * Donation Model
 * Represents food donations posted by donors
 */

const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor ID is required'],
    },
    foodType: {
      type: String,
      required: [true, 'Food type is required'],
      trim: true,
      enum: [
        'cooked_food',
        'raw_vegetables',
        'fruits',
        'grains',
        'dairy',
        'bakery',
        'packaged_food',
        'beverages',
        'other',
      ],
    },
    foodName: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
      maxlength: [200, 'Food name cannot exceed 200 characters'],
    },
    /** veg | non_veg — shown to NGOs for dietary suitability */
    dietType: {
      type: String,
      enum: ['veg', 'non_veg'],
      default: 'veg',
    },
    /** Optional sub-category, e.g. rice, curry, snacks */
    foodCategory: {
      type: String,
      trim: true,
      maxlength: [100, 'Food category cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    quantity: {
      value: {
        type: Number,
        required: [true, 'Quantity value is required'],
        min: [1, 'Quantity must be at least 1'],
      },
      unit: {
        type: String,
        enum: ['kg', 'liters', 'servings', 'packets', 'boxes', 'pieces'],
        required: [true, 'Quantity unit is required'],
      },
    },
    // Number of people the donation can feed
    servingSize: {
      type: Number,
      min: 1,
      default: null,
    },
    /** When food was cooked / prepared (food safety) */
    cookedAt: {
      type: Date,
      default: null,
    },
    expiryTime: {
      type: Date,
      required: [true, 'Expiry time / best-before is required'],
    },
    // GeoJSON point for geo-queries
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Location coordinates are required'],
      },
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true, required: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
      landmark: { type: String, trim: true, maxlength: [200, 'Landmark too long'] },
    },
    status: {
      type: String,
      enum: [
        'pending', // donor submitted — admin / NGOs see on dashboard
        'available', // legacy: open for requests
        'requested', // NGO(s) requested; awaiting donor/admin decision
        'accepted', // NGO approved — allocated; volunteer not yet assigned
        'assigned', // volunteer assigned for pickup
        'picked_up',
        'delivered',
        'expired',
        'cancelled',
      ],
      default: 'pending',
    },
    images: [
      {
        type: String, // Image URLs/paths
      },
    ],
    // Dietary info
    isVegetarian: {
      type: Boolean,
      default: true,
    },
    isVegan: {
      type: Boolean,
      default: false,
    },
    allergens: [
      {
        type: String,
        enum: ['nuts', 'dairy', 'gluten', 'eggs', 'soy', 'shellfish'],
      },
    ],
    // Pickup window
    pickupWindowStart: {
      type: Date,
      default: Date.now,
    },
    pickupWindowEnd: {
      type: Date,
    },
    /** Donor pickup contact (may differ from account phone) */
    pickupContactPhone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone too long'],
    },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: [1000, 'Instructions too long'],
    },
    packagingType: {
      type: String,
      enum: ['loose', 'packed', 'mixed'],
    },
    foodTemperature: {
      type: String,
      enum: ['hot', 'cold', 'room'],
    },
    // Which NGO/request is this allocated to
    allocatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // NGO user
      default: null,
    },
    // Assigned volunteer
    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Auto-expire flag
    isExpired: {
      type: Boolean,
      default: false,
    },
    cancelledReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
donationSchema.index({ location: '2dsphere' });
donationSchema.index({ status: 1 });
donationSchema.index({ donorId: 1 });
donationSchema.index({ expiryTime: 1 });
donationSchema.index({ createdAt: -1 });

// ─── Auto-expire check ────────────────────────────────────────────────────────
const OPEN_DONATION_STATUSES = ['pending', 'available'];

donationSchema.methods.checkExpiry = function () {
  if (new Date() > this.expiryTime && OPEN_DONATION_STATUSES.includes(this.status)) {
    this.status = 'expired';
    this.isExpired = true;
  }
  return this;
};

// ─── Virtual: Is donation still valid ────────────────────────────────────────
donationSchema.virtual('isValid').get(function () {
  return new Date() < this.expiryTime && OPEN_DONATION_STATUSES.includes(this.status);
});

// ─── Pre-find: Populate donor basic info ─────────────────────────────────────
donationSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'donorId',
    select: 'name email phone address avatar',
  });
  next();
});

module.exports = mongoose.model('Donation', donationSchema);
