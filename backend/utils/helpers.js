/**
 * General Helper Utilities
 */

/**
 * Parse pagination params from query string
 * @param {object} query - req.query
 * @param {number} defaultLimit
 */
const getPagination = (query, defaultLimit = 10) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(query.limit, 10) || defaultLimit, 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Haversine distance between two coordinates (km)
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Parse a MongoDB ID from string — returns null if invalid
 */
const parseObjectId = (id) => {
  if (/^[a-fA-F0-9]{24}$/.test(id)) return id;
  return null;
};

/**
 * Sanitize sort field to prevent injection
 * @param {string} field - field name from query
 * @param {string[]} allowed - allowed field names
 * @param {string} defaultField
 */
const sanitizeSortField = (field, allowed, defaultField = 'createdAt') => {
  return allowed.includes(field) ? field : defaultField;
};

/**
 * Format bytes to human-readable string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Sleep utility (for testing/delays)
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Build MongoDB text search query from keyword string
 */
const buildSearchQuery = (keyword, fields) => {
  if (!keyword) return {};
  const regex = { $regex: keyword.trim(), $options: 'i' };
  return { $or: fields.map((f) => ({ [f]: regex })) };
};

module.exports = {
  getPagination,
  haversineDistance,
  parseObjectId,
  sanitizeSortField,
  formatBytes,
  sleep,
  buildSearchQuery,
};
