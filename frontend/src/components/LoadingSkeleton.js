import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

/**
 * Skeleton loading placeholder for chat list items.
 *
 * @param {Object} props
 * @param {number} [props.count=5] - Number of skeleton rows.
 * @param {'chatList'|'message'} [props.type='chatList'] - Skeleton type.
 */
const LoadingSkeleton = ({ count = 5, type = 'chatList' }) => {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const renderChatListSkeleton = () => (
    <View style={styles.chatListRow}>
      <Animated.View
        style={[
          styles.avatar,
          { backgroundColor: colors.skeletonBase, opacity },
        ]}
      />
      <View style={styles.chatListContent}>
        <Animated.View
          style={[
            styles.nameLine,
            { backgroundColor: colors.skeletonBase, opacity },
          ]}
        />
        <Animated.View
          style={[
            styles.messageLine,
            { backgroundColor: colors.skeletonBase, opacity },
          ]}
        />
      </View>
    </View>
  );

  const renderMessageSkeleton = () => (
    <View
      style={[
        styles.messageBubble,
        Math.random() > 0.5 ? styles.messageRight : styles.messageLeft,
      ]}
    >
      <Animated.View
        style={[
          styles.messageBlock,
          { backgroundColor: colors.skeletonBase, opacity },
          { width: 120 + Math.random() * 100 },
        ]}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index}>
          {type === 'chatList'
            ? renderChatListSkeleton()
            : renderMessageSkeleton()}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  chatListContent: {
    flex: 1,
    marginLeft: 14,
  },
  nameLine: {
    height: 14,
    width: '60%',
    borderRadius: 4,
    marginBottom: 8,
  },
  messageLine: {
    height: 12,
    width: '80%',
    borderRadius: 4,
  },
  messageBubble: {
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  messageLeft: {
    alignItems: 'flex-start',
  },
  messageRight: {
    alignItems: 'flex-end',
  },
  messageBlock: {
    height: 40,
    borderRadius: 12,
  },
});

export default LoadingSkeleton;
