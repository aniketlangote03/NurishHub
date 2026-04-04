/**
 * Admin Controller
 * Platform administration, analytics, user management
 */

const User = require('../models/User');
const Donation = require('../models/Donation');
const Request = require('../models/Request');
const Pickup = require('../models/Pickup');
const Feedback = require('../models/Feedback');
const { asyncHandler, AppError } = require('../middleware/error');

const USER_NOT_FOUND = 'User not found.';

// ─── @route  GET /api/admin/users ────────────────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const { role, isActive, search } = req.query;

  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    },
  });
});

// ─── @route  GET /api/admin/users/:id ────────────────────────────────────────
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError(USER_NOT_FOUND, 404);

  res.status(200).json({ success: true, data: { user } });
});

// ─── @route  PUT /api/admin/users/:id ────────────────────────────────────────
const updateUser = asyncHandler(async (req, res) => {
  const { isActive, role, ngoDetails } = req.body;

  const allowedUpdates = {};
  if (isActive !== undefined) allowedUpdates.isActive = isActive;
  if (role) allowedUpdates.role = role;
  if (ngoDetails) allowedUpdates.ngoDetails = ngoDetails;

  const user = await User.findByIdAndUpdate(req.params.id, allowedUpdates, {
    new: true,
    runValidators: true,
  });

  if (!user) throw new AppError(USER_NOT_FOUND, 404);

  res.status(200).json({
    success: true,
    message: 'User updated by admin.',
    data: { user },
  });
});

// ─── @route  DELETE /api/admin/users/:id ─────────────────────────────────────
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!user) throw new AppError(USER_NOT_FOUND, 404);

  res.status(200).json({ success: true, message: 'User deactivated.', data: { user } });
});

// ─── @route  GET /api/admin/analytics ────────────────────────────────────────
const getAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query; // days
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(period, 10));

  const [
    totalUsers,
    usersByRole,
    totalDonations,
    donationsByStatus,
    donationsByFoodType,
    totalRequests,
    requestsByStatus,
    totalPickups,
    pickupsByStatus,
    avgRating,
    recentDonations,
    donationsOverTime,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),

    User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),

    Donation.countDocuments(),

    Donation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    Donation.aggregate([
      { $group: { _id: '$foodType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    Request.countDocuments(),

    Request.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    Pickup.countDocuments(),

    Pickup.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    Feedback.aggregate([
      { $match: { isHidden: false } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, total: { $sum: 1 } } },
    ]),

    Donation.find({ createdAt: { $gte: daysAgo } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('foodName quantity status createdAt address'),

    // Donations per day for chart
    Donation.aggregate([
      { $match: { createdAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity.value' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]),
  ]);

  // Calculate delivered/fulfilled donations
  const deliveredDonations = donationsByStatus.find((d) => d._id === 'delivered')?.count || 0;
  const wasteReduced = await Donation.aggregate([
    { $match: { status: 'delivered' } },
    { $group: { _id: null, totalKg: { $sum: '$quantity.value' } } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalDonations,
        totalRequests,
        totalPickups,
        deliveredDonations,
        platformRating: avgRating[0]?.avgRating?.toFixed(1) || 0,
        totalFeedbacks: avgRating[0]?.total || 0,
        wasteReducedKg: wasteReduced[0]?.totalKg || 0,
      },
      usersByRole: usersByRole.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
      donationsByStatus: donationsByStatus.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
      donationsByFoodType,
      requestsByStatus: requestsByStatus.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
      pickupsByStatus: pickupsByStatus.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
      recentDonations,
      donationsOverTime,
      period: `${period} days`,
    },
  });
});

// ─── @route  GET /api/admin/donations ────────────────────────────────────────
const getAllDonations = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const { status, foodType, city } = req.query;

  const query = {};
  if (status) query.status = status;
  if (foodType) query.foodType = foodType;
  if (city) query['address.city'] = { $regex: city, $options: 'i' };

  const [donations, total] = await Promise.all([
    Donation.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Donation.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: { donations, pagination: { total, page, limit, pages: Math.ceil(total / limit) } },
  });
});

// ─── @route  PUT /api/admin/ngo/:id/verify ───────────────────────────────────
const verifyNgo = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'ngo' });
  if (!user) throw new AppError('NGO not found.', 404);

  user.ngoDetails.verified = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'NGO verified.', data: { user } });
});

// ─── @route  GET /api/admin/dashboard-summary ───────────────────────────────
const getDashboardSummary = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayDonations, pendingRequests, activePickups, newUsersToday] = await Promise.all([
    Donation.countDocuments({ createdAt: { $gte: today } }),
    Request.countDocuments({ status: 'pending' }),
    Pickup.countDocuments({ status: { $in: ['assigned', 'accepted', 'en_route_pickup', 'picked_up', 'en_route_delivery'] } }),
    User.countDocuments({ createdAt: { $gte: today } }),
  ]);

  res.status(200).json({
    success: true,
    data: { todayDonations, pendingRequests, activePickups, newUsersToday },
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  getAnalytics,
  getAllDonations,
  verifyNgo,
  getDashboardSummary,
};
