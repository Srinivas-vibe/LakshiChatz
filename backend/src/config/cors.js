const env = require('./env');

/**
 * CORS configuration factory.
 * Returns cors options based on environment.
 */
const getCorsOptions = () => {
  const options = {
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400, // 24 hours preflight cache
  };

  if (env.IS_PRODUCTION) {
    // In production, restrict to specific origins
    options.origin = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  } else {
    // In development, allow all origins
    options.origin = true;
  }

  return options;
};

module.exports = getCorsOptions;
