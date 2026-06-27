import React, { useEffect, useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../../theme';
import useAuthStore from '../../../store/authStore';
import useChatStore from '../../../store/chatStore';
import useSocketStore from '../../../store/socketStore';
import Header from '../../../components/Header';
import ChatListItem from '../../../components/ChatListItem';
import EmptyState from '../../../components/EmptyState';
import LoadingSkeleton from '../../../components/LoadingSkeleton';
import { SCREENS } from '../../../constants';
import { Search, User } from 'lucide-react-native';

/**
 * Chat list screen — the main home screen.
 * Displays recent conversations with pull-to-refresh.
 */
const ChatListScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { chatList, isLoadingChats, fetchChatList } = useChatStore();
  const { isUserOnline } = useSocketStore();

  useEffect(() => {
    fetchChatList();
  }, [fetchChatList]);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="LakshiChatz"
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate(SCREENS.SEARCH)}
              style={styles.headerButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Search color={colors.primary} size={22} />
            </TouchableOpacity>
          </View>
        }
        leftComponent={
          <TouchableOpacity
            onPress={() => navigation.navigate(SCREENS.PROFILE)}
            style={styles.headerButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <User color={colors.primary} size={22} />
          </TouchableOpacity>
        }
      />

      {isLoadingChats && chatList.length === 0 ? (
        <LoadingSkeleton count={8} type="chatList" />
      ) : chatList.length === 0 ? (
        <EmptyState
          icon="💬"
          title="No conversations yet"
          subtitle="Tap the search icon to find users and start chatting!"
        />
      ) : (
        <FlatList
          data={chatList}
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
  headerIcon: {
    fontSize: 22,
  },
  listContent: {
    flexGrow: 1,
  },
});

export default ChatListScreen;
