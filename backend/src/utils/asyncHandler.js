/**
 * Wraps an async route handler to automatically catch errors
 * and forward them to Express error handling middleware.
 *
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 *
 * @param {Function} fn - Async route handler function.
 * @returns {Function} Express middleware that catches async errors.
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
