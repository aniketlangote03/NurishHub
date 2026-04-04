/**
 * Optional multipart handler for POST /api/donations:
 * - JSON body (default): unchanged
 * - multipart/form-data: field `payload` = JSON string + optional `images` files
 */

const { uploadDonationImages, handleMulterError } = require('./upload');
const { AppError } = require('./error');

function maybeParseDonationMultipart(req, res, next) {
  const ct = req.headers['content-type'] || '';
  if (!ct.includes('multipart/form-data')) {
    return next();
  }

  return uploadDonationImages(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    try {
      const raw = req.body.payload;
      if (!raw || typeof raw !== 'string') {
        return next(
          new AppError('Multipart donation requires a "payload" field (JSON string).', 400)
        );
      }
      const parsed = JSON.parse(raw);
      const host = `${req.protocol}://${req.get('host')}`;
      const uploaded = (req.files || []).map(
        (f) => `${host}/uploads/donations/${f.filename}`
      );
      req.body = { ...parsed, images: [...(parsed.images || []), ...uploaded] };
    } catch (e) {
      return next(new AppError('Invalid donation JSON in multipart payload.', 400));
    }
    return next();
  });
}

module.exports = { maybeParseDonationMultipart };
