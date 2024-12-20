const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
    const { userId } = req.query;

    const query = 'SELECT * FROM expenses WHERE userId = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching expenses:', err);
            return res.status(500).send('Error fetching expenses');
        }
        res.status(200).json({ expenses: results });
    });
});

module.exports = router;