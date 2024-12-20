const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Database connection
const bcrypt = require('bcryptjs');


router.post('/', async(req, res) => {
    const { name, email, password } = req.body;
    console.log(`Received signup data: Name=${name}, Email=${email}, Password=${password}`);
 try{
       const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    db.query(query, [name, email, hashedPassword], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).send('Error saving data');
        }

        console.log('Insert result:', result);
        res.send(`
            <h1>Signup Successful</h1>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
        `);
    });

   }catch (err){
       console.log('error hashing password:', err);
       res.status(500).send('error processing signup');
   }
});

module.exports = router;
