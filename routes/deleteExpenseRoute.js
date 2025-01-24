const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { db, executeQuery } = require('../config/db');

// Delete Expense - only for the authenticated user
router.delete('/:id', authenticate, async (req, res) => {
    const expenseId = req.params.id;
    const userId = req.userId;
   
    console.log('Expense ID from request:', expenseId); // Debugging: Log the expenseId
    console.log('User  ID from request:', userId); // Debugging: Log the userId
   
    if (!expenseId || isNaN(expenseId)) {
        return res.status(400).json({ success: false, message: 'Invalid expense ID' });
    }
    
    try {
        const checkQuery = 'SELECT * FROM expenses WHERE id = ? AND user_id = ?';
        const result = await executeQuery(checkQuery, [expenseId, userId]);

        if (result.length === 0) {
            return res.status(403).json({ success: false, message: 'Expense not found or not authorized to delete' });
        }

        const deleteQuery = 'DELETE FROM expenses WHERE id = ?';
        await executeQuery(deleteQuery, [expenseId]);

        res.status(200).json({ success: true, message: 'Expense deleted successfully' });
    } catch (err) {
        console.error('Error deleting expense:', err);
        return res.status(500).json({ success: false, message: 'Error deleting expense' });
    }
});

module.exports = router;