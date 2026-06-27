import { StyleSheet } from 'react-native';

/**
 * Global reusable style patterns.
 * These are theme-independent structural styles.
 * For theme-dependent styles, create them inside components using useTheme().
 */
export const globalStyles = StyleSheet.create({
  // Layout
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Screen container
  screenContainer: {
    flex: 1,
  },

  // Content padding
  contentPadding: {
    paddingHorizontal: 16,
  },

  // Full width
  fullWidth: {
    width: '100%',
  },
});
