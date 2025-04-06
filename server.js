const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./config/db');
const { sequelize } = require('./models');

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
const getExpensesRoute = require('./routes/getExpensesRoute');
const deleteExpenseRoute = require('./routes/deleteExpenseRoute');
const authRoutes = require('./middleware/auth');
const razorpayRoute = require('./routes/razorpayRoute'); // Import Razorpay route
const leaderboardRoutes = require('./routes/leaderboardRoute');
const forgotPasswordRoute = require("./routes/forgotPasswordRoute");
const downloadHistoryRoute = require('./routes/downloadRoutes');



// Use routes
app.use('/', checkEmailRoute);
app.use('/', signupRoute);
app.use('/login', loginRoute);
app.use('/', addExpenseRoute);
app.use('/api', getExpensesRoute);
app.use('/delete-expense', deleteExpenseRoute);
app.use('/api/auth', authRoutes);
app.use('/purchase', razorpayRoute); // Use Razorpay route
app.use('/leaderboard', leaderboardRoutes);
app.use("/password", forgotPasswordRoute);
app.use('/api', downloadHistoryRoute);

// app.get('/leaderboard', (req, res) => {
//     console.log(req.headers); // Check if the request has correct headers
//     res.send('Leaderboard data');
// });

sequelize.sync()
  .then(() => {
    console.log('Database synced!');
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });

// Start server
app.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000`);
});
