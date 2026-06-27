import { create } from 'zustand';
import userService from '../services/userService';

/**
 * User store (Zustand).
 * Manages search results and profile viewing/editing.
 */
const useUserStore = create((set) => ({
  // State
  searchResults: [],
  isSearching: false,
  profileUser: null,
  isLoadingProfile: false,
  isUpdatingProfile: false,
  error: null,

  /**
   * Search users by query.
   * @param {string} query - Search query.
   */
  searchUsers: async (query) => {
    if (!query || query.trim().length === 0) {
      set({ searchResults: [], isSearching: false });
      return;
    }

    set({ isSearching: true, error: null });

    try {
      const users = await userService.searchUsers(query.trim());
      set({ searchResults: users, isSearching: false });
    } catch (error) {
      set({
        isSearching: false,
        error: error.message || 'Search failed',
      });
    }
  },

  /**
   * Fetch a user's profile.
   * @param {string} userId - The user's ID.
   */
  fetchProfile: async (userId) => {
    set({ isLoadingProfile: true, error: null });

    try {
      const user = await userService.getProfile(userId);
      set({ profileUser: user, isLoadingProfile: false });
      return user;
    } catch (error) {
      set({
        isLoadingProfile: false,
        error: error.message || 'Failed to load profile',
      });
      return null;
    }
  },

  /**
   * Update the current user's profile.
   * @param {Object} data - Profile update data.
   * @returns {Promise<Object|null>} Updated user or null on failure.
   */
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true, error: null });

    try {
      const user = await userService.updateProfile(data);
      set({ isUpdatingProfile: false });
      return user;
    } catch (error) {
      set({
        isUpdatingProfile: false,
        error: error.message || 'Failed to update profile',
      });
      return null;
    }
  },

  /**
   * Upload user profile picture.
   * @param {FormData} formData
   * @returns {Promise<Object|null>}
   */
  uploadProfilePicture: async (formData) => {
    set({ isUpdatingProfile: true, error: null });

    try {
      const user = await userService.uploadProfilePicture(formData);
      set({ isUpdatingProfile: false });
      return user;
    } catch (error) {
      set({
        isUpdatingProfile: false,
        error: error.message || 'Failed to upload profile picture',
      });
      return null;
    }
  },

  /**
   * Clear search results.
   */
  clearSearch: () => set({ searchResults: [], isSearching: false }),

  /**
   * Clear error.
   */
  clearError: () => set({ error: null }),

  /**
   * Reset user store (on logout).
   */
  reset: () =>
    set({
      searchResults: [],
      isSearching: false,
      profileUser: null,
      isLoadingProfile: false,
      isUpdatingProfile: false,
      error: null,
    }),
}));

export default useUserStore;
