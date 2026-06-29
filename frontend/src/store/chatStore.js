import { create } from 'zustand';
import chatService from '../services/chatService';
import messageDb from '../database/messageDb';
import chatDb from '../database/chatDb';
import userCacheDb from '../database/userCacheDb';

/**
 * Chat store (Zustand).
 * LOCAL-FIRST architecture: reads from SQLite, writes to SQLite + server relay.
 * The server only holds undelivered messages temporarily.
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
   * Fetch the user's chat list from LOCAL SQLite.
   * Falls back to server API if local is empty (first launch / new device).
   */
  fetchChatList: async () => {
    set({ isLoadingChats: true, error: null });

    try {
      // Read from local SQLite first
      let chats = await chatDb.getChatList();

      if (chats.length === 0) {
        // Fallback to server API (first launch or new device)
        try {
          const serverChats = await chatService.getChatList();
          if (serverChats && serverChats.length > 0) {
            // Cache server chats locally
            for (const chat of serverChats) {
              const partner = chat.participants?.find(
                (p) => p._id !== undefined
              );
              if (partner) {
                await chatDb.upsertChat(
                  {
                    id: partner._id,
                    username: partner.username,
                    displayName: partner.displayName,
                    profilePicture: partner.profilePicture,
                  },
                  {
                    text: chat.lastMessage?.text || '',
                    senderId: chat.lastMessage?.sender?._id || '',
                    time: chat.lastMessage?.timestamp || new Date().toISOString(),
                  },
                  0
                );

                // Cache partner user profile
                await userCacheDb.cacheUser(partner);
              }
            }

            chats = await chatDb.getChatList();
          }
        } catch (serverError) {
          console.warn('Server chat list fetch failed (offline?):', serverError.message);
        }
      }

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
   * Fetch message history with a specific user from LOCAL SQLite.
   * @param {string} userId - The other user's ID.
   * @param {number} [page=1] - Page number.
   */
  fetchMessages: async (userId, page = 1) => {
    const isLoadMore = page > 1;
    if (!isLoadMore) {
      set({ isLoadingMessages: true });
    }

    try {
      // Read from local SQLite
      const result = await messageDb.getMessages(userId, page);
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
   * Add a new message to the store AND persist to local SQLite.
   * @param {string} userId - The other user's ID (chat partner).
   * @param {Object} message - The message object.
   */
  addMessage: async (userId, message) => {
    const currentMessages = get().messages[userId] || [];

    // Avoid duplicates
    const msgId = message._id;
    const exists = currentMessages.some((m) => m._id === msgId);
    if (exists) {
      return;
    }

    // Update Zustand state
    set({
      messages: {
        ...get().messages,
        [userId]: [...currentMessages, message],
      },
    });

    // Persist to local SQLite
    try {
      await messageDb.saveMessage(message, userId);
    } catch (error) {
      console.error('Failed to save message to local DB:', error.message);
    }
  },

  /**
   * Update message status (sent → delivered → read).
   * Also updates the local SQLite database.
   * @param {string} userId - The chat partner's ID.
   * @param {string} chatId - The chat ID.
   * @param {string} newStatus - The new status.
   * @param {Object} [extra] - Extra fields (deliveredAt, readAt).
   */
  updateMessageStatus: async (userId, chatId, newStatus, extra = {}) => {
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

    // Update local SQLite
    try {
      await messageDb.updateMessageStatus(userId, newStatus, extra);
    } catch (error) {
      console.error('Failed to update message status in local DB:', error.message);
    }
  },

  /**
   * Update the chat list when a new message is sent/received.
   * Moves the chat to the top and updates the last message.
   * Also persists to local SQLite.
   * @param {string} userId - The chat partner's ID.
   * @param {Object} lastMessage - The last message info.
   * @param {number} [unreadIncrement=0] - How much to increment unread count.
   */
  updateChatListItem: async (userId, lastMessage, unreadIncrement = 0) => {
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
      // Chat doesn't exist in list yet — refresh from local DB
      get().fetchChatList();
    }

    // Update local SQLite chat list
    try {
      const senderId = lastMessage.sender?._id || lastMessage.sender || '';
      await chatDb.updateLastMessage(
        userId,
        lastMessage.text || lastMessage.message || '',
        senderId,
        lastMessage.sentAt || new Date().toISOString()
      );
      if (unreadIncrement > 0) {
        await chatDb.incrementUnread(userId, unreadIncrement);
      }
    } catch (error) {
      console.error('Failed to update chat list in local DB:', error.message);
    }
  },

  /**
   * Mark a chat as read (reset unread count).
   * @param {string} userId - The chat partner's user ID.
   */
  markChatRead: async (userId) => {
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

    // Update local SQLite
    try {
      await chatDb.markChatRead(userId);
    } catch (error) {
      console.error('Failed to mark chat read in local DB:', error.message);
    }
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
   * Edit a message in the local store AND local SQLite.
   * @param {string} userId - The chat partner's user ID.
   * @param {string} messageId - The message ID.
   * @param {string} newText - The new message text.
   */
  editMessageInStore: async (userId, messageId, newText) => {
    const chatMessages = get().messages[userId] || [];
    const updatedMessages = chatMessages.map((msg) => {
      if (msg._id === messageId) {
        return { ...msg, message: newText, edited: true };
      }
      return msg;
    });

    set({
      messages: {
        ...get().messages,
        [userId]: updatedMessages,
      },
    });

    // Update lastMessage preview if this was the last message in the chat list
    const lastMsg = updatedMessages[updatedMessages.length - 1];
    if (lastMsg && lastMsg._id === messageId) {
      get().updateChatListItem(userId, {
        text: newText,
        sender: lastMsg.sender,
        sentAt: lastMsg.sentAt,
      });
    }

    // Persist to local SQLite
    try {
      await messageDb.editMessage(messageId, newText);
    } catch (error) {
      console.error('Failed to edit message in local DB:', error.message);
    }
  },

  /**
   * Delete a message in the local store AND local SQLite.
   * @param {string} userId - The chat partner's user ID.
   * @param {string} messageId - The message ID.
   * @param {string} deleteType - 'me' or 'everyone'.
   */
  deleteMessageInStore: async (userId, messageId, deleteType) => {
    const chatMessages = get().messages[userId] || [];
    let updatedMessages = [];

    if (deleteType === 'everyone') {
      updatedMessages = chatMessages.map((msg) => {
        if (msg._id === messageId) {
          return { ...msg, message: '🚫 This message was deleted', deleted: true };
        }
        return msg;
      });
    } else {
      // 'me' - remove entirely
      updatedMessages = chatMessages.filter((msg) => msg._id !== messageId);
    }

    set({
      messages: {
        ...get().messages,
        [userId]: updatedMessages,
      },
    });

    // Update lastMessage preview if this was the last message
    const lastMsg = updatedMessages[updatedMessages.length - 1];
    if (lastMsg) {
      get().updateChatListItem(userId, {
        text: lastMsg.deleted ? '🚫 This message was deleted' : lastMsg.message,
        sender: lastMsg.sender,
        sentAt: lastMsg.sentAt,
      });
    } else {
      // No messages left, refresh chat list
      get().fetchChatList();
    }

    // Persist to local SQLite
    try {
      if (deleteType === 'everyone') {
        await messageDb.deleteMessageForEveryone(messageId);
      } else {
        await messageDb.deleteMessageForMe(messageId);
      }
    } catch (error) {
      console.error('Failed to delete message in local DB:', error.message);
    }
  },

  /**
   * Ensure a chat exists in the local DB for a partner.
   * Called when we receive a message from a new conversation.
   * @param {Object} partnerInfo - { id, username, displayName, profilePicture }
   * @param {Object} [lastMessage] - Last message info.
   */
  ensureChatExists: async (partnerInfo, lastMessage = null) => {
    try {
      await chatDb.upsertChat(partnerInfo, lastMessage);
    } catch (error) {
      console.error('Failed to ensure chat exists:', error.message);
    }
  },

  /**
   * Reset the entire chat store AND clear local SQLite (on logout).
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
