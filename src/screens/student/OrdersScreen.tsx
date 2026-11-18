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
import { Order, OrderStatus } from '../../types';

interface OrdersScreenProps {
  navigation: any;
}

type TabType = 'All' | 'Active' | 'Completed' | 'Cancelled';
const TABS: TabType[] = ['All', 'Active', 'Completed', 'Cancelled'];

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string }
> = {
  PENDING_MEETUP: { label: 'Meetup Pending', bg: '#fef3c7', text: '#b45309' },     // Amber
  PAID_PENDING_MEETUP: { label: 'Paid – Meetup', bg: '#dbeafe', text: '#1d4ed8' }, // Blue
  PENDING_PAYMENT: { label: 'Payment Pending', bg: '#fce7f3', text: '#be185d' },   // Pink
  CONFIRMED: { label: 'Confirmed', bg: '#eff6ff', text: '#2563eb' },               // Blue
  COMPLETED: { label: 'Completed', bg: '#dcfce7', text: '#15803d' },               // Green
  CANCELLED: { label: 'Cancelled', bg: '#fee2e2', text: '#b91c1c' },              // Red
};

export const OrdersScreen: React.FC<OrdersScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revealedOtps, setRevealedOtps] = useState<Set<string>>(new Set());
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

  const toggleOtpReveal = (orderId: string) => {
    setRevealedOtps((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') {
      return ['PENDING_MEETUP', 'PAID_PENDING_MEETUP', 'PENDING_PAYMENT', 'CONFIRMED'].includes(order.status);
    }
    if (activeTab === 'Completed') {
      return order.status === 'COMPLETED';
    }
    if (activeTab === 'Cancelled') {
      return order.status === 'CANCELLED';
    }
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
            const product = item.product;
            const imageUrl = product?.images?.[0];
            const statusStyle = STATUS_CONFIG[item.status] || {
              label: item.status,
              bg: Colors.borderLight,
              text: Colors.textSecondary,
            };
            const isActive = ['PENDING_MEETUP', 'PAID_PENDING_MEETUP', 'PENDING_PAYMENT', 'CONFIRMED'].includes(item.status);
            const hasOtp = item.delivery_otp && ['PENDING_MEETUP', 'PAID_PENDING_MEETUP'].includes(item.status);
            const isOtpRevealed = revealedOtps.has(item.id);
            const formattedDate = new Date(item.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <View style={[styles.orderCard, Shadow.sm]}>
                {/* Header Row: Date & Status */}
                <View style={styles.orderTopRow}>
                  <Text style={styles.orderDate}>{formattedDate}</Text>
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
                      {product?.title || 'Campus Item'}
                    </Text>
                    <Text style={styles.qtyText}>Qty: {item.quantity}</Text>
                    <Text style={styles.totalPrice}>
                      Total: ₹{item.total_price.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                  {isActive && (
                    <TouchableOpacity
                      style={styles.chatBtn}
                      onPress={() =>
                        navigation.navigate('ChatRoom', {
                          orderId: item.id,
                          sellerName: item.seller?.name || 'Seller',
                          productName: product?.title || 'Item',
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.chatBtnText}>Chat with Seller</Text>
                    </TouchableOpacity>
                  )}

                  {item.status === 'PENDING_PAYMENT' && (
                    <TouchableOpacity
                      style={styles.payNowBtn}
                      onPress={() =>
                        navigation.navigate('PaymentWebView', {
                          orderId: item.id,
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons name="card-outline" size={16} color={Colors.white} style={{ marginRight: 6 }} />
                      <Text style={styles.payNowBtnText}>Pay Now</Text>
                    </TouchableOpacity>
                  )}

                  {hasOtp && (
                    <TouchableOpacity
                      style={styles.otpBtn}
                      onPress={() => toggleOtpReveal(item.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isOtpRevealed ? 'eye-off-outline' : 'eye-outline'}
                        size={16}
                        color={Colors.white}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.otpBtnText}>
                        {isOtpRevealed ? item.delivery_otp : 'Show OTP'}
                      </Text>
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
  otpBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#7c3aed',
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBtnText: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 1,
  },
  payNowBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#059669',
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payNowBtnText: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default OrdersScreen;
