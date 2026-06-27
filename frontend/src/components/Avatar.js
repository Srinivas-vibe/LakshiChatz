import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { getInitials } from '../utils';

/**
 * Reusable Avatar component with online indicator and initials fallback.
 *
 * @param {Object} props
 * @param {string} [props.uri] - Profile picture URI.
 * @param {string} [props.name] - Name for initials fallback.
 * @param {number} [props.size=48] - Avatar diameter.
 * @param {boolean} [props.showOnline=false] - Whether to show online indicator.
 * @param {boolean} [props.isOnline=false] - Online status.
 */
const Avatar = ({ uri, name, size = 48, showOnline = false, isOnline = false }) => {
  const { colors } = useTheme();
  const initials = getInitials(name);
  const fontSize = size * 0.38;
  const indicatorSize = Math.max(size * 0.28, 10);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: colors.border,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.initialsContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.initialsText,
              { fontSize, color: colors.textInverse },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}

      {showOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: indicatorSize / 2,
              backgroundColor: isOnline ? colors.online : colors.offline,
              borderColor: colors.background,
              borderWidth: 2,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    borderWidth: 0.5,
  },
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
  },
});

export default React.memo(Avatar);
