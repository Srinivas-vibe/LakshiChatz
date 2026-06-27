import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../../theme';
import useAuthStore from '../../../store/authStore';
import useChatStore from '../../../store/chatStore';
import useSocketStore from '../../../store/socketStore';
import socketService from '../../../services/socketService';
import chatService from '../../../services/chatService';
import Header from '../../../components/Header';
import Avatar from '../../../components/Avatar';
import ChatBubble from '../../../components/ChatBubble';
import MessageInput from '../../../components/MessageInput';
import TypingIndicator from '../../../components/TypingIndicator';
import EmptyState from '../../../components/EmptyState';
import LoadingSkeleton from '../../../components/LoadingSkeleton';
import { formatLastSeen } from '../../../utils';

/**
 * Chat room screen — the main messaging view.
 * Supports real-time messaging, typing indicators, read receipts,
 * and infinite scroll for history.
 */
const ChatRoomScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { userId, username, displayName, profilePicture } = route.params;

  const currentUser = useAuthStore((s) => s.user);
  const {
    messages,
    isLoadingMessages,
    fetchMessages,
    loadMoreMessages,
    addMessage,
    setActiveChatUserId,
  } = useChatStore();
  const { isUserOnline, isUserTyping, emitTyping, emitStopTyping, emitSeen } =
    useSocketStore();

  const chatMessages = messages[userId] || [];
  const flatListRef = useRef(null);
  const [chatId, setChatId] = useState(null);

  const isOnline = isUserOnline(userId);
  const isTyping = isUserTyping(userId);

  // Set active chat user and fetch messages on mount
  useEffect(() => {
    setActiveChatUserId(userId);
    fetchMessages(userId);

    // Get or create chat to get chatId
    const initChat = async () => {
      try {
        const chat = await chatService.getChatWithUser(userId);
        if (chat?._id) {
          setChatId(chat._id);
        }
      } catch (error) {
        console.error('Failed to init chat:', error);
      }
    };
    initChat();

    return () => {
      setActiveChatUserId(null);
    };
  }, [userId, fetchMessages, setActiveChatUserId]);

  // Mark messages as seen when chat opens or new messages arrive
  useEffect(() => {
    if (chatId && chatMessages.length > 0) {
      const unreadFromOther = chatMessages.filter(
        (msg) =>
          (msg.sender?._id || msg.sender) !== currentUser._id &&
          msg.status !== 'read',
      );

      if (unreadFromOther.length > 0) {
        emitSeen(chatId, userId);
      }
    }
  }, [chatId, chatMessages.length, currentUser._id, emitSeen, userId]);

  const handleSend = useCallback(
    (text) => {
      socketService.sendMessage(userId, text);
    },
    [userId],
  );

  const handleTyping = useCallback(() => {
    emitTyping(userId);
  }, [emitTyping, userId]);

  const handleStopTyping = useCallback(() => {
    emitStopTyping(userId);
  }, [emitStopTyping, userId]);

  const handleLoadMore = useCallback(() => {
    loadMoreMessages(userId);
  }, [loadMoreMessages, userId]);

  const renderMessage = useCallback(
    ({ item }) => (
      <ChatBubble
        message={item}
        isMine={(item.sender?._id || item.sender) === currentUser._id}
      />
    ),
    [currentUser._id],
  );

  const keyExtractor = useCallback((item, index) => item._id || `msg-${index}`, []);

  // Subtitle: online, typing, or last seen
  const getSubtitle = () => {
    if (isTyping) {
      return 'typing...';
    }
    if (isOnline) {
      return 'online';
    }
    return '';
  };

  const subtitleText = getSubtitle();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header with user info */}
      <Header
        showBack
        onBack={() => navigation.goBack()}
        centerComponent={
          <TouchableOpacity style={styles.headerCenter} activeOpacity={0.7}>
            <Avatar
              uri={profilePicture}
              name={displayName}
              size={36}
              showOnline
              isOnline={isOnline}
            />
            <View style={styles.headerInfo}>
              <Text
                style={[styles.headerName, { color: colors.text }]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              {subtitleText ? (
                <Text
                  style={[
                    styles.headerStatus,
                    {
                      color: isTyping
                        ? colors.typing
                        : isOnline
                          ? colors.online
                          : colors.textTertiary,
                    },
                  ]}
                >
                  {subtitleText}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        }
      />

      {/* Messages */}
      {isLoadingMessages && chatMessages.length === 0 ? (
        <LoadingSkeleton count={10} type="message" />
      ) : chatMessages.length === 0 ? (
        <EmptyState
          icon="👋"
          title="Start a Conversation"
          subtitle={`Say hello to ${displayName}!`}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          inverted={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messageList}
          onStartReached={handleLoadMore}
          onStartReachedThreshold={0.1}
          onContentSizeChange={() => {
            if (chatMessages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          ListFooterComponent={
            isTyping ? <TypingIndicator username={username} /> : null
          }
        />
      )}

      {/* Message Input */}
      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 10,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: 12,
    marginTop: 1,
  },
  messageList: {
    paddingVertical: 8,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
});

export default ChatRoomScreen;
