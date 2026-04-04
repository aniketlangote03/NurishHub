/**
 * Matching Routes
 * GET  /api/matching/nearby      - Find nearest NGOs/volunteers for a donation
 * POST /api/matching/auto-assign - Auto-assign best volunteer to a donation
 * GET  /api/matching/stats       - Area-wise matching statistics
 * GET  /api/matching/score       - Explain match scores for a donation
 */

const express = require('express');
const router = express.Router();
const {
  getNearbyMatches,
  autoAssign,
  getStats,
  getMatchScore,
} = require('../controllers/matchingController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/nearby', getNearbyMatches);                          // All authenticated
router.post('/auto-assign', authorize('admin', 'donor', 'ngo'), autoAssign);
router.get('/stats', authorize('admin', 'ngo'), getStats);
router.get('/score', getNearbyMatches);

module.exports = router;
