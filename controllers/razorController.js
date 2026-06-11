const { Order, User, sequelize } = require('../models');
const paymentService = require('../services/paymentService');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const audit = require('../services/auditService');
const env = require('../config/env');

const createOrder = catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const order = await paymentService.createOrder({
    amount: env.PREMIUM_AMOUNT_PAISE,
    currency: env.PREMIUM_CURRENCY,
    receipt: `premium_${userId}_${Date.now()}`,
  });

  await Order.create({
    userId,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    status: 'created',
  });

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: paymentService.getPublicKeyId(),
  });
});

const verifyPayment = catchAsync(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const userId = req.user.userId;

  const valid = paymentService.verifySignature({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });
  if (!valid) throw ApiError.badRequest('Payment signature verification failed');

  const dbOrder = await Order.findOne({ where: { orderId: razorpay_order_id, userId } });
  if (!dbOrder) throw ApiError.notFound('Order not found');

  // Idempotency: already processed
  if (dbOrder.status === 'paid') {
    return res.json({ message: 'Payment already processed', isPremium: true });
  }

  await sequelize.transaction(async (t) => {
    await dbOrder.update(
      { status: 'paid', paymentId: razorpay_payment_id, signature: razorpay_signature },
      { transaction: t },
    );
    await User.update(
      { isPremium: true, premiumGrantedAt: new Date() },
      { where: { id: userId }, transaction: t },
    );
  });

  await audit.record({
    userId,
    event: 'payment.verified',
    payload: { orderId: razorpay_order_id, paymentId: razorpay_payment_id },
    req,
  });

  res.json({ message: 'Payment verified. Premium activated!', isPremium: true });
});

module.exports = { createOrder, verifyPayment };
