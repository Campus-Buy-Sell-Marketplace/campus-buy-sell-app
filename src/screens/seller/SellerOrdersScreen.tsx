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
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { orderService } from '../../services/orderService';

type OrderFilter = 'All' | 'Pending' | 'Completed' | 'Cancelled';
const FILTER_TABS: OrderFilter[] = ['All', 'Pending', 'Completed', 'Cancelled'];

interface SellerOrdersScreenProps {
  navigation: any;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING_MEETUP:       { label: 'Pending Meetup',   bg: '#fef3c7', text: '#b45309' },
  PAID_PENDING_MEETUP:  { label: 'Paid – Meetup',    bg: '#dbeafe', text: '#1d4ed8' },
  PENDING_PAYMENT:      { label: 'Awaiting Payment', bg: '#fff7ed', text: '#c2410c' },
  COMPLETED:            { label: 'Completed',         bg: '#dcfce7', text: '#15803d' },
  CANCELLED:            { label: 'Cancelled',         bg: '#fee2e2', text: '#b91c1c' },
};

export const SellerOrdersScreen: React.FC<SellerOrdersScreenProps> = ({ navigation }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('All');
  // OTP verification state per order
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await orderService.getSellerIncomingOrders();
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
    setVerifyingId(orderId);
    try {
      await orderService.verifyDeliveryOtp(orderId, otp);
      Alert.alert('✅ Verified!', 'Order marked as completed. Handover confirmed!');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'COMPLETED', otp_verified: true } : o))
      );
      setOtpInputs((prev) => ({ ...prev, [orderId]: '' }));
    } catch (err: any) {
      Alert.alert('Verification Failed', err?.response?.data?.message || 'OTP is incorrect. Please try again.');
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'All') return true;
    const s = (order.status || '').toUpperCase();
    if (activeFilter === 'Pending') return s.includes('PENDING');
    if (activeFilter === 'Completed') return s === 'COMPLETED';
    if (activeFilter === 'Cancelled') return s === 'CANCELLED';
    return true;
  });

  const renderOrderItem = ({ item }: { item: any }) => {
    const firstItem = item.items?.[0] || {};
    const productName = firstItem.title || item.product?.title || 'Product';
    const productImg = firstItem.image_url || item.product?.images?.[0];
    const buyerName = item.buyer?.name || item.buyer_name || 'Campus Student';
    const totalPrice = Number(item.total_amount || item.total_price || 0);
    const quantity = firstItem.quantity || item.quantity || 1;
    const dateFormatted = item.created_at
      ? new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Recent';
    const status = item.status || 'PENDING_MEETUP';
    const statusCfg = STATUS_CONFIG[status] || { label: status, bg: Colors.borderLight, text: Colors.textSecondary };
    const needsOtp = (status === 'PENDING_MEETUP' || status === 'PAID_PENDING_MEETUP') && !item.otp_verified;
    const isVerifying = verifyingId === item.id;

    return (
      <View style={[styles.orderCard, Shadow.sm]}>
        {/* Product & Status */}
        <View style={styles.cardHeader}>
          <View style={styles.productThumb}>
            {productImg ? (
              <Image source={{ uri: productImg }} style={styles.image} resizeMode="cover" />
            ) : (
              <Ionicons name="cube-outline" size={24} color={Colors.textMuted} />
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.productTitle} numberOfLines={2}>{productName}</Text>
            <Text style={styles.orderMeta}>Qty: {quantity} · {dateFormatted}</Text>
            <Text style={styles.orderMeta}>Buyer: {buyerName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* Price + payment method */}
        <View style={styles.priceRow}>
          <Text style={styles.totalAmount}>₹{totalPrice.toLocaleString('en-IN')}</Text>
          <Text style={styles.payMethod}>{item.payment_method === 'ONLINE' ? '💳 Online' : '💵 Cash/UPI'}</Text>
        </View>

        {item.meetup_location ? (
          <Text style={styles.meetupText}>📍 {item.meetup_location}</Text>
        ) : null}

        {/* OTP Verification */}
        {needsOtp ? (
          <View style={styles.otpSection}>
            <Text style={styles.otpSectionTitle}>Verify Delivery OTP</Text>
            <Text style={styles.otpSectionHint}>Ask the buyer for their 6-digit OTP after handover.</Text>
            <View style={styles.otpInputRow}>
              <TextInput
                style={styles.otpInput}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                value={otpInputs[item.id] || ''}
                onChangeText={(txt) => setOtpInputs((prev) => ({ ...prev, [item.id]: txt }))}
              />
              <TouchableOpacity
                style={[styles.verifyBtn, isVerifying && { opacity: 0.6 }]}
                onPress={() => handleVerifyOtp(item.id)}
                disabled={isVerifying}
                activeOpacity={0.85}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.verifyBtnText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Chat Button */}
        <TouchableOpacity
          style={styles.chatButton}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('ChatRoom', {
              orderId: item.id,
              sellerName: buyerName,
              productName,
            })
          }
        >
          <Ionicons name="chatbubble-ellipses" size={16} color={Colors.white} />
          <Text style={styles.chatButtonText}>Chat with Buyer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Incoming Orders</Text>
        <Text style={styles.headerSubtitle}>{orders.length} total orders received</Text>
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
                <Text style={[styles.tabChipText, isSelected && styles.tabChipTextActive]}>
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
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySub}>Orders placed for your items will appear here.</Text>
            </View>
          }
        />
      )}
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase' as const,
  },
  priceRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: Spacing.xs,
  },
  payMethod: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  meetupText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  otpSection: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: BorderRadius.md,
    padding: 12,
    marginVertical: 8,
  },
  otpSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 2,
  },
  otpSectionHint: {
    fontSize: 11,
    color: '#166534',
    marginBottom: 8,
  },
  otpInputRow: {
    flexDirection: 'row' as const,
    gap: 8,
    alignItems: 'center' as const,
  },
  otpInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    letterSpacing: 4,
    color: Colors.text,
    backgroundColor: Colors.white,
    textAlign: 'center' as const,
  },
  verifyBtn: {
    backgroundColor: '#16a34a',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  verifyBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
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
  statusUpdateButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statusUpdateText: {
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
