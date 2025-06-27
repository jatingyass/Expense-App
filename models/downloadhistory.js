

// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/db");

// const DownloadHistory = sequelize.define("DownloadHistory", {
//   id: {
//     type: DataTypes.INTEGER,
//     autoIncrement: true,
//     primaryKey: true
//   },
//   fileUrl: {
//     type: DataTypes.STRING,
//     allowNull: false
//   }
  
// });

// module.exports = DownloadHistory;


const mongoose = require('mongoose');

const downloadHistorySchema = new mongoose.Schema({
  fileUrl: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('DownloadHistory', downloadHistorySchema);
