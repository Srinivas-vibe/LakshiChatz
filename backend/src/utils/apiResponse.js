const { HTTP_STATUS } = require('../constants');

/**
 * Send a success response with consistent format.
 * @param {Object} res - Express response object.
 * @param {*} data - Response data payload.
 * @param {string} [message='Success'] - Success message.
 * @param {number} [statusCode=200] - HTTP status code.
 */
const successResponse = (res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response with consistent format.
 * @param {Object} res - Express response object.
 * @param {string} message - Error message.
 * @param {number} [statusCode=500] - HTTP status code.
 * @param {string} [code='ERROR'] - Error code.
 * @param {*} [details=null] - Additional error details.
 */
const errorResponse = (
  res,
  message = 'An error occurred',
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code = 'ERROR',
  details = null,
) => {
  const response = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

module.exports = { successResponse, errorResponse };
