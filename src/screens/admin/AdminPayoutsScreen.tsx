import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { BorderRadius } from '../../constants/theme';

export const AdminPayoutsScreen: React.FC<any> = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Payouts Management</Text>
      </View>

      <View style={styles.centerContainer}>
        <View style={styles.comingSoonCard}>
          <Ionicons name="cash-outline" size={56} color="#6366f1" style={{ marginBottom: 16 }} />
          <Text style={styles.title}>Payouts Coming Soon</Text>
          <Text style={styles.body}>
            The backend payout management API is under development. Once live, admins will be able
            to review, approve, and process seller payout requests directly from this screen.
          </Text>
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={16} color="#2563eb" />
            <Text style={styles.infoText}>
              Payout requests can currently be handled manually via the database or admin panel.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  comingSoonCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: BorderRadius.md,
    padding: 10,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 16,
  },
});

export default AdminPayoutsScreen;
