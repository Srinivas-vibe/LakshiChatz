import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadows } from './spacing';

const ThemeContext = createContext(null);

/**
 * Theme provider component.
 * Detects system preference and provides theme values to the app tree.
 */
export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    setIsDark(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  const theme = useMemo(
    () => ({
      isDark,
      colors: isDark ? darkColors : lightColors,
      typography,
      spacing,
      borderRadius,
      shadows,
      toggleTheme: () => setIsDark((prev) => !prev),
    }),
    [isDark],
  );

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access theme values.
 * @returns {Object} Theme object with colors, typography, spacing, etc.
 */
export const useTheme = () => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
};

export { lightColors, darkColors } from './colors';
export { typography } from './typography';
export { spacing, borderRadius, shadows } from './spacing';
