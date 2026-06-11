const { Expense } = require('../models');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const audit = require('../services/auditService');

const deleteExpense = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const expense = await Expense.findOne({ where: { id, userId } });
  if (!expense) throw ApiError.notFound('Expense not found');

  await expense.destroy();

  await audit.record({
    userId,
    event: 'expense.deleted',
    payload: { expenseId: id },
    req,
  });

  res.json({ message: 'Expense deleted' });
});

module.exports = { deleteExpense };
