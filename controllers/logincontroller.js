
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {User} = require('../models');

const SECRET_KEY = 'my_super_secret_key_12345!@#';

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ where: { email } });
        
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
            isPremium: user.isPremium
            },
           SECRET_KEY,
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            userId: user.id,
            isPremium: user.isPremium
        });
    } catch (err) {
        console.error('Server Error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
