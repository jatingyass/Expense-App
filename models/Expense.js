const { executeQuery } = require('../config/db');

class Expense {
    static addExpense(userId, amount, description, category, callback) {
        const query = 'INSERT INTO expenses (user_id, amount, description, category) VALUES (?, ?, ?, ?)';
        executeQuery(query, [userId, amount, description, category], callback);
    }
}

module.exports = Expense;
