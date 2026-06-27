import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import Avatar from './Avatar';

/**
 * User list item for search results.
 *
 * @param {Object} props
 * @param {Object} props.user - User object.
 * @param {Function} props.onPress - Press handler.
 * @param {boolean} [props.isOnline=false] - Online status.
 */
const UserListItem = ({ user, onPress, isOnline = false }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderBottomColor: colors.borderLight },
      ]}
      onPress={() => onPress(user)}
      activeOpacity={0.7}
    >
      <Avatar
        uri={user.profilePicture}
        name={user.displayName}
        size={50}
        showOnline
        isOnline={isOnline}
      />

      <View style={styles.info}>
        <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
          {user.displayName}
        </Text>
        <Text style={[styles.username, { color: colors.textSecondary }]} numberOfLines={1}>
          @{user.username}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
  },
});

export default React.memo(UserListItem);
