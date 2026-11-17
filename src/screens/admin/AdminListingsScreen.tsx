import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { adminService } from '../../services/adminService';
import { Badge } from '../../components/common/Badge';
import { Product } from '../../types';

type ListingFilter = 'All' | 'Active' | 'Pending' | 'Flagged' | 'Removed';

const FILTER_TABS: ListingFilter[] = ['All', 'Active', 'Pending', 'Flagged', 'Removed'];

interface AdminListingsScreenProps {
  navigation: any;
}

export const AdminListingsScreen: React.FC<AdminListingsScreenProps> = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ListingFilter>('All');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchListings = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await adminService.getListings();
      setProducts(data || []);
    } catch (err) {
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings(true);
  };

  const handleApprove = async (product: any) => {
    setActionLoadingId(product.id);
    try {
      await adminService.approveProduct(product.id);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_active: true, status: 'ACTIVE' } : p
        )
      );
      Alert.alert('Approved', `"${product.title}" has been approved.`);
    } catch (err) {
      Alert.alert('Error', 'Failed to approve listing.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemove = (product: any) => {
    Alert.alert(
      'Remove Listing',
      `Are you sure you want to remove "${product.title}"? It will no longer be visible on the campus feed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(product.id);
            try {
              await adminService.removeProduct(product.id);
              setProducts((prev) => prev.filter((p) => p.id !== product.id));
              Alert.alert('Removed', 'Listing removed from marketplace.');
            } catch (err) {
              Alert.alert('Error', 'Failed to remove listing.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const filteredProducts = products.filter((p) => {
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchSeller = (p.seller_name || p.seller?.name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchSeller) return false;
    }

    // Tab filter
    const status = (p.status || (p.is_active !== false ? 'ACTIVE' : 'INACTIVE')).toUpperCase();
    if (activeFilter === 'Active') return status === 'ACTIVE' || p.is_active === true;
    if (activeFilter === 'Pending') return status === 'PENDING';
    if (activeFilter === 'Flagged') return status === 'FLAGGED' || Boolean(p.is_flagged);
    if (activeFilter === 'Removed') return status === 'REMOVED' || p.is_active === false;
    return true;
  });

  const renderProductItem = ({ item }: { item: any }) => {
    const imageUrl =
      item.images?.[0] || item.image_url || null;
    const sellerName =
      item.seller_name || item.seller?.name || 'Campus Seller';
    const price = Number(item.price || 0);
    const isPending =
      (item.status || '').toUpperCase() === 'PENDING' ||
      item.is_approved === false;
    const status = (item.status || (item.is_active !== false ? 'ACTIVE' : 'REMOVED')).toUpperCase();

    return (
      <View style={[styles.productCard, Shadow.sm]}>
        {/* Top Info Row */}
        <View style={styles.cardTopRow}>
          <View style={styles.imageBox}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.productImg} resizeMode="cover" />
            ) : (
              <Ionicons name="cube-outline" size={26} color={Colors.textMuted} />
            )}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.sellerName} numberOfLines={1}>
              Seller: {sellerName}
            </Text>
            <Text style={styles.priceText}>₹{price.toFixed(2)}</Text>
          </View>

          <View style={styles.badgeCol}>
            <Badge label={status} type="status" />
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          {isPending && (
            <TouchableOpacity
              style={[styles.outlineBtn, styles.approveBtn]}
              activeOpacity={0.7}
              onPress={() => handleApprove(item)}
              disabled={actionLoadingId === item.id}
            >
              {actionLoadingId === item.id ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <Text style={styles.approveBtnText}>✓ Approve</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.outlineBtn, styles.removeBtn]}
            activeOpacity={0.7}
            onPress={() => handleRemove(item)}
            disabled={actionLoadingId === item.id}
          >
            {actionLoadingId === item.id ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <Text style={styles.removeBtnText}>✕ Remove</Text>
            )}
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
        <Text style={styles.headerTitle}>Listings</Text>
        <Text style={styles.headerSubtitle}>
          Moderate buy & sell campus listings
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search listings or seller name..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_TABS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSelected = activeFilter === item;
            return (
              <TouchableOpacity
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                activeOpacity={0.7}
                onPress={() => setActiveFilter(item)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Products FlatList */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading listings...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
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
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No listings found</Text>
              <Text style={styles.emptySub}>
                {search
                  ? `No listings matching "${search}"`
                  : `No listings currently in "${activeFilter}".`}
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.base,
    color: Colors.text,
  },
  filterWrap: {
    paddingVertical: Spacing.sm,
  },
  filterList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
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
  productCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageBox: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImg: {
    width: '100%',
    height: '100%',
  },
  infoBox: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.xs,
  },
  productTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
  },
  sellerName: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priceText: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 3,
  },
  badgeCol: {
    alignItems: 'flex-end',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  outlineBtn: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    borderColor: '#a7f3d0',
    backgroundColor: '#ecfdf5',
  },
  approveBtnText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#059669',
  },
  removeBtn: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  removeBtnText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#dc2626',
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
    marginTop: 4,
  },
});

export default AdminListingsScreen;
