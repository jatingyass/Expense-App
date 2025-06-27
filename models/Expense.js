
// module.exports = (sequelize, DataTypes) => {
//     const Expense = sequelize.define('Expense', {
//       id: { 
//         type: DataTypes.INTEGER, 
//         primaryKey: true, 
//         autoIncrement: true 
//       },
//       expenseAmount: { 
//         type: DataTypes.BIGINT, 
//         allowNull: false 
//       },
//       income: { 
//         type: DataTypes.BIGINT, 
//         defaultValue: 0, 
//         allowNull: false 
//       },
//       description: { 
//         type: DataTypes.STRING, 
//         allowNull: false 
//       },
//       type: { 
//         type: DataTypes.ENUM('Food', 'Movie', 'Petrol', 'Bills', 'Salary'), 
//         allowNull: false 
//       },
//       userId: { 
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         references: {
//           model: 'Users',
//           key: 'id'
//         }
//       }
//     });
  
//     Expense.associate = (models) => {
//       Expense.belongsTo(models.User, {
//         foreignKey: 'userId',
//         onDelete: 'CASCADE'
//       });
//     };
  
//     return Expense;
//   };
  

const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expenseAmount: {
    type: Number,
    required: true
  },
  income: {
    type: Number,
    required: true,
    default: 0
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Food', 'Movie', 'Petrol', 'Bills', 'Salary'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
  
