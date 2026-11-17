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
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Order, OrderStatus } from '../../types';

type OrderFilter = 'All' | 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';

const FILTER_TABS: OrderFilter[] = [
  'All',
  'Pending',
  'Confirmed',
  'Shipped',
  'Delivered',
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

  // Status Action Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await sellerService.getSellerOrders();
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

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await sellerService.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setStatusModalVisible(false);
      setSelectedOrder(null);
      Alert.alert('Status Updated', `Order marked as ${newStatus}.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update order status.';
      Alert.alert('Error', msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'All') return true;
    const s = (order.status || '').toUpperCase();
    return s.includes(activeFilter.toUpperCase());
  });

  const getStatusButtonConfig = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PENDING') {
      return {
        label: 'Confirm Order',
        nextStatus: 'CONFIRMED',
        bg: '#eff6ff',
        text: '#2563eb',
        borderColor: '#bfdbfe',
      };
    }
    if (s === 'CONFIRMED') {
      return {
        label: 'Mark Shipped',
        nextStatus: 'SHIPPED',
        bg: '#f5f3ff',
        text: '#7c3aed',
        borderColor: '#ddd6fe',
      };
    }
    if (s === 'SHIPPED') {
      return {
        label: 'Mark Delivered',
        nextStatus: 'DELIVERED',
        bg: '#ecfdf5',
        text: '#059669',
        borderColor: '#a7f3d0',
      };
    }
    return null;
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
    const status = (item.status || 'PENDING').toUpperCase();
    const actionConfig = getStatusButtonConfig(status);

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
          <Badge label={status} type="status" />
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

        {/* Bottom: Action Buttons */}
        <View style={styles.actionRow}>
          {actionConfig ? (
            <TouchableOpacity
              style={[
                styles.statusUpdateButton,
                { backgroundColor: actionConfig.bg, borderColor: actionConfig.borderColor },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                setSelectedOrder(item);
                setStatusModalVisible(true);
              }}
            >
              <Text style={[styles.statusUpdateText, { color: actionConfig.text }]}>
                {actionConfig.label}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.statusCompletePill}>
              <Text style={styles.statusCompleteText}>
                {status === 'DELIVERED' ? '✓ Completed' : status}
              </Text>
            </View>
          )}

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

      {/* Status Update Options Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatusModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order Status</Text>
              <TouchableOpacity
                onPress={() => setStatusModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Update progress for order #{selectedOrder?.id?.slice(0, 8) || ''}:
            </Text>

            <View style={styles.statusOptions}>
              <TouchableOpacity
                style={[styles.statusOptionItem, { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }]}
                onPress={() =>
                  selectedOrder && handleUpdateStatus(selectedOrder.id, 'CONFIRMED')
                }
                disabled={updatingStatus}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#2563eb" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.statusOptionTitle, { color: '#2563eb' }]}>
                    Confirm Order
                  </Text>
                  <Text style={styles.statusOptionSub}>
                    Accept order and prepare for delivery
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOptionItem, { borderColor: '#ddd6fe', backgroundColor: '#f5f3ff' }]}
                onPress={() =>
                  selectedOrder && handleUpdateStatus(selectedOrder.id, 'SHIPPED')
                }
                disabled={updatingStatus}
              >
                <Ionicons name="bicycle-outline" size={20} color="#7c3aed" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.statusOptionTitle, { color: '#7c3aed' }]}>
                    Mark as Shipped / Out for Handoff
                  </Text>
                  <Text style={styles.statusOptionSub}>
                    Item is en route to campus meetup spot
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOptionItem, { borderColor: '#a7f3d0', backgroundColor: '#ecfdf5' }]}
                onPress={() =>
                  selectedOrder && handleUpdateStatus(selectedOrder.id, 'DELIVERED')
                }
                disabled={updatingStatus}
              >
                <Ionicons name="checkmark-done-circle-outline" size={20} color="#059669" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.statusOptionTitle, { color: '#059669' }]}>
                    Mark as Delivered
                  </Text>
                  <Text style={styles.statusOptionSub}>
                    Buyer has received the item
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOptionItem, { borderColor: '#fecaca', backgroundColor: '#fef2f2' }]}
                onPress={() =>
                  selectedOrder && handleUpdateStatus(selectedOrder.id, 'CANCELLED')
                }
                disabled={updatingStatus}
              >
                <Ionicons name="close-circle-outline" size={20} color="#dc2626" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.statusOptionTitle, { color: '#dc2626' }]}>
                    Cancel Order
                  </Text>
                  <Text style={styles.statusOptionSub}>
                    Cancel this order and notify buyer
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {updatingStatus && (
              <View style={styles.updatingLoader}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.updatingText}>Updating order...</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
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
