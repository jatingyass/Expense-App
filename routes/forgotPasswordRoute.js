const express = require('express');
const router = express.Router();
const { forgotPassword, resetPasswordForm, updatePassword } = require('../controllers/forgotPasswordController');

// Forgot Password - Generate Reset Link
router.post('/forgotpassword', forgotPassword);

// Validate Reset Link and Show Reset Form
router.get('/resetpassword/:id', resetPasswordForm);

// Update Password
router.post('/updatepassword', updatePassword);

module.exports = router;
