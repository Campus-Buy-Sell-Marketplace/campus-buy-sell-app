import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import EmptyState from '../../components/common/EmptyState';
import { useCart } from '../../context/CartContext';
import { orderService, CheckoutResult } from '../../services/orderService';
import { CartItem } from '../../types';

interface CartScreenProps {
  navigation: any;
}

export const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const { items, itemCount, total, isLoading, refreshCart, updateQuantity, removeFromCart } = useCart();
  const [refreshing, setRefreshing] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Meetup & Payment state matching web
  const [paymentMethod, setPaymentMethod] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');
  const [meetupLocation, setMeetupLocation] = useState('Campus Central Library Gate');
  const [meetupTime, setMeetupTime] = useState('Tomorrow (4:00 PM - 5:30 PM)');
  const [meetupNotes, setMeetupNotes] = useState('');

  // Post-checkout success modal
  const [confirmedOrder, setConfirmedOrder] = useState<CheckoutResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await refreshCart();
    } catch {
      setError('Could not update cart contents.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuantityStep = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    const title = item.title || item.product?.title || 'item';
    if (newQty <= 0) {
      handleRemoveItem(item.id, title);
      return;
    }
    const maxStock = item.stock || item.product?.stock || 99;
    if (newQty > maxStock) {
      Alert.alert('Maximum Stock Reached', `Only ${maxStock} units available.`);
      return;
    }

    setUpdatingItemId(item.id);
    try {
      await updateQuantity(item.id, newQty);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update quantity.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = (cartItemId: string, title: string) => {
    Alert.alert(
      'Remove Item',
      `Remove "${title}" from your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromCart(cartItemId);
            } catch {
              Alert.alert('Error', 'Failed to remove item.');
            }
          },
        },
      ]
    );
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setCheckingOut(true);
    setError(null);
    try {
      const res = await orderService.checkout({
        paymentMethod,
        meetupLocation,
        meetupTime,
        meetupNotes,
      });

      await refreshCart();
      if (paymentMethod === 'ONLINE') {
        const orderId = res.order?.id || (res.order as any)?.orderId || (res as any).orderId;
        navigation.navigate('PaymentWebView', { orderId });
      } else {
        setConfirmedOrder(res.order);
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to complete checkout.';
      setError(msg);
      Alert.alert('Checkout Notice', msg);
    } finally {
      setCheckingOut(false);
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
        <Text style={styles.headerTitle}>My Cart ({itemCount})</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isLoading && !refreshing && items.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          subtitle="Explore campus listings and discover great student deals."
          actionLabel="Browse Products"
          onAction={() => navigation.navigate('BrowseTab')}
        />
      ) : (
        <View style={styles.mainContainer}>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id || item.product_id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
              />
            }
            ListFooterComponent={
              <View style={styles.footerOptions}>
                {/* Meetup Details Card */}
                <View style={[styles.sectionCard, Shadow.sm]}>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="location" size={18} color="#2563eb" />
                    <Text style={styles.sectionTitle}>Campus Meetup Location</Text>
                  </View>
                  <TextInput
                    style={styles.inputField}
                    value={meetupLocation}
                    onChangeText={setMeetupLocation}
                    placeholder="e.g. Campus Central Library Gate"
                    placeholderTextColor={Colors.textMuted}
                  />

                  <View style={[styles.sectionHeaderRow, { marginTop: 14 }]}>
                    <Ionicons name="time" size={18} color="#2563eb" />
                    <Text style={styles.sectionTitle}>Preferred Meetup Time</Text>
                  </View>
                  <TextInput
                    style={styles.inputField}
                    value={meetupTime}
                    onChangeText={setMeetupTime}
                    placeholder="e.g. Tomorrow (4:00 PM - 5:30 PM)"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                {/* Payment Method Card */}
                <View style={[styles.sectionCard, Shadow.sm]}>
                  <Text style={styles.sectionTitle}>Payment Method</Text>

                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      paymentMethod === 'OFFLINE' && styles.paymentOptionActive,
                    ]}
                    onPress={() => setPaymentMethod('OFFLINE')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={paymentMethod === 'OFFLINE' ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={paymentMethod === 'OFFLINE' ? Colors.primary : Colors.textMuted}
                    />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.paymentOptionTitle}>Campus Handover / Cash</Text>
                      <Text style={styles.paymentOptionDesc}>Pay seller directly in cash or UPI upon handover</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paymentOption,
                      paymentMethod === 'ONLINE' && styles.paymentOptionActive,
                      { marginTop: 10 },
                    ]}
                    onPress={() => setPaymentMethod('ONLINE')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={paymentMethod === 'ONLINE' ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={paymentMethod === 'ONLINE' ? Colors.primary : Colors.textMuted}
                    />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.paymentOptionTitle}>Online Payment (Razorpay)</Text>
                      <Text style={styles.paymentOptionDesc}>Secure instant payment via Cards, UPI, Netbanking</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            }
            renderItem={({ item }) => {
              const imageUrl = item.image_url || item.product?.images?.[0];
              const title = item.title || item.product?.title || 'Campus Item';
              const price = item.price || item.product?.price || 0;
              const itemTotal = price * item.quantity;
              const isUpdating = updatingItemId === item.id;
              const sellerName = item.seller_name || item.product?.seller_name;

              return (
                <View style={[styles.cartItemCard, Shadow.sm]}>
                  {/* Image */}
                  <View style={styles.imageWrapper}>
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Ionicons name="cube-outline" size={26} color={Colors.textMuted} />
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.infoWrapper}>
                    <Text numberOfLines={2} style={styles.productTitle}>
                      {title}
                    </Text>

                    {sellerName ? (
                      <Text style={styles.sellerSubtitle}>Seller: {sellerName}</Text>
                    ) : null}

                    <Text style={styles.priceText}>
                      ₹{itemTotal.toLocaleString('en-IN')}
                      {item.quantity > 1 ? (
                        <Text style={styles.unitPriceText}> (₹{price} ea)</Text>
                      ) : null}
                    </Text>

                    {/* Stepper */}
                    <View style={styles.stepperRow}>
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => handleQuantityStep(item, -1)}
                          disabled={isUpdating}
                        >
                          <Ionicons name="remove" size={14} color={Colors.text} />
                        </TouchableOpacity>

                        <Text style={styles.stepQuantity}>{item.quantity}</Text>

                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => handleQuantityStep(item, 1)}
                          disabled={isUpdating || item.quantity >= (item.stock || 99)}
                        >
                          <Ionicons name="add" size={14} color={Colors.text} />
                        </TouchableOpacity>
                      </View>

                      {isUpdating && (
                        <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />
                      )}
                    </View>
                  </View>

                  {/* Trash Icon */}
                  <TouchableOpacity
                    style={styles.trashBtn}
                    onPress={() => handleRemoveItem(item.id, title)}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              );
            }}
          />

          {/* Sticky Order Summary Card at bottom */}
          <View style={[styles.summaryCard, Shadow.lg]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{total.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Campus Delivery</Text>
              <Text style={styles.deliveryNote}>Free (Arranged with seller)</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN')}</Text>
            </View>

            {/* Checkout Button */}
            <TouchableOpacity
              style={[styles.checkoutBtn, checkingOut && styles.btnDisabled]}
              onPress={handleCheckout}
              disabled={checkingOut}
              activeOpacity={0.85}
            >
              {checkingOut ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.checkoutBtnText}>
                  Place Order • ₹{total.toLocaleString('en-IN')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Order Confirmed & OTP Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalSuccessIcon}>
              <Ionicons name="checkmark-circle" size={56} color="#10b981" />
            </View>

            <Text style={styles.modalTitle}>Order Confirmed!</Text>
            <Text style={styles.modalSubtitle}>
              Your order has been placed. Meet the seller on campus to inspect and collect your items.
            </Text>

            {/* OTP Box */}
            {confirmedOrder?.deliveryOtp ? (
              <View style={styles.otpBox}>
                <Text style={styles.otpLabel}>YOUR 6-DIGIT DELIVERY OTP</Text>
                <Text style={styles.otpValue}>{confirmedOrder.deliveryOtp}</Text>
                <Text style={styles.otpHint}>
                  Share this OTP with the seller ONLY after inspecting and receiving your items.
                </Text>
              </View>
            ) : null}

            {confirmedOrder?.meetupLocation ? (
              <View style={styles.modalMeetupInfo}>
                <Ionicons name="location-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.modalMeetupText}>
                  {confirmedOrder.meetupLocation}
                </Text>
              </View>
            ) : null}

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate('OrdersScreen');
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>View My Orders</Text>
            </TouchableOpacity>

            {confirmedOrder?.orderId ? (
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.navigate('ChatRoom', {
                    orderId: confirmedOrder.orderId,
                    sellerName: 'Seller',
                    productName: 'Campus Order',
                  });
                }}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.modalSecondaryBtnText}>Chat with Seller</Text>
              </TouchableOpacity>
            ) : null}
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
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContainer: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 20,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
  },
  imageWrapper: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.borderLight,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  infoWrapper: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  productTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20,
  },
  sellerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  priceText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
    marginBottom: 6,
  },
  unitPriceText: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textMuted,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepQuantity: {
    paddingHorizontal: 10,
    fontWeight: '600',
    color: Colors.text,
  },
  trashBtn: {
    padding: Spacing.sm,
  },
  footerOptions: {
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  inputField: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  paymentOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: '#f8fafc',
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentOptionDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  deliveryNote: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  checkoutBtn: {
    backgroundColor: '#111827',
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  checkoutBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalSuccessIcon: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  otpBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: BorderRadius.lg,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  otpLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    letterSpacing: 1,
  },
  otpValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 8,
    color: '#166534',
    marginVertical: 8,
  },
  otpHint: {
    fontSize: 11,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 15,
  },
  modalMeetupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  modalMeetupText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  modalPrimaryBtn: {
    backgroundColor: '#111827',
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  modalSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 10,
    width: '100%',
  },
  modalSecondaryBtnText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default CartScreen;
