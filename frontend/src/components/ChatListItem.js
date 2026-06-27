import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import Avatar from './Avatar';
import { formatChatTime, truncateText } from '../utils';

/**
 * Chat list item component for rendering a conversation row.
 *
 * @param {Object} props
 * @param {Object} props.chat - Chat document with populated participants.
 * @param {Object} props.currentUser - Current user object.
 * @param {Function} props.onPress - Callback when item is pressed.
 * @param {boolean} [props.isOnline=false] - Whether the other user is online.
 */
const ChatListItem = ({ chat, currentUser, onPress, isOnline = false }) => {
  const { colors, shadows } = useTheme();

  // Get the other participant
  const otherUser = chat.participants?.find(
    (p) => p._id !== currentUser._id,
  );

  if (!otherUser) {
    return null;
  }

  const unreadCount =
    chat.unreadCount?.[currentUser._id] ||
    (typeof chat.unreadCount?.get === 'function'
      ? chat.unreadCount.get(currentUser._id)
      : 0) ||
    0;

  const lastMessageText = chat.lastMessage?.text
    ? truncateText(chat.lastMessage.text, 45)
    : 'Start a conversation';

  const lastMessageTime = chat.lastMessage?.timestamp
    ? formatChatTime(chat.lastMessage.timestamp)
    : formatChatTime(chat.updatedAt);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.borderLight,
        },
      ]}
      onPress={() => onPress(otherUser)}
      activeOpacity={0.7}
    >
      <Avatar
        uri={otherUser.profilePicture}
        name={otherUser.displayName}
        size={54}
        showOnline
        isOnline={isOnline}
      />

      <View style={styles.contentContainer}>
        <View style={styles.topRow}>
          <Text
            style={[styles.displayName, { color: colors.text }]}
            numberOfLines={1}
          >
            {otherUser.displayName}
          </Text>
          <Text
            style={[
              styles.time,
              {
                color: unreadCount > 0 ? colors.primary : colors.textTertiary,
              },
            ]}
          >
            {lastMessageTime}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.lastMessage,
              {
                color: unreadCount > 0
                  ? colors.text
                  : colors.textSecondary,
                fontWeight: unreadCount > 0 ? '500' : '400',
              },
            ]}
            numberOfLines={1}
          >
            {lastMessageText}
          </Text>

          {unreadCount > 0 && (
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.badgeText }]}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default React.memo(ChatListItem);
