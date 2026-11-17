import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';

interface EditProfileScreenProps {
  navigation: any;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [college, setCollege] = useState(user?.college || '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar_url || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Access to photos is required to change your avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open image library.');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Full Name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await userService.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        college: college.trim(),
        avatar_url: avatarUri || undefined,
      });
      await refreshUser();
      Alert.alert('Success', 'Profile updated!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update profile. Please try again.';
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar at Top */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8} style={styles.avatarTouchable}>
            <Avatar name={name || user?.name} uri={avatarUri} size="xl" />
            <View style={[styles.editIconBadge, Shadow.sm]}>
              <Ionicons name="camera" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Sahana Rao"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* Email (Readonly) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address (Read-only)</Text>
            <TextInput
              style={[styles.textInput, styles.readonlyInput]}
              value={user?.email || ''}
              editable={false}
            />
            <Text style={styles.helperText}>
              Campus email is linked to your institutional account.
            </Text>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 98765 43210"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          {/* College / Institution */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>College / Institution</Text>
            <TextInput
              style={styles.textInput}
              value={college}
              onChangeText={setCollege}
              placeholder="e.g. Bangalore Institute of Technology"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        {/* Save Changes Button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  errorBanner: {
    backgroundColor: Colors.danger,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  errorText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: '500',
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  avatarTouchable: {
    position: 'relative',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  changePhotoText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
  formContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.base,
    color: Colors.text,
  },
  readonlyInput: {
    backgroundColor: Colors.borderLight,
    borderColor: Colors.borderLight,
    color: Colors.textMuted,
  },
  helperText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  saveBtn: {
    backgroundColor: Colors.black,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.white,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export default EditProfileScreen;
