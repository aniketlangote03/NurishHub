/**
 * User Model
 * Handles authentication for all roles: Donor, NGO, Volunteer, Admin
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password in queries
    },
    role: {
      type: String,
      enum: ['donor', 'ngo', 'volunteer', 'admin'],
      default: 'donor',
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-()]{7,15}$/, 'Please provide a valid phone number'],
    },
    avatar: {
      type: String,
      default: null,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: { type: String, trim: true, default: 'India' },
    },
    // GeoJSON location for geo-queries
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    // NGO-specific fields
    ngoDetails: {
      registrationNumber: { type: String, trim: true },
      description: { type: String, maxlength: 1000 },
      website: { type: String, trim: true },
      verified: { type: Boolean, default: false },
    },
    // Volunteer-specific fields
    volunteerDetails: {
      vehicleType: {
        type: String,
        enum: ['bike', 'car', 'van', 'truck', 'none'],
        default: 'none',
      },
      availability: {
        type: Boolean,
        default: true,
      },
      rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      totalPickups: {
        type: Number,
        default: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    fcmToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Create 2dsphere index for geo-queries
userSchema.index({ location: '2dsphere' });
userSchema.index({ role: 1 });

// ─── Pre-save Hook: Hash password before saving ────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash password if it was modified
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// ─── Instance Method: Compare entered password with hashed password ─────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Instance Method: Return safe user object (no sensitive data) ────────────
userSchema.methods.toSafeObject = function () {
  const userObj = this.toObject();
  delete userObj.password;
  delete userObj.refreshToken;
  delete userObj.fcmToken;
  return userObj;
};

// ─── Static Method: Find active users by role ────────────────────────────────
userSchema.statics.findByRole = function (role) {
  return this.find({ role, isActive: true });
};

module.exports = mongoose.model('User', userSchema);
