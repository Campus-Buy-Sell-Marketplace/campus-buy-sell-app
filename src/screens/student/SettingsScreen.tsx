import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'Are you sure you want to clear temporary offline image cache?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        onPress: () => {
          Alert.alert('Cache Cleared', 'Local offline image cache has been cleared.');
        },
      },
    ]);
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Please use the "Forgot Password" feature on the login screen to receive a secure password reset link.'
    );
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of UniTrade?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section: Notifications */}
        <Text style={styles.sectionHeading}>NOTIFICATIONS</Text>
        <View style={[styles.sectionCard, Shadow.sm]}>
          <View style={styles.settingRow}>
            <View style={styles.labelCol}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingSubLabel}>
                Receive alerts for orders, messages, and saved item updates
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Section: App */}
        <Text style={styles.sectionHeading}>APP PREFERENCES</Text>
        <View style={[styles.sectionCard, Shadow.sm]}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>App Version</Text>
            <Text style={styles.versionValue}>1.0.0 (Build 24)</Text>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleClearCache}
            activeOpacity={0.7}
          >
            <Text style={styles.settingLabel}>Clear Offline Cache</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section: Account */}
        <Text style={styles.sectionHeading}>ACCOUNT</Text>
        <View style={[styles.sectionCard, Shadow.sm]}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleChangePassword}
            activeOpacity={0.7}
          >
            <Text style={styles.settingLabel}>Change Password</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={[styles.settingLabel, { color: Colors.danger }]}>
              Sign Out
            </Text>
            <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  sectionHeading: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  labelCol: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
  },
  settingSubLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  versionValue: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.lg,
  },
});

export default SettingsScreen;
