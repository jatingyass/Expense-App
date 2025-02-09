// const express = require('express');
// const router = express.Router();
// const authenticate = require('../middleware/auth');
// const { db, executeQuery } = require('../config/db');

// // Get Expenses for the authenticated user
// router.get('/', authenticate, async (req, res) => {
//     const userId = req.userId;
//     console.log('Fetching expenses for userId:', userId);
//     // console.log("le bhai dekh->", req.is_premium);


//     try {
//         const query = `
//         SELECT e.id, e.user_id, e.amount, e.income, e.description, e.category, e.created_at, u.is_premium
//         FROM expenses e
//         JOIN users u ON e.user_id = u.id
//         WHERE e.user_id = ?;
//     `;
//         // const query = 'SELECT id, user_id, amount, description, category, created_at FROM expenses WHERE user_id = ?';
//         const results = await executeQuery(query, [userId]);
//         // console.log('Query results:', results);
        
//         res.status(200).json({ expenses: results[0] });
//     } catch (err) {
//         console.error('Error fetching expenses:', err);
//         return res.status(500).send('Error fetching expenses');
//     }
// });

// module.exports = router;






const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { db, executeQuery } = require('../config/db');

router.get('/', authenticate, async (req, res) => {
    const userId = req.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    console.log(`Fetching expenses for userId: ${userId}, Page: ${page}`);

    try {
        // Get total number of expenses
        const countQuery = `SELECT COUNT(*) AS total FROM expenses WHERE user_id = ?`;
        const [countResult] = await executeQuery(countQuery, [userId]);
        const totalExpenses = countResult[0].total;
        const totalPages = Math.ceil(totalExpenses / limit);

        // 🔹 MySQL does NOT support ? for LIMIT & OFFSET, so use string interpolation
        const query = `
            SELECT e.id, e.user_id, e.amount, e.income, e.description, 
                   e.category, e.created_at, u.is_premium
            FROM expenses e
            JOIN users u ON e.user_id = u.id
            WHERE e.user_id = ?
            ORDER BY e.created_at DESC
            LIMIT ${limit} OFFSET ${offset};  -- ✅ Fix applied here
        `;

        const results = await executeQuery(query, [userId]);

        res.status(200).json({ expenses: results[0], totalPages });
    } catch (err) {
        console.error('Error fetching expenses:', err);
        res.status(500).json({ success: false, message: 'Error fetching expenses' });
    }
});

module.exports = router;
