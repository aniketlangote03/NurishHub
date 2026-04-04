/**
 * Feedback Routes
 * POST   /api/feedback          - Submit feedback
 * GET    /api/feedback          - Get feedback (role-filtered)
 * GET    /api/feedback/:id      - Get single feedback
 * POST   /api/feedback/:id/reply - Reply to feedback
 * DELETE /api/feedback/:id      - Hide feedback (admin)
 */

const express = require('express');
const router = express.Router();
const {
  createFeedback,
  getFeedback,
  getFeedbackById,
  replyToFeedback,
  hideFeedback,
} = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/auth');
const { feedbackValidator, mongoIdParam } = require('../middleware/validate');

router.use(protect);

router.post('/', feedbackValidator, createFeedback);
router.get('/', getFeedback);
router.get('/:id', mongoIdParam('id'), getFeedbackById);
router.post('/:id/reply', mongoIdParam('id'), replyToFeedback);
router.delete('/:id', mongoIdParam('id'), authorize('admin'), hideFeedback);

module.exports = router;
