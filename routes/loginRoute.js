const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

router.post('/', (req, res) => {
    const {email, password} = req.body;
    console.log(`Email: ${email}, Password: ${password}`); // Log received data


    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async(err, result) => {
        // console.log(result);
        if(err){
            console.log('error checking email:', err);
            return res.status(500).json({success: false, message: 'Internal server error'});
        }

        if(result.length > 0){
            //user exists
            const user = result[0];
            console.log(user);
    
          try{
              const isMacth = await bcrypt.compare(password, user.password);

              if(isMacth){
                  res.status(200).json({success: true, message: "User logged in successfully", userId: user.id});
              }else{
                  return res.status(400).json({success: false, message: 'Password is incorrect'});
              }
          }catch(err){
            console.log('error comparing passwords:', err);
            res.status(500).json({ success: false, message: 'error during login'});
          }
        }else{
            return res.status(404).send('User not found');
        }
    });
});

module.exports = router;