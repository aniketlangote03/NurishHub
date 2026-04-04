/**
 * Donation Routes
 * POST   /api/donations          - Create donation (donor)
 * GET    /api/donations          - Get all donations (all authenticated)
 * GET    /api/donations/nearby   - Nearby donations (geo-query)
 * GET    /api/donations/my       - My donations (donor)
 * GET    /api/donations/:id      - Get single donation
 * PUT    /api/donations/:id      - Update donation (donor/admin)
 * DELETE /api/donations/:id      - Delete donation (donor/admin)
 */

const express = require('express');
const router = express.Router();
const {
  createDonation,
  getDonations,
  getDonationById,
  updateDonation,
  deleteDonation,
  getNearbyDonations,
  getMyDonations,
} = require('../controllers/donationController');
const { protect, authorize } = require('../middleware/auth');
const { donationValidator, mongoIdParam } = require('../middleware/validate');
const { maybeParseDonationMultipart } = require('../middleware/donationMultipart');

// All routes require authentication
router.use(protect);

// Specific routes before parameterized routes
router.get('/nearby', getNearbyDonations);
router.get('/my', authorize('donor'), getMyDonations);

// CRUD — optional images via multipart (payload + images[])
router.post('/', authorize('donor'), maybeParseDonationMultipart, donationValidator, createDonation);
router.get('/', getDonations);
router.get('/:id', mongoIdParam('id'), getDonationById);
router.put('/:id', mongoIdParam('id'), authorize('donor', 'admin'), updateDonation);
router.delete('/:id', mongoIdParam('id'), authorize('donor', 'admin'), deleteDonation);

module.exports = router;
