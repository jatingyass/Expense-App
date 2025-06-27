// module.exports = (sequelize, DataTypes) => {
//     const ForgotPasswordRequest = sequelize.define('ForgotPasswordRequest', {
//       id: {
//          type: DataTypes.STRING, 
//          primaryKey: true, 
//          allowNull: false
//          },
//       isactive: {
//         type: DataTypes.ENUM('ACTIVE', 'NOT'),
//         allowNull: false
//       }
//     });
//     return ForgotPasswordRequest;
//   };
  

const mongoose = require('mongoose');

const forgotPasswordRequestSchema = new mongoose.Schema({
  _id: {
    type: String, 
    required: true
  },
  isactive: {
    type: String,
    enum: ['ACTIVE', 'NOT'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { _id: false, timestamps: true }); // we are using custom string _id

module.exports = mongoose.model('ForgotPasswordRequest', forgotPasswordRequestSchema);
