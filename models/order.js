module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderId: {
        // Razorpay's order_id — unique
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      paymentId: { type: DataTypes.STRING(100), allowNull: true },
      signature: { type: DataTypes.STRING(255), allowNull: true },
      amount: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
      status: {
        type: DataTypes.ENUM('created', 'paid', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'created',
      },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      timestamps: true,
      indexes: [
        { unique: true, fields: ['orderId'] },
        { fields: ['userId', 'status'] },
      ],
    },
  );

  return Order;
};
