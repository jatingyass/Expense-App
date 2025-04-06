const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { deleteExpense } = require('../controllers/deleteExpenseController');


router.delete('/:id', authenticate, deleteExpense);

module.exports = router;