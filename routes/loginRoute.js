const express = require('express');
const { loginUser } = require('../controllers/logincontroller');
const router = express.Router();

// Login route
router.post('/', loginUser);

module.exports = router;
