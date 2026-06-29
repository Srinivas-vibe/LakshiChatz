import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { AppState } from 'react-native';

const APP_LOCK_CONFIG_KEY = '@lakshichatz_applock_config';
const SECURE_PIN_KEY = 'lakshichatz_secure_pin';

/**
 * AppLock Store for managing global app security.
 */
const useAppLockStore = create((set, get) => {
  // Load configuration on init
  const initStore = async () => {
    try {
      const configStr = await AsyncStorage.getItem(APP_LOCK_CONFIG_KEY);
      if (configStr) {
        const parsed = JSON.parse(configStr);
        set({
          isAppLockEnabled: parsed.isAppLockEnabled || false,
          useBiometrics: parsed.useBiometrics || false,
          autoLockTimeout: parsed.autoLockTimeout || 0, // 0 = Immediately
          // If enabled, lock immediately on startup
          isLocked: parsed.isAppLockEnabled,
        });
      }
    } catch (e) {
      console.error('Failed to load app lock config', e);
    }
  };

  initStore();

  return {
    // Persisted Config
    isAppLockEnabled: false,
    useBiometrics: false,
    autoLockTimeout: 0, // In milliseconds. 0 = immediately.

    // Runtime State
    isLocked: false,
    failedAttempts: 0,
    lockoutUntil: null,
    lastBackgroundTime: null,

    /**
     * Set up or update the App Lock config and save the PIN securely.
     */
    setupAppLock: async (pin, useBiometrics = true) => {
      try {
        await SecureStore.setItemAsync(SECURE_PIN_KEY, pin);
        
        const newConfig = {
          isAppLockEnabled: true,
          useBiometrics,
          autoLockTimeout: get().autoLockTimeout,
        };
        
        await AsyncStorage.setItem(APP_LOCK_CONFIG_KEY, JSON.stringify(newConfig));
        set({ ...newConfig });
      } catch (e) {
        console.error('Failed to setup App Lock', e);
      }
    },

    /**
     * Change lock timeout
     */
    setTimeout: async (timeoutMs) => {
      const config = {
        isAppLockEnabled: get().isAppLockEnabled,
        useBiometrics: get().useBiometrics,
        autoLockTimeout: timeoutMs,
      };
      await AsyncStorage.setItem(APP_LOCK_CONFIG_KEY, JSON.stringify(config));
      set({ autoLockTimeout: timeoutMs });
    },

    /**
     * Disable App Lock entirely.
     */
    disableAppLock: async () => {
      try {
        await SecureStore.deleteItemAsync(SECURE_PIN_KEY);
        await AsyncStorage.removeItem(APP_LOCK_CONFIG_KEY);
        set({
          isAppLockEnabled: false,
          useBiometrics: false,
          isLocked: false,
          failedAttempts: 0,
          lockoutUntil: null,
        });
      } catch (e) {
        console.error('Failed to disable App Lock', e);
      }
    },

    /**
     * Attempt to unlock with a PIN.
     * @returns {Promise<boolean>}
     */
    verifyPin: async (inputPin) => {
      // Check lockout
      if (get().lockoutUntil && Date.now() < get().lockoutUntil) {
        return false;
      }

      try {
        const storedPin = await SecureStore.getItemAsync(SECURE_PIN_KEY);
        if (storedPin === inputPin) {
          set({ isLocked: false, failedAttempts: 0, lockoutUntil: null });
          return true;
        } else {
          // Increment failed attempts
          const attempts = get().failedAttempts + 1;
          const lockout = attempts >= 5 ? Date.now() + 30000 : null; // 30 sec lockout
          set({ failedAttempts: attempts, lockoutUntil: lockout });
          return false;
        }
      } catch (e) {
        console.error('Error verifying PIN', e);
        return false;
      }
    },

    /**
     * Attempt to unlock using Biometrics.
     */
    authenticateBiometrics: async () => {
      const { useBiometrics } = get();
      if (!useBiometrics) return false;

      // Check lockout
      if (get().lockoutUntil && Date.now() < get().lockoutUntil) {
        return false;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock LakshiChatz',
          fallbackLabel: 'Use PIN',
          disableDeviceFallback: true, // We want them to use our PIN fallback, not device passcode
        });
        
        if (result.success) {
          set({ isLocked: false, failedAttempts: 0, lockoutUntil: null });
          return true;
        }
      }
      return false;
    },

    /**
     * Reset the lock state completely on user logout.
     */
    resetOnLogout: () => {
      set({ isLocked: false });
    },
  };
});

// Manage Background -> Foreground transitions
AppState.addEventListener('change', (nextAppState) => {
  const store = useAppLockStore.getState();
  if (!store.isAppLockEnabled) return;

  if (nextAppState === 'background' || nextAppState === 'inactive') {
    useAppLockStore.setState({ lastBackgroundTime: Date.now() });
  } else if (nextAppState === 'active') {
    const { lastBackgroundTime, autoLockTimeout, isLocked } = useAppLockStore.getState();
    
    // If already locked, do nothing
    if (isLocked) return;

    if (lastBackgroundTime) {
      const timeAway = Date.now() - lastBackgroundTime;
      if (timeAway >= autoLockTimeout) {
        useAppLockStore.setState({ isLocked: true });
      }
    }
  }
});

export default useAppLockStore;
