import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { useTheme } from '../../../theme';
import useVaultStore from '../../../store/vaultStore';
import Header from '../../../components/Header';
import * as LocalAuthentication from 'expo-local-authentication';
import { Lock } from 'lucide-react-native';

/**
 * Settings for the Private Vault.
 */
const VaultSettingsScreen = ({ navigation }) => {
  const { colors, shadows } = useTheme();
  const vaultStore = useVaultStore();

  const [secret, setSecret] = useState(vaultStore.secretTrigger);
  const [useBiometrics, setUseBiometrics] = useState(vaultStore.useBiometrics);
  const [isEditingSecret, setIsEditingSecret] = useState(false);

  if (!vaultStore.isConfigured) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Private Vault" showBack onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <Lock size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            Vault not configured
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            Lock a chat to set up your Private Vault.
          </Text>
        </View>
      </View>
    );
  }

  const handleToggleBiometrics = async (val) => {
    if (val) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        Alert.alert('Error', 'Biometrics not available on this device.');
        return;
      }
    }
    setUseBiometrics(val);
    await vaultStore.setupVault(vaultStore.secretTrigger, val);
  };

  const handleSaveSecret = async () => {
    if (secret.trim().length === 0) {
      Alert.alert('Error', 'Secret trigger cannot be empty.');
      return;
    }
    await vaultStore.setupVault(secret.trim(), vaultStore.useBiometrics);
    setIsEditingSecret(false);
    Alert.alert('Success', 'Secret trigger updated successfully.');
  };

  const handleDisableVault = () => {
    Alert.alert(
      'Disable Vault',
      'Are you sure? This will remove all chats from the vault and return them to the main chat list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            await vaultStore.disableVault();
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Vault Settings" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Secret Trigger Settings */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight, ...shadows.sm }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Secret Trigger</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            The exact word or emojis you type in the search bar to reveal the vault.
          </Text>
          
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground },
              ]}
              value={secret}
              onChangeText={(text) => {
                setSecret(text);
                setIsEditingSecret(true);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            {isEditingSecret && (
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveSecret}
              >
                <Text style={{ color: colors.background, fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Biometrics Settings */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight, ...shadows.sm }]}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 4 }]}>Use Biometrics</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                Require Fingerprint or Face Unlock when opening the vault.
              </Text>
            </View>
            <Switch
              value={useBiometrics}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <TouchableOpacity
          style={[styles.card, styles.dangerCard, { borderColor: colors.error }]}
          onPress={handleDisableVault}
        >
          <Text style={[styles.dangerText, { color: colors.error }]}>Disable Private Vault</Text>
          <Text style={[styles.description, { color: colors.error, marginTop: 4, textAlign: 'center' }]}>
            This removes protection from all locked chats.
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  card: { borderRadius: 12, padding: 16, borderWidth: 0.5 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  description: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  saveButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, justifyContent: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dangerCard: { alignItems: 'center', backgroundColor: 'transparent', paddingVertical: 20 },
  dangerText: { fontSize: 16, fontWeight: 'bold' },
});

export default VaultSettingsScreen;
