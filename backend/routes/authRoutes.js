/**
 * Auth Routes
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/refresh
 * POST /api/auth/logout
 * GET  /api/auth/me
 * PUT  /api/auth/update-profile
 * PUT  /api/auth/change-password
 */

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  refreshAccessToken,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidator, loginValidator } = require('../middleware/validate');

// Public routes
router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/refresh', refreshAccessToken);

// Protected routes
router.use(protect); // All routes below require authentication

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/update-profile', updateProfile);
router.put('/change-password', changePassword);

module.exports = router;
