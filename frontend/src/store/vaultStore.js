import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { AppState } from 'react-native';

const VAULT_STORAGE_KEY = '@lakshichatz_vault_config';

/**
 * Vault Store for managing Private Locked Chats.
 * Handles configuration, authentication state, and session timeouts.
 */
const useVaultStore = create((set, get) => {
  // Load configuration from AsyncStorage on init
  AsyncStorage.getItem(VAULT_STORAGE_KEY).then((data) => {
    if (data) {
      try {
        const parsed = JSON.parse(data);
        set({
          isConfigured: true,
          secretTrigger: parsed.secretTrigger || '',
          useBiometrics: parsed.useBiometrics || false,
          lockedChatIds: parsed.lockedChatIds || [],
        });
      } catch (e) {
        console.error('Failed to parse vault config', e);
      }
    }
  });

  return {
    // Persistent State
    isConfigured: false,
    secretTrigger: '',
    useBiometrics: false,
    lockedChatIds: [],

    // Session State (Memory Only)
    isVaultUnlocked: false,
    lastUnlockTime: 0,
    timeoutMs: 5 * 60 * 1000, // 5 minutes

    /**
     * Save configuration to AsyncStorage
     */
    _saveConfig: async (config) => {
      try {
        await AsyncStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(config));
      } catch (e) {
        console.error('Failed to save vault config', e);
      }
    },

    /**
     * Set up the vault for the first time or update settings.
     */
    setupVault: async (secretTrigger, useBiometrics) => {
      const config = {
        secretTrigger,
        useBiometrics,
        lockedChatIds: get().lockedChatIds,
      };
      set({
        isConfigured: true,
        ...config,
      });
      await get()._saveConfig(config);
    },

    /**
     * Lock a specific chat.
     */
    lockChat: async (chatId) => {
      const { lockedChatIds, secretTrigger, useBiometrics } = get();
      if (!lockedChatIds.includes(chatId)) {
        const newIds = [...lockedChatIds, chatId];
        set({ lockedChatIds: newIds });
        await get()._saveConfig({
          secretTrigger,
          useBiometrics,
          lockedChatIds: newIds,
        });
      }
    },

    /**
     * Unlock a specific chat (remove from vault).
     */
    unlockChat: async (chatId) => {
      const { lockedChatIds, secretTrigger, useBiometrics } = get();
      const newIds = lockedChatIds.filter((id) => id !== chatId);
      set({ lockedChatIds: newIds });
      await get()._saveConfig({
        secretTrigger,
        useBiometrics,
        lockedChatIds: newIds,
      });
    },

    /**
     * Authenticate and unlock the vault session.
     */
    unlockVault: async () => {
      set({
        isVaultUnlocked: true,
        lastUnlockTime: Date.now(),
      });
    },

    /**
     * Relock the vault session.
     */
    relockVault: () => {
      set({
        isVaultUnlocked: false,
        lastUnlockTime: 0,
      });
    },

    /**
     * Verify biometrics if available and configured.
     * @returns {Promise<boolean>} Success status
     */
    authenticateBiometrics: async () => {
      const { useBiometrics } = get();
      if (!useBiometrics) return false;

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock Private Vault',
          fallbackLabel: 'Use Secret Trigger',
          disableDeviceFallback: false,
        });
        return result.success;
      }
      return false;
    },

    /**
     * Disable the vault entirely.
     */
    disableVault: async () => {
      set({
        isConfigured: false,
        secretTrigger: '',
        useBiometrics: false,
        lockedChatIds: [],
        isVaultUnlocked: false,
        lastUnlockTime: 0,
      });
      await AsyncStorage.removeItem(VAULT_STORAGE_KEY);
    },
  };
});

// Set up AppState listener for auto-locking when backgrounded
AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'background' || nextAppState === 'inactive') {
    useVaultStore.getState().relockVault();
  }
});

export default useVaultStore;
