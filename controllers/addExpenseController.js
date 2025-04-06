
const { Expense, User } = require('../models');

exports.addExpense = async (req, res) => {
    const { amount, description, category } = req.body;
    const userId = req.user?.userId;

    console.log('Received data:', req.body);
    console.log('UserId:', userId);

    if (!amount || !description || !category) {
        return res.status(400).json({ success: false, message: 'All fields are required!' });
    }

    try {
        const income = category === 'Salary' ? parseFloat(amount) : 0;
        const expenseAmount = category !== 'Salary' ? parseFloat(amount) : 0;

        const expense = await Expense.create({
            income,
            expenseAmount,
            description,
            type: category,
            userId
        });

        console.log('Expense created:', expense);

        // Update total income and expenses for user
        const user = await User.findByPk(userId);
        if (user) {
            if (category === 'Salary') {
                user.total_income = (user.total_income || 0) + parseFloat(amount);
            } else {
                user.total_cost = (user.total_cost || 0) + parseFloat(amount);
            }
            await user.save();
        }

        return res.status(201).json({ success: true, message: 'Expense added successfully!', expense });
    } catch (error) {
        console.error('Error adding expense:', error);
        return res.status(500).json({ success: false, message: 'Failed to add expense' });
    }
};
