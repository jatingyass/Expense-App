
  const { Expense, User } = require('../models');

exports.getExpenses = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID not found.' });
    }

    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Total expenses count for pagination
    const totalExpenses = await Expense.count({ where: { userId } });
    const totalPages = Math.ceil(totalExpenses / limit);

    // Fetch paginated expenses
    const expenses = await Expense.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    // Fetch user to get isPremium status
    const user = await User.findByPk(userId);

    res.status(200).json({
      success: true,
      expenses,
      totalPages,
      isPremium: user ? user.isPremium : false,
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ success: false, message: 'Error fetching expenses' });
  }
};
