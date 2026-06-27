const { Router } = require('express');
const chatController = require('../controllers/chat.controller');
const authenticate = require('../middleware/auth');

const router = Router();

// All chat routes require authentication
router.use(authenticate);

router.get('/list', chatController.getChatList);

router.get('/:userId', chatController.getChatWithUser);

module.exports = router;
