/**
 * Pickup Routes
 * POST /api/pickup/assign          - Assign volunteer to donation (admin/donor)
 * PUT  /api/pickup/status          - Update pickup status (volunteer)
 * GET  /api/pickup                 - Get pickups (role-filtered)
 * GET  /api/pickup/nearby-volunteers - Find nearby available volunteers (geo)
 * GET  /api/pickup/:id             - Get single pickup
 */

const express = require('express');
const router = express.Router();
const {
  assignPickup,
  updatePickupStatus,
  getPickups,
  getPickupById,
  getNearbyVolunteers,
} = require('../controllers/pickupController');
const { protect, authorize } = require('../middleware/auth');
const { pickupAssignValidator, pickupStatusValidator, mongoIdParam } = require('../middleware/validate');

router.use(protect);

router.post('/assign', authorize('admin', 'donor', 'ngo'), pickupAssignValidator, assignPickup);
router.put('/status', authorize('volunteer', 'admin'), pickupStatusValidator, updatePickupStatus);
router.get('/nearby-volunteers', authorize('admin', 'ngo', 'donor'), getNearbyVolunteers);
router.get('/', getPickups);
router.get('/:id', mongoIdParam('id'), getPickupById);

module.exports = router;
