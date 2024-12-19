const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/', (req, res) => {
    const {email, password} = req.body;
    console.log(`Email: ${email}, Password: ${password}`); // Log received data


    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, result) => {
        if(err){
            console.log('error during login:', err);
            return res.status(500).json({success: false, message: 'Internal server error'});
        }

        if(result.length > 0){
            //user authenticated
            res.json({success: true, message: 'Login successful'});
        }else{
            res.json({success: false, message: 'Invalid email or password'});
        }
    });
});

module.exports = router;