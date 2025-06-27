const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const SECRET_KEY = 'my_super_secret_key_12345!@#';

const authenticate = (req, res, next) => {
    try {
        //1. Extract token from header
        const token = req.headers['authorization'];
        if (!token) {
            return res.status(403).json({ success: false, message: 'Token is required' });
        }

        // 2. Remove 'Bearer ' from token
        const actualToken = token.split(' ')[1];
        console.log('Extracted Token:', actualToken);

        //3. Verify token
        const decoded = jwt.verify(actualToken, SECRET_KEY);
        console.log('Decoded Token:', decoded);

        // 4. Attach user data to request
        req.user = {
            userId: decoded.userId,
            isPremium: decoded.isPremium
        };

        next(); //5. Pass control to next middleware
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

module.exports = authenticate;
