/**
 * Message delivery statuses.
 */
const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
};

/**
 * Socket event names — single source of truth for both server and client.
 */
const SOCKET_EVENTS = {
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

/**
 * Pagination defaults.
 */
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 30,
  MAX_LIMIT: 100,
  CHAT_LIST_LIMIT: 50,
};

/**
 * Validation limits.
 */
const VALIDATION = {
  USERNAME_MIN: 4,
  USERNAME_MAX: 25,
  DISPLAY_NAME_MIN: 2,
  DISPLAY_NAME_MAX: 50,
  PASSWORD_MIN: 8,
  BIO_MAX: 150,
  MESSAGE_MIN: 1,
  MESSAGE_MAX: 5000,
  SEARCH_MIN: 1,
  SEARCH_MAX: 50,
};

/**
 * HTTP Status Codes.
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

module.exports = {
  MESSAGE_STATUS,
  SOCKET_EVENTS,
  PAGINATION,
  VALIDATION,
  HTTP_STATUS,
};
