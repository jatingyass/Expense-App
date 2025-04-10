const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { addExpense } = require('../controllers/addExpenseController');

router.post('/add-expense', authenticate, addExpense);

module.exports = router;
