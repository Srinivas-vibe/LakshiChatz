const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { HTTP_STATUS } = require('../constants');

/**
 * JWT authentication middleware.
 * Extracts token from Authorization header (Bearer <token>),
 * verifies it, and attaches the user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'Authentication required. Please provide a valid token.',
        },
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'Authentication required. Please provide a valid token.',
        },
      });
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Find user and exclude password
    const user = await User.findById(decoded.userId).select('-passwordHash');

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: 'AUTH_USER_NOT_FOUND',
          message: 'User associated with this token no longer exists.',
        },
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_EXPIRED',
          message: 'Token has expired. Please login again.',
        },
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'Invalid token. Please login again.',
        },
      });
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed.',
      },
    });
  }
};

module.exports = authenticate;
