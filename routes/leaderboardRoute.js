const express = require('express');
const router = express.Router();
const authenticate = require('./auth');
const { db, executeQuery } = require('../config/db');

// Get leaderboard (only for premium users)
router.get('/', authenticate, async (req, res) => {
    console.log("haa",req.isPremium);
    if (!req.isPremium) {
        return res.status(403).json({ error: 'Access Denied. Upgrade to premium to view the leaderboard.' });
    }

    try {
        // Fetch total expenses per user
        const query = `
            SELECT u.id, u.name, COALESCE(SUM(e.amount), 0) AS total_expense
            FROM users u
            LEFT JOIN expenses e ON u.id = e.user_id
            GROUP BY u.id
            ORDER BY total_expense DESC;
        `;
        const results = await executeQuery(query, []);
        res.status(200).json({ leaderboard: results });
        console.log(results);
    } catch (err) {
        console.log('Error fetching leaderboard:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

module.exports = router;
