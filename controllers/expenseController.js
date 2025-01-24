// const Expense = require('../models/Expense');

// const addExpense = (req, res) => {
//     const { amount, description, category } = req.body;
//     const userId = req.userId; 

//     if (!amount || !description || !category) {
//         return res.status(400).json({ success: false, message: 'All fields are required!' });
//     }

//     Expense.addExpense(userId, amount, description, category, (err, results) => {
//         if (err) {
//             console.error('Database error:', err.message);
//             return res.status(500).json({ success: false, message: 'Database error' });
//         }

//         res.status(200).json({ success: true, message: 'Expense added successfully!'});
//     });
// };

// module.exports = { addExpense };
