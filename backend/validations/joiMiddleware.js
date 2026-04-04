/**
 * Joi Validation Middleware
 * Generic middleware factory for validating req.body with a Joi schema
 */

const { AppError } = require('../middleware/error');

/**
 * Returns an Express middleware that validates req.body against a Joi schema
 * @param {import('joi').Schema} schema
 * @param {'body'|'query'|'params'} source - which part of the request to validate
 */
const joiValidate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,      // collect all errors, not just the first
      stripUnknown: true,     // remove unknown keys silently
      allowUnknown: false,
    });

    if (error) {
      const message = error.details.map((d) => d.message.replace(/"/g, '')).join('; ');
      return next(new AppError(`Validation failed: ${message}`, 422));
    }

    // Replace req[source] with validated & sanitized value
    req[source] = value;
    next();
  };
};

module.exports = joiValidate;
