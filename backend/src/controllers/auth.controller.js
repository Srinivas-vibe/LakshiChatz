const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { username, displayName, password } = req.body;

  const result = await authService.register(username, displayName, password);

  successResponse(res, result, 'User registered successfully', HTTP_STATUS.CREATED);
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const result = await authService.login(username, password);

  successResponse(res, result, 'Login successful');
});

module.exports = {
  register,
  login,
};
