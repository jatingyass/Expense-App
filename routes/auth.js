const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { signupSchema, loginSchema, checkEmailSchema } = require('../validation/auth.schema');
const { forgotPasswordSchema, resetPasswordSchema, validateResetParamSchema } = require('../validation/password.schema');
const { signup } = require('../controllers/signupController');
const { login } = require('../controllers/logincontroller');
const { checkEmail } = require('../controllers/checkEmailController');
const { forgotPassword, validateResetLink, resetPassword } = require('../controllers/forgotPasswordController');

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/check-email', validate(checkEmailSchema), checkEmail);

router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.get('/reset-password/:id', validate(validateResetParamSchema, 'params'), validateResetLink);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

module.exports = router;
