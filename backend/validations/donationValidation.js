/**
 * Donation Validation Schemas (Joi)
 */

const Joi = require('joi');

const createDonationSchema = Joi.object({
  foodName: Joi.string().max(200).trim().required().messages({
    'any.required': 'Food name is required',
  }),
  foodType: Joi.string()
    .valid('cooked_food', 'raw_vegetables', 'fruits', 'grains', 'dairy', 'bakery', 'packaged_food', 'beverages', 'other')
    .required(),
  dietType: Joi.string().valid('veg', 'non_veg').optional(),
  foodCategory: Joi.string().max(100).trim().optional(),
  description: Joi.string().max(1000).optional(),
  quantity: Joi.object({
    value: Joi.number().min(0.1).required(),
    unit: Joi.string().valid('kg', 'liters', 'servings', 'packets', 'boxes', 'pieces').required(),
  }).required(),
  servingSize: Joi.number().min(1).optional(),
  cookedAt: Joi.date().optional(),
  expiryTime: Joi.date().greater('now').required().messages({
    'date.greater': 'Expiry time must be in the future',
    'any.required': 'Expiry time is required',
  }),
  location: Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2).required().messages({
      'any.required': 'Location coordinates [longitude, latitude] are required',
    }),
  }).required(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().required(),
    state: Joi.string().optional(),
    pincode: Joi.string().optional(),
    country: Joi.string().default('India'),
    landmark: Joi.string().max(200).optional(),
  }).required(),
  isVegetarian: Joi.boolean().default(true),
  isVegan: Joi.boolean().default(false),
  allergens: Joi.array()
    .items(Joi.string().valid('nuts', 'dairy', 'gluten', 'eggs', 'soy', 'shellfish'))
    .optional(),
  pickupWindowStart: Joi.date().optional(),
  pickupWindowEnd: Joi.date().optional(),
  pickupContactPhone: Joi.string().max(20).optional(),
  specialInstructions: Joi.string().max(1000).optional(),
  packagingType: Joi.string().valid('loose', 'packed', 'mixed').optional(),
  foodTemperature: Joi.string().valid('hot', 'cold', 'room').optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
});

const updateDonationSchema = Joi.object({
  foodName: Joi.string().max(200).trim().optional(),
  foodType: Joi.string()
    .valid('cooked_food', 'raw_vegetables', 'fruits', 'grains', 'dairy', 'bakery', 'packaged_food', 'beverages', 'other')
    .optional(),
  description: Joi.string().max(1000).optional(),
  quantity: Joi.object({
    value: Joi.number().min(0.1),
    unit: Joi.string().valid('kg', 'liters', 'servings', 'packets', 'boxes', 'pieces'),
  }).optional(),
  servingSize: Joi.number().min(1).optional(),
  expiryTime: Joi.date().greater('now').optional(),
  location: Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2),
  }).optional(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    pincode: Joi.string().optional(),
    country: Joi.string().optional(),
    landmark: Joi.string().max(200).optional(),
  }).optional(),
  dietType: Joi.string().valid('veg', 'non_veg').optional(),
  foodCategory: Joi.string().max(100).optional(),
  cookedAt: Joi.date().optional(),
  isVegetarian: Joi.boolean().optional(),
  isVegan: Joi.boolean().optional(),
  allergens: Joi.array()
    .items(Joi.string().valid('nuts', 'dairy', 'gluten', 'eggs', 'soy', 'shellfish'))
    .optional(),
  pickupContactPhone: Joi.string().max(20).optional(),
  specialInstructions: Joi.string().max(1000).optional(),
  packagingType: Joi.string().valid('loose', 'packed', 'mixed').optional(),
  foodTemperature: Joi.string().valid('hot', 'cold', 'room').optional(),
  status: Joi.string()
    .valid(
      'pending',
      'available',
      'requested',
      'accepted',
      'assigned',
      'picked_up',
      'delivered',
      'expired',
      'cancelled'
    )
    .optional(),
  cancelledReason: Joi.string().optional(),
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

module.exports = { createDonationSchema, updateDonationSchema };
