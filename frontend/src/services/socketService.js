import { io } from 'socket.io-client';
import { SOCKET_URL, SOCKET_EVENTS } from '../constants';

/**
 * Socket.IO client service — singleton.
 * Manages connection lifecycle, event binding, and store integration.
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  /**
   * Connect to the Socket.IO server with JWT authentication.
   * @param {string} token - JWT token for authentication.
   * @param {Object} callbacks - Event callbacks.
   * @param {Function} callbacks.onConnect - Called when connected.
   * @param {Function} callbacks.onDisconnect - Called when disconnected.
   * @param {Function} callbacks.onNewMessage - Called when a new message arrives.
   * @param {Function} callbacks.onMessageStatusUpdate - Called when message status changes.
   * @param {Function} callbacks.onTyping - Called when someone is typing.
   * @param {Function} callbacks.onStopTyping - Called when someone stops typing.
   * @param {Function} callbacks.onUserOnline - Called when a user comes online.
   * @param {Function} callbacks.onUserOffline - Called when a user goes offline.
   * @param {Function} callbacks.onOnlineUsers - Called with initial online users list.
   * @param {Function} callbacks.onError - Called on socket error.
   */
  connect(token, callbacks = {}) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      timeout: 60000, // Increased to 60s for Render cold start
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('⚡ Socket connected:', this.socket.id);
      callbacks.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      callbacks.onDisconnect?.(reason);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('Socket connection error:', error.message);
      callbacks.onError?.(error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      callbacks.onConnect?.();
    });

    // Message events
    this.socket.on(SOCKET_EVENTS.NEW_MESSAGE, (data) => {
      callbacks.onNewMessage?.(data);
    });

    this.socket.on(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, (data) => {
      callbacks.onMessageStatusUpdate?.(data);
    });

    this.socket.on('messageEdited', (data) => {
      callbacks.onMessageEdited?.(data);
    });

    this.socket.on('messageDeleted', (data) => {
      callbacks.onMessageDeleted?.(data);
    });

    // Typing events
    this.socket.on(SOCKET_EVENTS.TYPING, (data) => {
      callbacks.onTyping?.(data);
    });

    this.socket.on(SOCKET_EVENTS.STOP_TYPING, (data) => {
      callbacks.onStopTyping?.(data);
    });

    // Presence events
    this.socket.on(SOCKET_EVENTS.USER_ONLINE, (data) => {
      callbacks.onUserOnline?.(data);
    });

    this.socket.on(SOCKET_EVENTS.USER_OFFLINE, (data) => {
      callbacks.onUserOffline?.(data);
    });

    this.socket.on(SOCKET_EVENTS.ONLINE, (data) => {
      callbacks.onOnlineUsers?.(data.onlineUsers);
    });

    // Error events
    this.socket.on(SOCKET_EVENTS.ERROR, (data) => {
      console.warn('Socket error event:', data);
      callbacks.onError?.(data);
    });
  }

  /**
   * Disconnect from the server.
   */
  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      console.log('Socket disconnected and cleaned up');
    }
  }

  /**
   * Emit a message event.
   * @param {string} receiverId - The receiver's user ID.
   * @param {string} message - The message content.
   */
  sendMessage(receiverId, message, localId = null) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected. Cannot send message.');
      return false;
    }
    this.socket.emit(SOCKET_EVENTS.MESSAGE, { receiverId, message, localId });
    return true;
  }

  /**
   * Emit typing indicator.
   * @param {string} receiverId - The receiver's user ID.
   */
  emitTyping(receiverId) {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.TYPING, { receiverId });
    }
  }

  /**
   * Emit stop typing indicator.
   * @param {string} receiverId - The receiver's user ID.
   */
  emitStopTyping(receiverId) {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.STOP_TYPING, { receiverId });
    }
  }

  /**
   * Emit message delivered acknowledgment.
   * @param {string} messageId - The message ID.
   * @param {string} chatId - The chat ID.
   * @param {string} senderId - The original sender's ID.
   */
  emitDelivered(messageId, chatId, senderId) {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.MESSAGE_DELIVERED, {
        messageId,
        chatId,
        senderId,
      });
    }
  }

  /**
   * Emit message seen event.
   * @param {string} chatId - The chat ID.
   * @param {string} senderId - The message sender's ID.
   */
  emitSeen(chatId, senderId) {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.MESSAGE_SEEN, {
        chatId,
        senderId,
      });
    }
  }

  /**
   * Emit a generic socket event.
   * @param {string} event - The event name.
   * @param {Object} data - The event data.
   */
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Check if socket is connected.
   * @returns {boolean}
   */
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
