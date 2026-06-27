const { Router } = require('express');
const userController = require('../controllers/user.controller');
const { updateProfileRules } = require('../validators/user.validator');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimiter');

const upload = require('../middleware/upload');

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get(
  '/search',
  searchLimiter,
  userController.searchUsers,
);

router.get(
  '/profile',
  userController.getProfile,
);

router.get(
  '/profile/:userId',
  userController.getProfile,
);

router.put(
  '/profile',
  updateProfileRules,
  validate,
  userController.updateProfile,
);

router.post(
  '/profile/upload',
  upload.single('profilePicture'),
  userController.uploadProfilePicture,
);

module.exports = router;
