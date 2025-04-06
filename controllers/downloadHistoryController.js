const { Expense, DownloadHistory, User } = require("../models");
const { uploadToS3 } = require("../services/s3Service");
const { parse } = require("json2csv");

exports.downloadExpenseReport = async (req, res) => {
    try {
        const userId = req.user?.userId;

        // ✅ Check if user is Premium
        const user = await User.findByPk(userId);
        if (!user || !user.isPremium) {
            return res.status(401).json({ success: false, message: "Access denied! Premium users only." });
        }

        // ✅ Fetch All Expenses
        const expenses = await Expense.findAll({ where: { userId } });

        if (!expenses.length) {
            return res.status(404).json({ success: false, message: "No expenses found." });
        }

        // ✅ Convert Data to CSV
        const csvData = parse(expenses.map(exp => ({
            Date: exp.createdAt.toISOString(),
            Description: exp.description,
            Category: exp.type,
            Amount: exp.expenseAmount
        })));

        // ✅ Upload CSV to S3
        const fileName = `expenses_${userId}_${Date.now()}.csv`;
        const uploadResponse = await uploadToS3(csvData, fileName);

        // ✅ Save download history
        await DownloadHistory.create({ userId, fileUrl: uploadResponse.Location });

        res.status(200).json({ success: true, fileUrl: uploadResponse.Location });
    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

// ✅ Fetch Download History
exports.getDownloadHistory = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const history = await DownloadHistory.findAll({ where: { userId } });

        res.status(200).json({ success: true, history });
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};
