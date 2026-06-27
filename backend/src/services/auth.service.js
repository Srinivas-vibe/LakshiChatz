const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const { HTTP_STATUS } = require('../constants');
const { formatUserResponse } = require('../helpers');

class AuthService {
  /**
   * Register a new user.
   * @param {string} username - Unique username.
   * @param {string} displayName - Display name.
   * @param {string} password - Plain text password (will be hashed by model).
   * @returns {Promise<{user: Object, token: string}>}
   * @throws {Error} If username already exists.
   */
  async register(username, displayName, password) {
    // Check if username already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      const error = new Error('Username is already taken');
      error.statusCode = HTTP_STATUS.CONFLICT;
      error.code = 'USERNAME_TAKEN';
      throw error;
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      username: username.toLowerCase(),
      displayName,
      passwordHash: password,
    });

    // Generate JWT
    const token = this.generateToken(user._id);

    return {
      user: formatUserResponse(user),
      token,
    };
  }

  /**
   * Authenticate a user with username and password.
   * @param {string} username - The username.
   * @param {string} password - The plain text password.
   * @returns {Promise<{user: Object, token: string}>}
   * @throws {Error} If credentials are invalid.
   */
  async login(username, password) {
    // Find user by username (need to explicitly select passwordHash since it's excluded by default)
    const user = await User.findOne({ username: username.toLowerCase() }).select('+passwordHash');

    if (!user) {
      const error = new Error('Invalid username or password');
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid username or password');
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Generate JWT
    const token = this.generateToken(user._id);

    return {
      user: formatUserResponse(user),
      token,
    };
  }

  /**
   * Generate a JWT for a given user ID.
   * @param {string} userId - The user's MongoDB _id.
   * @returns {string} Signed JWT.
   */
  generateToken(userId) {
    return jwt.sign({ userId: userId.toString() }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
  }
}

module.exports = new AuthService();
