/**
 * Admin Routes
 * GET  /api/admin/dashboard-summary  - Dashboard KPIs
 * GET  /api/admin/analytics          - Full analytics
 * GET  /api/admin/users              - All users
 * GET  /api/admin/users/:id          - User by ID
 * PUT  /api/admin/users/:id          - Update user
 * DELETE /api/admin/users/:id        - Deactivate user
 * GET  /api/admin/donations          - All donations
 * PUT  /api/admin/ngo/:id/verify     - Verify NGO
 */

const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  getAnalytics,
  getAllDonations,
  verifyNgo,
  getDashboardSummary,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { mongoIdParam } = require('../middleware/validate');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

router.get('/dashboard-summary', getDashboardSummary);
router.get('/system-metrics', getAnalytics);

router.get('/users', getAllUsers);
router.get('/users/:id', mongoIdParam('id'), getUserById);
router.put('/users/:id', mongoIdParam('id'), updateUser);
router.delete('/users/:id', mongoIdParam('id'), deactivateUser);

router.get('/donations', getAllDonations);

router.put('/ngo/:id/verify', mongoIdParam('id'), verifyNgo);

module.exports = router;
