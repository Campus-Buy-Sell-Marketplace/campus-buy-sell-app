import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import { productService } from '../../services/productService';
import { cartService } from '../../services/cartService';
import { userService } from '../../services/userService';
import { useCart } from '../../context/CartContext';
import { Product } from '../../types';

interface ProductDetailScreenProps {
  navigation: any;
  route: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { productId } = route.params || {};
  const { refreshCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [savingWishlist, setSavingWishlist] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!productId) {
      setError('Product ID is missing');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getProductById(productId);
      setProduct(data);
    } catch (err: any) {
      setError('Failed to load product details.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const checkWishlist = useCallback(async () => {
    if (!productId) return;
    try {
      const ids = await userService.getWishlist();
      setIsSaved(ids.includes(productId));
    } catch {
      // ignore
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
    checkWishlist();
  }, [fetchProduct, checkWishlist]);

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `Check out ${product.title} on UniTrade Campus Marketplace for ₹${product.price.toLocaleString('en-IN')}!`,
      });
    } catch (error) {
      // ignore
    }
  };

  const handleToggleWishlist = async () => {
    if (!product || savingWishlist) return;
    setSavingWishlist(true);
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    try {
      if (nextSaved) {
        await userService.addToWishlist(product.id);
      } else {
        await userService.removeFromWishlist(product.id);
      }
    } catch {
      setIsSaved(!nextSaved);
      Alert.alert('Error', 'Could not update wishlist.');
    } finally {
      setSavingWishlist(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || addingToCart) return;
    if (product.stock <= 0) {
      Alert.alert('Out of Stock', 'This item is currently sold out.');
      return;
    }
    setAddingToCart(true);
    try {
      await cartService.addToCart(product.id, quantity);
      await refreshCart();
      Alert.alert('Added to Cart', `Added ${quantity} item(s) to your cart.`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to add item to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (product.stock <= 0) {
      Alert.alert('Out of Stock', 'This item is currently sold out.');
      return;
    }
    try {
      await cartService.addToCart(product.id, quantity);
      await refreshCart();
      navigation.navigate('CartScreen');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not proceed with Buy Now.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{error || 'Product not found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleToggleWishlist}
            style={styles.headerBtn}
            disabled={savingWishlist}
          >
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={24}
              color={isSaved ? Colors.danger : Colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
            <Ionicons name="share-social-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Full-width image gallery (height 300) */}
        {images.length > 0 ? (
          <View style={styles.imageGalleryContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / SCREEN_WIDTH);
                setActiveImageIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {images.map((imgUri, index) => (
                <Image
                  key={`img-${index}`}
                  source={{ uri: imgUri }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            {/* Dots indicator */}
            {images.length > 1 && (
              <View style={styles.dotsContainer}>
                {images.map((_, index) => (
                  <View
                    key={`dot-${index}`}
                    style={[
                      styles.dot,
                      activeImageIndex === index ? styles.activeDot : styles.inactiveDot,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="image-outline" size={64} color={Colors.textMuted} />
          </View>
        )}

        {/* Details Container */}
        <View style={styles.bodyContainer}>
          {/* Price */}
          <Text style={styles.priceText}>
            ₹{product.price ? product.price.toLocaleString('en-IN') : '0'}
          </Text>

          {/* Title */}
          <Text style={styles.titleText}>{product.title}</Text>

          {/* Condition Badge */}
          <View style={styles.badgeRow}>
            <Badge label={product.condition} type="condition" />
            <Text style={styles.categoryBadge}>{product.category}</Text>
          </View>

          <View style={styles.divider} />

          {/* Seller Row */}
          <TouchableOpacity
            style={styles.sellerRow}
            onPress={() =>
              navigation.navigate('SellerProfile', { sellerId: product.seller_id })
            }
            activeOpacity={0.7}
          >
            <Avatar name={product.seller_name} uri={product.seller_avatar} size="md" />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{product.seller_name || 'Campus Seller'}</Text>
              <Text style={styles.viewProfileText}>View Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionHeading}>Description</Text>
          <Text style={styles.descriptionText}>
            {product.description || 'No description provided by the seller.'}
          </Text>

          <View style={styles.divider} />

          {/* Stock */}
          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Availability:</Text>
            {product.stock > 0 ? (
              <Text style={styles.stockIn}>In stock: {product.stock}</Text>
            ) : (
              <Text style={styles.stockOut}>Out of stock</Text>
            )}
          </View>

          <View style={styles.divider} />

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <View style={styles.quantityRow}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={[styles.stepperBtn, quantity <= 1 && styles.stepperDisabled]}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Ionicons name="remove" size={16} color={Colors.text} />
                </TouchableOpacity>

                <Text style={styles.quantityValue}>{quantity}</Text>

                <TouchableOpacity
                  style={[
                    styles.stepperBtn,
                    quantity >= product.stock && styles.stepperDisabled,
                  ]}
                  onPress={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                >
                  <Ionicons name="add" size={16} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Action Buttons Row: Save and Add to Cart */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.saveBtn, isSaved && styles.saveBtnActive]}
              onPress={handleToggleWishlist}
              disabled={savingWishlist}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={20}
                color={isSaved ? Colors.danger : Colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.saveBtnText, isSaved && styles.saveBtnTextActive]}>
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.addToCartBtn,
                (addingToCart || product.stock <= 0) && styles.btnDisabled,
              ]}
              onPress={handleAddToCart}
              disabled={addingToCart || product.stock <= 0}
              activeOpacity={0.8}
            >
              {addingToCart ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="cart-outline" size={20} color={Colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Buy Now Button (Full Width) */}
          <TouchableOpacity
            style={[styles.buyNowBtn, product.stock <= 0 && styles.btnDisabled]}
            onPress={handleBuyNow}
            disabled={product.stock <= 0}
            activeOpacity={0.85}
          >
            <Text style={styles.buyNowText}>Buy Now</Text>
          </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  headerBtn: {
    padding: Spacing.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  imageGalleryContainer: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: Colors.borderLight,
    position: 'relative',
  },
  productImage: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  placeholderContainer: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 18,
    backgroundColor: Colors.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  bodyContainer: {
    padding: Spacing.lg,
  },
  priceText: {
    fontSize: Typography['2xl'],
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  titleText: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 26,
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  sellerName: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
  },
  viewProfileText: {
    fontSize: Typography.xs,
    color: Colors.accent,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  descriptionText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockLabel: {
    fontSize: Typography.base,
    fontWeight: '500',
    color: Colors.text,
  },
  stockIn: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.success,
  },
  stockOut: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.danger,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityLabel: {
    fontSize: Typography.base,
    fontWeight: '500',
    color: Colors.text,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDisabled: {
    opacity: 0.3,
  },
  quantityValue: {
    minWidth: 32,
    textAlign: 'center',
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  saveBtnActive: {
    borderColor: Colors.danger,
    backgroundColor: '#fff1f2',
  },
  saveBtnText: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.primary,
  },
  saveBtnTextActive: {
    color: Colors.danger,
  },
  addToCartBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
  },
  addToCartText: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.white,
  },
  buyNowBtn: {
    backgroundColor: Colors.black,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  buyNowText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.white,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});

export default ProductDetailScreen;
