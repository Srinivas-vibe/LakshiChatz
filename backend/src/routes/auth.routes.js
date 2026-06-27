const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { registerRules, loginRules } = require('../validators/auth.validator');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.post(
  '/register',
  authLimiter,
  registerRules,
  validate,
  authController.register,
);

router.post(
  '/login',
  authLimiter,
  loginRules,
  validate,
  authController.login,
);

module.exports = router;
