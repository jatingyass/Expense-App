const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { addExpenseSchema, idParamSchema, listExpensesQuerySchema } = require('../validation/expense.schema');
const { addExpense } = require('../controllers/addExpenseController');
const { getExpenses } = require('../controllers/getExpensesController');
const { deleteExpense } = require('../controllers/deleteExpenseController');

router.use(authenticate);

router.post('/', validate(addExpenseSchema), addExpense);
router.get('/', validate(listExpensesQuerySchema, 'query'), getExpenses);
router.delete('/:id', validate(idParamSchema, 'params'), deleteExpense);

module.exports = router;
