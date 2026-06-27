const { Router } = require('express');
const messageController = require('../controllers/message.controller');
const { sendMessageRules } = require('../validators/message.validator');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');

const router = Router();

// All message routes require authentication
router.use(authenticate);

router.post(
  '/send',
  sendMessageRules,
  validate,
  messageController.sendMessage,
);

router.get(
  '/history/:userId',
  messageController.getHistory,
);

module.exports = router;
