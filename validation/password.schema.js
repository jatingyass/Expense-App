const { z } = require('zod');

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email format'),
});

const resetPasswordSchema = z.object({
  // The reset request id (uuid, comes from the email link)
  requestId: z.string().uuid('Invalid reset link'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

const validateResetParamSchema = z.object({
  id: z.string().uuid('Invalid reset link'),
});

module.exports = {
  forgotPasswordSchema,
  resetPasswordSchema,
  validateResetParamSchema,
};
