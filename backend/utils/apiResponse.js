/**
 * API Response Helpers
 * Standardized response format across all endpoints
 */

/**
 * Send a success response
 * @param {import('express').Response} res
 * @param {object} options
 */
const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, meta = null }) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return res.status(statusCode).json(response);
};

/**
 * Send a paginated success response
 */
const sendPaginated = (res, { data, total, page, limit, message = 'Data retrieved successfully' }) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
};

/**
 * Send an error response (use errorHandler middleware for unhandled errors)
 */
const sendError = (res, { statusCode = 500, message = 'Something went wrong' }) => {
  return res.status(statusCode).json({ success: false, message });
};

module.exports = { sendSuccess, sendPaginated, sendError };
