/**
 * Navigation theme configuration for React Navigation.
 * Syncs with our custom theme system.
 */

import { Platform } from 'react-native';

/**
 * Get navigation theme object based on current app theme.
 * @param {boolean} isDark - Whether dark mode is active.
 * @param {Object} colors - Current theme colors.
 * @returns {Object} React Navigation theme object.
 */
export const getNavigationTheme = (isDark, colors) => ({
  dark: isDark,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    notification: colors.badge,
  },
  fonts: {
    regular: {
      fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
      fontWeight: '500',
    },
    bold: {
      fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
      fontWeight: 'bold',
    },
    heavy: {
      fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
      fontWeight: '900',
    },
  },
});
