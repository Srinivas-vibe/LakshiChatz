import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useTheme } from '../../theme';
import useAppLockStore from '../../store/appLockStore';
import Header from '../../components/Header';
import * as LocalAuthentication from 'expo-local-authentication';
import { ShieldCheck } from 'lucide-react-native';

const { width } = Dimensions.get('window');

/**
 * Screen for setting up or changing the App Lock PIN.
 */
const PinSetupScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const store = useAppLockStore();
  const isChange = route.params?.isChange || false;

  const [step, setStep] = useState(isChange ? 'verify' : 'create'); // 'verify', 'create', 'confirm'
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');

  const handleKeyPress = async (digit) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === 4) {
        if (step === 'verify') {
          const success = await store.verifyPin(newPin);
          if (success) {
            setStep('create');
            setPin('');
          } else {
            Alert.alert('Incorrect', 'The PIN you entered is incorrect.');
            setPin('');
          }
        } else if (step === 'create') {
          setFirstPin(newPin);
          setStep('confirm');
          setPin('');
        } else if (step === 'confirm') {
          if (newPin === firstPin) {
            // Save PIN
            if (isChange) {
              await store.setupAppLock(newPin, store.useBiometrics);
              Alert.alert('Success', 'PIN changed successfully.');
              navigation.goBack();
            } else {
              // Check if they want to enable Biometrics
              const hasHardware = await LocalAuthentication.hasHardwareAsync();
              const isEnrolled = await LocalAuthentication.isEnrolledAsync();
              
              if (hasHardware && isEnrolled) {
                Alert.alert(
                  'Enable Biometrics?',
                  'Would you like to also use Fingerprint/Face ID to unlock the app?',
                  [
                    {
                      text: 'No',
                      onPress: async () => {
                        await store.setupAppLock(newPin, false);
                        navigation.goBack();
                      },
                      style: 'cancel'
                    },
                    {
                      text: 'Yes',
                      onPress: async () => {
                        await store.setupAppLock(newPin, true);
                        navigation.goBack();
                      }
                    }
                  ]
                );
              } else {
                await store.setupAppLock(newPin, false);
                Alert.alert('Success', 'App Lock enabled successfully.');
                navigation.goBack();
              }
            }
          } else {
            Alert.alert('Mismatch', 'PINs do not match. Please try again.');
            setStep('create');
            setPin('');
            setFirstPin('');
          }
        }
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
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

  let title = 'Create PIN';
  if (step === 'verify') title = 'Enter Current PIN';
  if (step === 'confirm') title = 'Confirm New PIN';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Setup App Lock" showBack onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <ShieldCheck size={48} color={colors.primary} style={{ marginBottom: 16 }} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {step === 'verify' && 'Enter your current 4-digit PIN.'}
          {step === 'create' && 'Enter a 4-digit PIN to secure your app.'}
          {step === 'confirm' && 'Re-enter your PIN to confirm.'}
        </Text>

        <View style={styles.dotsContainer}>
          {[0, 1, 2, 3].map(renderDot)}
        </View>
      </View>

      <View style={styles.keypadContainer}>
        <View style={styles.keypad}>
          {[[1, 2, 3], [4, 5, 6], [7, 8, 9]].map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[styles.key, { backgroundColor: colors.card }]}
                  onPress={() => handleKeyPress(num.toString())}
                >
                  <Text style={[styles.keyText, { color: colors.text }]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <View style={styles.row}>
            <View style={styles.key} />
            <TouchableOpacity
              style={[styles.key, { backgroundColor: colors.card }]}
              onPress={() => handleKeyPress('0')}
            >
              <Text style={[styles.keyText, { color: colors.text }]}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.key} onPress={handleDelete}>
              <Text style={[styles.keyText, { color: colors.textSecondary, fontSize: 16 }]}>DEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { alignItems: 'center', marginTop: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 30, textAlign: 'center', paddingHorizontal: 40 },
  dotsContainer: { flexDirection: 'row', gap: 20, marginBottom: 40 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5 },
  keypadContainer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  keypad: { width: width * 0.8, maxWidth: 320, gap: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  key: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 32, fontWeight: '500' },
});

export default PinSetupScreen;
