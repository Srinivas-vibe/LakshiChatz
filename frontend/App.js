import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/theme';
import AppNavigator from './src/navigation/AppNavigator';
import localDb from './src/database/localDb';

/**
 * Root application component.
 * Wraps the app with necessary providers:
 * - GestureHandlerRootView (for gesture handler)
 * - SafeAreaProvider (for safe area insets)
 * - ThemeProvider (for light/dark mode)
 */
const App = () => {
  useEffect(() => {
    // Initialize local SQLite database on app start
    localDb.getDatabase().catch((error) => {
      console.error('Failed to initialize local database:', error);
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
