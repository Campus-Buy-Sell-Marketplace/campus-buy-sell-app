import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Shadow, BorderRadius } from '../../constants/theme';
import { adminService } from '../../services/adminService';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';

interface PayoutItem {
  id: string;
  seller_id: string;
  seller_name?: string;
  seller_email?: string;
  seller_avatar?: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED';
  created_at: string;
  notes?: string;
}

export const AdminPayoutsScreen: React.FC<any> = () => {
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'PAID'>('PENDING');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPayouts = useCallback(async () => {
    try {
      const data: any = await adminService.getPayouts();
      if (Array.isArray(data)) {
        setPayouts(data);
      } else if (data?.payouts && Array.isArray(data.payouts)) {
        setPayouts(data.payouts);
      } else {
        setPayouts([]);
      }
    } catch {
      setPayouts([]);
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
    fetchPayouts();
  };

  const handleProcessPayout = (payout: PayoutItem) => {
    Alert.alert(
      'Process Payout',
      `Approve and process payout of ₹${payout.amount.toLocaleString('en-IN')} to ${payout.seller_name || 'Seller'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Process',
          style: 'default',
          onPress: async () => {
            setProcessingId(payout.id);
            try {
              await adminService.processPayout(payout.id);
              Alert.alert('Success', 'Payout marked as processed.');
              fetchPayouts();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to process payout.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const filteredPayouts = payouts.filter((p) => {
    if (activeTab === 'ALL') return true;
    return p.status === activeTab;
  });

  const totalPendingAmount = payouts
    .filter((p) => p.status === 'PENDING')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalPaidAmount = payouts
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const renderHeader = () => (
    <View style={styles.headerArea}>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending Payouts</Text>
          <Text style={[styles.summaryValue, { color: Colors.warning }]}>
            ₹{totalPendingAmount.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.summarySub}>
            {payouts.filter((p) => p.status === 'PENDING').length} requests
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Paid Out</Text>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>
            ₹{totalPaidAmount.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.summarySub}>
            {payouts.filter((p) => p.status === 'PAID').length} processed
          </Text>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {(['PENDING', 'PROCESSING', 'PAID', 'ALL'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderPayoutItem = ({ item }: { item: PayoutItem }) => {
    const isPending = item.status === 'PENDING';
    const isProcessingCurrent = processingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.sellerInfo}>
            <Avatar uri={item.seller_avatar} name={item.seller_name || 'Seller'} size="md" />
            <View style={styles.nameWrap}>
              <Text style={styles.sellerName}>{item.seller_name || 'Seller'}</Text>
              <Text style={styles.sellerEmail}>{item.seller_email || 'Verified Seller'}</Text>
            </View>
          </View>
          <Badge label={item.status} type="status" />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.amountWrap}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>₹{Number(item.amount).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.dateWrap}>
            <Text style={styles.dateLabel}>Requested</Text>
            <Text style={styles.dateValue}>
              {new Date(item.created_at || Date.now()).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {isPending && (
          <TouchableOpacity
            style={[styles.processBtn, isProcessingCurrent && { opacity: 0.7 }]}
            onPress={() => handleProcessPayout(item)}
            disabled={isProcessingCurrent}
          >
            {isProcessingCurrent ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.processBtnText}>Approve & Process Payout</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Payouts Management</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading payouts...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPayouts}
          keyExtractor={(item) => item.id}
          renderItem={renderPayoutItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="💰"
              title="No Payouts Found"
              subtitle={`There are no ${activeTab.toLowerCase()} payout requests.`}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 30,
  },
  headerArea: {
    padding: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  summarySub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: BorderRadius.md,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabButtonActive: {
    backgroundColor: Colors.surface,
    ...Shadow.sm,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.text,
    fontWeight: '700',
  },
  card: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nameWrap: {
    gap: 2,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  sellerEmail: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: 12,
  },
  amountWrap: {
    gap: 2,
  },
  amountLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  dateWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
  dateLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  processBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default AdminPayoutsScreen;
