import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import EmptyState from '../../components/common/EmptyState';
import { useCart } from '../../context/CartContext';
import { orderService } from '../../services/orderService';
import { cartService } from '../../services/cartService';
import { CartItem } from '../../types';

interface CartScreenProps {
  navigation: any;
}

export const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
  const { items, itemCount, total, isLoading, refreshCart, removeFromCart } = useCart();
  const [refreshing, setRefreshing] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await refreshCart();
    } catch {
      setError('Could not update cart contents.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuantityStep = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(item.id, item.product?.title || 'item');
      return;
    }
    if (item.product?.stock && newQty > item.product.stock) {
      Alert.alert('Maximum Stock Reached', `Only ${item.product.stock} units available.`);
      return;
    }

    setUpdatingItemId(item.id);
    try {
      await cartService.addToCart(item.product_id, delta);
      await refreshCart();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update quantity.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = (cartItemId: string, title: string) => {
    Alert.alert(
      'Remove Item',
      `Remove "${title}" from your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromCart(cartItemId);
            } catch {
              Alert.alert('Error', 'Failed to remove item.');
            }
          },
        },
      ]
    );
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setCheckingOut(true);
    setError(null);
    try {
      const cartItemIds = items.map((i) => i.id);
      await orderService.createOrder(cartItemIds);
      await refreshCart();
      Alert.alert(
        'Order Placed!',
        'Your order has been created. Coordinate delivery with your seller.',
        [
          {
            text: 'View Orders',
            onPress: () => navigation.navigate('OrdersScreen'),
          },
        ]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to complete checkout.';
      setError(msg);
      Alert.alert('Checkout Error', msg);
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart ({itemCount})</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isLoading && !refreshing && items.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          subtitle="Explore campus listings and discover great deals."
          actionLabel="Browse Products"
          onAction={() => navigation.navigate('BrowseTab')}
        />
      ) : (
        <View style={styles.mainContainer}>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
              />
            }
            renderItem={({ item }) => {
              const product = item.product;
              const imageUrl = product?.images?.[0];
              const price = product?.price || 0;
              const itemTotal = price * item.quantity;
              const isUpdating = updatingItemId === item.id;

              return (
                <View style={[styles.cartItemCard, Shadow.sm]}>
                  {/* Image (60x60) */}
                  <View style={styles.imageWrapper}>
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.itemImage} />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Ionicons name="image-outline" size={24} color={Colors.textMuted} />
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.infoWrapper}>
                    <Text numberOfLines={2} style={styles.productTitle}>
                      {product?.title || 'Campus Item'}
                    </Text>

                    <Text style={styles.priceText}>
                      ₹{itemTotal.toLocaleString('en-IN')}
                    </Text>

                    {/* Stepper */}
                    <View style={styles.stepperRow}>
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => handleQuantityStep(item, -1)}
                          disabled={isUpdating}
                        >
                          <Ionicons name="remove" size={14} color={Colors.text} />
                        </TouchableOpacity>

                        <Text style={styles.stepQuantity}>{item.quantity}</Text>

                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => handleQuantityStep(item, 1)}
                          disabled={isUpdating}
                        >
                          <Ionicons name="add" size={14} color={Colors.text} />
                        </TouchableOpacity>
                      </View>

                      {isUpdating && (
                        <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />
                      )}
                    </View>
                  </View>

                  {/* Trash Icon */}
                  <TouchableOpacity
                    style={styles.trashBtn}
                    onPress={() => handleRemoveItem(item.id, product?.title || 'item')}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              );
            }}
          />

          {/* Sticky Order Summary Card at bottom */}
          <View style={[styles.summaryCard, Shadow.lg]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{total.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={styles.deliveryNote}>Arranged with seller</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN')}</Text>
            </View>

            {/* Checkout Button */}
            <TouchableOpacity
              style={[styles.checkoutBtn, checkingOut && styles.btnDisabled]}
              onPress={handleCheckout}
              disabled={checkingOut}
              activeOpacity={0.85}
            >
              {checkingOut ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.checkoutBtnText}>Checkout</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 220,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
  },
  imageWrapper: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.borderLight,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoWrapper: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  productTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  priceText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
  },
  stepBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepQuantity: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  trashBtn: {
    padding: Spacing.xs,
  },
  summaryCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
  },
  deliveryNote: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  totalValue: {
    fontSize: Typography.xl,
    fontWeight: '900',
    color: Colors.primary,
  },
  checkoutBtn: {
    backgroundColor: Colors.black,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  checkoutBtnText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.white,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export default CartScreen;
