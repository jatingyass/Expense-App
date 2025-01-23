// const express = require('express');
// const router = express.Router();
// const {db, executeQuery} = require('../config/db'); // Database connection

// router.post('/', (req, res) => {
//     const { email } = req.body;
//     console.log(`Checking email: ${email}`);

//     const query = 'SELECT * FROM users WHERE email = ?';
//     db.query(query, [email], (err, result) => {
//         if (err) {
//             console.error('Error checking email:', err);
//             return res.status(500).send('Error checking email');
//         }

//         if (result.length > 0) {
//             // Email exists
//             return res.json({ exists: true });
//         } else {
//             // Email does not exist
//             return res.json({ exists: false });
//         }
//     });
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const { db, executeQuery } = require('../config/db');

router.post('/', async (req, res) => {
    const { email } = req.body;
    console.log(`Checking email: ${email}`);

    try {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await executeQuery(query, [email]); // Extract the first element

        console.log("Database Query Result:", rows); // Debugging log

        if (rows.length > 0) {
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
});

module.exports = router;
