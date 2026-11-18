import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { sellerService } from '../../services/sellerService';
import { orderService } from '../../services/orderService';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Order, OrderStatus } from '../../types';

type OrderFilter = 'All' | 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

const FILTER_TABS: OrderFilter[] = [
  'All',
  'Pending',
  'Confirmed',
  'Completed',
  'Cancelled',
];

interface SellerOrdersScreenProps {
  navigation: any;
}

export const SellerOrdersScreen: React.FC<SellerOrdersScreenProps> = ({ navigation }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('All');

  // OTP Verification state
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [verifyingOtp, setVerifyingOtp] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await orderService.getSellerOrders();
      setOrders(data || []);
    } catch (err) {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };

  const handleVerifyOtp = async (orderId: string) => {
    const otp = (otpInputs[orderId] || '').trim();
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP from the buyer.');
      return;
    }
    setVerifyingOtp(orderId);
    try {
      await orderService.verifyDeliveryOtp(orderId, otp);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'COMPLETED' } : o))
      );
      setOtpInputs((prev) => ({ ...prev, [orderId]: '' }));
      Alert.alert('✅ Delivery Confirmed!', 'The order has been marked as completed.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'OTP verification failed. Please check and try again.';
      Alert.alert('Verification Failed', msg);
    } finally {
      setVerifyingOtp(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'All') return true;
    const s = (order.status || '').toUpperCase();
    if (activeFilter === 'Pending') return s === 'PENDING_MEETUP' || s === 'PENDING_PAYMENT';
    if (activeFilter === 'Confirmed') return s === 'CONFIRMED' || s === 'PAID_PENDING_MEETUP';
    if (activeFilter === 'Completed') return s === 'COMPLETED';
    if (activeFilter === 'Cancelled') return s === 'CANCELLED';
    return true;
  });

  const getStatusLabel = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PENDING_MEETUP') return { label: 'Meetup Pending', bg: '#fef3c7', text: '#b45309' };
    if (s === 'PAID_PENDING_MEETUP') return { label: 'Paid – Meetup', bg: '#dbeafe', text: '#1d4ed8' };
    if (s === 'PENDING_PAYMENT') return { label: 'Payment Pending', bg: '#fce7f3', text: '#be185d' };
    if (s === 'CONFIRMED') return { label: 'Confirmed', bg: '#eff6ff', text: '#2563eb' };
    if (s === 'COMPLETED') return { label: 'Completed', bg: '#dcfce7', text: '#15803d' };
    if (s === 'CANCELLED') return { label: 'Cancelled', bg: '#fee2e2', text: '#b91c1c' };
    return { label: status, bg: Colors.borderLight, text: Colors.textSecondary };
  };

  const canVerifyOtp = (status: string) => {
    const s = (status || '').toUpperCase();
    return s === 'PENDING_MEETUP' || s === 'PAID_PENDING_MEETUP';
  };

  const renderOrderItem = ({ item }: { item: any }) => {
    const productName =
      item.product?.title ||
      item.product_title ||
      (item.items && item.items[0]?.title) ||
      'Product';
    const productImg =
      item.product?.images?.[0] ||
      item.product?.image_url ||
      item.image_url ||
      (item.items && item.items[0]?.image_url);
    const buyerName =
      item.buyer?.name || item.buyer_name || 'Campus Student';
    const buyerAvatar = item.buyer?.avatar_url;
    const totalPrice = Number(
      item.total_price || item.total_amount || item.price || 0
    );
    const quantity =
      item.quantity ||
      (item.items && item.items[0]?.quantity) ||
      1;
    const dateFormatted = item.created_at
      ? new Date(item.created_at).toLocaleDateString()
      : 'Recent';
    const status = (item.status || 'PENDING_MEETUP').toUpperCase();
    const statusConfig = getStatusLabel(status);
    const needsOtp = canVerifyOtp(status);
    const isVerifyingThisOrder = verifyingOtp === item.id;

    return (
      <View style={[styles.orderCard, Shadow.sm]}>
        {/* Top: Product Info & Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.productThumb}>
            {productImg ? (
              <Image source={{ uri: productImg }} style={styles.image} resizeMode="cover" />
            ) : (
              <Ionicons name="cube-outline" size={24} color={Colors.textMuted} />
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {productName}
            </Text>
            <Text style={styles.orderMeta}>
              Qty: {quantity} • {dateFormatted}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusPillText, { color: statusConfig.text }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Middle: Buyer Details & Total Price */}
        <View style={styles.buyerRow}>
          <View style={styles.buyerLeft}>
            <Avatar uri={buyerAvatar} name={buyerName} size="sm" />
            <View style={styles.buyerNames}>
              <Text style={styles.buyerLabel}>Buyer</Text>
              <Text style={styles.buyerName} numberOfLines={1}>
                {buyerName}
              </Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₹{totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* OTP Verification for PENDING_MEETUP orders */}
        {needsOtp && (
          <View style={styles.otpSection}>
            <Text style={styles.otpLabel}>Enter buyer's delivery OTP to confirm:</Text>
            <View style={styles.otpRow}>
              <TextInput
                style={styles.otpInput}
                value={otpInputs[item.id] || ''}
                onChangeText={(text) =>
                  setOtpInputs((prev) => ({ ...prev, [item.id]: text.replace(/[^0-9]/g, '').slice(0, 6) }))
                }
                placeholder="6-digit OTP"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity
                style={[styles.verifyBtn, isVerifyingThisOrder && { opacity: 0.6 }]}
                onPress={() => handleVerifyOtp(item.id)}
                disabled={isVerifyingThisOrder}
                activeOpacity={0.8}
              >
                {isVerifyingThisOrder ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.verifyBtnText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom: Chat Button */}
        <View style={styles.actionRow}>
          <View style={styles.statusCompletePill}>
            <Text style={styles.statusCompleteText}>
              {status === 'COMPLETED' ? '✓ Completed' : status === 'CANCELLED' ? '✗ Cancelled' : `Order #${item.id?.slice(0, 8)}`}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.chatButton}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('ChatRoom', {
                orderId: item.id,
                buyerName: buyerName,
                productName: productName,
              })
            }
          >
            <Ionicons name="chatbubble-ellipses" size={16} color={Colors.white} />
            <Text style={styles.chatButtonText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <Text style={styles.headerSubtitle}>
          {orders.length} total orders received
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_TABS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.tabsList}
          renderItem={({ item }) => {
            const isSelected = activeFilter === item;
            return (
              <TouchableOpacity
                style={[styles.tabChip, isSelected && styles.tabChipActive]}
                activeOpacity={0.7}
                onPress={() => setActiveFilter(item)}
              >
                <Text
                  style={[styles.tabChipText, isSelected && styles.tabChipTextActive]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No orders in this status</Text>
              <Text style={styles.emptySub}>
                Orders placed for your items will appear here.
              </Text>
            </View>
          }
        />
      )}

      {/* Status Update Options Modal - removed, now using inline OTP */}
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
  filterTabsWrap: {
    paddingVertical: Spacing.sm,
  },
  tabsList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  tabChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabChipText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabChipTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing['3xl'],
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing['3xl'],
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  productThumb: {
    width: 54,
    height: 54,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
    marginRight: Spacing.xs,
  },
  productTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
  },
  orderMeta: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  buyerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  buyerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  buyerNames: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  buyerLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  buyerName: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  totalAmount: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  otpSection: {
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  otpLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  otpRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  otpInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    fontSize: Typography.sm,
    letterSpacing: 2,
    fontWeight: '700',
    textAlign: 'center',
  },
  verifyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  verifyBtnText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  statusCompletePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCompleteText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 9,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  chatButtonText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginVertical: Spacing.sm,
  },
  statusOptions: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  statusOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  statusOptionTitle: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  statusOptionSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  updatingLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  updatingText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
});

export default SellerOrdersScreen;
