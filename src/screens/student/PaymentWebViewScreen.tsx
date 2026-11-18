import React, { useState, useEffect, useRef } from 'react';
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
import { paymentService, PaymentInitResponse } from '../../services/paymentService';

const WebViewComponent = WebView as any;

interface PaymentWebViewScreenProps {
  navigation: any;
  route: any;
}

export const PaymentWebViewScreen: React.FC<PaymentWebViewScreenProps> = ({
  navigation,
  route,
}) => {
  const { paymentUrl, orderId } = route.params || {};

  const webViewRef = useRef<WebView>(null);
  const [initData, setInitData] = useState<PaymentInitResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [deliveryOtp, setDeliveryOtp] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!orderId && !paymentUrl) {
        setError('Missing payment information.');
        setIsLoading(false);
        return;
      }

      if (orderId) {
        try {
          setIsLoading(true);
          const data = await paymentService.initPayment(orderId);
          setInitData(data);
        } catch (err: any) {
          const msg = err?.response?.data?.message || 'Failed to initialize payment gateway.';
          setError(msg);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    init();
  }, [orderId, paymentUrl]);

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PAYMENT_SUCCESS') {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data.payload || {};
        setIsVerifying(true);
        try {
          const verifyResult = await paymentService.verifyPayment({
            orderId,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
          });

          setDeliveryOtp(verifyResult.deliveryOtp);
          setShowSuccessModal(true);
        } catch (err: any) {
          const msg = err?.response?.data?.message || 'Payment verification failed.';
          Alert.alert('Verification Error', msg, [
            { text: 'View Orders', onPress: () => navigation.navigate('OrdersScreen') },
          ]);
        } finally {
          setIsVerifying(false);
        }
      } else if (data.type === 'PAYMENT_CANCELLED') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment transaction.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch {
      // Non-JSON message from external webview
    }
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const url = navState.url.toLowerCase();
    if (url.includes('success') || url.includes('payment_success')) {
      setShowSuccessModal(true);
    } else if (url.includes('cancel') || url.includes('failure') || url.includes('failed')) {
      Alert.alert('Payment Cancelled', 'Your transaction was cancelled.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Exit Payment',
      'Are you sure you want to cancel and leave the payment gateway? Your order will remain pending.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  const handleSuccessDone = () => {
    setShowSuccessModal(false);
    navigation.navigate('OrdersScreen');
  };

  // HTML content with Razorpay embedded checkout
  const razorpayHtml = initData
    ? `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f8fafc;
      color: #0f172a;
      text-align: center;
      padding: 24px;
      box-sizing: border-box;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { font-size: 18px; margin: 0 0 8px; }
    p { font-size: 14px; color: #64748b; margin: 0; }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <h2>Opening Secure Razorpay Portal...</h2>
  <p>Amount: ₹${(initData.amountPaise / 100).toFixed(2)}</p>

  <script>
    var options = {
      key: '${initData.keyId}',
      amount: ${initData.amountPaise},
      currency: '${initData.currency}',
      name: 'Campus Marketplace',
      description: 'Order #${(initData.orderId || '').slice(0, 8).toUpperCase()}',
      order_id: '${initData.razorpayOrderId}',
      handler: function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PAYMENT_SUCCESS',
          payload: response
        }));
      },
      modal: {
        ondismiss: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAYMENT_CANCELLED'
          }));
        }
      },
      theme: {
        color: '#2563eb'
      }
    };
    var rzp = new Razorpay(options);
    rzp.on('payment.failed', function(resp) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'PAYMENT_CANCELLED',
        payload: resp.error
      }));
    });
    setTimeout(function() {
      rzp.open();
    }, 400);
  </script>
</body>
</html>`
    : null;

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

      {/* Main Body */}
      {error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={54} color={Colors.danger} />
          <Text style={styles.errorTitle}>Payment Initialization Error</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.webViewWrapper}>
          {(initData || paymentUrl) && (
            <WebViewComponent
              ref={webViewRef}
              source={
                razorpayHtml
                  ? { html: razorpayHtml, baseUrl: 'https://checkout.razorpay.com' }
                  : { uri: paymentUrl }
              }
              onMessage={handleMessage}
              onNavigationStateChange={handleNavigationStateChange}
              style={styles.webView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
            />
          )}

          {(isLoading || isVerifying) && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loaderText}>
                {isVerifying ? 'Verifying payment with bank...' : 'Connecting to payment gateway...'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadow.lg]}>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={styles.modalTitle}>Payment Confirmed!</Text>
            <Text style={styles.modalBody}>
              Your payment has been held safely in campus escrow. Present the delivery OTP to the seller upon item collection.
            </Text>

            {deliveryOtp && (
              <View style={styles.otpBox}>
                <Text style={styles.otpBoxLabel}>Your Delivery OTP</Text>
                <Text style={styles.otpBoxValue}>{deliveryOtp}</Text>
              </View>
            )}

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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  errorSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  retryBtn: {
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryBtnText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: Typography.base,
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    marginBottom: Spacing.md,
  },
  otpBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.xl,
  },
  otpBoxLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: '#1d4ed8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  otpBoxValue: {
    fontSize: Typography['2xl'],
    fontWeight: '900',
    color: '#1e40af',
    letterSpacing: 4,
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
