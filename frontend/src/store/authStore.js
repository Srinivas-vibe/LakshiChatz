import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';
import { STORAGE_KEYS } from '../constants';

/**
 * Authentication store (Zustand).
 * Manages user session, JWT token, and auth state.
 */
const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Initially loading (checking stored token)
  error: null,

  /**
   * Load stored authentication data from AsyncStorage.
   * Called on app startup (SplashScreen).
   */
  loadStoredAuth: async () => {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
      ]);

      if (token && userData) {
        const user = JSON.parse(userData);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      }

      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      set({ isLoading: false, error: null });
      return false;
    }
  },

  /**
   * Login with username and password.
   * @param {string} username
   * @param {string} password
   */
  login: async (username, password) => {
    set({ isLoading: true, error: null });

    try {
      const { user, token } = await authService.login(username, password);

      // Persist to AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
      ]);

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Login failed',
      });
      return false;
    }
  },

  /**
   * Register a new user.
   * @param {string} username
   * @param {string} displayName
   * @param {string} password
   */
  register: async (username, displayName, password) => {
    set({ isLoading: true, error: null });

    try {
      const { user, token } = await authService.register(
        username,
        displayName,
        password,
      );

      // Persist to AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
      ]);

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Registration failed',
      });
      return false;
    }
  },

  /**
   * Logout and clear all stored data.
   */
  logout: async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.CACHED_CHATS,
      ]);
    } catch (error) {
      console.error('Failed to clear auth storage:', error);
    }

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  /**
   * Update the stored user data (e.g., after profile edit).
   * @param {Object} updatedUser - Updated user object.
   */
  updateUser: async (updatedUser) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(updatedUser),
      );
    } catch (error) {
      console.error('Failed to update stored user:', error);
    }

    set({ user: updatedUser });
  },

  /**
   * Clear any authentication error.
   */
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
