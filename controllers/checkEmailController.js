
const { User } = require('../models'); // Sequelize Model import

// Check if email exists
exports.checkEmail = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required!' });
    }

    console.log(`Checking email: ${email}`);

    try {
        const user = await User.findOne({ where: { email } });

        if (user) {
            console.log("Email exists, sending response...");
            return res.json({ exists: true });
        } else {
            console.log("Email does not exist, sending response...");
            return res.json({ exists: false });
        }
    } catch (err) {
        console.error('Error checking email:', err);
        return res.status(500).json({ success: false, message: 'Error checking email' });
    }
};
