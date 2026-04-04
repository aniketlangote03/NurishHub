/**
 * Request Controller
 * NGO requests to claim donations
 */

const Request = require('../models/Request');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const { asyncHandler, AppError } = require('../middleware/error');

const getPagination = (q) => {
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(parseInt(q.limit, 10) || 10, 100);
  return { page, limit, skip: (page - 1) * limit };
};

// ─── @route  POST /api/requests ──────────────────────────────────────────────
const createRequest = asyncHandler(async (req, res) => {
  const { donationId, message, urgencyLevel, requiredBy, beneficiaryCount } = req.body;

  // Verify donation exists and is available
  const donation = await Donation.findById(donationId);
  if (!donation) throw new AppError('Donation not found.', 404);
  const openForRequest = ['pending', 'available', 'requested'].includes(donation.status);
  if (!openForRequest) {
    throw new AppError(`Donation is not open for requests. Current status: ${donation.status}`, 400);
  }
  if (new Date() > donation.expiryTime) {
    throw new AppError('This donation has expired.', 400);
  }

  // Check for duplicate pending/approved request
  const existing = await Request.findOne({
    ngoId: req.user._id,
    donationId,
    status: { $in: ['pending', 'approved'] },
  });
  if (existing) {
    throw new AppError('You have already submitted a request for this donation.', 409);
  }

  const request = await Request.create({
    ngoId: req.user._id,
    donationId,
    message,
    urgencyLevel,
    requiredBy,
    beneficiaryCount,
  });

  // Update donation status to requested
  await Donation.findByIdAndUpdate(donationId, { status: 'requested' });

  // Notify donor
  await Notification.create({
    userId: donation.donorId._id || donation.donorId,
    type: 'donation_requested',
    title: 'New Request for Your Donation',
    body: `${req.user.name} has requested your donation: ${donation.foodName}`,
    data: { donationId, requestId: request._id },
    channels: ['in_app'],
  });

  // Socket.io - real-time notification
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${donation.donorId}`).emit('notification:new', {
      type: 'donation_requested',
      requestId: request._id,
    });
  }

  res.status(201).json({
    success: true,
    message: 'Request submitted successfully.',
    data: { request },
  });
});

// ─── @route  GET /api/requests ───────────────────────────────────────────────
const getRequests = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, donationId } = req.query;

  let query = {};

  // Role-based filtering
  if (req.user.role === 'ngo') {
    query.ngoId = req.user._id;
  } else if (req.user.role === 'donor') {
    // Find donations by this donor
    const myDonations = await Donation.find({ donorId: req.user._id }).select('_id');
    query.donationId = { $in: myDonations.map((d) => d._id) };
  }
  // Admin sees all

  if (status) query.status = status;
  if (donationId) query.donationId = donationId;

  const [requests, total] = await Promise.all([
    Request.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Request.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      requests,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    },
  });
});

// ─── @route  GET /api/requests/:id ───────────────────────────────────────────
const getRequestById = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) throw new AppError('Request not found.', 404);

  res.status(200).json({ success: true, data: { request } });
});

// ─── @route  PUT /api/requests/:id/approve ───────────────────────────────────
const approveRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) throw new AppError('Request not found.', 404);

  if (request.status !== 'pending') {
    throw new AppError(`Request is already ${request.status}.`, 400);
  }

  // Verify the logged-in user is the donor who owns the donation
  const donation = await Donation.findById(request.donationId._id || request.donationId);
  const donorId = donation.donorId._id ? donation.donorId._id.toString() : donation.donorId.toString();
  if (donorId !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Only the donor or admin can approve requests.', 403);
  }

  request.status = 'approved';
  request.approvedAt = new Date();
  await request.save();

  // NGO accepted — volunteer assignment is a separate step (status → assigned)
  await Donation.findByIdAndUpdate(donation._id, {
    status: 'accepted',
    allocatedTo: request.ngoId._id || request.ngoId,
  });

  // Reject other pending requests for same donation
  await Request.updateMany(
    { donationId: donation._id, status: 'pending', _id: { $ne: request._id } },
    { status: 'rejected', rejectionReason: 'Another request was approved.' }
  );

  // Notify NGO
  await Notification.create({
    userId: request.ngoId._id || request.ngoId,
    type: 'request_approved',
    title: 'Your Request was Approved!',
    body: `Your request for ${donation.foodName} has been approved. Please arrange pickup.`,
    data: { donationId: donation._id, requestId: request._id },
    channels: ['in_app'],
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`user_${request.ngoId}`).emit('notification:new', {
      type: 'request_approved',
      requestId: request._id,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Request approved successfully.',
    data: { request },
  });
});

// ─── @route  PUT /api/requests/:id/reject ────────────────────────────────────
const rejectRequest = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;
  const request = await Request.findById(req.params.id);
  if (!request) throw new AppError('Request not found.', 404);

  const donation = await Donation.findById(request.donationId._id || request.donationId);
  const donorId = donation.donorId._id ? donation.donorId._id.toString() : donation.donorId.toString();
  if (donorId !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Only the donor or admin can reject requests.', 403);
  }

  request.status = 'rejected';
  request.rejectionReason = rejectionReason || 'No reason provided.';
  request.rejectedAt = new Date();
  await request.save();

  // If no other pending requests, set donation back to available
  const pendingCount = await Request.countDocuments({
    donationId: donation._id,
    status: 'pending',
  });
  if (pendingCount === 0 && donation.status === 'requested') {
    await Donation.findByIdAndUpdate(donation._id, { status: 'pending', allocatedTo: null });
  }

  await Notification.create({
    userId: request.ngoId._id || request.ngoId,
    type: 'request_rejected',
    title: 'Request Update',
    body: `Your request for ${donation.foodName} was not approved.`,
    data: { requestId: request._id },
    channels: ['in_app'],
  });

  res.status(200).json({
    success: true,
    message: 'Request rejected.',
    data: { request },
  });
});

// ─── @route  PUT /api/requests/:id/cancel ────────────────────────────────────
const cancelRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) throw new AppError('Request not found.', 404);

  const ngoId = request.ngoId._id ? request.ngoId._id.toString() : request.ngoId.toString();
  if (ngoId !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Only the requesting NGO can cancel.', 403);
  }

  if (!['pending', 'approved'].includes(request.status)) {
    throw new AppError('Cannot cancel a request that is already fulfilled or rejected.', 400);
  }

  request.status = 'cancelled';
  await request.save();

  const pendingOthers = await Request.countDocuments({
    donationId: request.donationId,
    status: 'pending',
  });
  await Donation.findByIdAndUpdate(request.donationId, {
    status: pendingOthers > 0 ? 'requested' : 'pending',
    allocatedTo: null,
  });

  res.status(200).json({
    success: true,
    message: 'Request cancelled.',
    data: { request },
  });
});

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  cancelRequest,
};
