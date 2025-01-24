const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const {db, executeQuery} = require('../config/db');
const authenticate = require('../middleware/auth');

const razorpay = new Razorpay({
    key_id: 'rzp_test_g9o5t7MyUYqjBf', // Replace with your Razorpay key ID
    key_secret: 'nWqDg2Ms5Txb8BmTz6ojZsXx' // Replace with your Razorpay key secret
});

// Route to create a Razorpay order
router.get('/premiummembership', authenticate, async (req, res) => {
    try {
        const amount = 50000; // Amount in paise (e.g., 50000 paise = ₹500)
        const currency = 'INR';

        const order = await razorpay.orders.create({ amount, currency });
        console.log('Order Response:', order);
        
        if (!order || !order.id) {
            throw new Error('Razorpay API response is undefined or invalid');
        }
        res.status(200).json({ key_id: razorpay.key_id, order });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ success: false, message: 'Error creating order' });
    }
});

// Route to update transaction status
router.post('/updatetransactionstatus', authenticate, async (req, res) => {
    const { order_id, payment_id, status } = req.body;

    try {
        // Update the order status in the database
        const updateOrderStatus = db.query('UPDATE orders SET status = ?, payment_id = ? WHERE id = ?', [status, payment_id, order_id]);

        let updateUserStatus;
        if (status === 'SUCCESSFUL') {
            const userId = req.userId;
            updateUserStatus = db.query('UPDATE users SET is_premium = ? WHERE id = ?', [true, userId]);
        }

        await Promise.all([updateOrderStatus, updateUserStatus].filter(Boolean));

        res.status(200).json({ success: true, message: 'Transaction status updated' });
    } catch (error) {
        console.error('Error updating transaction status:', error);
        res.status(500).json({ success: false, message: 'Error updating transaction status' });
    }
});

module.exports = router;