const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Database connection

router.post('/', (req, res) => {
    const { email } = req.body;
    console.log(`Checking email: ${email}`);

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, result) => {
        if (err) {
            console.error('Error checking email:', err);
            return res.status(500).send('Error checking email');
        }

        if (result.length > 0) {
            // Email exists
            return res.json({ exists: true });
        } else {
            // Email does not exist
            return res.json({ exists: false });
        }
    });
});

module.exports = router;
