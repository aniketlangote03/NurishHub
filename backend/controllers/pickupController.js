/**
 * Pickup Controller
 * Assigns volunteers to donations and tracks pickup status
 */

const Pickup = require('../models/Pickup');
const Donation = require('../models/Donation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { asyncHandler, AppError } = require('../middleware/error');

// ─── @route  POST /api/pickup/assign ─────────────────────────────────────────
const assignPickup = asyncHandler(async (req, res) => {
  const { donationId, volunteerId, requestId, ngoId } = req.body;

  // Verify donation
  const donation = await Donation.findById(donationId);
  if (!donation) throw new AppError('Donation not found.', 404);
  // Core flow: NGO must have accepted (donation status → accepted) before volunteer assignment
  if (donation.status !== 'accepted') {
    throw new AppError(
      `Assign a volunteer only after an NGO has accepted the donation. Current status: ${donation.status}`,
      400
    );
  }
  if (donation.assignedVolunteer) {
    throw new AppError('A volunteer is already assigned to this donation.', 400);
  }

  // Verify volunteer
  const volunteer = await User.findById(volunteerId);
  if (!volunteer || volunteer.role !== 'volunteer') {
    throw new AppError('Invalid volunteer.', 400);
  }
  if (!volunteer.volunteerDetails?.availability) {
    throw new AppError('Volunteer is not currently available.', 400);
  }

  // Check volunteer doesn't already have active pickup
  const activePickup = await Pickup.findOne({
    volunteerId,
    status: { $in: ['assigned', 'accepted', 'en_route_pickup', 'picked_up', 'en_route_delivery'] },
  });
  if (activePickup) {
    throw new AppError('Volunteer already has an active pickup task.', 409);
  }

  const resolvedNgoId = ngoId || donation.allocatedTo || null;

  const pickup = await Pickup.create({
    volunteerId,
    donationId,
    requestId: requestId || null,
    ngoId: resolvedNgoId,
    pickupLocation: donation.location,
    status: 'assigned',
  });

  // Update donation status
  await Donation.findByIdAndUpdate(donationId, {
    status: 'assigned',
    assignedVolunteer: volunteerId,
  });

  // Set volunteer unavailable
  await User.findByIdAndUpdate(volunteerId, {
    'volunteerDetails.availability': false,
  });

  // Notify volunteer
  await Notification.create({
    userId: volunteerId,
    type: 'pickup_assigned',
    title: 'New Pickup Task Assigned',
    body: `You have been assigned to pick up: ${donation.foodName}`,
    data: { pickupId: pickup._id, donationId },
    channels: ['in_app'],
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`user_${volunteerId}`).emit('pickup:assigned', { pickupId: pickup._id });
  }

  res.status(201).json({
    success: true,
    message: 'Pickup assigned successfully.',
    data: { pickup },
  });
});

// ─── @route  PUT /api/pickup/status ──────────────────────────────────────────
const updatePickupStatus = asyncHandler(async (req, res) => {
  const { pickupId, status, notes, currentLocation } = req.body;

  const pickup = await Pickup.findById(pickupId);
  if (!pickup) throw new AppError('Pickup record not found.', 404);

  // Volunteers can only update their own pickups
  const volId = pickup.volunteerId._id ? pickup.volunteerId._id.toString() : pickup.volunteerId.toString();
  if (req.user.role === 'volunteer' && volId !== req.user._id.toString()) {
    throw new AppError('You can only update your own pickups.', 403);
  }

  // Status transition validation
  const validTransitions = {
    assigned: ['accepted', 'cancelled'],
    accepted: ['en_route_pickup', 'cancelled'],
    en_route_pickup: ['picked_up', 'failed'],
    picked_up: ['en_route_delivery'],
    en_route_delivery: ['delivered', 'failed'],
  };

  if (!validTransitions[pickup.status]?.includes(status)) {
    throw new AppError(
      `Invalid status transition: ${pickup.status} → ${status}. Allowed: ${validTransitions[pickup.status]?.join(', ')}`,
      400
    );
  }

  // Build update
  const updates = { status, notes };

  if (status === 'accepted') updates.acceptedAt = new Date();
  if (status === 'picked_up') {
    updates.pickedUpAt = new Date();
    // Update donation status
    await Donation.findByIdAndUpdate(pickup.donationId, { status: 'picked_up' });
  }
  if (status === 'delivered') {
    updates.deliveredAt = new Date();
    await Donation.findByIdAndUpdate(pickup.donationId, { status: 'delivered' });
    // Free volunteer
    await User.findByIdAndUpdate(pickup.volunteerId, {
      'volunteerDetails.availability': true,
      $inc: { 'volunteerDetails.totalPickups': 1 },
    });
  }
  if (['failed', 'cancelled'].includes(status)) {
    await User.findByIdAndUpdate(pickup.volunteerId, { 'volunteerDetails.availability': true });
    const d = await Donation.findById(pickup.donationId);
    const revertStatus = d?.allocatedTo ? 'accepted' : 'pending';
    await Donation.findByIdAndUpdate(pickup.donationId, {
      status: revertStatus,
      assignedVolunteer: null,
    });
    if (req.body.failureReason) updates.failureReason = req.body.failureReason;
  }

  if (currentLocation) {
    updates.currentLocation = currentLocation;
    updates.updatedByVolunteer = new Date();
  }

  const updated = await Pickup.findByIdAndUpdate(pickupId, updates, { new: true });

  // Human-readable label map
  const STATUS_LABELS = {
    assigned        : '📋 Assigned',
    accepted        : '✅ Accepted',
    en_route_pickup : '🚴 En Route to Pickup',
    picked_up       : '📦 Picked Up',
    en_route_delivery: '🚚 En Route to NGO',
    delivered       : '🎉 Delivered',
    cancelled       : '❌ Cancelled',
    failed          : '⚠️ Failed',
  };

  // Emit real-time tracking update
  const io = req.app.get('io');
  if (io) {
    io.emit(`pickup:update:${pickupId}`, { status, currentLocation });

    // Broadcast to all dashboards (MapDashboard, AdminPanel, NgoRequest, etc.)
    io.emit('pickup:status-update', {
      pickupId,
      status,
      label          : STATUS_LABELS[status] || status,
      volunteerId    : pickup.volunteerId?.toString(),
      volunteerName  : req.user.name,
      donationId     : pickup.donationId?.toString(),
      ngoId          : pickup.ngoId?.toString() || null,
      currentLocation: currentLocation || null,
      ts             : Date.now(),
    });

    if (status === 'delivered') {
      const ngoId = pickup.ngoId?._id || pickup.ngoId;
      if (ngoId) {
        await Notification.create({
          userId: ngoId,
          type: 'pickup_completed',
          title: 'Donation Delivered!',
          body: `Your donation pickup has been successfully delivered.`,
          data: { pickupId: pickup._id },
          channels: ['in_app'],
        });
        io.to(`user_${ngoId}`).emit('notification:new', { type: 'pickup_completed' });
      }
    }
  }

  res.status(200).json({
    success: true,
    message: `Pickup status updated to '${status}'.`,
    data: { pickup: updated },
  });
});

// ─── @route  GET /api/pickup ──────────────────────────────────────────────────
const getPickups = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;
  const { status } = req.query;

  let query = {};
  if (req.user.role === 'volunteer') query.volunteerId = req.user._id;
  if (status) query.status = status;

  const [pickups, total] = await Promise.all([
    Pickup.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Pickup.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: { pickups, pagination: { total, page, limit, pages: Math.ceil(total / limit) } },
  });
});

// ─── @route  GET /api/pickup/:id ─────────────────────────────────────────────
const getPickupById = asyncHandler(async (req, res) => {
  const pickup = await Pickup.findById(req.params.id);
  if (!pickup) throw new AppError('Pickup not found.', 404);

  res.status(200).json({ success: true, data: { pickup } });
});

// ─── @route  GET /api/pickup/nearby-volunteers ────────────────────────────────
const getNearbyVolunteers = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 15 } = req.query;

  if (!lat || !lng) throw new AppError('Latitude and longitude are required.', 400);

  const volunteers = await User.find({
    role: 'volunteer',
    isActive: true,
    'volunteerDetails.availability': true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseFloat(radius) * 1000,
      },
    },
  }).select('name email phone volunteerDetails location address');

  res.status(200).json({
    success: true,
    data: { volunteers, count: volunteers.length },
  });
});

module.exports = { assignPickup, updatePickupStatus, getPickups, getPickupById, getNearbyVolunteers };
