/**
 * NGO Request Routes
 * POST /api/requests              - Create request (ngo)
 * GET  /api/requests              - Get requests (role-filtered)
 * GET  /api/requests/:id          - Get single request
 * PUT  /api/requests/:id/approve  - Approve request (donor/admin)
 * PUT  /api/requests/:id/reject   - Reject request (donor/admin)
 * PUT  /api/requests/:id/cancel   - Cancel request (ngo)
 */

const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  cancelRequest,
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/auth');
const { requestValidator, mongoIdParam } = require('../middleware/validate');

router.use(protect);

router.post('/', authorize('ngo'), requestValidator, createRequest);
router.get('/', getRequests);
router.get('/:id', mongoIdParam('id'), getRequestById);
router.put('/:id/approve', mongoIdParam('id'), authorize('donor', 'admin'), approveRequest);
router.put('/:id/reject', mongoIdParam('id'), authorize('donor', 'admin'), rejectRequest);
router.put('/:id/cancel', mongoIdParam('id'), authorize('ngo', 'admin'), cancelRequest);

module.exports = router;
