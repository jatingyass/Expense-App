const { User } = require('../models');
const catchAsync = require('../utils/catchAsync');

const checkEmail = catchAsync(async (req, res) => {
  const { email } = req.body;
  const existing = await User.findOne({ where: { email }, attributes: ['id'] });
  res.json({ available: !existing });
});

module.exports = { checkEmail };
