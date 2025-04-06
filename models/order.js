
module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
      orderId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      paymentId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('created', 'completed', 'failed', 'pending'),
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    });
  
    Order.associate = (models) => {
      Order.belongsTo(models.User, { foreignKey: 'userId' });
    };
  
    return Order;
  };
  