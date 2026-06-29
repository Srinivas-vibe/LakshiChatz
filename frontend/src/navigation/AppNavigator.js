import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import useAuthStore from '../store/authStore';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import SplashScreen from '../screens/Splash/SplashScreen';
import { getNavigationTheme } from './navigationTheme';
import { useTheme } from '../theme';
import useSocket from '../hooks/useSocket';
import useAppLockStore from '../store/appLockStore';
import UnlockScreen from '../screens/AppLock/UnlockScreen';
import { View, StyleSheet } from 'react-native';

/**
 * Root navigator.
 * Switches between Splash, Auth, and Main stacks based on auth state.
 */
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const theme = useTheme();
  const isLocked = useAppLockStore((s) => s.isLocked);

  // Initialize socket connection when authenticated
  useSocket();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer theme={getNavigationTheme(theme.isDark, theme.colors)}>
        {isAuthenticated ? <MainStack /> : <AuthStack />}
      </NavigationContainer>
      
      {isAuthenticated && isLocked && (
        <View style={StyleSheet.absoluteFill}>
          <UnlockScreen />
        </View>
      )}
    </View>
  );
};

export default AppNavigator;
