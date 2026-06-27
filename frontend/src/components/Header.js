import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { ArrowLeft } from 'lucide-react-native';

/**
 * Custom header component with back button, title, and optional right action.
 *
 * @param {Object} props
 * @param {string} props.title - Header title.
 * @param {string} [props.subtitle] - Header subtitle.
 * @param {Function} [props.onBack] - Back button handler.
 * @param {boolean} [props.showBack=false] - Whether to show back button.
 * @param {React.ReactNode} [props.rightComponent] - Right side component.
 * @param {React.ReactNode} [props.leftComponent] - Left side component (overrides back button).
 * @param {React.ReactNode} [props.centerComponent] - Center component (overrides title).
 */
const Header = ({
  title,
  subtitle,
  onBack,
  showBack = false,
  rightComponent,
  leftComponent,
  centerComponent,
}) => {
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          paddingTop: insets.top + 8,
          borderBottomColor: colors.borderLight,
          ...shadows.sm,
        },
      ]}
    >
      <StatusBar
        barStyle={useTheme().isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.card}
      />

      <View style={styles.content}>
        <View style={styles.leftSection}>
          {leftComponent ||
            (showBack && onBack ? (
              <TouchableOpacity
                onPress={onBack}
                style={styles.backButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft color={colors.primary} size={24} />
              </TouchableOpacity>
            ) : null)}
        </View>

        <View style={styles.centerSection}>
          {centerComponent || (
            <View>
              <Text
                style={[styles.title, { color: colors.text }]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle && (
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.rightSection}>
          {rightComponent || null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
  },
  leftSection: {
    width: 48,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 48,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 4,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default Header;
