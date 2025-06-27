
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// Signup User
exports.signupUser = async (req, res) => {
    const { name, email, password} = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required!' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ success: false, message: 'User already exists!' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);


        // Create new user using Sequelize
        // const newUser = await User.create({ name, email, password: hashedPassword, ispremium: false });
         
        //mongoose
         const newUser = new User({
            name,
            email,
            password: hashedPassword,
            isPremium: false // same as ispremium in SQL
        });

        await newUser.save(); // Save to MongoDB

        res.status(201).json({ success: true, message: 'Signup successful', userId: newUser._id });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ success: false, message: 'Error signing up' });
    }
};
