const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
};

// Authenticates the request via JWT.
// Note: we deliberately re-fetch isPremium from the DB on every request
// rather than trusting the token claim. The token-baked premium flag in v1
// became stale the moment a user paid; this fix keeps premium state correct.
const authenticate = catchAsync(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Authentication token missing');

  const decoded = jwt.verify(token, env.JWT_SECRET);

  const user = await User.findByPk(decoded.userId, {
    attributes: ['id', 'name', 'email', 'isPremium'],
  });
  if (!user) throw ApiError.unauthorized('User no longer exists');

  req.user = {
    userId: user.id,
    id: user.id,
    name: user.name,
    email: user.email,
    isPremium: user.isPremium,
  };
  next();
});

const requirePremium = (req, res, next) => {
  if (!req.user?.isPremium) {
    throw ApiError.forbidden('Premium membership required');
  }
  next();
};

module.exports = { authenticate, requirePremium };
