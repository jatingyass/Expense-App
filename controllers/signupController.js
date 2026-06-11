const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const audit = require('../services/auditService');
const env = require('../config/env');

const signup = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) throw ApiError.conflict('Email already in use');

  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hash });

  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  await audit.record({ userId: user.id, event: 'user.signup', payload: { email }, req });

  res.status(201).json({
    message: 'Account created',
    token,
    user: { id: user.id, name: user.name, email: user.email, isPremium: user.isPremium },
  });
});

module.exports = { signup };
