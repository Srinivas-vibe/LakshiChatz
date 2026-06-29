import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Switch } from 'react-native';
import { useTheme } from '../theme';
import useVaultStore from '../store/vaultStore';
import * as LocalAuthentication from 'expo-local-authentication';

const VaultSetupModal = ({ visible, onClose, onComplete }) => {
  const { colors } = useTheme();
  const [secret, setSecret] = useState('');
  const [useBiometrics, setUseBiometrics] = useState(false);
  const vaultStore = useVaultStore();

  const handleSetup = async () => {
    if (secret.trim().length === 0) {
      alert('Please enter a secret trigger.');
      return;
    }

    // Check biometric support if enabled
    if (useBiometrics) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        alert('Biometrics not available or enrolled on this device. Disabling biometrics.');
        setUseBiometrics(false);
      }
    }

    await vaultStore.setupVault(secret.trim(), useBiometrics);
    onComplete();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>Protect Your Private Chats</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Create a private unlock method to access your hidden conversations.
            This can be a passphrase, word, or emoji sequence (e.g. 🔥🌙❤️).
          </Text>

          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
            ]}
            placeholder="Enter secret trigger..."
            placeholderTextColor={colors.textSecondary}
            value={secret}
            onChangeText={setSecret}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>Enable Biometrics (Optional)</Text>
            <Switch
              value={useBiometrics}
              onValueChange={setUseBiometrics}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={[styles.buttonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSetup}>
              <Text style={[styles.buttonText, { color: colors.background }]}>Create Vault</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VaultSetupModal;
