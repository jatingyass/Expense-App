const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { verifyPaymentSchema } = require('../validation/razorpay.schema');
const { createOrder, verifyPayment } = require('../controllers/razorController');

router.use(authenticate);

router.post('/order', createOrder);
router.post('/verify', validate(verifyPaymentSchema), verifyPayment);

module.exports = router;
