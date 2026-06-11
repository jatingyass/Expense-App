const { connect } = require('./config/db');
const { sequelize } = require('./models');
const createApp = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');

const main = async () => {
  await connect();

  // alter:true migrates schema without dropping data (dev only)
  await sequelize.sync({ alter: env.NODE_ENV === 'development' });
  logger.info('database synced');

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`server listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} — shutting down gracefully`);
    server.close(async () => {
      await sequelize.close();
      logger.info('db connection closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

main().catch((err) => {
  console.error('startup failed:', err);
  process.exit(1);
});
