// Razorpay payment service.
// Big v1 issue we're fixing: the verify endpoint accepted the client-supplied
// `status` and granted premium with no signature check, so any logged-in user
// could become premium for free. Now we verify the HMAC SHA-256 signature
// Razorpay sends back from the checkout, and only then mark the order paid.

const crypto = require('crypto');
const Razorpay = require('razorpay');
const env = require('../config/env');
const logger = require('../utils/logger');

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

const createOrder = async ({ amount, currency = env.PREMIUM_CURRENCY, receipt }) => {
  const order = await razorpay.orders.create({
    amount,
    currency,
    receipt,
    payment_capture: 1, // auto-capture authorized payments
  });
  if (!order?.id) throw new Error('Razorpay order creation failed');
  logger.info(`razorpay order created: id=${order.id} amount=${amount}`);
  return order;
};

// Razorpay computes HMAC-SHA256(secret, "<order_id>|<payment_id>") on its end
// and sends the digest as `razorpay_signature`. We recompute and compare in
// constant time. Mismatch == forged or tampered payment.
const verifySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  // timingSafeEqual rejects buffers of different lengths, so guard first
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(razorpay_signature, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

// Exposed so we can store it in env (frontend uses it on the checkout widget).
const getPublicKeyId = () => env.RAZORPAY_KEY_ID;

module.exports = { createOrder, verifySignature, getPublicKeyId };
