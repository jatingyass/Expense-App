const { Op } = require('sequelize');
const { Expense } = require('../models');
const catchAsync = require('../utils/catchAsync');

const getExpenses = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { page, limit, kind, category, from, to } = req.query;

  const where = { userId };

  if (kind && kind !== 'all') where.kind = kind;
  if (category && category !== 'all') where.category = category;
  if (from || to) {
    where.occurredAt = {};
    if (from) where.occurredAt[Op.gte] = new Date(from);
    if (to) where.occurredAt[Op.lte] = new Date(to);
  }

  const parsedPage = parseInt(page, 10) || 1;
  const parsedLimit = parseInt(limit, 10) || 10;
  const offset = (parsedPage - 1) * parsedLimit;

  const { count, rows: expenses } = await Expense.findAndCountAll({
    where,
    order: [['occurredAt', 'DESC']],
    limit: parsedLimit,
    offset,
  });

  res.json({
    expenses,
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(count / parsedLimit),
    },
  });
});

module.exports = { getExpenses };
