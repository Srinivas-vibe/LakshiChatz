import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../theme';
import useUserStore from '../../../store/userStore';
import useSocketStore from '../../../store/socketStore';
import useVaultStore from '../../../store/vaultStore';
import useDebounce from '../../../hooks/useDebounce';
import Header from '../../../components/Header';
import SearchBar from '../../../components/SearchBar';
import UserListItem from '../../../components/UserListItem';
import EmptyState from '../../../components/EmptyState';
import { SCREENS, PAGINATION } from '../../../constants';

/**
 * Search screen with debounced user search.
 */
const SearchScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { searchResults, isSearching, searchUsers, clearSearch } = useUserStore();
  const { isUserOnline } = useSocketStore();
  const vaultStore = useVaultStore();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, PAGINATION.SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      searchUsers(debouncedQuery);
    } else {
      clearSearch();
    }
  }, [debouncedQuery, searchUsers, clearSearch]);

  // Clean up on unmount
  useEffect(() => {
    return () => clearSearch();
  }, [clearSearch]);

  const handleUserPress = useCallback(
    async (user) => {
      if (user.isVaultTrigger) {
        // Handle Vault Authentication
        const success = await vaultStore.authenticateBiometrics();
        if (success) {
          vaultStore.unlockVault();
          navigation.navigate(SCREENS.VAULT);
        } else {
          // If biometric fails or is skipped, we would ideally show a passcode modal
          // For now, if no biometrics, unlock directly if secret matched (since they typed it)
          if (!vaultStore.useBiometrics) {
            vaultStore.unlockVault();
            navigation.navigate(SCREENS.VAULT);
          }
        }
        return;
      }

      navigation.navigate(SCREENS.CHAT_ROOM, {
        userId: user._id,
        username: user.username,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
      });
    },
    [navigation, vaultStore],
  );

  const renderItem = useCallback(
    ({ item }) => {
      if (item.isVaultTrigger) {
        return (
          <UserListItem
            user={{
              ...item,
              profilePicture: null,
            }}
            onPress={() => handleUserPress(item)}
            isOnline={false}
          />
        );
      }
      return (
        <UserListItem
          user={item}
          onPress={() => handleUserPress(item)}
          isOnline={isUserOnline(item._id)}
        />
      );
    },
    [handleUserPress, isUserOnline],
  );

  const keyExtractor = useCallback((item) => item._id, []);

  const renderContent = () => {
    if (query.length === 0) {
      return (
        <EmptyState
          icon="🔍"
          title="Search Users"
          subtitle="Search by username or display name to start a conversation"
        />
      );
    }

    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    // Filter out locked chats
    const filteredResults = searchResults.filter(
      (u) => vaultStore.isVaultUnlocked || !vaultStore.lockedChatIds.includes(u._id)
    );

    // Check for secret trigger
    const isSecretMatch =
      vaultStore.isConfigured &&
      !vaultStore.isVaultUnlocked &&
      debouncedQuery.trim().toLowerCase() === vaultStore.secretTrigger.toLowerCase() &&
      vaultStore.secretTrigger.length > 0;

    const displayData = isSecretMatch
      ? [
          {
            _id: 'vault_trigger',
            isVaultTrigger: true,
            displayName: 'Private Vault',
            username: 'Hidden Conversations',
            profilePicture: null,
          },
          ...filteredResults,
        ]
      : filteredResults;

    if (displayData.length === 0 && debouncedQuery.length > 0) {
      return (
        <EmptyState
          icon="😔"
          title="No users found"
          subtitle={`No results for "${debouncedQuery}". Try a different search.`}
        />
      );
    }

    return (
      <FlatList
        data={displayData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Search"
        showBack
        onBack={() => navigation.goBack()}
      />

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search by username or name..."
        onClear={() => setQuery('')}
        autoFocus
      />

      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
});

export default SearchScreen;
