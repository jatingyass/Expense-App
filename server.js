const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./config/db');

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const checkEmailRoute = require('./routes/checkEmailRoute');
const signupRoute = require('./routes/singnupRoute');
const loginRoute = require('./routes/loginRoute');
const addExpenseRoute = require('./routes/addExpenseRoute');
const fetchExpensesRoute = require('./routes/fetchExpensesRoute');
const deleteExpenseRoute = require('./routes/deleteExpenseRoute');


// Use routes
app.use('/check-email', checkEmailRoute);
app.use('/signup', signupRoute);
app.use('/login', loginRoute);
app.use('/add-expense', addExpenseRoute);
app.use('/fetch-expenses', fetchExpensesRoute);
app.use('/delete-expense', deleteExpenseRoute);


// Start server
app.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000`);
});
