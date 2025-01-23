const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db, executeQuery } = require('../config/db'); 

const router = express.Router();
const SECRET_KEY = 'my_super_secret_key_12345!@#';
// const REFRESH_SECRET_KEY = 'my_refresh_secret_key_67890@#!';


router.post('/', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    try {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await executeQuery(query, [email]); // Using the executeQuery function

        const user = rows[0];
       
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.password) {
            console.error('Password field is missing in the user record:', user);
            return res.status(500).json({ success: false, message: 'User password is not set in the database' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        const token = jwt.sign({ 
            userId: user.id,
            is_premium: user.is_premium === 1
            },
           SECRET_KEY,
            { expiresIn: '1h' }
        );

        console.log(user.id);

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            userId: user.id,
            is_premium: user.is_premium
        });
    } 
    catch (err) {
        console.error('Server Error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
