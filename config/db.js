// // const mysql = require('mysql2');

// // const db = mysql.createConnection({
// //     host: 'localhost',
// //     user: 'root',
// //     password: 'Jatin@1234',
// //     database: 'expense'
// // });

// // db.connect((err) => {
// //     if(err){
// //         console.log('Database connection failed:', err);
// //     }
// //     console.log('Connected to mysql database!');
// // });

// // module.exports = db;

// const mysql = require('mysql2/promise');

// const db = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: 'Jatin@123',
//     database: 'expense'
// });

// db.getConnection((err, connection) => {
//     if(err){
//         console.log('Database connection failed:', err);
//     }
//     console.log('Connected to mysql database!');
//     connection.release();
// });

// // Use the connection pool to execute queries
// async function executeQuery(query, params) {
//     try {
//         const connection = await db.getConnection();
//         const result = await connection.execute(query, params);
//         connection.release();
//         return result;
//     } catch (err) {
//         console.error('Database error:', err);
//         throw err;
//     }
// }

// module.exports = { db, executeQuery };



const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('expenseZ', 'root', 'Jatin@123', {
  host: 'localhost',
  dialect: 'mysql'
});

sequelize.authenticate()
  .then(() => console.log('Database connected successfully!'))
  .catch(err => console.error('Database connection error:', err));

module.exports = sequelize;
