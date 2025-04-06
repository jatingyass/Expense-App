
const { User, Expense, sequelize } = require('../models');

// Get leaderboard (only for premium users)
exports.getLeaderboard = async (req, res) => {
    try {
        console.log("haa", req.user.isPremium);
        
        if (!req.user.isPremium) {
            return res.status(403).json({ error: 'Access Denied. Upgrade to premium to view the leaderboard.' });
        }

        // Fetch total expenses per user using Sequelize
        const leaderboard = await User.findAll({
            attributes: ['id', 'name', [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('expenses.expenseAmount')), 0), 'total_expense']],
            include: [{
                model: Expense,
                attributes: [],
            }],
            group: ['User.id'],
            order: [[sequelize.literal('total_expense'), 'DESC']]
        });

        res.status(200).json({ leaderboard });
        console.log(leaderboard);

    } catch (err) {
        console.log('Error fetching leaderboard:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
};
