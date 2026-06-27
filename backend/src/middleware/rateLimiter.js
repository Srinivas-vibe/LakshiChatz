const rateLimit = require('express-rate-limit');
const { HTTP_STATUS } = require('../constants');
const env = require('../config/env');

/**
 * Create a rate limiter with custom message format.
 * @param {Object} options - Rate limiter options.
 * @returns {Function} Express middleware.
 */
const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || env.RATE_LIMIT_WINDOW_MS,
    max: options.max || env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: options.message || 'Too many requests. Please try again later.',
        },
      });
    },
  });
};

/**
 * General API rate limiter: 100 requests per 15 minutes.
 */
const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP. Please try again after 15 minutes.',
});

/**
 * Auth rate limiter: 20 requests per 15 minutes.
 * More restrictive for login/register to prevent brute force.
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

/**
 * Search rate limiter: 30 requests per minute.
 */
const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many search requests. Please slow down.',
});

module.exports = {
  generalLimiter,
  authLimiter,
  searchLimiter,
};
