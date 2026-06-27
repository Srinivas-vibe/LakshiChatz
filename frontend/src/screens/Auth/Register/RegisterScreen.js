import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../../theme';
import useAuthStore from '../../../store/authStore';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { SCREENS } from '../../../constants';
import {
  validateUsername,
  validatePassword,
  validateDisplayName,
} from '../../../utils';

/**
 * Registration screen with username, display name, and password form.
 */
const RegisterScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleRegister = useCallback(async () => {
    clearError();
    const errors = {};

    const usernameCheck = validateUsername(username.toLowerCase());
    if (!usernameCheck.valid) {
      errors.username = usernameCheck.error;
    }

    const displayNameCheck = validateDisplayName(displayName);
    if (!displayNameCheck.valid) {
      errors.displayName = displayNameCheck.error;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      errors.password = passwordCheck.error;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    await register(username.toLowerCase(), displayName.trim(), password);
  }, [username, displayName, password, register, clearError]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoEmoji}>🚀</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join LakshiChatz and start chatting
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {error && (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: colors.errorLight },
              ]}
            >
              <Text style={[styles.errorBannerText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          <Input
            label="Username"
            placeholder="e.g., idz_srini"
            value={username}
            onChangeText={(text) => {
              setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
              if (fieldErrors.username) {
                setFieldErrors((prev) => ({ ...prev, username: null }));
              }
            }}
            error={fieldErrors.username}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={25}
          />

          <Input
            label="Display Name"
            placeholder="e.g., Shree"
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              if (fieldErrors.displayName) {
                setFieldErrors((prev) => ({ ...prev, displayName: null }));
              }
            }}
            error={fieldErrors.displayName}
            maxLength={50}
          />

          <Input
            label="Password"
            placeholder="Minimum 8 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: null }));
              }
            }}
            error={fieldErrors.password}
            secureTextEntry
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={styles.registerButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate(SCREENS.LOGIN)}
          >
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  registerButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default RegisterScreen;
