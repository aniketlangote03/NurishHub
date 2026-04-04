/**
 * Notification Controller
 * In-app notification management
 */

const Notification = require('../models/Notification');
const { asyncHandler, AppError } = require('../middleware/error');

// ─── @route  GET /api/notifications ──────────────────────────────────────────
const getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const { isRead, type } = req.query;

  const query = { userId: req.user._id };
  if (isRead !== undefined) query.isRead = isRead === 'true';
  if (type) query.type = type;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    },
  });
});

// ─── @route  PUT /api/notifications/:id/read ─────────────────────────────────
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) throw new AppError('Notification not found.', 404);

  res.status(200).json({ success: true, message: 'Marked as read.', data: { notification } });
});

// ─── @route  PUT /api/notifications/read-all ─────────────────────────────────
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.status(200).json({ success: true, message: 'All notifications marked as read.' });
});

// ─── @route  DELETE /api/notifications/:id ───────────────────────────────────
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!notification) throw new AppError('Notification not found.', 404);

  res.status(200).json({ success: true, message: 'Notification deleted.' });
});

// ─── @route  DELETE /api/notifications/clear-all ─────────────────────────────
const clearAllNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ userId: req.user._id });
  res.status(200).json({ success: true, message: 'All notifications cleared.' });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
};
