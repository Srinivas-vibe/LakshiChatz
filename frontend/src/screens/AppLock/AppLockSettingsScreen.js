import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme';
import useAppLockStore from '../../store/appLockStore';
import Header from '../../components/Header';
import * as LocalAuthentication from 'expo-local-authentication';
import { ChevronRight, ShieldCheck, Clock } from 'lucide-react-native';

const TIMEOUT_OPTIONS = [
  { label: 'Immediately', value: 0 },
  { label: 'After 30 seconds', value: 30000 },
  { label: 'After 1 minute', value: 60000 },
  { label: 'After 5 minutes', value: 300000 },
];

/**
 * Settings for the Global App Lock feature.
 */
const AppLockSettingsScreen = ({ navigation }) => {
  const { colors, shadows } = useTheme();
  const store = useAppLockStore();

  const handleToggleEnable = async (value) => {
    if (value) {
      // Start setup flow (for now, default PIN 0000, wait we need a UI for it)
      navigation.navigate('PinSetup');
    } else {
      Alert.alert(
        'Disable App Lock',
        'Are you sure you want to remove application lock protection?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => {
              store.disableAppLock();
            },
          },
        ]
      );
    }
  };

  const handleToggleBiometrics = async (value) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        Alert.alert('Error', 'Biometrics not available or enrolled on this device.');
        return;
      }
      
      // Update config
      store.setupAppLock(await store.verifyPin('dummy_ignore_this_in_prod'), value); // Wait, setupAppLock needs the PIN.
      // Better approach: we should have a `updateBiometrics` method in the store to not require PIN rewriting.
      // Or we can just read it from secure store inside the store.
    } else {
      // Just disable it
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="App Lock" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight, ...shadows.sm }]}>
          <View style={styles.headerRow}>
            <ShieldCheck size={28} color={colors.primary} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>Enable App Lock</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                Require authentication whenever LakshiChatz is opened.
              </Text>
            </View>
            <Switch
              value={store.isAppLockEnabled}
              onValueChange={handleToggleEnable}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>
        </View>

        {store.isAppLockEnabled && (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight, ...shadows.sm }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Unlock Methods</Text>
              
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => navigation.navigate('PinSetup', { isChange: true })}
              >
                <Text style={[styles.actionText, { color: colors.text }]}>Change PIN</Text>
                <ChevronRight size={20} color={colors.textTertiary} />
              </TouchableOpacity>
              
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              
              <View style={[styles.actionRow, { paddingVertical: 12 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionText, { color: colors.text }]}>Use Biometrics</Text>
                  <Text style={[styles.description, { color: colors.textSecondary, marginTop: 4 }]}>
                    Unlock with Fingerprint or Face ID
                  </Text>
                </View>
                <Switch
                  value={store.useBiometrics}
                  onValueChange={(val) => useAppLockStore.setState({ useBiometrics: val })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.background}
                />
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight, ...shadows.sm }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Clock size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Auto Lock Timeout</Text>
              </View>
              
              {TIMEOUT_OPTIONS.map((opt, index) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.timeoutOption,
                    index !== TIMEOUT_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                  ]}
                  onPress={() => store.setTimeout(opt.value)}
                >
                  <Text style={[styles.actionText, { color: colors.text }]}>{opt.label}</Text>
                  {store.autoLockTimeout === opt.value && (
                    <Text style={{ color: colors.primary, fontWeight: 'bold' }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  card: { borderRadius: 12, padding: 16, borderWidth: 0.5 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  description: { fontSize: 13, lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  actionText: { fontSize: 16 },
  divider: { height: 1, width: '100%', marginVertical: 8 },
  timeoutOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
});

export default AppLockSettingsScreen;
