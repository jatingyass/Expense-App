// Audit row for every CSV report a premium user generates.
// Lets us throttle abuse and lets the user re-download without re-running the query.

module.exports = (sequelize, DataTypes) => {
  const DownloadHistory = sequelize.define(
    'DownloadHistory',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      fileUrl: { type: DataTypes.STRING(1000), allowNull: false },
      rowCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      sizeBytes: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    },
    {
      timestamps: true,
      indexes: [{ fields: ['userId', 'createdAt'] }],
    },
  );

  return DownloadHistory;
};
