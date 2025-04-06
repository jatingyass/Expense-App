const express = require('express');
const { signupUser } = require('../controllers/signupController');
const router = express.Router();

// User Signup
router.post('/signup', signupUser);

module.exports = router;
