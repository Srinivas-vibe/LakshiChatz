const { validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../constants');

/**
 * Express-validator error aggregation middleware.
 * Call this after validation chain to check for errors.
 * Returns 422 with structured error details if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: formattedErrors,
      },
    });
  }

  next();
};

module.exports = validate;
