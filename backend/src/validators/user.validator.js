const { body } = require('express-validator');
const { VALIDATION } = require('../constants');

/**
 * Validation rules for profile updates.
 */
const updateProfileRules = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: VALIDATION.DISPLAY_NAME_MIN, max: VALIDATION.DISPLAY_NAME_MAX })
    .withMessage(
      `Display name must be between ${VALIDATION.DISPLAY_NAME_MIN} and ${VALIDATION.DISPLAY_NAME_MAX} characters`,
    ),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: VALIDATION.BIO_MAX })
    .withMessage(`Bio cannot exceed ${VALIDATION.BIO_MAX} characters`),
];

module.exports = {
  updateProfileRules,
};
