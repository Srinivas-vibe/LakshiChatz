import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { formatMessageTime } from '../utils';
import { MESSAGE_STATUS } from '../constants';

/**
 * Chat bubble component for displaying a single message.
 *
 * @param {Object} props
 * @param {Object} props.message - Message object.
 * @param {boolean} props.isMine - Whether the message is from the current user.
 * @param {boolean} [props.showTimestamp=true] - Whether to show the timestamp.
 */
const ChatBubble = ({ message, isMine, showTimestamp = true }) => {
  const { colors, borderRadius: br } = useTheme();

  const renderStatusIcon = () => {
    if (!isMine) {
      return null;
    }

    switch (message.status) {
      case MESSAGE_STATUS.SENT:
        return <Text style={[styles.statusIcon, { color: colors.statusSent }]}>✓</Text>;
      case MESSAGE_STATUS.DELIVERED:
        return <Text style={[styles.statusIcon, { color: colors.statusDelivered }]}>✓✓</Text>;
      case MESSAGE_STATUS.READ:
        return <Text style={[styles.statusIcon, { color: colors.statusRead }]}>✓✓</Text>;
      default:
        return null;
    }
  };

  if (message.deleted) {
    return (
      <View
        style={[
          styles.bubbleContainer,
          isMine ? styles.bubbleRight : styles.bubbleLeft,
        ]}
      >
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isMine ? colors.bubbleMine : colors.bubbleOther,
              borderRadius: br.lg,
              opacity: 0.6,
            },
            isMine ? styles.bubbleMine : styles.bubbleOther,
          ]}
        >
          <Text
            style={[
              styles.deletedText,
              {
                color: isMine ? colors.bubbleMineText : colors.bubbleOtherText,
              },
            ]}
          >
            🚫 This message was deleted
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.bubbleContainer,
        isMine ? styles.bubbleRight : styles.bubbleLeft,
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isMine ? colors.bubbleMine : colors.bubbleOther,
            borderRadius: br.lg,
          },
          isMine ? styles.bubbleMine : styles.bubbleOther,
          isMine
            ? { borderBottomRightRadius: br.xs }
            : { borderBottomLeftRadius: br.xs },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            {
              color: isMine ? colors.bubbleMineText : colors.bubbleOtherText,
            },
          ]}
        >
          {message.message}
        </Text>

        <View style={styles.metaRow}>
          {message.edited && (
            <Text
              style={[
                styles.editedLabel,
                { color: isMine ? colors.bubbleMineText : colors.textTertiary },
              ]}
            >
              edited{' '}
            </Text>
          )}
          {showTimestamp && (
            <Text
              style={[
                styles.timestamp,
                {
                  color: isMine
                    ? colors.bubbleMineText
                    : colors.textTertiary,
                },
              ]}
            >
              {formatMessageTime(message.sentAt)}
            </Text>
          )}
          {renderStatusIcon()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleContainer: {
    marginVertical: 2,
    paddingHorizontal: 12,
  },
  bubbleRight: {
    alignItems: 'flex-end',
  },
  bubbleLeft: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  bubbleMine: {
    marginLeft: '20%',
  },
  bubbleOther: {
    marginRight: '20%',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.7,
  },
  statusIcon: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  editedLabel: {
    fontSize: 11,
    fontStyle: 'italic',
    opacity: 0.6,
  },
  deletedText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default React.memo(ChatBubble);
