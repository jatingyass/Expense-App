
// module.exports = (sequelize, DataTypes) => {
//     const Order = sequelize.define('Order', {
//       orderId: {
//         type: DataTypes.STRING,
//         allowNull: false
//       },
//       paymentId: {
//         type: DataTypes.STRING,
//         allowNull: true
//       },
//       status: {
//         type: DataTypes.ENUM('created', 'completed', 'failed', 'pending'),
//         allowNull: false
//       },
//       userId: {
//         type: DataTypes.INTEGER,
//         allowNull: false
//       }
//     });
  
//     Order.associate = (models) => {
//       Order.belongsTo(models.User, { foreignKey: 'userId' });
//     };
  
//     return Order;
//   };
  

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true
  },
  paymentId: {
    type: String
  },
  status: {
    type: String,
    enum: ['created', 'completed', 'failed', 'pending'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
