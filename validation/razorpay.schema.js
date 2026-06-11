const { z } = require('zod');

// Createing a premium-membership order; no body needed.
const createOrderSchema = z.object({}).strict().optional();

// Razorpay's standard checkout response shape.
const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

module.exports = { createOrderSchema, verifyPaymentSchema };
