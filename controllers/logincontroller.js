const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const audit = require('../services/auditService');
const env = require('../config/env');

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw ApiError.unauthorized('Invalid email or password');

  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  await audit.record({ userId: user.id, event: 'user.login', payload: { email }, req });

  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, name: user.name, email: user.email, isPremium: user.isPremium },
  });
});

module.exports = { login };
