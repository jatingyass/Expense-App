const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Jatin@1234',
    database: 'expense'
});

db.connect((err) => {
    if(err){
        console.log('Database connection failed:', err);
    }
    console.log('Connected to mysql database!');
});

module.exports = db;