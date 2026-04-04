/**
 * Auth Controller
 * Handles registration, login, refresh tokens, and profile management
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/error');
const logger = require('../config/logger');

// ─── Token Generator ──────────────────────────────────────────────────────────
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
};

// ─── @route  POST /api/auth/register ─────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, address, ngoDetails, volunteerDetails } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  // Build user data
  const userData = { name, email, password, role: role || 'donor', phone };
  if (address) userData.address = address;
  if (role === 'ngo' && ngoDetails) userData.ngoDetails = ngoDetails;
  if (role === 'volunteer' && volunteerDetails) userData.volunteerDetails = volunteerDetails;

  const user = await User.create(userData);

  const { accessToken, refreshToken } = generateTokens(user._id, user.role);

  // Store refresh token in DB
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`New user registered: ${email} (${role})`);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    },
  });
});

// ─── @route  POST /api/auth/login ────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Include password field (excluded by default)
  const user = await User.findOne({ email }).select('+password +refreshToken');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact support.', 401);
  }

  const { accessToken, refreshToken } = generateTokens(user._id, user.role);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${email}`);

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    },
  });
});

// ─── @route  POST /api/auth/refresh ──────────────────────────────────────────
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required.', 400);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError('Refresh token mismatch. Please log in again.', 401);
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    data: { accessToken, refreshToken: newRefreshToken },
  });
});

// ─── @route  POST /api/auth/logout ───────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

// ─── @route  GET /api/auth/me ─────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({
    success: true,
    data: { user },
  });
});

// ─── @route  PUT /api/auth/update-profile ────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, ngoDetails, volunteerDetails, location } = req.body;

  // Fields user can update
  const allowedUpdates = {};
  if (name) allowedUpdates.name = name;
  if (phone) allowedUpdates.phone = phone;
  if (address) allowedUpdates.address = address;
  if (location) allowedUpdates.location = location;
  if (req.user.role === 'ngo' && ngoDetails) allowedUpdates.ngoDetails = ngoDetails;
  if (req.user.role === 'volunteer' && volunteerDetails) allowedUpdates.volunteerDetails = volunteerDetails;

  const user = await User.findByIdAndUpdate(req.user._id, allowedUpdates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: { user },
  });
});

// ─── @route  PUT /api/auth/change-password ───────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current and new password are required.', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters.', 400);
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect.', 401);
  }

  user.password = newPassword;
  await user.save();

  const { accessToken, refreshToken } = generateTokens(user._id, user.role);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully.',
    data: { accessToken, refreshToken },
  });
});

module.exports = { register, login, logout, getMe, updateProfile, changePassword, refreshAccessToken };
