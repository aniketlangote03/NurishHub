/**
 * Donation Controller
 * CRUD + geo-based nearby donations
 */

const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const { asyncHandler, AppError } = require('../middleware/error');

// ─── Helper: pagination ───────────────────────────────────────────────────────
const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// ─── @route  POST /api/donations ─────────────────────────────────────────────
const createDonation = asyncHandler(async (req, res) => {
  const donationData = { ...req.body, donorId: req.user._id };

  if (donationData.dietType === 'non_veg') {
    donationData.isVegetarian = false;
  }
  if (donationData.dietType === 'veg') {
    donationData.isVegetarian = true;
  }

  // Set pickupWindowEnd to expiryTime if not provided
  if (!donationData.pickupWindowEnd) {
    donationData.pickupWindowEnd = donationData.expiryTime;
  }

  if (!donationData.status) {
    donationData.status = 'pending';
  }

  const donation = await Donation.create(donationData);

  // Emit socket event for real-time dashboard update
  const io = req.app.get('io');
  if (io) {
    io.emit('donation:new', {
      donationId: donation._id,
      foodName: donation.foodName,
      location: donation.location,
    });
  }

  res.status(201).json({
    success: true,
    message: 'Donation posted successfully.',
    data: { donation },
  });
});

// ─── @route  GET /api/donations ──────────────────────────────────────────────
const getDonations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const {
    status,
    foodType,
    isVegetarian,
    city,
    lat,
    lng,
    radius = 10, // km
    sortBy = 'createdAt',
    order = 'desc',
  } = req.query;

  let query = {};

  // Filters
  if (status) query.status = status;
  if (foodType) query.foodType = foodType;
  if (isVegetarian !== undefined) query.isVegetarian = isVegetarian === 'true';
  if (city) query['address.city'] = { $regex: city, $options: 'i' };

  // Only donors see their own donations; NGOs/volunteers see all available
  if (req.user?.role === 'donor') {
    query.donorId = req.user._id;
  }

  let mongoQuery;

  // ─── Geo-based query (nearby donations) ───────────────────────────────────
  if (lat && lng) {
    mongoQuery = Donation.find({
      ...query,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000, // convert km to meters
        },
      },
    });
  } else {
    mongoQuery = Donation.find(query);
  }

  // Sorting
  const sortOrder = order === 'asc' ? 1 : -1;
  mongoQuery = mongoQuery.sort({ [sortBy]: sortOrder });

  // Execute with pagination
  const [donations, total] = await Promise.all([
    mongoQuery.skip(skip).limit(limit),
    Donation.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      donations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    },
  });
});

// ─── @route  GET /api/donations/:id ──────────────────────────────────────────
const getDonationById = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);

  if (!donation) {
    throw new AppError('Donation not found.', 404);
  }

  res.status(200).json({
    success: true,
    data: { donation },
  });
});

// ─── @route  PUT /api/donations/:id ──────────────────────────────────────────
const updateDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);

  if (!donation) {
    throw new AppError('Donation not found.', 404);
  }

  // Only donor who created it or admin can update
  if (
    donation.donorId._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new AppError('You are not authorized to update this donation.', 403);
  }

  // Prevent editing if already picked up or delivered
  if (['picked_up', 'delivered'].includes(donation.status)) {
    throw new AppError('Cannot edit a donation that has been picked up or delivered.', 400);
  }

  const allowedFields = [
    'foodName',
    'foodType',
    'dietType',
    'foodCategory',
    'description',
    'quantity',
    'servingSize',
    'cookedAt',
    'expiryTime',
    'pickupWindowStart',
    'pickupWindowEnd',
    'location',
    'address',
    'isVegetarian',
    'isVegan',
    'allergens',
    'status',
    'cancelledReason',
    'images',
    'pickupContactPhone',
    'specialInstructions',
    'packagingType',
    'foodTemperature',
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const updated = await Donation.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  // Notify if status changed to cancelled
  const io = req.app.get('io');
  if (io && updates.status === 'cancelled') {
    io.emit('donation:cancelled', { donationId: updated._id });
  }

  res.status(200).json({
    success: true,
    message: 'Donation updated successfully.',
    data: { donation: updated },
  });
});

// ─── @route  DELETE /api/donations/:id ───────────────────────────────────────
const deleteDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findById(req.params.id);

  if (!donation) {
    throw new AppError('Donation not found.', 404);
  }

  if (
    donation.donorId._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    throw new AppError('You are not authorized to delete this donation.', 403);
  }

  if (['assigned', 'picked_up', 'accepted', 'requested'].includes(donation.status)) {
    throw new AppError('Cannot delete a donation that is in the allocation or pickup flow.', 400);
  }

  await Donation.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Donation deleted successfully.',
  });
});

// ─── @route  GET /api/donations/nearby ───────────────────────────────────────
const getNearbyDonations = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 10 } = req.query;

  if (!lat || !lng) {
    throw new AppError('Latitude and longitude are required for nearby search.', 400);
  }

  const donations = await Donation.find({
    status: { $in: ['pending', 'available'] },
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseFloat(radius) * 1000,
      },
    },
    expiryTime: { $gt: new Date() },
  }).limit(50);

  res.status(200).json({
    success: true,
    data: {
      donations,
      count: donations.length,
      searchRadius: `${radius} km`,
    },
  });
});

// ─── @route  GET /api/donations/my ───────────────────────────────────────────
const getMyDonations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status } = req.query;

  const query = { donorId: req.user._id };
  if (status) query.status = status;

  const [donations, total] = await Promise.all([
    Donation.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Donation.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      donations,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    },
  });
});

module.exports = {
  createDonation,
  getDonations,
  getDonationById,
  updateDonation,
  deleteDonation,
  getNearbyDonations,
  getMyDonations,
};
