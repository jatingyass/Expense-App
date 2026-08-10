module.exports = (sequelize, DataTypes) => {
  const ForgotPasswordRequest = sequelize.define(
    'ForgotPasswordRequest',
    {
      id: {
        // We use uuidv4 from app code as the primary key — opaque + unguessable
        type: DataTypes.STRING(36),
        primaryKey: true,
        allowNull: false,
      },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      isUsed: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      timestamps: true,
      indexes: [{ fields: ['userId'] }, { fields: ['expiresAt'] }],
    },
  );

  return ForgotPasswordRequest;
};
