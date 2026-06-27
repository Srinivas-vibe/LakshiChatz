import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../../../theme';
import useAuthStore from '../../../store/authStore';
import useChatStore from '../../../store/chatStore';
import useSocketStore from '../../../store/socketStore';
import useUserStore from '../../../store/userStore';
import Header from '../../../components/Header';
import Avatar from '../../../components/Avatar';
import { SCREENS } from '../../../constants';
import { formatJoinedDate } from '../../../utils';
import { Calendar, Edit3, LogOut, ChevronRight } from 'lucide-react-native';

/**
 * Profile screen displaying current user's information.
 */
const ProfileScreen = ({ navigation }) => {
  const { colors, shadows } = useTheme();
  const { user, logout } = useAuthStore();
  const resetChat = useChatStore((s) => s.reset);
  const resetSocket = useSocketStore((s) => s.reset);
  const resetUser = useUserStore((s) => s.reset);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            resetSocket();
            resetChat();
            resetUser();
            await logout();
          },
        },
      ],
    );
  };

  if (!user) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Profile"
        showBack
        onBack={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            onPress={() => navigation.navigate(SCREENS.EDIT_PROFILE)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.editButton, { color: colors.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.borderLight,
              ...shadows.md,
            },
          ]}
        >
          <View style={styles.avatarSection}>
            <Avatar
              uri={user.profilePicture}
              name={user.displayName}
              size={90}
            />
          </View>

          <Text style={[styles.displayName, { color: colors.text }]}>
            {user.displayName}
          </Text>

          <Text style={[styles.username, { color: colors.textSecondary }]}>
            @{user.username}
          </Text>

          {user.bio ? (
            <Text style={[styles.bio, { color: colors.textSecondary }]}>
              {user.bio}
            </Text>
          ) : (
            <Text style={[styles.bioPlaceholder, { color: colors.textTertiary }]}>
              No bio yet. Tap Edit to add one.
            </Text>
          )}

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.infoRow}>
            <Calendar size={18} color={colors.textSecondary} style={styles.infoIcon} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {formatJoinedDate(user.createdAt)}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.borderLight,
                ...shadows.sm,
              },
            ]}
            onPress={() => navigation.navigate(SCREENS.EDIT_PROFILE)}
            activeOpacity={0.7}
          >
            <Edit3 size={20} color={colors.text} style={styles.actionIcon} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              Edit Profile
            </Text>
            <ChevronRight size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.logoutButton,
              {
                backgroundColor: colors.errorLight,
                borderColor: colors.error,
              },
            ]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOut size={20} color={colors.error} style={styles.actionIcon} />
            <Text style={[styles.actionText, { color: colors.error }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  editButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 0.5,
    marginBottom: 20,
  },
  avatarSection: {
    marginBottom: 16,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  bioPlaceholder: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
  },
  actionsSection: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  actionArrow: {
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    borderWidth: 1,
  },
});

export default ProfileScreen;
