/**
 * Request, Pickup, Feedback, Message Validation Schemas (Joi)
 */

const Joi = require('joi');

// ─── NGO Request ──────────────────────────────────────────────────────────────
const createRequestSchema = Joi.object({
  donationId: Joi.string().hex().length(24).required().messages({
    'any.required': 'Donation ID is required',
    'string.length': 'Invalid donation ID',
  }),
  message: Joi.string().max(500).trim().optional(),
  urgencyLevel: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  requiredBy: Joi.date().optional(),
  beneficiaryCount: Joi.number().integer().min(1).default(10),
});

// ─── Pickup ───────────────────────────────────────────────────────────────────
const assignPickupSchema = Joi.object({
  donationId: Joi.string().hex().length(24).required(),
  volunteerId: Joi.string().hex().length(24).required(),
  requestId: Joi.string().hex().length(24).optional(),
  ngoId: Joi.string().hex().length(24).optional(),
});

const updatePickupStatusSchema = Joi.object({
  pickupId: Joi.string().hex().length(24).required(),
  status: Joi.string()
    .valid('accepted', 'en_route_pickup', 'picked_up', 'en_route_delivery', 'delivered', 'failed', 'cancelled')
    .required(),
  notes: Joi.string().max(500).optional(),
  failureReason: Joi.string().optional(),
  currentLocation: Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2),
  }).optional(),
});

// ─── Message ──────────────────────────────────────────────────────────────────
const sendMessageSchema = Joi.object({
  receiverId: Joi.string().hex().length(24).required(),
  text: Joi.string().max(2000).trim().optional(),
  messageType: Joi.string().valid('text', 'image', 'document').default('text'),
  donationRef: Joi.string().hex().length(24).optional(),
}).or('text', 'attachment').messages({
  'object.missing': 'Message must have text or an attachment',
});

// ─── Feedback ─────────────────────────────────────────────────────────────────
const createFeedbackSchema = Joi.object({
  targetUserId: Joi.string().hex().length(24).required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().max(1000).trim().optional(),
  category: Joi.string()
    .valid('donor_review', 'ngo_review', 'volunteer_review', 'platform_review')
    .required(),
  donationId: Joi.string().hex().length(24).optional(),
  pickupId: Joi.string().hex().length(24).optional(),
  tags: Joi.array()
    .items(Joi.string().valid('on_time', 'fresh_food', 'good_quantity', 'professional', 'helpful', 'fast_delivery', 'poor_quality', 'late', 'other'))
    .optional(),
  isAnonymous: Joi.boolean().default(false),
});

// ─── Geo query ────────────────────────────────────────────────────────────────
const geoQuerySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required().messages({
    'any.required': 'Latitude is required',
  }),
  lng: Joi.number().min(-180).max(180).required().messages({
    'any.required': 'Longitude is required',
  }),
  radius: Joi.number().min(1).max(500).default(10),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createRequestSchema,
  assignPickupSchema,
  updatePickupStatusSchema,
  sendMessageSchema,
  createFeedbackSchema,
  geoQuerySchema,
};
