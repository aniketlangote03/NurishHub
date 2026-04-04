/**
 * Feedback Controller
 * Ratings and comments after donations/pickups
 */

const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/error');

// ─── @route  POST /api/feedback ──────────────────────────────────────────────
const createFeedback = asyncHandler(async (req, res) => {
  const { targetUserId, rating, comment, category, donationId, pickupId, tags, isAnonymous } = req.body;

  // Can't review yourself
  if (targetUserId === req.user._id.toString()) {
    throw new AppError('You cannot review yourself.', 400);
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) throw new AppError('Target user not found.', 404);

  const feedback = await Feedback.create({
    userId: req.user._id,
    targetUserId,
    rating,
    comment,
    category,
    donationId,
    pickupId,
    tags,
    isAnonymous: isAnonymous || false,
  });

  // Update volunteer average rating
  if (targetUser.role === 'volunteer') {
    const { avgRating } = await Feedback.getAverageRating(targetUser._id);
    await User.findByIdAndUpdate(targetUserId, {
      'volunteerDetails.rating': Math.round(avgRating * 10) / 10,
    });
  }

  res.status(201).json({
    success: true,
    message: 'Feedback submitted successfully.',
    data: { feedback },
  });
});

// ─── @route  GET /api/feedback ───────────────────────────────────────────────
const getFeedback = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
  const skip = (page - 1) * limit;
  const { targetUserId, category, minRating, maxRating } = req.query;

  const query = { isHidden: false };

  if (targetUserId) query.targetUserId = targetUserId;
  if (category) query.category = category;
  if (minRating || maxRating) {
    query.rating = {};
    if (minRating) query.rating.$gte = parseFloat(minRating);
    if (maxRating) query.rating.$lte = parseFloat(maxRating);
  }

  // Donors/NGOs/Volunteers only see feedback for themselves
  if (['donor', 'ngo', 'volunteer'].includes(req.user.role) && !targetUserId) {
    query.targetUserId = req.user._id;
  }

  const [feedbacks, total, stats] = await Promise.all([
    Feedback.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Feedback.countDocuments(query),
    targetUserId
      ? Feedback.aggregate([
          { $match: { targetUserId: require('mongoose').Types.ObjectId.createFromHexString(targetUserId), isHidden: false } },
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$rating' },
              count: { $sum: 1 },
              dist: { $push: '$rating' },
            },
          },
        ])
      : Promise.resolve([]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      feedbacks,
      stats: stats[0] || { avgRating: 0, count: total },
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    },
  });
});

// ─── @route  GET /api/feedback/:id ───────────────────────────────────────────
const getFeedbackById = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) throw new AppError('Feedback not found.', 404);

  res.status(200).json({ success: true, data: { feedback } });
});

// ─── @route  POST /api/feedback/:id/reply ────────────────────────────────────
const replyToFeedback = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) throw new AppError('Reply text is required.', 400);

  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) throw new AppError('Feedback not found.', 404);

  const targetId = feedback.targetUserId._id ? feedback.targetUserId._id.toString() : feedback.targetUserId.toString();
  if (targetId !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Only the reviewed user can reply.', 403);
  }

  feedback.reply = { text, repliedAt: new Date() };
  await feedback.save();

  res.status(200).json({ success: true, message: 'Reply added.', data: { feedback } });
});

// ─── @route  DELETE /api/feedback/:id (Admin only) ───────────────────────────
const hideFeedback = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    { isHidden: true, hiddenReason: reason },
    { new: true }
  );
  if (!feedback) throw new AppError('Feedback not found.', 404);

  res.status(200).json({ success: true, message: 'Feedback hidden.', data: { feedback } });
});

module.exports = { createFeedback, getFeedback, getFeedbackById, replyToFeedback, hideFeedback };
