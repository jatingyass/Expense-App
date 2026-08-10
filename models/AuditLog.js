// Append-only log of money-affecting events for a user.
// Used for premium upgrade trail, refunds, suspicious activity review,
// and "show me what changed on my account" support flows.

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      event: {
        // e.g. 'order.created', 'payment.verified', 'premium.granted',
        //      'password.reset', 'expense.created', 'expense.deleted'
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      // Free-form JSON payload — whatever context is useful for that event
      payload: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      ipAddress: { type: DataTypes.STRING(45), allowNull: true },
      userAgent: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      timestamps: true,
      indexes: [
        { fields: ['userId', 'createdAt'] },
        { fields: ['event'] },
      ],
    },
  );

  return AuditLog;
};
