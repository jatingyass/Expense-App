const { z } = require('zod');

const ALL_CATEGORIES = [
  'Food', 'Travel', 'Bills', 'Entertainment', 'Health',
  'Shopping', 'Education', 'Salary', 'Bonus', 'Investment', 'Other',
];

const addExpenseSchema = z.object({
  // Amount in paise (or cents). Integer-only to dodge float rounding.
  // The frontend converts rupees → paise before sending.
  amount: z.coerce.number().int().positive('Amount must be positive').max(10_000_000_000),
  description: z.string().trim().min(1, 'Description is required').max(255),
  category: z.enum(ALL_CATEGORIES),
  // Reuse Expense.kind to flag income vs expense; default expense
  kind: z.enum(['income', 'expense']).default('expense'),
  occurredAt: z.coerce.date().optional(),
  receiptUrl: z.string().max(1000).optional().nullable(),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const listExpensesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  kind: z.enum(['income', 'expense', 'all']).default('all'),
  category: z.enum([...ALL_CATEGORIES, 'all']).default('all'),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

module.exports = {
  addExpenseSchema,
  idParamSchema,
  listExpensesQuerySchema,
  ALL_CATEGORIES,
};
