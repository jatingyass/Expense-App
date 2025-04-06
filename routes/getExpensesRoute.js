const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { getExpenses } = require('../controllers/getExpensesController');

router.get('/fetch-expenses', authenticate, getExpenses);

module.exports = router;
