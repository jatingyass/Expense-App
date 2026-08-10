const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const storageService = require('../services/storageService');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const env = require('../config/env');

// GET /api/receipts/upload-url?filename=...&filetype=...
// Returns a presigned S3 URL (prod) or a local upload URL (dev).
router.get(
  '/receipts/upload-url',
  authenticate,
  catchAsync(async (req, res) => {
    const { filename, filetype } = req.query;
    if (!filename || !filetype) throw ApiError.badRequest('filename and filetype required');
    const result = await storageService.getUploadUrl({ filename, filetype, prefix: 'receipts' });
    res.json(result);
  }),
);

// PUT /api/files/upload?key=...
// Local-driver upload endpoint — browser PUTs raw bytes here when STORAGE_DRIVER=local.
// In S3 mode the browser uploads directly to S3, so this route is a no-op guard.
router.put(
  '/files/upload',
  authenticate,
  express.raw({ type: () => true, limit: `${Math.ceil(storageService.ABSOLUTE_MAX_BYTES / 1024 / 1024) + 1}mb` }),
  catchAsync(async (req, res) => {
    if (storageService.driverName !== 'local') throw ApiError.notFound('Not found');

    const rawKey = req.query.key;
    if (!rawKey) throw ApiError.badRequest('key required');

    // Use only the basename to prevent any path-traversal via the key parameter
    const safe = path.basename(rawKey);
    const uploadDir = path.resolve(env.LOCAL_UPLOAD_PATH);
    const dest = path.join(uploadDir, safe);

    // Paranoia: ensure resolved path is inside uploadDir
    if (!dest.startsWith(uploadDir + path.sep) && dest !== uploadDir) {
      throw ApiError.badRequest('Invalid key');
    }

    const buffer = req.body; // express.raw gives us a Buffer
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw ApiError.badRequest('Empty or missing file body');
    }
    if (buffer.length > storageService.ABSOLUTE_MAX_BYTES) {
      throw ApiError.badRequest('File exceeds maximum allowed size');
    }

    fs.mkdirSync(uploadDir, { recursive: true });
    await fs.promises.writeFile(dest, buffer);

    res.json({ message: 'uploaded', fileUrl: `/uploads/${safe}` });
  }),
);

module.exports = router;
