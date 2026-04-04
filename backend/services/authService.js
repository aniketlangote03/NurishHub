/**
 * Auth Service
 * Business logic layer for authentication operations
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/error');
const logger = require('../config/logger');

// ─── Token Generation ─────────────────────────────────────────────────────────
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

// ─── Register new user ────────────────────────────────────────────────────────
const registerUser = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new AppError('An account with this email already exists.', 409);

  const user = await User.create(data);
  const { accessToken, refreshToken } = generateTokens(user._id, user.role);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`New user registered: ${data.email} (${data.role})`);
  return { user: user.toSafeObject(), accessToken, refreshToken };
};

// ─── Login user ───────────────────────────────────────────────────────────────
const loginUser = async (email, password) => {
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
  return { user: user.toSafeObject(), accessToken, refreshToken };
};

// ─── Refresh access token ─────────────────────────────────────────────────────
const refreshUserToken = async (refreshToken) => {
  if (!refreshToken) throw new AppError('Refresh token is required.', 400);

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

  return { accessToken, refreshToken: newRefreshToken };
};

// ─── Logout user ──────────────────────────────────────────────────────────────
const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

// ─── Change password ──────────────────────────────────────────────────────────
const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect.', 401);
  }
  user.password = newPassword;
  await user.save();

  const { accessToken, refreshToken } = generateTokens(user._id, user.role);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

module.exports = { registerUser, loginUser, refreshUserToken, logoutUser, changeUserPassword, generateTokens };
