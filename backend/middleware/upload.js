/**
 * Multer Upload Middleware
 * Handles multipart/form-data file uploads for donation images and user avatars
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./error');

// ─── Ensure upload directories exist ─────────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');
const dirs = [
  path.join(uploadDir, 'donations'),
  path.join(uploadDir, 'avatars'),
];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Storage Engine ───────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Route-based directory
    const isAvatar = req.baseUrl.includes('users') || req.path.includes('avatar');
    const dest = isAvatar
      ? path.join(uploadDir, 'avatars')
      : path.join(uploadDir, 'donations');
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = req.user?._id || 'unknown';
    cb(null, `${userId}-${uniqueSuffix}${ext}`);
  },
});

// ─── File Filter ──────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, WebP and GIF are allowed.`, 400), false);
  }
};

// ─── Multer instance ──────────────────────────────────────────────────────────
const maxSizeMB = parseInt(process.env.UPLOAD_MAX_SIZE_MB, 10) || 5;

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxSizeMB * 1024 * 1024, // Convert MB to bytes
    files: 5, // Max 5 files per request
  },
});

// ─── Multer error handler ─────────────────────────────────────────────────────
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError(`File too large. Maximum allowed size is ${maxSizeMB}MB.`, 400));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Too many files. Maximum 5 files per upload.', 400));
    }
    return next(new AppError(`Upload error: ${err.message}`, 400));
  }
  next(err);
};

// ─── Convenience upload presets ───────────────────────────────────────────────
const uploadDonationImages = upload.array('images', 5);
const uploadAvatar = upload.single('avatar');

// ─── Generate public URL from file path ──────────────────────────────────────
const getFileUrl = (req, filePath) => {
  if (!filePath) return null;
  const relativePath = filePath.replace(path.join(__dirname, '..'), '').replace(/\\/g, '/');
  return `${req.protocol}://${req.get('host')}${relativePath}`;
};

module.exports = { upload, uploadDonationImages, uploadAvatar, handleMulterError, getFileUrl };
