module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING(100), allowNull: false },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
      },
      password: { type: DataTypes.STRING(200), allowNull: false },
      isPremium: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      premiumGrantedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      indexes: [{ unique: true, fields: ['email'] }],
    },
  );

  return User;
};
