/**
 * User Routes
 * GET  /api/users/profile               - Get my profile
 * PUT  /api/users/update                - Update my profile
 * PUT  /api/users/avatar                - Upload avatar
 * PUT  /api/users/volunteer/availability - Toggle volunteer availability
 * GET  /api/users                       - List users (discovery)
 * GET  /api/users/:id                   - Get user by ID
 */

const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  getUsers,
  getUserById,
  toggleAvailability,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { uploadAvatar: multerAvatar, handleMulterError } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const joiValidate = require('../validations/joiMiddleware');
const { updateProfileSchema } = require('../validations/authValidation');
const { mongoIdParam } = require('../middleware/validate');

router.use(protect); // All user routes require auth

router.get('/profile', getProfile);
router.put('/update', joiValidate(updateProfileSchema), updateProfile);
router.put(
  '/avatar',
  uploadLimiter,
  (req, res, next) => multerAvatar(req, res, (err) => handleMulterError(err, req, res, next)),
  uploadAvatar
);
router.put('/volunteer/availability', authorize('volunteer'), toggleAvailability);
router.get('/', getUsers);
router.get('/:id', mongoIdParam('id'), getUserById);

module.exports = router;
