const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const getCorsOptions = require('./config/cors');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

/**
 * Create and configure the Express application.
 * Applies security headers, CORS, rate limiting, body parsing,
 * and mounts all API routes.
 *
 * @returns {Object} Configured Express app.
 */
const createApp = () => {
  const app = express();

  // ─── Security ──────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(cors(getCorsOptions()));

  // ─── Rate Limiting ─────────────────────────────────
  app.use('/api', generalLimiter);

  // ─── Body Parsing ──────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ─── API Routes ────────────────────────────────────
  app.use('/api', routes);

  // ─── Root Route ────────────────────────────────────
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'Welcome to LakshiChatz API',
      version: '1.0.0',
      docs: '/api/health',
    });
  });

  // ─── Error Handling ────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
