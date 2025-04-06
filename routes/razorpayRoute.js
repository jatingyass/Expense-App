const express = require('express');
const { createOrder, updateTransactionStatus } = require('../controllers/razorController');
const authenticate = require('../middleware/auth');
const router = express.Router();

// Create Razorpay Order
router.get('/premiummembership', authenticate, createOrder);

// Update Transaction Status
router.post('/updatetransactionstatus', authenticate, updateTransactionStatus);

module.exports = router;
