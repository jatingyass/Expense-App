const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { getLeaderboard } = require('../controllers/leaderboardcontroller');

// Get leaderboard (only for premium users)
router.get('/', authenticate, getLeaderboard);

module.exports = router;
