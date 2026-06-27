import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '../constants';

/**
 * Configured Axios instance for all API calls.
 * Includes request interceptor for JWT and response interceptor for 401 handling.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor: Attach JWT token to all requests.
 */
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get token from storage:', error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor: Handle 401 unauthorized (auto-logout).
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear stored auth
      try {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.AUTH_TOKEN,
          STORAGE_KEYS.USER_DATA,
        ]);
      } catch (storageError) {
        console.error('Failed to clear auth storage:', storageError);
      }

      // The auth store's listener will pick up the storage change
      // and navigate to login screen
    }

    // Extract error message from response or provide a default
    const errorMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    const errorCode =
      error.response?.data?.error?.code || 'UNKNOWN_ERROR';

    const enhancedError = new Error(errorMessage);
    enhancedError.code = errorCode;
    enhancedError.status = error.response?.status;
    enhancedError.details = error.response?.data?.error?.details;

    return Promise.reject(enhancedError);
  },
);

export default api;
