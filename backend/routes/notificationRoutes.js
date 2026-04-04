/**
 * Notification Routes
 * GET    /api/notifications           - Get user's notifications
 * PUT    /api/notifications/read-all  - Mark all as read
 * DELETE /api/notifications/clear-all - Clear all
 * PUT    /api/notifications/:id/read  - Mark single as read
 * DELETE /api/notifications/:id       - Delete single
 */

const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { mongoIdParam } = require('../middleware/validate');

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.delete('/clear-all', clearAllNotifications);
router.put('/:id/read', mongoIdParam('id'), markAsRead);
router.delete('/:id', mongoIdParam('id'), deleteNotification);

module.exports = router;
