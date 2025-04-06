const express = require("express");
const { downloadExpenseReport, getDownloadHistory } = require("../controllers/downloadHistoryController");
const authenticateUser  = require("../middleware/auth");



console.log("downloadExpenseReport:", downloadExpenseReport);
console.log("getDownloadHistory:", getDownloadHistory);


const router = express.Router();

// Download Report Route
router.get("/download-report", authenticateUser, downloadExpenseReport);

// Get Download History
router.get("/download-history", authenticateUser, getDownloadHistory);

module.exports = router;
