// Storage abstraction with two drivers — same shape as Group-Chat-App.
//   "local" : writes to disk under env.LOCAL_UPLOAD_PATH (dev)
//   "s3"    : presigned S3/MinIO PUT (prod)
//
// Used for: receipts attached to expenses, and CSV reports for premium users.

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const env = require('../config/env');

// Per-mime byte caps (receipts only — CSVs use writeBuffer directly)
const MIME_LIMITS = {
  'image/jpeg': 10 * 1024 * 1024,
  'image/png': 10 * 1024 * 1024,
  'image/webp': 10 * 1024 * 1024,
  'application/pdf': 25 * 1024 * 1024,
  'text/csv': 25 * 1024 * 1024,
};
const ABSOLUTE_MAX_BYTES = 25 * 1024 * 1024;

const sanitize = (name) =>
  name
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .slice(-150);

const buildKey = (prefix, filename) => {
  const safe = sanitize(filename);
  const stamp = Date.now();
  const rand = crypto.randomBytes(6).toString('hex');
  return `${prefix}/${stamp}_${rand}_${safe}`;
};

// ---------------- LOCAL ----------------
const ensureLocalDir = () => {
  const dir = path.resolve(env.LOCAL_UPLOAD_PATH);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const localDriver = {
  async getUploadUrl({ filename, filetype, prefix = 'receipts' }) {
    const limit = MIME_LIMITS[filetype];
    if (!limit) {
      const err = new Error(`Filetype "${filetype}" is not allowed`);
      err.statusCode = 400;
      throw err;
    }
    ensureLocalDir();
    const key = buildKey(prefix, filename);
    return {
      url: `/api/files/upload?key=${encodeURIComponent(key)}`,
      fileUrl: `/uploads/${path.basename(key)}`,
      key,
      method: 'PUT',
      maxBytes: limit,
    };
  },

  async writeBuffer(buffer, { filename, prefix = 'reports', contentType }) {
    const dir = ensureLocalDir();
    const key = buildKey(prefix, filename);
    const full = path.join(dir, path.basename(key));
    await fs.promises.writeFile(full, buffer);
    return {
      fileUrl: `/uploads/${path.basename(key)}`,
      key,
      sizeBytes: buffer.length,
      contentType,
    };
  },
};

// ---------------- S3 ----------------
let s3Client = null;
const getS3Client = () => {
  if (s3Client) return s3Client;
  // eslint-disable-next-line global-require
  const AWS = require('aws-sdk');
  const config = {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    signatureVersion: 'v4',
  };
  if (env.AWS_S3_ENDPOINT) {
    config.endpoint = env.AWS_S3_ENDPOINT;
    config.s3ForcePathStyle = env.AWS_S3_FORCE_PATH_STYLE;
  }
  s3Client = new AWS.S3(config);
  return s3Client;
};

const s3Driver = {
  async getUploadUrl({ filename, filetype, prefix = 'receipts' }) {
    const limit = MIME_LIMITS[filetype];
    if (!limit) {
      const err = new Error(`Filetype "${filetype}" is not allowed`);
      err.statusCode = 400;
      throw err;
    }
    const s3 = getS3Client();
    const key = buildKey(prefix, filename);
    const url = await s3.getSignedUrlPromise('putObject', {
      Bucket: env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: filetype,
      Expires: 60,
    });
    const fileUrl = env.AWS_S3_ENDPOINT
      ? `${env.AWS_S3_ENDPOINT}/${env.AWS_BUCKET_NAME}/${key}`
      : `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
    return { url, fileUrl, key, method: 'PUT', maxBytes: limit };
  },

  async writeBuffer(buffer, { filename, prefix = 'reports', contentType }) {
    const s3 = getS3Client();
    const key = buildKey(prefix, filename);
    await s3
      .putObject({
        Bucket: env.AWS_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream',
      })
      .promise();
    const fileUrl = env.AWS_S3_ENDPOINT
      ? `${env.AWS_S3_ENDPOINT}/${env.AWS_BUCKET_NAME}/${key}`
      : `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
    return { fileUrl, key, sizeBytes: buffer.length, contentType };
  },
};

const driver = env.STORAGE_DRIVER === 's3' ? s3Driver : localDriver;

module.exports = {
  getUploadUrl: (...args) => driver.getUploadUrl(...args),
  writeBuffer: (...args) => driver.writeBuffer(...args),
  writeLocalBuffer: localDriver.writeBuffer, // for the local-upload route handler
  driverName: env.STORAGE_DRIVER,
  ABSOLUTE_MAX_BYTES,
};
