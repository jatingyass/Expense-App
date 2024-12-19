const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./config/db');

const app = express();
app.use(bodyParser.json());  // Use body-parser to parse JSON data

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, 'public')));

//route to check if email exists
app.post('/check-email', (req, res) => {
    const {email} = req.body;
    console.log(email);

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, result) => {
        if(err){
            console.log('error checking email:', err);
            res.status(500).send('error checking email');
        }else{
             //email exists
            if(result.length > 0){
               return res.json({exists: true});
            }
            else{
               return  res.json({exists: false});
            }
        }
    });
});

//route for signup
app.post('/signup', (req, res) => {
    const {name, email, password} = req.body;
    console.log("receiving fdata:", {name, email, password});

    const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    db.query(query, [name, email, password], (err, result) => {
        if(err){
            console.log('error inserting data:', err);
            res.status(500).send('error saving data');
        }else{
            console.log('insert result :', result);
            res.send(`
                <h1>Signup Successful</h1>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
            `);
        }
    })
});

app.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000`);
});