
const Razorpay = require('razorpay');
const {Order, User} = require('../models');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: 'rzp_test_g9o5t7MyUYqjBf',
  key_secret: 'nWqDg2Ms5Txb8BmTz6ojZsXx',
});

// Create Razorpay Order
const createOrder = async (req, res) => {
  try {
    const amount = 50000; // ₹500 in paise
    const currency = 'INR';

    const order = await razorpay.orders.create({ amount, currency });
    console.log('Order Created:', order);

    if (!order || !order.id) {
      throw new Error('Failed to create order from Razorpay');
    }

    // Save the order in the database
    await Order.create({
      orderId: order.id,
      status: 'created',
      userId: req.user.userId,
    });

    res.status(200).json({ key_id: razorpay.key_id, order });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ success: false, message: 'Error creating order' });
  }
};

// Update Transaction Status
const updateTransactionStatus = async (req, res) => {
  const { order_id, payment_id, status } = req.body;

  const t = await Order.sequelize.transaction();

  try {
    const order = await Order.findOne({ where: { orderId: order_id }, transaction: t });

    if (!order) {
      throw new Error('Order not found');
    }

     // Validate payment_id
     if (!payment_id) {
      throw new Error('Payment ID is missing or invalid');
    }

    // Update order details
    order.paymentId = payment_id;
    order.status = status.toLowerCase() === 'successful' ? 'completed' : 'failed';
    await order.save({ transaction: t });

    // If payment is successful, upgrade user to premium
    if (order.status === 'completed') {
      const user = await User.findByPk(req.user.userId, { transaction: t });

      if (!user) {
        throw new Error('User not found');
      }

      user.isPremium = true;
      await user.save({ transaction: t });

      //  // Generate new token with updated isPremium status
      //  const newToken = jwt.sign(
      //   { userId: user.id, isPremium: user.isPremium },
      //   SECRET_KEY,
      //   { expiresIn: '1h' }
      // );
    }

    await t.commit();
    res.status(200).json({ success: true, message: 'Transaction status updated' });
  } catch (error) {
    await t.rollback();
    console.error('Error updating transaction status:', error);
    res.status(500).json({ success: false, message: 'Error updating transaction status' });
  }
};

module.exports = { createOrder, updateTransactionStatus };


