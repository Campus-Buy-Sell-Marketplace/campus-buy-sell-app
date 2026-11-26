import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import { Badge } from '../../components/common/Badge';

interface RecentActivityItem {
  id: string;
  type: string;
  description: string;
  time: string;
  status?: string;
}

interface AdminDashboardScreenProps {
  navigation: any;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingSellerApps: 0,
    pendingPayouts: 0,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await adminService.getDashboard();
      if (data) {
        setStats({
          totalUsers: data.totalUsers ?? data.total_users ?? 0,
          totalProducts: data.totalProducts ?? data.total_products ?? 0,
          totalOrders: data.totalOrders ?? data.total_orders ?? 0,
          totalRevenue: data.totalRevenue ?? data.total_revenue ?? data.platformCommissionEarned ?? 0,
          pendingSellerApps: data.pendingApplications ?? data.pending_seller_apps ?? 0,
          pendingPayouts: data.pendingPayoutsCount ?? data.pending_payouts ?? 0,
        });

        const activityRaw = data.recentActivity ?? data.recent_activity ?? data.recentOrders ?? [];
        if (Array.isArray(activityRaw)) {
          const parsed: RecentActivityItem[] = activityRaw.slice(0, 5).map((act: any, idx) => ({
            id: act.id || String(idx),
            type: act.type || 'ORDER',
            description: act.description || act.product?.title || `Order #${(act.id || '').slice(0, 6)} placed`,
            time: act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
            status: act.status || 'NEW',
          }));
          setRecentActivity(parsed);
        }
      }
    } catch (err) {
      // Graceful fallback with zeros
      setStats({
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingSellerApps: 0,
        pendingPayouts: 0,
      });
      setRecentActivity([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard(true);
  };

  const statGridItems = [
    {
      key: 'users',
      label: 'Total Users',
      value: stats.totalUsers,
      color: Colors.primary,
      iconEmoji: '??',
      route: 'UsersTab',
    },
    {
      key: 'products',
      label: 'Total Products',
      value: stats.totalProducts,
      color: '#7c3aed',
      iconEmoji: '??',
      route: 'ListingsTab',
    },
    {
      key: 'orders',
      label: 'Total Orders',
      value: stats.totalOrders,
      color: Colors.success,
      iconEmoji: '???',
      route: 'ListingsTab',
    },
    {
      key: 'revenue',
      label: 'Total Revenue',
      value: `?${Number(stats.totalRevenue).toLocaleString('en-IN')}`,
      color: Colors.warning,
      iconEmoji: '??',
      route: 'PayoutsTab',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Admin Panel</Text>
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#dc2626" />
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          </View>
          <Text style={styles.greetingText}>
            Hello, {user?.name || 'Administrator'}
          </Text>
        </View>
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
        {/* 2x2 Stats Grid */}
        <View style={styles.statsGrid}>
          {statGridItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.statGridCard, Shadow.sm]}
              activeOpacity={0.8}
              onPress={() => item.route && navigation.navigate(item.route)}
            >
              <View style={styles.statCardHeader}>
                <Text style={styles.statEmoji}>{item.iconEmoji}</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.textMuted} />
              </View>
              <Text style={[styles.statValue, { color: item.color }]}>
                {loading && !refreshing ? '—' : item.value}
              </Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending Actions Section */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Pending Actions</Text>

          {/* Seller Applications Row */}
          <View style={[styles.actionRowCard, Shadow.sm]}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconBox, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="briefcase" size={20} color="#d97706" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Seller Applications</Text>
                <Text style={styles.actionSubtitle}>
                  Students waiting for seller account approval
                </Text>
              </View>
            </View>

            <View style={styles.actionRight}>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{stats.pendingSellerApps}</Text>
              </View>
              <TouchableOpacity
                style={styles.reviewBtn}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('UsersTab')}
              >
                <Text style={styles.reviewBtnText}>Review ?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pending Payouts Row */}
          <View style={[styles.actionRowCard, Shadow.sm]}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconBox, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="cash" size={20} color="#059669" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>Pending Payouts</Text>
                <Text style={styles.actionSubtitle}>
                  Disbursements awaiting UPI transaction
                </Text>
              </View>
            </View>

            <View style={styles.actionRight}>
              <View style={[styles.countBadge, { backgroundColor: '#059669' }]}>
                <Text style={styles.countBadgeText}>{stats.pendingPayouts}</Text>
              </View>
              <TouchableOpacity
                style={[styles.reviewBtn, { backgroundColor: '#059669' }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('PayoutsTab')}
              >
                <Text style={styles.reviewBtnText}>Process ?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recent Activity List */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          {recentActivity.length === 0 ? (
            <View style={[styles.emptyActivityCard, Shadow.sm]}>
              <Ionicons name="pulse-outline" size={36} color={Colors.textMuted} />
              <Text style={styles.emptyActivityTitle}>No recent events</Text>
              <Text style={styles.emptyActivitySub}>
                Marketplace orders and actions will be logged in real-time.
              </Text>
            </View>
          ) : (
            <View style={[styles.activityCard, Shadow.sm]}>
              {recentActivity.map((item, idx) => (
                <View
                  key={item.id}
                  style={[
                    styles.activityItem,
                    idx < recentActivity.length - 1 && styles.activityItemBorder,
                  ]}
                >
                  <View style={styles.activityDot} />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityDesc} numberOfLines={1}>
                      {item.description}
                    </Text>
                    <Text style={styles.activityTime}>{item.time}</Text>
                  </View>
                  {item.status && <Badge label={item.status} type="status" />}
                </View>
              ))}
            </View>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography['2xl'],
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  statGridCard: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statEmoji: {
    fontSize: 22,
  },
  statValue: {
    fontSize: Typography.xl,
    fontWeight: '800',
    marginTop: 4,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionWrap: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  actionRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  actionTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
  },
  actionSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionRight: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: Spacing.sm,
  },
  countBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  countBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  reviewBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  reviewBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyActivityCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyActivityTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  emptyActivitySub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: Spacing.sm,
  },
  activityContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  activityDesc: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  activityTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

export default AdminDashboardScreen;
