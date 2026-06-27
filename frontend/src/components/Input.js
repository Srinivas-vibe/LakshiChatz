import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

/**
 * Reusable styled text input with label and error state.
 *
 * @param {Object} props
 * @param {string} [props.label] - Input label.
 * @param {string} [props.error] - Error message.
 * @param {string} [props.placeholder] - Placeholder text.
 * @param {boolean} [props.secureTextEntry] - Whether to obscure text.
 * @param {Object} [props.style] - Additional style.
 * @param {Object} props - All other TextInput props.
 */
const Input = ({
  label,
  error,
  placeholder,
  secureTextEntry,
  style,
  containerStyle,
  ...props
}) => {
  const { colors, borderRadius: br } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            color: colors.text,
            borderColor: error
              ? colors.error
              : isFocused
                ? colors.primary
                : colors.border,
            borderRadius: br.md,
          },
          style,
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={secureTextEntry}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoCapitalize="none"
        {...props}
      />

      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1.5,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default Input;
