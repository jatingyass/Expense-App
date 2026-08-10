const express = require('express');
const router = express.Router();
const { authenticate, requirePremium } = require('../middleware/auth');
const { getLeaderboard } = require('../controllers/leaderboardcontroller');
const { downloadExpenseReport, getDownloadHistory } = require('../controllers/downloadHistoryController');

router.use(authenticate, requirePremium);

router.get('/leaderboard', getLeaderboard);
router.get('/report', downloadExpenseReport);
router.get('/report/history', getDownloadHistory);

module.exports = router;
