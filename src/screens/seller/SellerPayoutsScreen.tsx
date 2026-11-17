import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { sellerService } from '../../services/sellerService';
import { Badge } from '../../components/common/Badge';

type PayoutFilter = 'All' | 'Pending' | 'Paid';

interface PayoutRecord {
  id: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'REJECTED';
  date: string;
  note?: string;
  reference?: string;
  upiId?: string;
}

interface SellerPayoutsScreenProps {
  navigation: any;
}

export const SellerPayoutsScreen: React.FC<SellerPayoutsScreenProps> = ({ navigation }) => {
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<PayoutFilter>('All');
  const [summary, setSummary] = useState({
    totalEarned: 0,
    paidOut: 0,
    pending: 0,
  });

  const fetchPayouts = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await sellerService.getPayouts();
      if (Array.isArray(data)) {
        const normalized: PayoutRecord[] = data.map((item: any) => ({
          id: item.id || String(Math.random()),
          amount: Number(item.net_payout_amount ?? item.amount ?? 0),
          status: (item.status || 'PENDING').toUpperCase(),
          date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent',
          note: item.note || item.description || (item.order_id ? `Order payout for #${item.order_id.slice(0, 8)}` : 'Sales payout'),
          reference: item.transaction_reference || item.reference || undefined,
          upiId: item.seller_upi_id || item.upi_id || undefined,
        }));
        setPayouts(normalized);

        // Calculate summary
        let total = 0;
        let paid = 0;
        let pend = 0;
        normalized.forEach((p) => {
          total += p.amount;
          if (p.status === 'PAID') paid += p.amount;
          else if (p.status === 'PENDING' || p.status === 'PROCESSING') pend += p.amount;
        });
        setSummary({ totalEarned: total, paidOut: paid, pending: pend });
      }
    } catch (err) {
      // Graceful fallback to zeros
      setPayouts([]);
      setSummary({ totalEarned: 0, paidOut: 0, pending: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayouts(true);
  };

  const filteredPayouts = payouts.filter((p) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Pending') return p.status === 'PENDING' || p.status === 'PROCESSING';
    if (activeFilter === 'Paid') return p.status === 'PAID';
    return true;
  });

  const filterTabs: PayoutFilter[] = ['All', 'Pending', 'Paid'];

  const renderPayoutItem = ({ item }: { item: PayoutRecord }) => {
    const isPaid = item.status === 'PAID';

    return (
      <View style={[styles.payoutCard, Shadow.sm]}>
        <View style={styles.payoutRow}>
          <View style={styles.payoutLeft}>
            <Text style={styles.payoutAmount}>
              ₹{item.amount.toFixed(2)}
            </Text>
            <Text style={styles.payoutNote}>{item.note}</Text>
            {item.reference && (
              <Text style={styles.payoutRef}>UTR: {item.reference}</Text>
            )}
          </View>

          <View style={styles.payoutRight}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isPaid ? '#ecfdf5' : '#fffbeb',
                  borderColor: isPaid ? '#a7f3d0' : '#fde68a',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: isPaid ? '#059669' : '#d97706' },
                ]}
              >
                {isPaid ? '✓ Paid' : '⏳ Pending'}
              </Text>
            </View>
            <Text style={styles.payoutDate}>{item.date}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payouts</Text>
        <Text style={styles.headerSubtitle}>Track earnings & bank transfers</Text>
      </View>

      {/* Summary Card */}
      <View style={[styles.summaryCard, Shadow.sm]}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Total Earned</Text>
          <Text style={[styles.summaryValue, { color: Colors.text }]}>
            ₹{summary.totalEarned.toFixed(0)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Paid Out</Text>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>
            ₹{summary.paidOut.toFixed(0)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryValue, { color: Colors.warning }]}>
            ₹{summary.pending.toFixed(0)}
          </Text>
        </View>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={18} color="#2563eb" style={{ marginRight: 8 }} />
        <Text style={styles.infoText}>
          Payouts are processed by campus admin within 3-5 business days after order delivery.
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {filterTabs.map((tab) => {
          const isSelected = activeFilter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isSelected && styles.tabSelected]}
              activeOpacity={0.8}
              onPress={() => setActiveFilter(tab)}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading payout records...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPayouts}
          keyExtractor={(item) => item.id}
          renderItem={renderPayoutItem}
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
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyTitle}>No payout records</Text>
              <Text style={styles.emptySub}>
                {activeFilter === 'All'
                  ? 'Completed orders and disbursements will be logged here.'
                  : `No ${activeFilter.toLowerCase()} payouts.`}
              </Text>
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
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  summaryLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: Typography.lg,
    fontWeight: '800',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.sm + 2,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.xs,
    color: '#1e40af',
    lineHeight: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextSelected: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
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
  payoutCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  payoutAmount: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.success,
  },
  payoutNote: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  payoutRef: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    marginTop: 2,
  },
  payoutRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  payoutDate: {
    fontSize: 10,
    color: Colors.textMuted,
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
});

export default SellerPayoutsScreen;
