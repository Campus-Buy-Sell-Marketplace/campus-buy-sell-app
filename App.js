import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Campus Marketplace</Text>
        <Text style={styles.subtitle}>Mobile Application</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🚀 Deployment Active</Text>
        </View>
        <Text style={styles.message}>
          This is a pre-production deployment.{'\n'}
          The full application is currently under development.
        </Text>
        <Text style={styles.footer}>OJT Semester 3 — Product Development</Text>
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    color: '#f1f5f9',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 15,
    marginBottom: 20,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: '#166534',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  badgeText: {
    color: '#bbf7d0',
    fontSize: 13,
    fontWeight: '600',
  },
  message: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 28,
  },
  footer: {
    color: '#475569',
    fontSize: 11,
    textAlign: 'center',
  },
});
