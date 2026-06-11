const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const path = require('path');

const env = require('./config/env');
const { apiLimiter, authLimiter, paymentLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const paymentRoutes = require('./routes/payments');
const premiumRoutes = require('./routes/premium');
const fileRoutes = require('./routes/files');

const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(compression());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // Serve locally-stored uploads (receipts + reports)
  app.use('/uploads', express.static(path.resolve(env.LOCAL_UPLOAD_PATH)));

  app.get('/healthz', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/expenses', apiLimiter, expenseRoutes);
  app.use('/api/payments', paymentLimiter, paymentRoutes);
  app.use('/api/premium', apiLimiter, premiumRoutes);
  app.use('/api', apiLimiter, fileRoutes);

  app.use((req, res, next) => next(ApiError.notFound('Route not found')));

  app.use(errorHandler);

  return app;
};

module.exports = createApp;
