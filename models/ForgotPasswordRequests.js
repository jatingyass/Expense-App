module.exports = (sequelize, DataTypes) => {
    const ForgotPasswordRequest = sequelize.define('ForgotPasswordRequest', {
      id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      isactive: {
        type: DataTypes.ENUM('ACTIVE', 'NOT'),
        allowNull: false
      }
    });
    return ForgotPasswordRequest;
  };
  