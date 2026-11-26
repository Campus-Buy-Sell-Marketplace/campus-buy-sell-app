import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { sellerService } from '../../services/sellerService';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';

interface StatItem {
  key: string;
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

interface RecentOrder {
  id: string;
  productName: string;
  buyerName: string;
  price: number;
  status: string;
  date: string;
}

interface SellerDashboardScreenProps {
  navigation: any;
}

export const SellerDashboardScreen: React.FC<SellerDashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeListings: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await sellerService.getDashboard();
      if (data) {
        setStats({
          totalRevenue: data.totalRevenue ?? data.total_revenue ?? data.revenue ?? 0,
          totalOrders: data.totalOrders ?? data.total_orders ?? data.orders_count ?? 0,
          activeListings: data.activeListings ?? data.active_listings ?? data.listings_count ?? 0,
          pendingOrders: data.pendingOrders ?? data.pending_orders ?? 0,
        });

        // Normalize recent orders if returned
        const ordersRaw = data.recentOrders ?? data.recent_orders ?? data.orders ?? [];
        if (Array.isArray(ordersRaw)) {
          const parsed: RecentOrder[] = ordersRaw.slice(0, 5).map((o: any) => ({
            id: o.id || String(Math.random()),
            productName: o.product?.title || o.productName || o.product_title || o.title || 'Product',
            buyerName: o.buyer?.name || o.buyerName || o.buyer_name || 'Buyer',
            price: Number(o.total_price || o.total_amount || o.price || 0),
            status: (o.status || 'PENDING').toUpperCase(),
            date: o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Recent',
          }));
          setRecentOrders(parsed);
        }
      }
    } catch (err) {
      // Graceful fallback mock stats for demo
      setStats({
        totalRevenue: 0,
        totalOrders: 0,
        activeListings: 0,
        pendingOrders: 0,
      });
      setRecentOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData(true);
  };

  const statCards: StatItem[] = [
    {
      key: 'revenue',
      label: 'Total Revenue',
      value: `?${Number(stats.totalRevenue).toLocaleString('en-IN')}`,
      icon: 'cash',
      color: Colors.success,
      bgColor: '#ecfdf5',
    },
    {
      key: 'orders',
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: 'receipt',
      color: Colors.primary,
      bgColor: '#eff6ff',
    },
    {
      key: 'listings',
      label: 'Active Listings',
      value: stats.activeListings,
      icon: 'pricetags',
      color: '#7c3aed',
      bgColor: '#f5f3ff',
    },
    {
      key: 'pending',
      label: 'Pending Orders',
      value: stats.pendingOrders,
      icon: 'time',
      color: Colors.warning,
      bgColor: '#fffbeb',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.storeTitle}>My Store</Text>
          <Text style={styles.subGreeting}>
            Welcome back, {user?.name || 'Seller'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notificationBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={22} color={Colors.text} />
          {stats.pendingOrders > 0 && <View style={styles.notifBadgeDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions Row */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProductsTab', { screen: 'AddEditProduct' })}
          >
            <Ionicons name="add" size={18} color={Colors.white} style={styles.btnIcon} />
            <Text style={styles.primaryActionText}>Add Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineActionButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('OrdersTab')}
          >
            <Ionicons name="list" size={18} color={Colors.text} style={styles.btnIcon} />
            <Text style={styles.outlineActionText}>View Orders</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row Horizontal Scroll */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Overview</Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.skeletonContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading store stats...</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsScroll}
          >
            {statCards.map((card) => (
              <View key={card.key} style={[styles.statCard, Shadow.sm]}>
                <View style={[styles.statIconBox, { backgroundColor: card.bgColor }]}>
                  <Ionicons name={card.icon} size={20} color={card.color} />
                </View>
                <Text style={[styles.statNumber, { color: card.color }]}>
                  {card.value}
                </Text>
                <Text style={styles.statLabel}>{card.label}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Recent Orders Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('OrdersTab')}
          >
            <Text style={styles.seeAllText}>View all ?</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length === 0 ? (
          <View style={[styles.emptyOrdersCard, Shadow.sm]}>
            <Ionicons name="receipt-outline" size={38} color={Colors.textMuted} />
            <Text style={styles.emptyOrdersTitle}>No recent orders</Text>
            <Text style={styles.emptyOrdersSub}>
              New customer orders will appear here once placed.
            </Text>
          </View>
        ) : (
          <View style={[styles.recentOrdersList, Shadow.sm]}>
            {recentOrders.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.orderRow,
                  idx < recentOrders.length - 1 && styles.orderRowBorder,
                ]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('OrdersTab')}
              >
                <Avatar name={item.buyerName} size="sm" />
                <View style={styles.orderInfo}>
                  <Text style={styles.orderProductName} numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <Text style={styles.orderBuyerName}>
                    Buyer: {item.buyerName} • {item.date}
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderPrice}>?{item.price.toFixed(2)}</Text>
                  <Badge label={item.status} type="status" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Store Tip Card */}
        <View style={[styles.tipCard, Shadow.sm]}>
          <Ionicons name="bulb-outline" size={24} color="#d97706" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Seller Tip</Text>
            <Text style={styles.tipText}>
              Keep your listings up to date with clear campus photos and condition details to sell faster!
            </Text>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  storeTitle: {
    fontSize: Typography['2xl'],
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  outlineActionButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  btnIcon: {
    marginRight: 6,
  },
  primaryActionText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: Typography.base,
  },
  outlineActionText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: Typography.base,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  seeAllText: {
    fontSize: Typography.sm,
    color: Colors.secondary,
    fontWeight: '600',
  },
  skeletonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  statsScroll: {
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: 140,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statNumber: {
    fontSize: Typography.xl,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyOrdersCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyOrdersTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  emptyOrdersSub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  recentOrdersList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  orderRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  orderInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  orderProductName: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
  },
  orderBuyerName: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderPrice: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  tipTitle: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: '#92400e',
  },
  tipText: {
    fontSize: Typography.xs,
    color: '#b45309',
    marginTop: 2,
    lineHeight: 16,
  },
});

export default SellerDashboardScreen;
