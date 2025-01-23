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

        const actualToken = token.split(' ')[1];  // `Bearer <token>`
        console.log('Extracted Token:', actualToken);
        // Verify the token
        const user = jwt.verify(actualToken, SECRET_KEY);  // Verify access token with the secret key
        console.log('Decoded Token:', user);

        req.userId = user.userId;  // Add userId to request object for future use
       console.log(req.userId);
       console.log(user.is_premium);
        req.isPremium = user.is_premium; // Store premium status in request object
        console.log("Premium Status:", req.isPremium);
        next();  // Continue to the next route handler
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

module.exports = authenticate;
