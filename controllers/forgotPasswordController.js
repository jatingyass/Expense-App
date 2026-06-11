const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { User, ForgotPasswordRequest } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const audit = require('../services/auditService');
const emailService = require('../services/emailService');
const env = require('../config/env');

// POST /auth/forgot-password
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  // Always return 200 to prevent email enumeration
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.json({ message: 'If that email is registered, a reset link has been sent.' });
  }

  const requestId = uuidv4();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await ForgotPasswordRequest.create({ id: requestId, userId: user.id, expiresAt });

  const resetLink = `${env.PASSWORD_RESET_URL}/${requestId}`;
  const { subject, text, html } = emailService.renderResetEmail(resetLink);
  await emailService.sendMail({ to: email, subject, text, html });

  await audit.record({ userId: user.id, event: 'password.resetRequested', payload: { email }, req });

  res.json({ message: 'If that email is registered, a reset link has been sent.' });
});

// GET /auth/reset-password/:id  — frontend calls this to check link validity before showing the form
const validateResetLink = catchAsync(async (req, res) => {
  const { id } = req.params;

  const request = await ForgotPasswordRequest.findOne({ where: { id, isUsed: false } });
  if (!request) throw ApiError.badRequest('Invalid or already-used reset link');
  if (new Date() > request.expiresAt) throw ApiError.badRequest('Reset link has expired');

  res.json({ valid: true });
});

// POST /auth/reset-password
const resetPassword = catchAsync(async (req, res) => {
  const { requestId, newPassword } = req.body;

  const request = await ForgotPasswordRequest.findOne({ where: { id: requestId, isUsed: false } });
  if (!request) throw ApiError.badRequest('Invalid or already-used reset link');
  if (new Date() > request.expiresAt) throw ApiError.badRequest('Reset link has expired');

  const user = await User.findByPk(request.userId);
  if (!user) throw ApiError.notFound('User not found');

  const hash = await bcrypt.hash(newPassword, 12);

  await user.update({ password: hash });
  await request.update({ isUsed: true });

  await audit.record({ userId: user.id, event: 'password.reset', payload: {}, req });

  res.json({ message: 'Password reset successfully' });
});

module.exports = { forgotPassword, validateResetLink, resetPassword };
