import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { useNotifications } from '../../context/NotificationContext';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/common/ProductCard';
import EmptyState from '../../components/common/EmptyState';
import { productService } from '../../services/productService';
import { userService } from '../../services/userService';
import { Product } from '../../types';

interface HomeScreenProps {
  navigation: any;
}

const CATEGORIES = [
  { label: 'All', emoji: '✨' },
  { label: 'Electronics', emoji: '📱' },
  { label: 'Books', emoji: '📚' },
  { label: 'Clothing', emoji: '👕' },
  { label: 'Furniture', emoji: '🛋️' },
  { label: 'Sports', emoji: '⚽' },
  { label: 'Other', emoji: '🎁' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm) / 2;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { unreadCount } = useNotifications();
  const { itemCount } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState('');
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (searchSubmitted.trim()) {
        params.q = searchSubmitted.trim();
      }
      const res = await productService.getProducts(params);
      setProducts(res.products || []);
    } catch (err: any) {
      setError('Could not load products. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, searchSubmitted]);

  const loadWishlist = useCallback(async () => {
    try {
      const ids = await userService.getWishlist();
      setWishlistIds(ids || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useFocusEffect(
    useCallback(() => {
      loadWishlist();
    }, [loadWishlist])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(true);
    loadWishlist();
  };

  const handleSearchSubmit = () => {
    setSearchSubmitted(searchQuery);
  };

  const handleWishlistToggle = async (productId: string) => {
    const isSaved = wishlistIds.includes(productId);
    setWishlistIds((prev) =>
      isSaved ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    try {
      if (isSaved) {
        await userService.removeFromWishlist(productId);
      } else {
        await userService.addToWishlist(productId);
      }
    } catch {
      setWishlistIds((prev) =>
        isSaved ? [...prev, productId] : prev.filter((id) => id !== productId)
      );
    }
  };

  const renderSkeletons = () => (
    <View style={styles.gridContainer}>
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonBadge} />
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: '50%' }]} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header Row */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandText}>UniTrade.</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Cart')}
            style={[styles.iconBtn, { marginLeft: Spacing.sm }]}
            activeOpacity={0.7}
          >
            <Ionicons name="bag-outline" size={22} color={Colors.text} />
            {itemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {itemCount > 99 ? '99+' : itemCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Welcome Hero */}
      <View style={styles.welcomeHero}>
        <Text style={styles.welcomeTitle}>Find great{'\n'}campus deals 🛍️</Text>
        <Text style={styles.welcomeSub}>Buy & sell with fellow students</Text>
      </View>

      {/* Error Banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchCard}>
          <Ionicons
            name="search-outline"
            size={18}
            color={Colors.primary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products…"
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchSubmitted('');
              }}
              style={styles.clearSearchBtn}
            >
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Chips */}
      <View style={styles.categoryContainer}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.label}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setSelectedCategory(item.label)}
              style={[
                styles.categoryPill,
                selectedCategory === item.label
                  ? styles.categoryPillSelected
                  : styles.categoryPillUnselected,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item.label
                    ? styles.categoryTextSelected
                    : styles.categoryTextUnselected,
                ]}
              >
                {item.emoji} {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Campus Deals</Text>
      </View>

      {/* Products Grid */}
      {loading && !refreshing ? (
        renderSkeletons()
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.productList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🛍️"
              title="No products found"
              subtitle={
                searchSubmitted
                  ? `No matches for "${searchSubmitted}".`
                  : 'No active products in this category yet.'
              }
            />
          }
          renderItem={({ item }) => (
            <View style={{ width: COLUMN_WIDTH }}>
              <ProductCard
                product={item}
                isWishlisted={wishlistIds.includes(item.id)}
                onWishlistToggle={() => handleWishlistToggle(item.id)}
                onPress={() =>
                  navigation.navigate('ProductDetail', { productId: item.id })
                }
              />
            </View>
          )}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Profile')}
      >
        <Ionicons name="add" size={26} color={Colors.white} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  iconBtn: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Shadow.sm,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.full,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 8,
    fontWeight: '700',
  },
  welcomeHero: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 30,
  },
  welcomeSub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: Colors.danger,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 48,
    ...Shadow.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.text,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: Spacing.xs,
  },
  categoryContainer: {
    marginBottom: Spacing.sm,
  },
  categoryList: {
    paddingHorizontal: Spacing.lg,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  categoryPillSelected: {
    backgroundColor: Colors.primary,
  },
  categoryPillUnselected: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryText: {
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: Colors.white,
  },
  categoryTextUnselected: {
    color: Colors.textSecondary,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.text,
  },
  productList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  skeletonCard: {
    width: COLUMN_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: Colors.borderLight,
  },
  skeletonContent: {
    padding: Spacing.sm,
    gap: 8,
  },
  skeletonBadge: {
    width: 60,
    height: 16,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.sm,
  },
  skeletonLine: {
    width: '80%',
    height: 12,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

export default HomeScreen;
