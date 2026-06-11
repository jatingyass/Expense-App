const { Expense } = require('../models');
const catchAsync = require('../utils/catchAsync');
const audit = require('../services/auditService');

const addExpense = catchAsync(async (req, res) => {
  const { amount, description, category, kind, occurredAt, receiptUrl } = req.body;
  const userId = req.user.userId;

  const expense = await Expense.create({
    userId,
    amount,
    description,
    category,
    kind,
    occurredAt: occurredAt || new Date(),
    receiptUrl: receiptUrl || null,
  });

  await audit.record({
    userId,
    event: 'expense.created',
    payload: { expenseId: expense.id, amount, category, kind },
    req,
  });

  res.status(201).json({ message: 'Expense added', expense });
});

module.exports = { addExpense };
