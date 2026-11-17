import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { Badge } from '../../components/common/Badge';

type FilterType = 'All' | 'Active' | 'Inactive';

interface SellerProductsScreenProps {
  navigation: any;
}

export const SellerProductsScreen: React.FC<SellerProductsScreenProps> = ({ navigation }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await productService.getMyProducts();
      setProducts(data || []);
    } catch (err) {
      // Graceful fallback to empty list
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProducts();
    });
    fetchProducts();
    return unsubscribe;
  }, [navigation, fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(true);
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Delete Listing',
      `Are you sure you want to remove "${product.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(product.id);
              await productService.deleteProduct(product.id);
              setProducts((prev) => prev.filter((p) => p.id !== product.id));
              Alert.alert('Success', 'Listing deleted.');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete listing. Please try again.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const filteredProducts = products.filter((p) => {
    const isActive = p.is_active !== false;
    if (activeFilter === 'Active') return isActive;
    if (activeFilter === 'Inactive') return !isActive;
    return true;
  });

  const filterTabs: FilterType[] = ['All', 'Active', 'Inactive'];

  const renderProductItem = ({ item }: { item: Product }) => {
    const isActive = item.is_active !== false;
    const imageUrl =
      item.images && item.images.length > 0
        ? item.images[0]
        : (item as any).image_url;

    return (
      <View style={[styles.productCard, Shadow.sm]}>
        {/* Thumbnail Image */}
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={28} color={Colors.textMuted} />
            </View>
          )}
        </View>

        {/* Center Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={styles.productPrice}>
            ₹{Number(item.price).toFixed(2)}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.stockText}>
              {item.stock} in stock
            </Text>
            {item.condition && (
              <Badge label={item.condition} type="condition" />
            )}
          </View>
        </View>

        {/* Right Side: Status Indicator + Action Buttons */}
        <View style={styles.rightActions}>
          <View style={styles.statusIndicatorRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? Colors.success : Colors.secondary },
              ]}
            />
            <Text style={[styles.statusText, { color: isActive ? Colors.success : Colors.secondary }]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('AddEditProduct', { productId: item.id })
              }
            >
              <Ionicons name="pencil" size={17} color={Colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, styles.deleteBtn]}
              activeOpacity={0.7}
              onPress={() => handleDelete(item)}
              disabled={deletingId === item.id}
            >
              {deletingId === item.id ? (
                <ActivityIndicator size="small" color={Colors.danger} />
              ) : (
                <Ionicons name="trash-outline" size={17} color={Colors.danger} />
              )}
            </TouchableOpacity>
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
        <Text style={styles.headerTitle}>My Listings</Text>
        <Text style={styles.headerCount}>
          {products.length} {products.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsContainer}>
        {filterTabs.map((tab) => {
          const isSelected = activeFilter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterTab,
                isSelected && styles.filterTabSelected,
              ]}
              activeOpacity={0.8}
              onPress={() => setActiveFilter(tab)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isSelected && styles.filterTabTextSelected,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Product List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
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
                {activeFilter === 'All'
                  ? 'No listings yet. Tap + to add your first product!'
                  : `No ${activeFilter.toLowerCase()} listings at the moment.`}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB: Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, Shadow.lg]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddEditProduct')}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
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
    alignItems: 'baseline',
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
  headerCount: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextSelected: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: 90, // Leave room for FAB
  },
  loadingContainer: {
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
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  productTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  stockText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  rightActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 68,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: '#fef2f2',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
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
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SellerProductsScreen;
