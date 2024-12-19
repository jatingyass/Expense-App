const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

router.post('/', (req, res) => {
    const {email, password} = req.body;
    console.log(`Email: ${email}, Password: ${password}`); // Log received data


    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, result) => {
        // console.log(result);
        if(err){
            console.log('error checking email:', err);
            return res.status(500).json({success: false, message: 'Internal server error'});
        }

        if(result.length > 0){
            const user = result[0];
            console.log(user);
    
            if(user.password === password){
                res.status(200).json({success: true, message: "User logged in successfully"});
            }else{
                return res.status(400).json({success: false, message: 'Password is incorrect'});
            }
        }else{
            return res.status(404).send('User not found');
        }
    });
});

module.exports = router;