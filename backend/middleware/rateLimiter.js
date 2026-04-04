/**
 * Rate Limiter Configurations
 * Granular rate limiting for different route groups
 */

const rateLimit = require('express-rate-limit');

// ─── Default message formatter ────────────────────────────────────────────────
const rateLimitMessage = (label) => ({
  success: false,
  message: `Too many ${label} attempts. Please try again later.`,
});

// ─── Global API limiter (100 req / 15 min) ────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('requests'),
});

// ─── Auth limiter (20 req / 15 min) ──────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('auth'),
  skipSuccessfulRequests: false,
});

// ─── Sensitive routes (5 req / 15 min) ───────────────────────────────────────
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('sensitive'),
});

// ─── Upload limiter (10 uploads / hour) ──────────────────────────────────────
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('upload'),
});

// ─── Message limiter (60 messages / min) ─────────────────────────────────────
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage('message'),
});

module.exports = { globalLimiter, authLimiter, strictLimiter, uploadLimiter, messageLimiter };
