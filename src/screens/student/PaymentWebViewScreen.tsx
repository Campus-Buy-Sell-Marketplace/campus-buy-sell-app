import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';

interface PaymentWebViewScreenProps {
  navigation: any;
  route: any;
}

export const PaymentWebViewScreen: React.FC<PaymentWebViewScreenProps> = ({
  navigation,
  route,
}) => {
  const { paymentUrl = 'https://checkout.stripe.com', orderId } = route.params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const url = navState.url.toLowerCase();

    if (url.includes('success') || url.includes('payment_success')) {
      setShowSuccessModal(true);
    } else if (url.includes('cancel') || url.includes('failure') || url.includes('failed')) {
      Alert.alert('Payment Cancelled', 'Your transaction was cancelled.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Exit Payment',
      'Are you sure you want to cancel and leave the payment gateway?',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const handleSuccessDone = () => {
    setShowSuccessModal(false);
    navigation.navigate('OrdersScreen');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <Text style={styles.headerTitle}>Secure Payment</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* WebView Container */}
      <View style={styles.webViewWrapper}>
        <WebView
          source={{ uri: paymentUrl }}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loaderText}>Connecting to payment gateway...</Text>
            </View>
          )}
        />

        {/* Extra loading overlay if needed */}
        {isLoading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Loading secure checkout...</Text>
          </View>
        )}
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadow.lg]}>
            <Text style={styles.modalEmoji}>✅</Text>
            <Text style={styles.modalTitle}>Payment Successful!</Text>
            <Text style={styles.modalBody}>
              Your order has been confirmed. You can now coordinate meetup and pickup with your seller.
            </Text>

            <TouchableOpacity
              style={styles.ordersBtn}
              onPress={handleSuccessDone}
              activeOpacity={0.85}
            >
              <Text style={styles.ordersBtnText}>View My Orders</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  webViewWrapper: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loaderText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  modalEmoji: {
    fontSize: 54,
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  ordersBtn: {
    width: '100%',
    backgroundColor: Colors.black,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  ordersBtnText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: '700',
  },
});

export default PaymentWebViewScreen;
