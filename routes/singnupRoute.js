const express = require('express');
const router = express.Router();
const {db, executeQuery } = require('../config/db'); // Database connection
const bcrypt = require('bcryptjs');


// router.post('/', async(req, res) => {
//     const { name, email, password } = req.body;
//     console.log(`Received signup data: Name=${name}, Email=${email}, Password=${password}`);
//  try{
//        const hashedPassword = await bcrypt.hash(password, 10);

//     const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
//     const result = await executeQuery(query, [name, email, hashedPassword], (err, result) => {
//         console.log('Insert result:', result);
//         if (err) {
//             console.error('Error inserting data:', err);
//             return res.status(500).send('Error saving data');
//         }

//         console.log('Insert result:', result);
//         res.send(`
//             <h1>Signup Successful</h1>
//             <p><strong>Name:</strong> ${name}</p>
//             <p><strong>Email:</strong> ${email}</p>
//         `);
//     });

//    }catch (err){
//        console.log('error hashing password:', err);
//        res.status(500).send('error processing signup');
//    }
// });

// module.exports = router;

router.post('/', async (req, res) => {
    const { name, email, password } = req.body;
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await executeQuery('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
        await connection.commit();
        res.status(200).send('<h1>Signup Successful</h1>');
    } catch (err) {
        await connection.rollback();
        res.status(500).send('Error processing signup');
    } finally {
        connection.release();
    }
});

module.exports = router;