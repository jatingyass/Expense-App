const express = require('express');
const path = require('path');

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

// Use routes
app.use('/check-email', checkEmailRoute);
app.use('/signup', signupRoute);
app.use('/login', loginRoute);

// Start server
app.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000`);
});
