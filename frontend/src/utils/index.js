/**
 * Utility functions for the frontend.
 */

/**
 * Format a timestamp for chat display.
 * Shows "Just now", "Xm ago", "Xh ago", or date.
 * @param {string|Date} timestamp - The timestamp to format.
 * @returns {string} Formatted time string.
 */
export const formatChatTime = (timestamp) => {
  if (!timestamp) {
    return '';
  }

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format a timestamp for message bubbles.
 * Shows "HH:MM AM/PM".
 * @param {string|Date} timestamp - The timestamp to format.
 * @returns {string} Formatted time string.
 */
export const formatMessageTime = (timestamp) => {
  if (!timestamp) {
    return '';
  }

  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format "last seen" timestamp.
 * @param {string|Date} timestamp - The last seen timestamp.
 * @returns {string} Formatted string like "last seen today at 3:45 PM".
 */
export const formatLastSeen = (timestamp) => {
  if (!timestamp) {
    return 'last seen recently';
  }

  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) {
    return `last seen today at ${time}`;
  }
  if (isYesterday) {
    return `last seen yesterday at ${time}`;
  }

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return `last seen ${dateStr} at ${time}`;
};

/**
 * Format joined date for profile.
 * @param {string|Date} timestamp - The creation timestamp.
 * @returns {string} Formatted date like "Joined January 2024".
 */
export const formatJoinedDate = (timestamp) => {
  if (!timestamp) {
    return '';
  }

  const date = new Date(timestamp);
  return `Joined ${date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })}`;
};

/**
 * Get initials from a name for avatar fallback.
 * @param {string} name - The display name.
 * @returns {string} First two initials, uppercased.
 */
export const getInitials = (name) => {
  if (!name) {
    return '?';
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Truncate text to a maximum length.
 * @param {string} text - The text to truncate.
 * @param {number} maxLength - Maximum length.
 * @returns {string} Truncated text with ellipsis if needed.
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) {
    return text || '';
  }
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Validate username format.
 * @param {string} username - The username to validate.
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validateUsername = (username) => {
  if (!username) {
    return { valid: false, error: 'Username is required' };
  }
  if (username.length < 4) {
    return { valid: false, error: 'Username must be at least 4 characters' };
  }
  if (username.length > 25) {
    return { valid: false, error: 'Username cannot exceed 25 characters' };
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain lowercase letters, numbers, and underscores',
    };
  }
  return { valid: true, error: null };
};

/**
 * Validate password strength.
 * @param {string} password - The password to validate.
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  return { valid: true, error: null };
};

/**
 * Validate display name.
 * @param {string} name - The display name to validate.
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validateDisplayName = (name) => {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Display name is required' };
  }
  if (name.trim().length < 2) {
    return { valid: false, error: 'Display name must be at least 2 characters' };
  }
  if (name.trim().length > 50) {
    return { valid: false, error: 'Display name cannot exceed 50 characters' };
  }
  return { valid: true, error: null };
};
