/**
 * Auth Validation Schemas (Joi)
 */

const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required().messages({
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).pattern(/\d/).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'string.pattern.base': 'Password must contain at least one number',
    'any.required': 'Password is required',
  }),
  role: Joi.string().valid('donor', 'ngo', 'volunteer').default('donor'),
  phone: Joi.string()
    .pattern(/^\+?[\d\s\-()]{7,15}$/)
    .optional()
    .messages({ 'string.pattern.base': 'Invalid phone number' }),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    pincode: Joi.string().optional(),
    country: Joi.string().default('India'),
  }).optional(),
  ngoDetails: Joi.when('role', {
    is: 'ngo',
    then: Joi.object({
      registrationNumber: Joi.string().optional(),
      description: Joi.string().max(1000).optional(),
      website: Joi.string().uri().optional(),
    }).optional(),
  }),
  volunteerDetails: Joi.when('role', {
    is: 'volunteer',
    then: Joi.object({
      vehicleType: Joi.string()
        .valid('bike', 'car', 'van', 'truck', 'none')
        .default('none'),
    }).optional(),
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).pattern(/\d/).required().messages({
    'string.min': 'New password must be at least 6 characters',
    'string.pattern.base': 'New password must contain at least one number',
  }),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().optional(),
  phone: Joi.string().pattern(/^\+?[\d\s\-()]{7,15}$/).optional(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    pincode: Joi.string().optional(),
    country: Joi.string().optional(),
  }).optional(),
  location: Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2).optional(),
  }).optional(),
  ngoDetails: Joi.object({
    registrationNumber: Joi.string().optional(),
    description: Joi.string().max(1000).optional(),
    website: Joi.string().uri().optional(),
  }).optional(),
  volunteerDetails: Joi.object({
    vehicleType: Joi.string().valid('bike', 'car', 'van', 'truck', 'none').optional(),
    availability: Joi.boolean().optional(),
  }).optional(),
});

module.exports = { registerSchema, loginSchema, changePasswordSchema, updateProfileSchema };
