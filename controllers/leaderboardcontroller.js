
// const { User, Expense, sequelize } = require('../models');

// // Get leaderboard (only for premium users)
// exports.getLeaderboard = async (req, res) => {
//     try {
//         console.log("User isPremium", req.user.isPremium);
        
//         if (!req.user.isPremium) {
//             return res.status(403).json({ error: 'Access Denied. Upgrade to premium to view the leaderboard.' });
//         }

//         // Fetch total expenses per user using Sequelize
//         const leaderboard = await User.findAll({
//             attributes: ['id', 'name', [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('expenses.expenseAmount')), 0), 'total_expense']],
//             include: [{
//                 model: Expense,
//                 attributes: [],
//                 as: 'expenses',
//             }],
//             group: ['User.id'],
//             order: [[sequelize.literal('total_expense'), 'DESC']]
//         });

//         res.status(200).json({ leaderboard });
//         console.log(leaderboard);

//     } catch (err) {
//         console.log('Error fetching leaderboard:', err);
//         res.status(500).json({ error: 'Internal server error', details: err.message });
//     }
// };


const { User } = require('../models'); // Mongoose User model

// Get leaderboard (only for premium users)
exports.getLeaderboard = async (req, res) => {
    try {
        console.log("User isPremium", req.user.isPremium);

        if (!req.user.isPremium) {
            return res.status(403).json({
                success: false,
                message: 'Access Denied. Upgrade to premium to view the leaderboard.'
            });
        }

        // ✅ Mongoose: Use aggregation pipeline to sum expenses
        const leaderboard = await User.aggregate([
            {
                $lookup: {
                    from: 'expenses', // MongoDB collection name (Mongoose auto-pluralizes)
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'expenses'
                }
            },
            {
                $addFields: {
                    total_expense: { $sum: '$expenses.expenseAmount' }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    total_expense: 1
                }
            },
            {
                $sort: { total_expense: -1 }
            }
        ]);

        res.status(200).json({ success: true, leaderboard });
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
};
