import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { APP_NAME, APP_TAGLINE } from '../../config/appConfig';
import { API_BASE_URL } from '../../config/env';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

WebBrowser.maybeCompleteAuthSession();

export const LoginScreen: React.FC = () => {
  const { login, register, googleLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (activeTab === 'signin') {
      if (!email.trim() || !password) {
        setErrorMessage('Please enter both email and password.');
        return;
      }
      try {
        setLoading(true);
        await login({ email: email.trim(), password });
      } catch (err: any) {
        setErrorMessage(err.message || 'Login failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!name.trim() || !email.trim() || !password) {
        setErrorMessage('All fields are required.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
      try {
        setLoading(true);
        await register({ name: name.trim(), email: email.trim(), password });
      } catch (err: any) {
        setErrorMessage(err.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    try {
      // In development / mobile environment, open backend Google auth or mock token
      const authUrl = `${API_BASE_URL.replace('/api', '')}/api/auth/google`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, 'unitrade://');

      if (result.type === 'success' && result.url) {
        // Parse token from redirect URL
        const parsedUrl = new URL(result.url);
        const token = parsedUrl.searchParams.get('token');
        if (token) {
          await googleLogin(token);
          return;
        }
      }
      // If direct browser flow was cancelled or no token returned in dev:
      Alert.alert(
        'Google Authentication',
        'Google sign-in is configured with backend OAuth. To test in local development, you can also use one of the quick demo accounts below.'
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const fillQuickAccount = (role: 'student' | 'seller' | 'admin') => {
    setActiveTab('signin');
    setErrorMessage(null);
    if (role === 'student') {
      setEmail('student@campus.edu');
      setPassword('Password123!');
    } else if (role === 'seller') {
      setEmail('seller@campus.edu');
      setPassword('Password123!');
    } else if (role === 'admin') {
      setEmail('admin@campus.edu');
      setPassword('Password123!');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Brand */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>{APP_NAME}.</Text>
            <Text style={styles.tagline}>{APP_TAGLINE}</Text>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setActiveTab('signin');
                setErrorMessage(null);
              }}
              style={[
                styles.tabButton,
                activeTab === 'signin' && styles.activeTabButton,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'signin' && styles.activeTabText,
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setActiveTab('register');
                setErrorMessage(null);
              }}
              style={[
                styles.tabButton,
                activeTab === 'register' && styles.activeTabButton,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'register' && styles.activeTabText,
                ]}
              >
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form Content */}
          <View style={styles.formCard}>
            {activeTab === 'register' ? (
              <Input
                label="Full Name"
                placeholder="e.g. Alex Johnson"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            ) : null}

            <Input
              label="Campus Email"
              placeholder="you@campus.edu"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {activeTab === 'register' ? (
              <Input
                label="Confirm Password"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            ) : null}

            <Button
              title={activeTab === 'signin' ? 'Sign In' : 'Create Account'}
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitBtn}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google OAuth Button */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={18} color="#ea4335" style={styles.googleIcon} />
              <Text style={styles.googleBtnText}>
                {googleLoading ? 'Connecting...' : 'Sign in with Google'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Test Accounts Card */}
          <View style={styles.testAccountsCard}>
            <Text style={styles.testAccountsTitle}>⚡ Quick Demo Sign In</Text>
            <Text style={styles.testAccountsSubtitle}>
              Tap a chip below to auto-fill credentials:
            </Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={styles.chip}
                onPress={() => fillQuickAccount('student')}
              >
                <Text style={styles.chipText}>🎓 Student</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chip}
                onPress={() => fillQuickAccount('seller')}
              >
                <Text style={styles.chipText}>💼 Seller</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chip}
                onPress={() => fillQuickAccount('admin')}
              >
                <Text style={styles.chipText}>🛡️ Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  tagline: {
    marginTop: Spacing.xs,
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  activeTabButton: {
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  tabText: {
    fontSize: Typography.base,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    color: Colors.danger,
    fontSize: Typography.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  submitBtn: {
    marginTop: Spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.sm,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: 11,
    ...Shadow.sm,
  },
  googleIcon: {
    marginRight: Spacing.sm,
  },
  googleBtnText: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
  },
  testAccountsCard: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  testAccountsTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  testAccountsSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.text,
  },
});

export default LoginScreen;
