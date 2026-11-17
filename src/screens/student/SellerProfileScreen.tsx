import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import ProductCard from '../../components/common/ProductCard';
import EmptyState from '../../components/common/EmptyState';
import apiClient from '../../services/apiClient';
import { productService } from '../../services/productService';
import { userService } from '../../services/userService';
import { Product, User } from '../../types';

interface SellerProfileScreenProps {
  navigation: any;
  route: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm) / 2;

export const SellerProfileScreen: React.FC<SellerProfileScreenProps> = ({
  navigation,
  route,
}) => {
  const { sellerId } = route.params || {};

  const [seller, setSeller] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSellerData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      // 1. Fetch public products by this seller
      const res = await productService.getProducts({} as any);
      const allProducts = res.products || [];
      const sellerProducts = allProducts.filter(
        (p: any) => p.seller_id === sellerId || (seller && p.seller_name === seller.name)
      );
      setProducts(sellerProducts);

      // 2. Fetch public user profile if endpoint exists
      try {
        const userRes = await apiClient.get(`/user/${sellerId}`);
        const userData = userRes.data.data ?? userRes.data.user ?? userRes.data;
        if (userData) {
          setSeller(userData);
        }
      } catch {
        // Fallback: derive seller info from first product if direct endpoint doesn't exist
        if (sellerProducts.length > 0) {
          const firstP = sellerProducts[0];
          setSeller({
            id: sellerId,
            name: firstP.seller_name || 'Campus Seller',
            email: 'campus.verified@lavsa.edu',
            role: 'SELLER',
            avatar_url: firstP.seller_avatar,
            created_at: firstP.created_at || new Date().toISOString(),
          } as User);
        }
      }

      // 3. Wishlist state
      const wishRes = await userService.getWishlist().catch(() => []);
      setWishlistIds(wishRes || []);
    } catch (err: any) {
      setError('Could not load seller profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sellerId, seller]);

  useEffect(() => {
    fetchSellerData();
  }, [fetchSellerData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSellerData(true);
  };

  const handleWishlistToggle = async (productId: string) => {
    const isSaved = wishlistIds.includes(productId);
    setWishlistIds((prev) =>
      isSaved ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    try {
      if (isSaved) await userService.removeFromWishlist(productId);
      else await userService.addToWishlist(productId);
    } catch {
      // revert
      setWishlistIds((prev) =>
        isSaved ? [...prev, productId] : prev.filter((id) => id !== productId)
      );
    }
  };

  const joinedDate = seller?.created_at
    ? new Date(seller.created_at).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={[styles.profileHeaderCard, Shadow.sm]}>
              <Avatar
                name={seller?.name || 'Seller'}
                uri={seller?.avatar_url}
                size="xl"
              />
              <Text style={styles.sellerName}>{seller?.name || 'Campus Merchant'}</Text>

              {seller?.college ? (
                <Text style={styles.sellerCollege}>🎓 {seller.college}</Text>
              ) : null}

              <View style={styles.badgeRow}>
                <Badge label={seller?.role || 'SELLER'} type="role" />
                <Text style={styles.joinedText}>Joined {joinedDate}</Text>
              </View>

              <View style={styles.statPillsRow}>
                <View style={styles.statPill}>
                  <Text style={styles.statPillNumber}>{products.length}</Text>
                  <Text style={styles.statPillLabel}>Active Listings</Text>
                </View>
              </View>

              <Text style={styles.listingsSectionTitle}>Active Campus Listings</Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="📦"
              title="No active listings"
              subtitle="This seller has not posted any active products currently."
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
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  profileHeaderCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginVertical: Spacing.lg,
  },
  sellerName: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
  sellerCollege: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  joinedText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  statPillsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statPill: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statPillNumber: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.primary,
  },
  statPillLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  listingsSectionTitle: {
    alignSelf: 'flex-start',
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.md,
  },
});

export default SellerProfileScreen;
