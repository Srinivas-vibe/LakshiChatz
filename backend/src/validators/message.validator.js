const { body } = require('express-validator');
const { VALIDATION } = require('../constants');

/**
 * Validation rules for sending a message.
 */
const sendMessageRules = [
  body('receiverId')
    .notEmpty()
    .withMessage('Receiver ID is required')
    .isMongoId()
    .withMessage('Invalid receiver ID format'),

  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message cannot be empty')
    .isLength({ min: VALIDATION.MESSAGE_MIN, max: VALIDATION.MESSAGE_MAX })
    .withMessage(
      `Message must be between ${VALIDATION.MESSAGE_MIN} and ${VALIDATION.MESSAGE_MAX} characters`,
    ),
];

module.exports = {
  sendMessageRules,
};
