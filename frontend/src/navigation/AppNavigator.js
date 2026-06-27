import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import useAuthStore from '../store/authStore';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import SplashScreen from '../screens/Splash/SplashScreen';
import { getNavigationTheme } from './navigationTheme';
import { useTheme } from '../theme';
import useSocket from '../hooks/useSocket';

/**
 * Root navigator.
 * Switches between Splash, Auth, and Main stacks based on auth state.
 */
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const theme = useTheme();

  // Initialize socket connection when authenticated
  useSocket();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={getNavigationTheme(theme.isDark, theme.colors)}>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
