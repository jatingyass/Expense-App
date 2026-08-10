// Each row models a single financial event for a user.
// `kind` distinguishes income from expense — keeps the math simple at read time.

const EXPENSE_CATEGORIES = [
  'Food',
  'Travel',
  'Bills',
  'Entertainment',
  'Health',
  'Shopping',
  'Education',
  'Other',
];
const INCOME_CATEGORIES = ['Salary', 'Bonus', 'Investment', 'Other'];

module.exports = (sequelize, DataTypes) => {
  const Expense = sequelize.define(
    'Expense',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      kind: {
        // 'income' or 'expense' — determines which sum it contributes to
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false,
      },
      amount: {
        // Stored in paise (or cents). 100 paise = ₹1. Avoids float rounding.
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      description: { type: DataTypes.STRING(255), allowNull: false },
      category: {
        type: DataTypes.ENUM(
          ...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]),
        ),
        allowNull: false,
      },
      receiptUrl: { type: DataTypes.STRING(1000), allowNull: true },
      occurredAt: {
        // The date the user is recording the expense for, separate from createdAt
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: true,
      indexes: [
        { fields: ['userId', 'occurredAt'] },
        { fields: ['userId', 'kind'] },
      ],
    },
  );

  Expense.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
  Expense.INCOME_CATEGORIES = INCOME_CATEGORIES;

  return Expense;
};
