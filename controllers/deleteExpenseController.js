
// const { Expense } = require('../models');

// const deleteExpense = async (req, res) => {
//     const { id } = req.params;
//     const userId = req.user.userId; // ✅ Fix here

//     try {
//         console.log('UserId from token:', userId);
//         console.log('ExpenseId:', id);

//         const expense = await Expense.findOne({ where: { id, userId } });

//         if (!expense) {
//             return res.status(404).json({ success: false, message: 'Expense not found' });
//         }

//         await expense.destroy();
//         res.status(200).json({ success: true, message: 'Expense deleted successfully' });
//     } catch (error) {
//         console.error('Error deleting expense:', error);
//         res.status(500).json({ success: false, message: 'Failed to delete expense' });
//     }
// };

// module.exports = { deleteExpense };


const Expense = require('../models/expense'); // ✅ Mongoose model

//  DELETE Expense Controller
exports.deleteExpense = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        console.log('UserId from token:', userId);
        console.log('ExpenseId:', id);

        // MongoDB: Find expense by _id and user (No SQL WHERE clause)
        const expense = await Expense.findOne({ _id: id, userId: userId });

        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        // Delete using Mongoose's delete method
        await Expense.deleteOne({ _id: id });

        res.status(200).json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ success: false, message: 'Failed to delete expense' });
    }
};
