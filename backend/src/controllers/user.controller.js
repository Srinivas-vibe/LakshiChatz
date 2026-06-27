const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');

/**
 * @route   GET /api/users/search?q=query
 * @desc    Search users by username or display name
 * @access  Private
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const users = await userService.searchUsers(q, req.userId);

  successResponse(res, { users }, 'Search results');
});

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 * @access  Private
 *
 * @route   GET /api/users/profile/:userId
 * @desc    Get a specific user's profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.userId;
  const user = await userService.getProfile(userId);

  successResponse(res, { user }, 'User profile');
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user's profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { displayName, bio, profilePicture } = req.body;

  const user = await userService.updateProfile(req.userId, {
    displayName,
    bio,
    profilePicture,
  });

  successResponse(res, { user }, 'Profile updated successfully');
});

/**
 * @route   POST /api/users/profile/upload
 * @desc    Upload profile picture for current user
 * @access  Private
 */
const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded or file was rejected by format limit.',
    });
  }

  // Generate full file URL
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

  // Update profilePicture field directly in the DB
  const user = await userService.updateProfile(req.userId, {
    profilePicture: fileUrl,
  });

  successResponse(
    res,
    { user, profilePicture: fileUrl },
    'Profile picture uploaded successfully'
  );
});

module.exports = {
  searchUsers,
  getProfile,
  updateProfile,
  uploadProfilePicture,
};
