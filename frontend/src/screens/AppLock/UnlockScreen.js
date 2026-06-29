import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';
import useAppLockStore from '../../store/appLockStore';
import { ShieldAlert, Fingerprint } from 'lucide-react-native';

const { width } = Dimensions.get('window');

/**
 * Global Unlock Overlay Screen
 * Displays a minimal PIN keypad and Biometric prompt.
 */
const UnlockScreen = () => {
  const { colors } = useTheme();
  const {
    verifyPin,
    authenticateBiometrics,
    useBiometrics,
    failedAttempts,
    lockoutUntil,
  } = useAppLockStore();

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [remainingLockout, setRemainingLockout] = useState(0);

  // Shake animation for incorrect PIN
  const offset = useSharedValue(0);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.value }],
    };
  });

  const triggerShake = () => {
    const TIME = 80;
    const DIST = 10;
    offset.value = withSequence(
      withTiming(-DIST, { duration: TIME / 2 }),
      withRepeat(withTiming(DIST, { duration: TIME }), 3, true),
      withTiming(0, { duration: TIME / 2 })
    );
  };

  // Attempt Biometrics on mount if enabled
  useEffect(() => {
    if (useBiometrics && !lockoutUntil) {
      authenticateBiometrics();
    }
  }, [useBiometrics, lockoutUntil, authenticateBiometrics]);

  // Handle Lockout timer
  useEffect(() => {
    if (!lockoutUntil) {
      setRemainingLockout(0);
      return;
    }

    const checkLockout = () => {
      const now = Date.now();
      if (now >= lockoutUntil) {
        useAppLockStore.setState({ lockoutUntil: null, failedAttempts: 0 });
        setRemainingLockout(0);
        setErrorMsg('');
      } else {
        setRemainingLockout(Math.ceil((lockoutUntil - now) / 1000));
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handleKeyPress = async (digit) => {
    if (lockoutUntil) return;

    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMsg('');

      if (newPin.length === 4) {
        // Verify
        const success = await verifyPin(newPin);
        if (!success) {
          triggerShake();
          setPin('');
          if (failedAttempts >= 4) {
            setErrorMsg('Too many failed attempts.');
          } else {
            setErrorMsg('Incorrect PIN');
          }
        }
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMsg('');
    }
  };

  const renderDot = (index) => {
    const isFilled = index < pin.length;
    return (
      <View
        key={index}
        style={[
          styles.dot,
          {
            borderColor: colors.primary,
            backgroundColor: isFilled ? colors.primary : 'transparent',
          },
        ]}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ShieldAlert size={48} color={colors.primary} style={{ marginBottom: 16 }} />
        <Text style={[styles.title, { color: colors.text }]}>Unlock LakshiChatz</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Authentication required
        </Text>
      </View>

      <Animated.View style={[styles.dotsContainer, animatedStyles]}>
        {[0, 1, 2, 3].map(renderDot)}
      </Animated.View>

      <View style={styles.messageContainer}>
        {remainingLockout > 0 ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            Locked. Try again in {remainingLockout}s
          </Text>
        ) : errorMsg ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg}</Text>
        ) : null}
      </View>

      <View style={styles.keypad}>
        {[[1, 2, 3], [4, 5, 6], [7, 8, 9]].map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.key, { backgroundColor: colors.card }]}
                onPress={() => handleKeyPress(num.toString())}
                disabled={remainingLockout > 0}
              >
                <Text style={[styles.keyText, { color: colors.text }]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.key}
            onPress={() => {
              if (useBiometrics && remainingLockout === 0) authenticateBiometrics();
            }}
            disabled={!useBiometrics || remainingLockout > 0}
          >
            {useBiometrics ? (
              <Fingerprint size={32} color={colors.primary} />
            ) : null}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.key, { backgroundColor: colors.card }]}
            onPress={() => handleKeyPress('0')}
            disabled={remainingLockout > 0}
          >
            <Text style={[styles.keyText, { color: colors.text }]}>0</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.key}
            onPress={handleDelete}
            disabled={remainingLockout > 0}
          >
            <Text style={[styles.keyText, { color: colors.textSecondary, fontSize: 16 }]}>
              DEL
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  messageContainer: {
    height: 30,
    marginBottom: 30,
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  keypad: {
    width: width * 0.8,
    maxWidth: 320,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 32,
    fontWeight: '500',
  },
});

export default UnlockScreen;
