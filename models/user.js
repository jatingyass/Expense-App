
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      isPremium: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false,
        //  field: 'ispremium'
      }
    });
  
    return User;
  };
  