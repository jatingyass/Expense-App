const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.delete('/:id', (req, res) => {
    const expenseId = req.params.id;
     console.log(expenseId);
    const query = 'DELETE FROM expenses WHERE id = ?';
    db.query(query, [expenseId], (err, result) => {
        if (err) {
            console.error('Error deleting expense:', err);
            return res.status(500).json({ success: false, message: 'Error deleting expense' });
        }
        res.status(200).json({ success: true, message: 'Expense deleted successfully' });
    });
});

module.exports = router;