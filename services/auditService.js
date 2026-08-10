// Best-effort write to the AuditLog. We never let an audit failure break
// the user-facing operation — the underlying business logic already happened,
// the audit row is observability, not correctness.

const { AuditLog } = require('../models');
const logger = require('../utils/logger');

const record = async ({ userId, event, payload, req }) => {
  try {
    const ipAddress =
      req?.ip ||
      req?.headers?.['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      null;
    const userAgent = req?.headers?.['user-agent']?.toString().slice(0, 255) || null;

    await AuditLog.create({
      userId: userId || null,
      event,
      payload: payload || null,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    logger.warn(`audit write failed for event=${event} userId=${userId}: ${err.message}`);
  }
};

module.exports = { record };
