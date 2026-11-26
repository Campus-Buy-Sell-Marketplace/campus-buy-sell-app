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
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { sellerService } from '../../services/sellerService';
import { useAuth } from '../../context/AuthContext';

interface SellerOnboardingScreenProps {
  navigation: any;
}

export const SellerOnboardingScreen: React.FC<SellerOnboardingScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 fields
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');

  // Step 2 fields
  const [phone, setPhone] = useState(user?.phone || '');
  const [college, setCollege] = useState(user?.college || '');

  // Step 3 fields
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    setError(null);
    if (currentStep === 1) {
      if (!businessName.trim()) {
        setError('Please enter a business or store name.');
        return;
      }
      if (!description.trim()) {
        setError('Please provide a brief description of what you sell.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!phone.trim()) {
        setError('Please enter a valid phone number.');
        return;
      }
      if (!college.trim()) {
        setError('Please enter your campus/college name.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      setError('You must agree to the seller terms and campus code of conduct.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await sellerService.applyAsSeller({
        businessName: businessName.trim(),
        description: description.trim(),
        contactNumber: phone.trim(),
      });
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit application. Please try again.';
      setError(msg);
      Alert.alert('Submission Error', msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Application Submitted!</Text>
          <Text style={styles.successBody}>
            We'll review your student merchant application within 24 hours. You'll receive a notification once approved.
          </Text>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Seller</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar & Indicators */}
      <View style={styles.progressContainer}>
        <View style={styles.stepsRow}>
          <View style={[styles.stepDot, currentStep >= 1 && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, currentStep >= 1 && styles.stepDotTextActive]}>1</Text>
          </View>
          <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, currentStep >= 2 && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, currentStep >= 2 && styles.stepDotTextActive]}>2</Text>
          </View>
          <View style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]} />
          <View style={[styles.stepDot, currentStep >= 3 && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, currentStep >= 3 && styles.stepDotTextActive]}>3</Text>
          </View>
        </View>
        <Text style={styles.stepTitle}>Step {currentStep} of 3</Text>
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 1: Business Info */}
        {currentStep === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionHeading}>Store & Business Information</Text>
            <Text style={styles.sectionSubHeading}>
              Give your campus store a friendly name that peer students will recognize.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Store / Business Name *</Text>
              <TextInput
                style={styles.textInput}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Sahana's Textbook & Tech Hub"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Store Description *</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="What kinds of items do you plan to sell? (Textbooks, notes, electronics, dorm essentials...)"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        )}

        {/* Step 2: Contact & College */}
        {currentStep === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionHeading}>Contact & Institution</Text>
            <Text style={styles.sectionSubHeading}>
              Buyers will communicate with you regarding meetups and delivery.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>College / Institution *</Text>
              <TextInput
                style={styles.textInput}
                value={college}
                onChangeText={setCollege}
                placeholder="e.g. Bangalore Institute of Technology"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>
        )}

        {/* Step 3: Review & Terms */}
        {currentStep === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionHeading}>Review Your Details</Text>
            <Text style={styles.sectionSubHeading}>
              Verify your information before submitting for student merchant review.
            </Text>

            {/* Review Card */}
            <View style={[styles.reviewCard, Shadow.sm]}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Store Name:</Text>
                <Text style={styles.reviewValue}>{businessName}</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Description:</Text>
                <Text style={styles.reviewValue}>{description}</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Phone:</Text>
                <Text style={styles.reviewValue}>{phone}</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>College:</Text>
                <Text style={styles.reviewValue}>{college}</Text>
              </View>
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={agreedToTerms ? 'checkbox' : 'square-outline'}
                size={22}
                color={agreedToTerms ? Colors.primary : Colors.textMuted}
                style={{ marginRight: 10 }}
              />
              <Text style={styles.termsText}>
                I agree to the UniTrade Seller Terms, authentic student listing policy, and campus code of conduct.
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Navigation Buttons */}
        <View style={styles.buttonsRow}>
          {currentStep > 1 ? (
            <TouchableOpacity
              style={styles.backStepBtn}
              onPress={handleBack}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.backStepText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {currentStep < 3 ? (
            <TouchableOpacity
              style={styles.nextStepBtn}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.nextStepText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Submit Application</Text>
              )}
            </TouchableOpacity>
          )}
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
  progressContainer: {
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  stepDotText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  stepDotTextActive: {
    color: Colors.white,
  },
  stepLine: {
    width: 40,
    height: 3,
    backgroundColor: Colors.borderLight,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  stepTitle: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
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
  stepContent: {
    gap: Spacing.md,
  },
  sectionHeading: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionSubHeading: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
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
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
  },
  reviewRow: {
    gap: 2,
  },
  reviewLabel: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  reviewValue: {
    fontSize: Typography.base,
    color: Colors.text,
    fontWeight: '500',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  termsText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  backStepBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  backStepText: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
  },
  nextStepBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextStepText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.white,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.white,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: Typography['2xl'],
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  successBody: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  doneBtn: {
    width: '100%',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  doneBtnText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: '700',
  },
});

export default SellerOnboardingScreen;
