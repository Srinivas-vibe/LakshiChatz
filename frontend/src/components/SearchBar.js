import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';

import { Search, X } from 'lucide-react-native';

/**
 * Search bar component with icon.
 *
 * @param {Object} props
 * @param {string} props.value - Current search value.
 * @param {Function} props.onChangeText - Text change handler.
 * @param {string} [props.placeholder='Search...'] - Placeholder text.
 * @param {Function} [props.onClear] - Clear button handler.
 * @param {boolean} [props.autoFocus=false] - Auto-focus on mount.
 */
const SearchBar = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  autoFocus = false,
}) => {
  const { colors, borderRadius: br } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.inputBackground,
          borderRadius: br.lg,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Search size={18} color={colors.textTertiary} />
      </View>

      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {value.length > 0 && onClear && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={onClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View
            style={[
              styles.clearIcon,
              { backgroundColor: colors.textTertiary },
            ]}
          >
            <X size={14} color={colors.inputBackground} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  iconContainer: {
    marginRight: 10,
  },
  searchIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
  },
  clearIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearX: {
    width: 8,
    height: 2,
    borderRadius: 1,
  },
});

export default SearchBar;
