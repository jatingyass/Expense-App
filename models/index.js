
const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const DownloadHistory = require('./downloadhistory');
// Import and initialize models
const UserModel = require('./user');
const ExpenseModel = require('./expense');
const ForgotPasswordRequestModel = require('./ForgotPasswordRequests');
// const DownloadHistoryModel = require('./downloadhistory');
const OrderModel = require('./order');

const User = UserModel(sequelize, Sequelize.DataTypes);
const Expense = ExpenseModel(sequelize, Sequelize.DataTypes);
const ForgotPasswordRequest = ForgotPasswordRequestModel(sequelize, Sequelize.DataTypes);
// const DownloadHistory = DownloadHistoryModel(sequelize, Sequelize.DataTypes);
const Order = OrderModel(sequelize, Sequelize.DataTypes);

// Associations
User.hasMany(Expense, { foreignKey: 'userId' });
User.hasMany(ForgotPasswordRequest);
User.hasMany(DownloadHistory, { foreignKey: 'userId' });
User.hasMany(Order, { foreignKey: 'userId' });

Expense.belongsTo(User, { foreignKey: 'userId' });
ForgotPasswordRequest.belongsTo(User);
DownloadHistory.belongsTo(User, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Expense,
  ForgotPasswordRequest,
  DownloadHistory,
  Order
};
