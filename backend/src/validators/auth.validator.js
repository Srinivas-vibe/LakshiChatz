const { body } = require('express-validator');
const { VALIDATION } = require('../constants');

/**
 * Validation rules for user registration.
 */
const registerRules = [
  body('username')
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: VALIDATION.USERNAME_MIN, max: VALIDATION.USERNAME_MAX })
    .withMessage(
      `Username must be between ${VALIDATION.USERNAME_MIN} and ${VALIDATION.USERNAME_MAX} characters`,
    )
    .matches(/^[a-z0-9_]+$/)
    .withMessage('Username can only contain lowercase letters, numbers, and underscores'),

  body('displayName')
    .trim()
    .notEmpty()
    .withMessage('Display name is required')
    .isLength({ min: VALIDATION.DISPLAY_NAME_MIN, max: VALIDATION.DISPLAY_NAME_MAX })
    .withMessage(
      `Display name must be between ${VALIDATION.DISPLAY_NAME_MIN} and ${VALIDATION.DISPLAY_NAME_MAX} characters`,
    ),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: VALIDATION.PASSWORD_MIN })
    .withMessage(`Password must be at least ${VALIDATION.PASSWORD_MIN} characters`),
];

/**
 * Validation rules for user login.
 */
const loginRules = [
  body('username')
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage('Username is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

module.exports = {
  registerRules,
  loginRules,
};
