const Sequelize = require('sequelize');
const { sequelize } = require('../config/db');

const UserModel = require('./user');
const ExpenseModel = require('./Expense');
const OrderModel = require('./order');
const ForgotPasswordRequestModel = require('./ForgotPasswordRequests');
const DownloadHistoryModel = require('./downloadhistory');
const AuditLogModel = require('./AuditLog');

const User = UserModel(sequelize, Sequelize.DataTypes);
const Expense = ExpenseModel(sequelize, Sequelize.DataTypes);
const Order = OrderModel(sequelize, Sequelize.DataTypes);
const ForgotPasswordRequest = ForgotPasswordRequestModel(sequelize, Sequelize.DataTypes);
const DownloadHistory = DownloadHistoryModel(sequelize, Sequelize.DataTypes);
const AuditLog = AuditLogModel(sequelize, Sequelize.DataTypes);

User.hasMany(Expense, { foreignKey: 'userId', as: 'expenses', onDelete: 'CASCADE' });
Expense.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Order, { foreignKey: 'userId', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(ForgotPasswordRequest, { foreignKey: 'userId', onDelete: 'CASCADE' });
ForgotPasswordRequest.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(DownloadHistory, { foreignKey: 'userId', onDelete: 'CASCADE' });
DownloadHistory.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(AuditLog, { foreignKey: 'userId', onDelete: 'SET NULL' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Expense,
  Order,
  ForgotPasswordRequest,
  DownloadHistory,
  AuditLog,
};
