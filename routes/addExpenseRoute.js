const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/', (req, res) => {
    const { userId, amount, description, category } = req.body;

    const query = 'INSERT INTO expenses (user_Id, amount, description, category) VALUES (?, ?, ?, ?)';
    db.query(query, [userId, amount, description, category], (err, result) => {
        if (err) {
            console.error('Error adding expense:', err);
            return res.status(500).send('Error adding expense');
        }
        res.status(200).json({ success: true, message: 'Expense added successfully' });
    });
});

module.exports = router;