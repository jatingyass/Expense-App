// const express = require('express');
// const {db, executeQuery} = require('../config/db'); // Import db connection
// const authenticate = require('../middleware/auth');
// const router = express.Router();

// // Add Expense - only for the authenticated user
// router.post('/', authenticate, (req, res) => {
//     const { amount, description, category } = req.body;
//     const userId = req.userId;

//     if (!amount || !description || !category) {
//         return res.status(400).json({ success: false, message: 'All fields are required!' });
//     }

//     const query = 'INSERT INTO expenses (user_id, amount, description, category) VALUES (?, ?, ?, ?)';
//      executeQuery(query, [userId, amount, description, category], (err, results) => {
//         if (err) {
//             console.error('Database error:', err.message);
//             return res.status(500).json({ success: false, message: 'Database error' });
//         }

//         res.status(200).json({ success: true, message: 'Expense added successfully!'});
//     });
// });

// module.exports = router;


// const express = require('express');
// const { db, executeQuery } = require('../config/db'); // Import db connection
// const authenticate = require('../middleware/auth');
// const router = express.Router();

// // Add Expense - only for the authenticated user
// router.post('/', authenticate, async (req, res) => {
//     const { amount, description, category } = req.body;
//     const userId = req.userId;

//     if (!amount || !description || !category) {
//         return res.status(400).json({ success: false, message: 'All fields are required!' });
//     }

//     try {
//         //Insert Expense
//         const insertQuery = 'INSERT INTO expenses (user_id, amount, description, category) VALUES (?, ?, ?, ?)';
//         await executeQuery(insertQuery, [userId, amount, description, category]);

//         // Update total_expense in users table
//         const updateQuery = `
//             UPDATE users 
//             SET total_expense = (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = ?)
//             WHERE id = ?;
//         `;
//         await executeQuery(updateQuery, [userId, userId]);

//         res.status(200).json({ success: true, message: 'Expense added and total_expense updated successfully!' });
//     } catch (err) {
//         console.error('Database error:', err.message);
//         return res.status(500).json({ success: false, message: 'Database error' });
//     }
// });

// module.exports = router;


const express = require('express');
const { db } = require('../config/db'); // Import db connection
const authenticate = require('../middleware/auth');
const router = express.Router();

// Add Expense - only for the authenticated user
router.post('/', authenticate, async (req, res) => {
    const { amount, description, category } = req.body;
    const userId = req.userId;

    if (!amount || !description || !category) {
        return res.status(400).json({ success: false, message: 'All fields are required!' });
    }

    const connection = await db.getConnection(); // Get MySQL connection for transaction

    try {
        await connection.beginTransaction(); // Start transaction

        // Insert Expense
        const insertQuery = 'INSERT INTO expenses (user_id, amount, description, category) VALUES (?, ?, ?, ?)';
        await connection.query(insertQuery, [userId, amount, description, category]);

        // Update total_expense in users table
        const updateQuery = `
            UPDATE users 
            SET total_expense = (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = ?)
            WHERE id = ?;
        `;
        await connection.query(updateQuery, [userId, userId]);

        await connection.commit(); // Commit transaction if both queries succeed
        res.status(200).json({ success: true, message: 'Expense added and total_expense updated successfully!' });

    } catch (err) {
        await connection.rollback(); // Rollback if any error occurs
        console.error('Transaction Error:', err.message);
        res.status(500).json({ success: false, message: 'Database error' });

    } finally {
        connection.release(); // Release connection back to pool
    }
});

module.exports = router;
