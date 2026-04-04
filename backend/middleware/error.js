/**
 * Global Error Handling Middleware
 * Catches all errors and returns consistent JSON responses
 */

const logger = require('../config/logger');

/**
 * Custom AppError class for operational errors
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Distinguishes from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler wrapper - eliminates try/catch boilerplate
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ─── Specific error handlers ───────────────────────────────────────────────

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate value for field '${field}': '${value}'. Please use a different value.`;
  return new AppError(message, 409);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Validation failed: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Token expired. Please log in again.', 401);

// ─── Development error response (full stack trace) ─────────────────────────
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

// ─── Production error response (clean messages only) ──────────────────────
const sendErrorProd = (err, res) => {
  // Operational (trusted) errors - send to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  }

  // 5xx programming errors - don't leak details
  logger.error('UNHANDLED ERROR:', err);
  return res.status(500).json({
    success: false,
    status: 'error',
    message: 'Something went wrong. Please try again later.',
  });
};

// ─── Main error handler middleware ─────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log all errors (log 404s as warn to reduce production log noise)
  const logMethod = err.statusCode === 404 ? 'warn' : 'error';
  logger[logMethod]({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id,
  });

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, res);
  }

  // Transform known Mongoose/JWT errors into AppErrors for production
  let error = { ...err };
  error.message = err.message;

  if (err.name === 'CastError') error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  return sendErrorProd(error, res);
};

/**
 * 404 Not Found handler - catch unmatched routes
 */
const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

module.exports = { errorHandler, notFound, AppError, asyncHandler };
