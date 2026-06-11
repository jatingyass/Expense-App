const { Sequelize } = require('sequelize');
const env = require('./env');
const logger = require('../utils/logger');

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  logging: env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
});

const connect = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
  } catch (err) {
    logger.error(`Database connection failed: ${err.message}`);
    throw err;
  }
};

module.exports = { sequelize, connect };
