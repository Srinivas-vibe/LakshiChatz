/**
 * Application-wide constants.
 */

// API Configuration
export const API_BASE_URL = 'http://192.168.1.117:5000/api'; // Point to machine's local IP
export const SOCKET_URL = 'http://192.168.1.117:5000';

// For iOS Simulator, use:
// export const API_BASE_URL = 'http://localhost:5000/api';
// export const SOCKET_URL = 'http://localhost:5000';

// For physical device, use your machine's IP:
// export const API_BASE_URL = 'http://192.168.x.x:5000/api';
// export const SOCKET_URL = 'http://192.168.x.x:5000';

// AsyncStorage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@lakshichatz_auth_token',
  USER_DATA: '@lakshichatz_user_data',
  THEME_PREFERENCE: '@lakshichatz_theme',
  CACHED_CHATS: '@lakshichatz_cached_chats',
};

// Message Status
export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
};

// Socket Events (must match backend constants)
export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN: 'join',
  LEAVE: 'leave',
  TYPING: 'typing',
  STOP_TYPING: 'stopTyping',
  MESSAGE: 'message',
  MESSAGE_DELIVERED: 'messageDelivered',
  MESSAGE_SEEN: 'messageSeen',
  ONLINE: 'online',
  OFFLINE: 'offline',
  ERROR: 'error',
  NEW_MESSAGE: 'newMessage',
  MESSAGE_STATUS_UPDATE: 'messageStatusUpdate',
  USER_ONLINE: 'userOnline',
  USER_OFFLINE: 'userOffline',
};

// Validation
export const VALIDATION = {
  USERNAME_MIN: 4,
  USERNAME_MAX: 25,
  DISPLAY_NAME_MIN: 2,
  DISPLAY_NAME_MAX: 50,
  PASSWORD_MIN: 8,
  BIO_MAX: 150,
  MESSAGE_MAX: 5000,
};

// Pagination
export const PAGINATION = {
  MESSAGES_PER_PAGE: 30,
  SEARCH_DEBOUNCE_MS: 400,
};

// Screen Names
export const SCREENS = {
  SPLASH: 'Splash',
  LOGIN: 'Login',
  REGISTER: 'Register',
  CHAT_LIST: 'ChatList',
  CHAT_ROOM: 'ChatRoom',
  SEARCH: 'Search',
  PROFILE: 'Profile',
  EDIT_PROFILE: 'EditProfile',
};
