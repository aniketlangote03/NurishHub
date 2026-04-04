/**
 * Input Validation Middleware
 * Uses express-validator for request body/param/query validation
 */

const { body, param, query, validationResult } = require('express-validator');

// ─── Helper: Run validation and return errors ─────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
        value: e.value,
      })),
    });
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────────────────────────
const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  body('role')
    .optional()
    .isIn(['donor', 'ngo', 'volunteer']).withMessage('Role must be donor, ngo, or volunteer'),

  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-()]{7,15}$/).withMessage('Please provide a valid phone number'),

  validate,
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

  validate,
];

// ─── Donation Validators ──────────────────────────────────────────────────
const donationValidator = [
  body('foodName')
    .trim()
    .notEmpty().withMessage('Food name is required')
    .isLength({ max: 200 }).withMessage('Food name cannot exceed 200 characters'),

  body('foodType')
    .notEmpty().withMessage('Food type is required')
    .isIn(['cooked_food', 'raw_vegetables', 'fruits', 'grains', 'dairy', 'bakery', 'packaged_food', 'beverages', 'other'])
    .withMessage('Invalid food type'),

  body('quantity.value')
    .notEmpty().withMessage('Quantity value is required')
    .isFloat({ min: 0.1 }).withMessage('Quantity must be a positive number'),

  body('quantity.unit')
    .notEmpty().withMessage('Quantity unit is required')
    .isIn(['kg', 'liters', 'servings', 'packets', 'boxes', 'pieces'])
    .withMessage('Invalid quantity unit'),

  body('expiryTime')
    .notEmpty().withMessage('Expiry time is required')
    .isISO8601().withMessage('Expiry time must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry time must be in the future');
      }
      return true;
    }),

  body('location.coordinates')
    .notEmpty().withMessage('Location coordinates are required')
    .isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [longitude, latitude]'),

  body('location.coordinates.*')
    .isFloat().withMessage('Coordinates must be numbers'),

  body('address.city')
    .notEmpty().withMessage('City is required'),

  body('address.landmark').optional().trim().isLength({ max: 200 }),

  body('dietType')
    .optional()
    .isIn(['veg', 'non_veg'])
    .withMessage('dietType must be veg or non_veg'),

  body('foodCategory').optional().trim().isLength({ max: 100 }),

  body('cookedAt')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('cookedAt must be a valid ISO date'),

  body('pickupWindowStart')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('pickupWindowStart must be a valid ISO date'),

  body('pickupWindowEnd')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('pickupWindowEnd must be a valid ISO date'),

  body('pickupContactPhone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Contact phone too long'),

  body('specialInstructions')
    .optional()
    .trim()
    .isLength({ max: 1000 }),

  body('packagingType')
    .optional({ nullable: true })
    .isIn(['loose', 'packed', 'mixed'])
    .withMessage('Invalid packagingType'),

  body('foodTemperature')
    .optional({ nullable: true })
    .isIn(['hot', 'cold', 'room'])
    .withMessage('Invalid foodTemperature'),

  body('servingSize')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('servingSize must be a positive integer'),

  body('images')
    .optional()
    .isArray()
    .withMessage('images must be an array of URLs'),

  validate,
];

// ─── Request Validators ───────────────────────────────────────────────────
const requestValidator = [
  body('donationId')
    .notEmpty().withMessage('Donation ID is required')
    .isMongoId().withMessage('Invalid donation ID'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters'),

  body('urgencyLevel')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid urgency level'),

  body('beneficiaryCount')
    .optional()
    .isInt({ min: 1 }).withMessage('Beneficiary count must be at least 1'),

  validate,
];

// ─── Pickup Validators ────────────────────────────────────────────────────
const pickupAssignValidator = [
  body('donationId')
    .notEmpty().withMessage('Donation ID is required')
    .isMongoId().withMessage('Invalid donation ID'),

  body('volunteerId')
    .notEmpty().withMessage('Volunteer ID is required')
    .isMongoId().withMessage('Invalid volunteer ID'),

  validate,
];

const pickupStatusValidator = [
  body('pickupId')
    .notEmpty().withMessage('Pickup ID is required')
    .isMongoId().withMessage('Invalid pickup ID'),

  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['accepted', 'en_route_pickup', 'picked_up', 'en_route_delivery', 'delivered', 'failed', 'cancelled'])
    .withMessage('Invalid pickup status'),

  validate,
];

// ─── Message Validators ───────────────────────────────────────────────────
const messageValidator = [
  body('receiverId')
    .notEmpty().withMessage('Receiver ID is required')
    .isMongoId().withMessage('Invalid receiver ID'),

  body('text')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),

  body('messageType')
    .optional()
    .isIn(['text', 'image', 'document']).withMessage('Invalid message type'),

  validate,
];

// ─── Feedback Validators ──────────────────────────────────────────────────
const feedbackValidator = [
  body('targetUserId')
    .notEmpty().withMessage('Target user ID is required')
    .isMongoId().withMessage('Invalid target user ID'),

  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['donor_review', 'ngo_review', 'volunteer_review', 'platform_review'])
    .withMessage('Invalid feedback category'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),

  validate,
];

// ─── Param Validators ─────────────────────────────────────────────────────
const mongoIdParam = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
  validate,
];

// ─── Query Validators ─────────────────────────────────────────────────────
const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),
  validate,
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  donationValidator,
  requestValidator,
  pickupAssignValidator,
  pickupStatusValidator,
  messageValidator,
  feedbackValidator,
  mongoIdParam,
  paginationQuery,
};
