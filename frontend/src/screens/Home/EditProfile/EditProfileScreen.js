import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../theme';
import useAuthStore from '../../../store/authStore';
import useUserStore from '../../../store/userStore';
import Header from '../../../components/Header';
import Avatar from '../../../components/Avatar';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { validateDisplayName } from '../../../utils';
import { VALIDATION } from '../../../constants';

/**
 * Edit profile screen.
 * Allows updating display name, bio, and profile picture.
 */
const EditProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, updateUser } = useAuthStore();
  const { updateProfile, uploadProfilePicture, isUpdatingProfile } = useUserStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'We need access to your photo library to update your profile photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setSelectedPhoto(asset);
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'An unexpected error occurred during photo selection.');
    }
  }, []);

  const handleSave = useCallback(async () => {
    const errors = {};

    const nameCheck = validateDisplayName(displayName);
    if (!nameCheck.valid) {
      errors.displayName = nameCheck.error;
    }

    if (bio.length > VALIDATION.BIO_MAX) {
      errors.bio = `Bio cannot exceed ${VALIDATION.BIO_MAX} characters`;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      let photoUpdate = {};

      // 1. If photo was changed, upload it first
      if (selectedPhoto) {
        setIsUploadingPhoto(true);
        const filename = selectedPhoto.uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        const formData = new FormData();
        formData.append('profilePicture', {
          uri: Platform.OS === 'android' ? selectedPhoto.uri : selectedPhoto.uri.replace('file://', ''),
          name: filename,
          type: type,
        });

        const uploadResult = await uploadProfilePicture(formData);
        setIsUploadingPhoto(false);

        if (uploadResult) {
          photoUpdate = uploadResult;
        } else {
          Alert.alert('Error', 'Failed to upload profile picture.');
          return;
        }
      }

      // 2. Save text updates (displayName, bio)
      const updatedUser = await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
      });

      if (updatedUser) {
        // Merge updates and update auth store
        const mergedUser = {
          ...user,
          ...photoUpdate,
          ...updatedUser,
        };
        await updateUser(mergedUser);

        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to update profile.');
      }
    } catch (error) {
      setIsUploadingPhoto(false);
      console.error('Error saving profile changes:', error);
      Alert.alert('Error', 'Failed to save profile changes.');
    }
  }, [displayName, bio, selectedPhoto, updateProfile, uploadProfilePicture, updateUser, user, navigation]);

  const hasChanges =
    displayName.trim() !== (user?.displayName || '') ||
    bio.trim() !== (user?.bio || '') ||
    selectedPhoto !== null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header
        title="Edit Profile"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Avatar
            uri={selectedPhoto ? selectedPhoto.uri : user?.profilePicture}
            name={displayName || user?.displayName}
            size={90}
          />
          {isUploadingPhoto ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginTop: 16 }}
            />
          ) : (
            <Button
              title="Change Photo"
              variant="ghost"
              fullWidth={false}
              onPress={handlePickImage}
              style={styles.changePhotoButton}
            />
          )}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Display Name"
            placeholder="Enter your display name"
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              if (fieldErrors.displayName) {
                setFieldErrors((prev) => ({ ...prev, displayName: null }));
              }
            }}
            error={fieldErrors.displayName}
            maxLength={VALIDATION.DISPLAY_NAME_MAX}
          />

          <Input
            label="Bio"
            placeholder="Tell us about yourself..."
            value={bio}
            onChangeText={(text) => {
              setBio(text);
              if (fieldErrors.bio) {
                setFieldErrors((prev) => ({ ...prev, bio: null }));
              }
            }}
            error={fieldErrors.bio}
            maxLength={VALIDATION.BIO_MAX}
            multiline
            style={styles.bioInput}
          />

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={isUpdatingProfile || isUploadingPhoto}
            disabled={!hasChanges || isUpdatingProfile || isUploadingPhoto}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  changePhotoButton: {
    marginTop: 12,
  },
  form: {},
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
});

export default EditProfileScreen;
