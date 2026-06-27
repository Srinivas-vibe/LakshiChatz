import { create } from 'zustand';
import socketService from '../services/socketService';

/**
 * Socket store (Zustand).
 * Manages socket connection state, online users, and typing indicators.
 */
const useSocketStore = create((set, get) => ({
  // State
  isConnected: false,
  onlineUsers: new Set(),
  typingUsers: {}, // Map of userId → { username, timeout }

  /**
   * Connect to the Socket.IO server and register event handlers.
   * @param {string} token - JWT token.
   * @param {Object} handlers - External handlers for store updates.
   * @param {Function} handlers.onNewMessage - Handle new message.
   * @param {Function} handlers.onMessageStatusUpdate - Handle status change.
   */
  connect: (token, handlers = {}) => {
    socketService.connect(token, {
      onConnect: () => {
        set({ isConnected: true });
      },

      onDisconnect: () => {
        set({ isConnected: false });
      },

      onOnlineUsers: (userIds) => {
        set({ onlineUsers: new Set(userIds) });
      },

      onUserOnline: (data) => {
        const newOnline = new Set(get().onlineUsers);
        newOnline.add(data.userId);
        set({ onlineUsers: newOnline });
      },

      onUserOffline: (data) => {
        const newOnline = new Set(get().onlineUsers);
        newOnline.delete(data.userId);
        set({ onlineUsers: newOnline });
      },

      onTyping: (data) => {
        const typingUsers = { ...get().typingUsers };

        // Clear existing timeout for this user
        if (typingUsers[data.userId]?.timeout) {
          clearTimeout(typingUsers[data.userId].timeout);
        }

        // Auto-clear typing after 3 seconds of no typing event
        const timeout = setTimeout(() => {
          const current = { ...get().typingUsers };
          delete current[data.userId];
          set({ typingUsers: current });
        }, 3000);

        typingUsers[data.userId] = {
          username: data.username,
          timeout,
        };

        set({ typingUsers });
      },

      onStopTyping: (data) => {
        const typingUsers = { ...get().typingUsers };
        if (typingUsers[data.userId]?.timeout) {
          clearTimeout(typingUsers[data.userId].timeout);
        }
        delete typingUsers[data.userId];
        set({ typingUsers });
      },

      onNewMessage: (data) => {
        handlers.onNewMessage?.(data);
      },

      onMessageStatusUpdate: (data) => {
        handlers.onMessageStatusUpdate?.(data);
      },

      onError: (error) => {
        console.error('Socket store error:', error);
      },
    });
  },

  /**
   * Disconnect from the socket server.
   */
  disconnect: () => {
    socketService.disconnect();
    set({
      isConnected: false,
      onlineUsers: new Set(),
      typingUsers: {},
    });
  },

  /**
   * Emit typing indicator.
   * @param {string} receiverId
   */
  emitTyping: (receiverId) => {
    socketService.emitTyping(receiverId);
  },

  /**
   * Emit stop typing indicator.
   * @param {string} receiverId
   */
  emitStopTyping: (receiverId) => {
    socketService.emitStopTyping(receiverId);
  },

  /**
   * Emit message seen.
   * @param {string} chatId
   * @param {string} senderId
   */
  emitSeen: (chatId, senderId) => {
    socketService.emitSeen(chatId, senderId);
  },

  /**
   * Check if a user is online.
   * @param {string} userId
   * @returns {boolean}
   */
  isUserOnline: (userId) => {
    return get().onlineUsers.has(userId);
  },

  /**
   * Check if a user is typing.
   * @param {string} userId
   * @returns {boolean}
   */
  isUserTyping: (userId) => {
    return !!get().typingUsers[userId];
  },

  /**
   * Reset socket store (on logout).
   */
  reset: () => {
    socketService.disconnect();
    set({
      isConnected: false,
      onlineUsers: new Set(),
      typingUsers: {},
    });
  },
}));

export default useSocketStore;
