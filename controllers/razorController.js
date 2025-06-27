
// const Razorpay = require('razorpay');
// const {Order, User} = require('../models');

// // Initialize Razorpay instance
// const razorpay = new Razorpay({
//   key_id: 'rzp_test_g9o5t7MyUYqjBf',
//   key_secret: 'nWqDg2Ms5Txb8BmTz6ojZsXx',
// });

// // Create Razorpay Order
// const createOrder = async (req, res) => {
//   try {
//     const amount = 50000; // ₹500 in paise
//     const currency = 'INR';

//     const order = await razorpay.orders.create({ amount, currency });
//     console.log('Order Created:', order);

//     if (!order || !order.id) {
//       throw new Error('Failed to create order from Razorpay');
//     }

//     // Save the order in the database
//     await Order.create({
//       orderId: order.id,
//       status: 'created',
//       userId: req.user.userId,
//     });

//     res.status(200).json({ key_id: razorpay.key_id, order });
//   } catch (error) {
//     console.error('Error creating Razorpay order:', error);
//     res.status(500).json({ success: false, message: 'Error creating order' });
//   }
// };

// // Update Transaction Status
// const updateTransactionStatus = async (req, res) => {
//   const { order_id, payment_id, status } = req.body;

//   const t = await Order.sequelize.transaction();

//   try {
//     const order = await Order.findOne({ where: { orderId: order_id }, transaction: t });

//     if (!order) {
//       throw new Error('Order not found');
//     }

//      // Validate payment_id
//      if (!payment_id) {
//       throw new Error('Payment ID is missing or invalid');
//     }

//     // Update order details
//     order.paymentId = payment_id;
//     order.status = status.toLowerCase() === 'successful' ? 'completed' : 'failed';
//     await order.save({ transaction: t });

//     // If payment is successful, upgrade user to premium
//     if (order.status === 'completed') {
//       const user = await User.findByPk(req.user.userId, { transaction: t });

//       if (!user) {
//         throw new Error('User not found');
//       }

//       user.isPremium = true;
//       await user.save({ transaction: t });

//       //  // Generate new token with updated isPremium status
//       //  const newToken = jwt.sign(
//       //   { userId: user.id, isPremium: user.isPremium },
//       //   SECRET_KEY,
//       //   { expiresIn: '1h' }
//       // );
//     }

//     await t.commit();
//     res.status(200).json({ success: true, message: 'Transaction status updated' });
//   } catch (error) {
//     await t.rollback();
//     console.error('Error updating transaction status:', error);
//     res.status(500).json({ success: false, message: 'Error updating transaction status' });
//   }
// };

// module.exports = { createOrder, updateTransactionStatus };


const Razorpay = require('razorpay');
const { Order, User } = require('../models');
const jwt = require('jsonwebtoken');

//Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: 'rzp_test_g9o5t7MyUYqjBf',
  key_secret: 'nWqDg2Ms5Txb8BmTz6ojZsXx',
});

// Create Razorpay Order
const createOrder = async (req, res) => {
  try {
    const amount = 50000; // ₹500 in paise
    const currency = 'INR';

    // Call Razorpay API to create order
    const order = await razorpay.orders.create({ amount, currency });
    console.log('Order Created:', order);

    if (!order || !order.id) {
      throw new Error('Failed to create order from Razorpay');
    }

    //  Save Razorpay order ID in MongoDB
    await Order.create({
      orderId: order.id,
      status: 'created',
      userId: req.user.userId, //  Storing reference to user
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

  try {
    //Mongoose version: no need for manual transaction unless you're doing very complex ops
    const order = await Order.findOne({ orderId: order_id });

    if (!order) {
      throw new Error('Order not found');
    }

    //Validate payment ID
    if (!payment_id) {
      throw new Error('Payment ID is missing or invalid');
    }

    //Update order fields
    order.paymentId = payment_id;
    order.status = status.toLowerCase() === 'successful' ? 'completed' : 'failed';
    await order.save(); //Save updated order
    
    let newToken = null;
    
    //If payment is successful, upgrade user to premium
    if (order.status === 'completed') {
      const user = await User.findById(req.user.userId);

      if (!user) {
        throw new Error('User not found');
      }

      user.isPremium = true;
      await user.save(); //Save updated user
      
      //Generate new token with updated isPremium status
       newToken = jwt.sign(
        { userId: user._id, isPremium: user.isPremium },
          process.env.SECRET_KEY,
        { expiresIn: '1h' }
      );
    }

    res.status(200).json({ success: true, message: 'Transaction status updated', token: newToken});
  } catch (error) {
    console.error('Error updating transaction status:', error);
    res.status(500).json({ success: false, message: 'Error updating transaction status' });
  }
};

module.exports = { createOrder, updateTransactionStatus };
