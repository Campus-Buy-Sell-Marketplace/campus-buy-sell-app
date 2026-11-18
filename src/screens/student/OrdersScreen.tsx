import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import EmptyState from '../../components/common/EmptyState';
import { orderService } from '../../services/orderService';

interface OrdersScreenProps {
  navigation: any;
}

type TabType = 'All' | 'Active' | 'Completed' | 'Cancelled';
const TABS: TabType[] = ['All', 'Active', 'Completed', 'Cancelled'];

// Match real backend statuses
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING_MEETUP:       { label: 'Pending Meetup',  bg: '#fef3c7', text: '#b45309' },
  PAID_PENDING_MEETUP:  { label: 'Paid – Meetup',   bg: '#dbeafe', text: '#1d4ed8' },
  PENDING_PAYMENT:      { label: 'Awaiting Payment', bg: '#fff7ed', text: '#c2410c' },
  COMPLETED:            { label: 'Completed',         bg: '#dcfce7', text: '#15803d' },
  CANCELLED:            { label: 'Cancelled',         bg: '#fee2e2', text: '#b91c1c' },
  // legacy fallbacks
  PENDING:    { label: 'Pending',   bg: '#fef3c7', text: '#b45309' },
  CONFIRMED:  { label: 'Confirmed', bg: '#dbeafe', text: '#1d4ed8' },
  SHIPPED:    { label: 'Shipped',   bg: '#f3e8ff', text: '#7e22ce' },
  DELIVERED:  { label: 'Delivered', bg: '#dcfce7', text: '#15803d' },
};

export const OrdersScreen: React.FC<OrdersScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await orderService.getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError('Could not fetch your orders. Please pull down to retry.');
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

  const handleCancelOrder = (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(orderId);
            try {
              await orderService.cancelOrder(orderId);
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === orderId ? { ...o, status: 'CANCELLED' } : o
                )
              );
              Alert.alert('Order Cancelled', 'Your order was successfully cancelled.');
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to cancel order.');
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const isActive = (status: string) =>
    ['PENDING_MEETUP', 'PAID_PENDING_MEETUP', 'PENDING_PAYMENT', 'PENDING', 'CONFIRMED', 'SHIPPED'].includes(status);
  const isCompleted = (status: string) => ['COMPLETED', 'DELIVERED'].includes(status);

  const filteredOrders = orders.filter((order) => {
    const s = order.status || '';
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return isActive(s);
    if (activeTab === 'Completed') return isCompleted(s);
    if (activeTab === 'Cancelled') return s === 'CANCELLED';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Orders List */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="📦"
              title={`No ${activeTab.toLowerCase()} orders`}
              subtitle={
                activeTab === 'All'
                  ? 'You have not placed any orders yet.'
                  : `There are no orders in the ${activeTab.toLowerCase()} state right now.`
              }
              actionLabel={activeTab === 'All' ? 'Browse Campus Deals' : undefined}
              onAction={() => navigation.navigate('BrowseTab')}
            />
          }
          renderItem={({ item }) => {
            // Backend returns items[] array; grab first item info
            const firstItem = item.items?.[0] || {};
            const imageUrl = firstItem.image_url || item.product?.images?.[0];
            const productTitle = firstItem.title || item.product?.title || 'Campus Item';
            const sellerName = firstItem.seller_name || item.seller?.name || 'Seller';
            const totalAmount = Number(item.total_amount || item.total_price || 0);
            const statusStyle = STATUS_CONFIG[item.status] || {
              label: item.status || 'Unknown',
              bg: Colors.borderLight,
              text: Colors.textSecondary,
            };
            const orderIsActive = isActive(item.status);
            const canCancel = ['PENDING_MEETUP', 'PENDING'].includes(item.status);
            const needsPayment = item.status === 'PENDING_PAYMENT';
            const hasOtp = item.delivery_otp && !item.otp_verified && (item.status === 'PENDING_MEETUP' || item.status === 'PAID_PENDING_MEETUP');
            const isCancelling = cancellingId === item.id;
            const formattedDate = item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
              : 'Recent';

            return (
              <View style={[styles.orderCard, Shadow.sm]}>
                {/* Header Row: Date & Status */}
                <View style={styles.orderTopRow}>
                  <Text style={styles.orderDate}>Order #{item.id?.slice(0, 8) || '—'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                      {statusStyle.label}
                    </Text>
                  </View>
                </View>

                {/* Main Product Row */}
                <View style={styles.productRow}>
                  <View style={styles.imageWrapper}>
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.productImage} />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Ionicons name="image-outline" size={24} color={Colors.textMuted} />
                      </View>
                    )}
                  </View>

                  <View style={styles.productInfo}>
                    <Text numberOfLines={2} style={styles.productTitle}>
                      {productTitle}
                    </Text>
                    <Text style={styles.qtyText}>{formattedDate} · Seller: {sellerName}</Text>
                    <Text style={styles.totalPrice}>
                      ₹{totalAmount.toLocaleString('en-IN')} · {item.payment_method === 'ONLINE' ? 'Online' : 'Cash/UPI'}
                    </Text>
                    {item.meetup_location ? (
                      <Text style={styles.meetupText}>📍 {item.meetup_location}</Text>
                    ) : null}
                  </View>
                </View>

                {/* OTP Box for buyer */}
                {hasOtp ? (
                  <View style={styles.otpBox}>
                    <Text style={styles.otpLabel}>YOUR DELIVERY OTP</Text>
                    <Text style={styles.otpValue}>{item.delivery_otp}</Text>
                    <Text style={styles.otpHint}>Share this with the seller ONLY after receiving your item.</Text>
                  </View>
                ) : null}

                {/* Pay Now for PENDING_PAYMENT */}
                {needsPayment ? (
                  <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() =>
                      navigation.navigate('PaymentWebView', { orderId: item.id, amount: totalAmount })
                    }
                    activeOpacity={0.85}
                  >
                    <Ionicons name="card-outline" size={16} color={Colors.white} style={{ marginRight: 6 }} />
                    <Text style={styles.payBtnText}>Pay Now · ₹{totalAmount.toLocaleString('en-IN')}</Text>
                  </TouchableOpacity>
                ) : null}

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                  {orderIsActive && (
                    <TouchableOpacity
                      style={styles.chatBtn}
                      onPress={() =>
                        navigation.navigate('ChatRoom', {
                          orderId: item.id,
                          sellerName,
                          productName: productTitle,
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.chatBtnText}>Chat with Seller</Text>
                    </TouchableOpacity>
                  )}

                  {canCancel && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancelOrder(item.id)}
                      disabled={isCancelling}
                      activeOpacity={0.8}
                    >
                      {isCancelling ? (
                        <ActivityIndicator size="small" color={Colors.danger} />
                      ) : (
                        <Text style={styles.cancelBtnText}>Cancel Order</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  orderDate: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  imageWrapper: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.borderLight,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  productTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 2,
  },
  qtyText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.primary,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.borderLight,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  chatBtnText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.danger,
  },
  meetupText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  otpBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: BorderRadius.md,
    padding: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  otpLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
    letterSpacing: 1,
  },
  otpValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 6,
    color: '#166534',
    marginVertical: 4,
  },
  otpHint: {
    fontSize: 10,
    color: '#166534',
    textAlign: 'center',
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ea580c',
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    marginVertical: 8,
  },
  payBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default OrdersScreen;
