import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';

/**
 * Animated typing indicator with bouncing dots.
 *
 * @param {Object} props
 * @param {string} [props.username] - Name of the user who is typing.
 */
const TypingIndicator = ({ username }) => {
  const { colors, borderRadius: br } = useTheme();

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createDotAnimation = (dot, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const animation = Animated.parallel([
      createDotAnimation(dot1, 0),
      createDotAnimation(dot2, 150),
      createDotAnimation(dot3, 300),
    ]);

    animation.start();

    return () => animation.stop();
  }, [dot1, dot2, dot3]);

  const getDotStyle = (animValue) => ({
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -6],
        }),
      },
    ],
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
  });

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: colors.bubbleOther,
            borderRadius: br.lg,
            borderBottomLeftRadius: br.xs,
          },
        ]}
      >
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: colors.typing },
              getDotStyle(dot1),
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: colors.typing },
              getDotStyle(dot2),
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: colors.typing },
              getDotStyle(dot3),
            ]}
          />
        </View>
      </View>
      {username && (
        <Text style={[styles.label, { color: colors.textTertiary }]}>
          {username} is typing...
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default TypingIndicator;
