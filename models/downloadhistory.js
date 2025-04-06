

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const DownloadHistory = sequelize.define("DownloadHistory", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false
  }
  
});

module.exports = DownloadHistory;
