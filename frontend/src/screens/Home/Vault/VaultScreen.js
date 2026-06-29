import React, { useEffect, useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../theme';
import useAuthStore from '../../../store/authStore';
import useChatStore from '../../../store/chatStore';
import useSocketStore from '../../../store/socketStore';
import useVaultStore from '../../../store/vaultStore';
import Header from '../../../components/Header';
import ChatListItem from '../../../components/ChatListItem';
import EmptyState from '../../../components/EmptyState';
import LoadingSkeleton from '../../../components/LoadingSkeleton';
import { SCREENS } from '../../../constants';
import { Lock, ArrowLeft } from 'lucide-react-native';

/**
 * Vault screen — visually identical to the main chat list, but only shows locked chats.
 */
const VaultScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { chatList, isLoadingChats, fetchChatList } = useChatStore();
  const { isUserOnline } = useSocketStore();
  const vaultStore = useVaultStore();

  useEffect(() => {
    fetchChatList();
  }, [fetchChatList]);

  // If vault somehow relocks while we are on this screen (e.g. timeout/background), kick user out
  useEffect(() => {
    if (!vaultStore.isVaultUnlocked) {
      navigation.goBack();
    }
  }, [vaultStore.isVaultUnlocked, navigation]);

  const handleRefresh = useCallback(() => {
    fetchChatList();
  }, [fetchChatList]);

  const handleChatPress = useCallback(
    (otherUser) => {
      navigation.navigate(SCREENS.CHAT_ROOM, {
        userId: otherUser._id,
        username: otherUser.username,
        displayName: otherUser.displayName,
        profilePicture: otherUser.profilePicture,
      });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <ChatListItem
        chat={item}
        currentUser={user}
        onPress={handleChatPress}
        isOnline={isUserOnline(
          item.participants?.find((p) => p._id !== user._id)?._id,
        )}
      />
    ),
    [user, handleChatPress, isUserOnline],
  );

  const keyExtractor = useCallback((item) => item._id, []);

  // Filter to show ONLY locked chats
  const lockedChats = chatList.filter((chat) => {
    const partnerId = chat.participants?.find((p) => p._id !== user._id)?._id;
    return partnerId && vaultStore.lockedChatIds.includes(partnerId);
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Private Vault"
        leftComponent={
          <TouchableOpacity
            onPress={() => {
              vaultStore.relockVault();
              navigation.goBack();
            }}
            style={styles.headerButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft color={colors.primary} size={22} />
          </TouchableOpacity>
        }
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => {
                vaultStore.relockVault();
                navigation.goBack();
              }}
              style={styles.headerButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Lock color={colors.primary} size={22} />
            </TouchableOpacity>
          </View>
        }
      />

      {isLoadingChats && lockedChats.length === 0 ? (
        <LoadingSkeleton count={8} type="chatList" />
      ) : lockedChats.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Vault is empty"
          subtitle="You haven't locked any conversations yet."
        />
      ) : (
        <FlatList
          data={lockedChats}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingChats}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 4,
  },
  listContent: {
    flexGrow: 1,
  },
});

export default VaultScreen;
