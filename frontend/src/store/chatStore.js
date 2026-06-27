import { create } from 'zustand';
import chatService from '../services/chatService';
import messageService from '../services/messageService';

/**
 * Chat store (Zustand).
 * Manages chat list, messages, and active chat state.
 */
const useChatStore = create((set, get) => ({
  // State
  chatList: [],
  messages: {}, // Map of chatUserId → messages array
  activeChatUserId: null,
  isLoadingChats: false,
  isLoadingMessages: false,
  isSending: false,
  pagination: {}, // Map of chatUserId → pagination info
  error: null,

  /**
   * Fetch the user's chat list from API.
   */
  fetchChatList: async () => {
    set({ isLoadingChats: true, error: null });

    try {
      const chats = await chatService.getChatList();
      set({ chatList: chats, isLoadingChats: false });
      return chats;
    } catch (error) {
      set({
        isLoadingChats: false,
        error: error.message || 'Failed to fetch chats',
      });
      return [];
    }
  },

  /**
   * Fetch message history with a specific user.
   * @param {string} userId - The other user's ID.
   * @param {number} [page=1] - Page number.
   */
  fetchMessages: async (userId, page = 1) => {
    const isLoadMore = page > 1;
    if (!isLoadMore) {
      set({ isLoadingMessages: true });
    }

    try {
      const result = await messageService.getHistory(userId, page);
      const currentMessages = get().messages[userId] || [];

      set({
        messages: {
          ...get().messages,
          [userId]: isLoadMore
            ? [...result.messages, ...currentMessages]
            : result.messages,
        },
        pagination: {
          ...get().pagination,
          [userId]: result.pagination,
        },
        isLoadingMessages: false,
      });

      return result;
    } catch (error) {
      set({
        isLoadingMessages: false,
        error: error.message || 'Failed to fetch messages',
      });
      return null;
    }
  },

  /**
   * Load more (older) messages for infinite scroll.
   * @param {string} userId - The other user's ID.
   */
  loadMoreMessages: async (userId) => {
    const paginationInfo = get().pagination[userId];
    if (!paginationInfo || !paginationInfo.hasMore) {
      return;
    }

    const nextPage = paginationInfo.page + 1;
    return get().fetchMessages(userId, nextPage);
  },

  /**
   * Add a new message to the store (from socket or local send).
   * @param {string} userId - The other user's ID (chat partner).
   * @param {Object} message - The message object.
   */
  addMessage: (userId, message) => {
    const currentMessages = get().messages[userId] || [];

    // Avoid duplicates
    const exists = currentMessages.some(
      (m) => m._id === message._id,
    );
    if (exists) {
      return;
    }

    set({
      messages: {
        ...get().messages,
        [userId]: [...currentMessages, message],
      },
    });
  },

  /**
   * Update message status (sent → delivered → read).
   * @param {string} userId - The chat partner's ID.
   * @param {string} chatId - The chat ID.
   * @param {string} newStatus - The new status.
   * @param {Object} [extra] - Extra fields (deliveredAt, readAt).
   */
  updateMessageStatus: (userId, chatId, newStatus, extra = {}) => {
    const currentMessages = get().messages[userId] || [];

    const updatedMessages = currentMessages.map((msg) => {
      // Update all messages from the current user in this chat
      if (msg.chatId === chatId || !chatId) {
        const statusOrder = { sent: 0, delivered: 1, read: 2 };
        // Only upgrade status, never downgrade
        if (statusOrder[newStatus] > (statusOrder[msg.status] || 0)) {
          return { ...msg, status: newStatus, ...extra };
        }
      }
      return msg;
    });

    set({
      messages: {
        ...get().messages,
        [userId]: updatedMessages,
      },
    });
  },

  /**
   * Update the chat list when a new message is sent/received.
   * Moves the chat to the top and updates the last message.
   * @param {string} userId - The chat partner's ID.
   * @param {Object} lastMessage - The last message info.
   * @param {number} [unreadIncrement=0] - How much to increment unread count.
   */
  updateChatListItem: (userId, lastMessage, unreadIncrement = 0) => {
    const currentChats = get().chatList;
    const chatIndex = currentChats.findIndex((chat) =>
      chat.participants.some((p) => p._id === userId),
    );

    if (chatIndex >= 0) {
      const updatedChat = { ...currentChats[chatIndex] };
      updatedChat.lastMessage = {
        text: lastMessage.text || lastMessage.message,
        sender: lastMessage.sender,
        timestamp: lastMessage.sentAt || new Date(),
      };
      updatedChat.updatedAt = new Date();

      if (unreadIncrement > 0) {
        const currentCount = updatedChat.unreadCount?.[userId] || 0;
        updatedChat.unreadCount = {
          ...updatedChat.unreadCount,
          [userId]: currentCount + unreadIncrement,
        };
      }

      // Move chat to top
      const newChats = [
        updatedChat,
        ...currentChats.filter((_, i) => i !== chatIndex),
      ];

      set({ chatList: newChats });
    } else {
      // Chat doesn't exist in list yet — refresh
      get().fetchChatList();
    }
  },

  /**
   * Mark a chat as read (reset unread count).
   * @param {string} userId - The chat partner's user ID.
   */
  markChatRead: (userId) => {
    const currentChats = get().chatList.map((chat) => {
      const isMatch = chat.participants.some((p) => p._id === userId);
      if (isMatch) {
        return {
          ...chat,
          unreadCount: {
            ...chat.unreadCount,
            [userId]: 0,
          },
        };
      }
      return chat;
    });

    set({ chatList: currentChats });
  },

  /**
   * Set the active chat user ID.
   * @param {string|null} userId
   */
  setActiveChatUserId: (userId) => set({ activeChatUserId: userId }),

  /**
   * Clear error.
   */
  clearError: () => set({ error: null }),

  /**
   * Reset the entire chat store (on logout).
   */
  reset: () =>
    set({
      chatList: [],
      messages: {},
      activeChatUserId: null,
      isLoadingChats: false,
      isLoadingMessages: false,
      isSending: false,
      pagination: {},
      error: null,
    }),
}));

export default useChatStore;
