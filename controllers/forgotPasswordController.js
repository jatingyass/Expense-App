
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const ForgotPasswordRequest = require('../models/ForgotPasswordRequests');
const User = require('../models/user');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    port: 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Forgot Password - Generate Reset Link
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const resetId = uuidv4();
        await ForgotPasswordRequest.create({
            id: resetId,
            userId: user.id,
            isactive: 'ACTIVE'
        });

        const resetLink = `http://localhost:3000/password/resetpassword/${resetId}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset Your Password',
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
        });

        res.json({ success: true, message: 'Reset link sent to email' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Something went wrong!' });
    }
};

// Reset Password Form - Validate Reset Request
exports.resetPasswordForm = async (req, res) => {
    const { id } = req.params;

    try {
        const request = await ForgotPasswordRequest.findOne({ where: { id, isactive: 'ACTIVE' } });
        if (!request) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
        }

        res.send(`<form action="/password/updatepassword" method="POST">
                    <input type="hidden" name="id" value="${id}" />
                    <input type="password" name="newPassword" placeholder="Enter new password" required />
                    <button type="submit">Reset Password</button>
                  </form>`);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Something went wrong!' });
    }
};

// Reset Password - Store New Password
exports.updatePassword = async (req, res) => {
    const { id, newPassword } = req.body;

    if (!id || !newPassword) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        const request = await ForgotPasswordRequest.findOne({ where: { id, isactive: 'ACTIVE' } });
        if (!request) {
            return res.status(400).json({ success: false, message: 'Invalid request' });
        }

        const user = await User.findByPk(request.userId);
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        await request.update({ isactive: 'NOT' });

        res.json({ success: true, message: 'Password reset successfully!' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Something went wrong!' });
    }
};
