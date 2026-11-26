import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, Typography, BorderRadius } from '../../constants/theme';

export const SellerPayoutsScreen: React.FC<any> = () => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payouts</Text>
        <Text style={styles.headerSubtitle}>Track earnings & bank transfers</Text>
      </View>

      {/* Coming Soon Card */}
      <View style={styles.centerContainer}>
        <View style={styles.comingSoonCard}>
          <Ionicons name="wallet-outline" size={56} color="#6366f1" style={styles.icon} />
          <Text style={styles.comingSoonTitle}>Payouts Coming Soon</Text>
          <Text style={styles.comingSoonBody}>
            The payout management feature is under development and will be available in the next
            release. Your completed order earnings are being tracked and will be disbursed once the
            feature is live.
          </Text>
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={16} color="#2563eb" />
            <Text style={styles.infoText}>
              Contact campus admin for manual payout requests in the meantime.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: Typography['2xl'],
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  comingSoonCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  icon: {
    marginBottom: Spacing.md,
  },
  comingSoonTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  comingSoonBody: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: Typography.xs,
    color: '#1e40af',
    lineHeight: 16,
  },
});

export default SellerPayoutsScreen;
