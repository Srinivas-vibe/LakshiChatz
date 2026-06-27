import { useEffect, useRef } from 'react';
import useAuthStore from '../store/authStore';
import useSocketStore from '../store/socketStore';
import useChatStore from '../store/chatStore';

/**
 * Hook to manage socket lifecycle based on auth state.
 * Connects on login, disconnects on logout.
 * Registers message and status update handlers that update the chat store.
 */
const useSocket = () => {
  const { token, isAuthenticated, user } = useAuthStore();
  const { connect, disconnect } = useSocketStore();
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessageStatus = useChatStore((s) => s.updateMessageStatus);
  const updateChatListItem = useChatStore((s) => s.updateChatListItem);
  const activeChatUserId = useChatStore((s) => s.activeChatUserId);
  const fetchChatList = useChatStore((s) => s.fetchChatList);

  const activeChatUserIdRef = useRef(activeChatUserId);
  activeChatUserIdRef.current = activeChatUserId;

  useEffect(() => {
    if (isAuthenticated && token) {
      connect(token, {
        onNewMessage: (data) => {
          const { message } = data;
          if (!message || !user) {
            return;
          }

          // Determine chat partner ID
          const chatPartnerId =
            message.sender?._id === user._id
              ? message.receiver?._id || message.receiver
              : message.sender?._id || message.sender;

          if (!chatPartnerId) {
            return;
          }

          // Add message to store
          addMessage(chatPartnerId, message);

          // Update chat list
          const isFromMe = (message.sender?._id || message.sender) === user._id;
          updateChatListItem(
            chatPartnerId,
            {
              text: message.message,
              sender: message.sender,
              sentAt: message.sentAt,
            },
            isFromMe ? 0 : 1,
          );
        },

        onMessageStatusUpdate: (data) => {
          const { chatId, status, readBy } = data;

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
