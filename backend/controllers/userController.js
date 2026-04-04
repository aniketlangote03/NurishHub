/**
 * User Controller
 * Profile management, avatar upload, and user discovery
 */

const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/error');
const { sendSuccess, sendPaginated } = require('../utils/apiResponse');
const { getPagination, buildSearchQuery } = require('../utils/helpers');
const { getFileUrl } = require('../middleware/upload');

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 */
// ─── @route  GET /api/users/profile ──────────────────────────────────────────
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendSuccess(res, { message: 'Profile fetched successfully.', data: { user } });
});

/**
 * @swagger
 * /api/users/update:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
// ─── @route  PUT /api/users/update ───────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, ngoDetails, volunteerDetails, location } = req.body;

  const updates = {};
  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (address) updates.address = address;
  if (location) updates.location = location;
  if (req.user.role === 'ngo' && ngoDetails) updates.ngoDetails = ngoDetails;
  if (req.user.role === 'volunteer' && volunteerDetails) {
    updates['volunteerDetails.vehicleType'] = volunteerDetails.vehicleType;
    if (volunteerDetails.availability !== undefined) {
      updates['volunteerDetails.availability'] = volunteerDetails.availability;
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  sendSuccess(res, { message: 'Profile updated successfully.', data: { user } });
});

// ─── @route  PUT /api/users/avatar ───────────────────────────────────────────
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded.', 400);
  }

  const avatarUrl = getFileUrl(req, req.file.path);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatarUrl },
    { new: true }
  );

  sendSuccess(res, { message: 'Avatar updated successfully.', data: { avatar: avatarUrl, user } });
});

// ─── @route  GET /api/users ───────────────────────────────────────────────────
// List all users (admin) or discover volunteers/NGOs (public within role)
const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { role, search, city, available } = req.query;

  let query = { isActive: true };

  // Non-admins can only discover NGOs and volunteers
  if (req.user.role !== 'admin') {
    query.role = { $in: ['ngo', 'volunteer'] };
  } else if (role) {
    query.role = role;
  }

  if (search) {
    const searchQ = buildSearchQuery(search, ['name', 'email']);
    Object.assign(query, searchQ);
  }
  if (city) query['address.city'] = { $regex: city, $options: 'i' };
  if (available === 'true') query['volunteerDetails.availability'] = true;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('name email role phone address avatar ngoDetails volunteerDetails location createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  sendPaginated(res, { data: users, total, page, limit, message: 'Users fetched successfully.' });
});

// ─── @route  GET /api/users/:id ──────────────────────────────────────────────
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, isActive: true })
    .select('-refreshToken -fcmToken');

  if (!user) throw new AppError('User not found.', 404);

  sendSuccess(res, { data: { user } });
});

// ─── @route  PUT /api/users/volunteer/availability ───────────────────────────
const toggleAvailability = asyncHandler(async (req, res) => {
  if (req.user.role !== 'volunteer') {
    throw new AppError('Only volunteers can toggle availability.', 403);
  }

  const user = await User.findById(req.user._id);
  user.volunteerDetails.availability = !user.volunteerDetails.availability;
  await user.save({ validateBeforeSave: false });

  sendSuccess(res, {
    message: `Availability set to ${user.volunteerDetails.availability ? 'available' : 'unavailable'}.`,
    data: { availability: user.volunteerDetails.availability },
  });
});

module.exports = { getProfile, updateProfile, uploadAvatar, getUsers, getUserById, toggleAvailability };
