import { useEffect, useRef } from 'react';
import useAuthStore from '../store/authStore';
import useSocketStore from '../store/socketStore';
import useChatStore from '../store/chatStore';
import socketService from '../services/socketService';
import messageDb from '../database/messageDb';
import chatDb from '../database/chatDb';
import userCacheDb from '../database/userCacheDb';

/**
 * Hook to manage socket lifecycle based on auth state.
 * Connects on login, disconnects on logout.
 * LOCAL-FIRST: Saves incoming messages to SQLite and ACKs the server.
 */
const useSocket = () => {
  const { token, isAuthenticated, user } = useAuthStore();
  const { connect, disconnect } = useSocketStore();
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessageStatus = useChatStore((s) => s.updateMessageStatus);
  const updateChatListItem = useChatStore((s) => s.updateChatListItem);
  const editMessageInStore = useChatStore((s) => s.editMessageInStore);
  const deleteMessageInStore = useChatStore((s) => s.deleteMessageInStore);
  const ensureChatExists = useChatStore((s) => s.ensureChatExists);
  const activeChatUserId = useChatStore((s) => s.activeChatUserId);
  const fetchChatList = useChatStore((s) => s.fetchChatList);

  const activeChatUserIdRef = useRef(activeChatUserId);
  activeChatUserIdRef.current = activeChatUserId;

  useEffect(() => {
    if (isAuthenticated && token) {
      connect(token, {
        onNewMessage: async (data) => {
          const { message } = data;
          if (!message || !user) {
            return;
          }

          // Determine chat partner ID
          const senderId = message.sender?._id || message.sender;
          const receiverId = message.receiver?._id || message.receiver;
          const chatPartnerId =
            senderId === user._id ? receiverId : senderId;

          if (!chatPartnerId) {
            return;
          }

          // Save message to local SQLite
          try {
            await messageDb.saveMessage(message, chatPartnerId);
          } catch (err) {
            console.error('Failed to save message to SQLite:', err.message);
          }

          // Ensure chat entry exists locally for this partner
          const partnerInfo = senderId === user._id
            ? {
                id: receiverId,
                username: message.receiver?.username,
                displayName: message.receiver?.displayName,
                profilePicture: message.receiver?.profilePicture,
              }
            : {
                id: senderId,
                username: message.sender?.username,
                displayName: message.sender?.displayName,
                profilePicture: message.sender?.profilePicture,
              };

          await ensureChatExists(partnerInfo, {
            text: message.message,
            senderId: senderId,
            time: message.sentAt,
          });

          // Cache partner user profile
          if (senderId !== user._id && message.sender?._id) {
            try {
              await userCacheDb.cacheUser(message.sender);
            } catch (err) {
              // Non-critical
            }
          }

          // Add message to Zustand state
          addMessage(chatPartnerId, message);

          // Update chat list
          const isFromMe = senderId === user._id;
          updateChatListItem(
            chatPartnerId,
            {
              text: message.message,
              sender: message.sender,
              sentAt: message.sentAt,
            },
            isFromMe ? 0 : 1,
          );

          // ACK to server: "I have saved this message locally, you can delete it from MongoDB"
          socketService.emit('messageReceived', {
            messageId: message._id,
          });
        },

        onMessageStatusUpdate: (data) => {
          const { chatId, status } = data;

          // Find the chat partner to update their messages
          if (activeChatUserIdRef.current) {
            updateMessageStatus(
              activeChatUserIdRef.current,
              chatId,
              status,
              {
                ...(data.deliveredAt ? { deliveredAt: data.deliveredAt } : {}),
                ...(data.readAt ? { readAt: data.readAt } : {}),
              },
            );
          }

          // Refresh chat list to update status
          fetchChatList();
        },

        onMessageEdited: (data) => {
          const { messageId, message: newText, senderId, receiverId } = data;
          if (!user) {
            return;
          }
          const chatPartnerId = (senderId === user._id) ? receiverId : senderId;
          editMessageInStore(chatPartnerId, messageId, newText);
        },

        onMessageDeleted: (data) => {
          const { messageId, senderId, receiverId } = data;
          if (!user) {
            return;
          }
          const chatPartnerId = (senderId === user._id) ? receiverId : senderId;
          deleteMessageInStore(chatPartnerId, messageId, 'everyone');
        },
      });
    }

    return () => {
      if (!isAuthenticated) {
        disconnect();
      }
    };
  }, [isAuthenticated, token]);

  return null;
};

export default useSocket;
