const { User, Expense, sequelize } = require('../models');
const catchAsync = require('../utils/catchAsync');

// requirePremium middleware gates this route; controller just runs the query.
const getLeaderboard = catchAsync(async (req, res) => {
  const leaderboard = await User.findAll({
    attributes: [
      'id',
      'name',
      [
        sequelize.fn(
          'COALESCE',
          sequelize.fn(
            'SUM',
            sequelize.literal("CASE WHEN `expenses`.`kind` = 'expense' THEN `expenses`.`amount` ELSE 0 END"),
          ),
          0,
        ),
        'totalSpend',
      ],
    ],
    include: [{ model: Expense, attributes: [], as: 'expenses', required: false }],
    group: ['User.id'],
    order: [[sequelize.literal('totalSpend'), 'DESC']],
    subQuery: false,
  });

  res.json({ leaderboard });
});

module.exports = { getLeaderboard };
