const express = require('express');
const {db, executeQuery} = require('../config/db'); // Import db connection
const authenticate = require('./auth');
const router = express.Router();

// Add Expense - only for the authenticated user
router.post('/', authenticate, (req, res) => {
    const { amount, description, category } = req.body;
    const userId = req.userId;

    if (!amount || !description || !category) {
        return res.status(400).json({ success: false, message: 'All fields are required!' });
    }

    const query = 'INSERT INTO expenses (user_id, amount, description, category) VALUES (?, ?, ?, ?)';
     executeQuery(query, [userId, amount, description, category], (err, results) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.status(200).json({ success: true, message: 'Expense added successfully!'});
    });
});

module.exports = router;
