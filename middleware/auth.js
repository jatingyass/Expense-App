
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const SECRET_KEY = 'my_super_secret_key_12345!@#';

const authenticate = (req, res, next) => {
    try {
        // Extract token from Authorization header
        const token = req.headers['authorization'];

        if (!token) {
            return res.status(403).json({ success: false, message: 'Token is required' });
        }

        const actualToken = token.split(' ')[1]; // Extract token from "Bearer <token>"
        console.log('Extracted Token:', actualToken);

        // Verify token
        const decoded = jwt.verify(actualToken, SECRET_KEY);
        console.log('Decoded Token:', decoded);

         req.user = {
            userId: decoded.userId,
            isPremium: decoded.isPremium // Fix applied here ✅
        };

        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

module.exports = authenticate;
