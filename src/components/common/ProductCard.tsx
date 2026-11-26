import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../types';
import { Colors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import Badge from './Badge';

export interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onWishlistToggle?: () => void;
  isWishlisted?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onWishlistToggle,
  isWishlisted = false,
  style,
}) => {
  const imageUrl = product.images?.[0] || (product as any).image_url;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.card, style]}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="image-outline" size={32} color={Colors.textMuted} />
          </View>
        )}
        {onWishlistToggle && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              onWishlistToggle();
            }}
            style={styles.wishlistBtn}
          >
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={16}
              color={isWishlisted ? Colors.danger : Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <Badge label={product.condition} type="condition" style={styles.badge} />

        <Text numberOfLines={2} style={styles.title}>
          {product.title}
        </Text>

        <Text style={styles.price}>
          ₹{product.price ? product.price.toLocaleString('en-IN') : '0'}
        </Text>

        {product.seller_name ? (
          <Text numberOfLines={1} style={styles.seller}>
            {product.seller_name}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    width: '100%',
    ...Shadow.md,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: Colors.borderLight,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.borderLight,
  },
  wishlistBtn: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  content: {
    padding: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  badge: {
    marginBottom: 6,
  },
  title: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    minHeight: 32,
    lineHeight: 16,
  },
  price: {
    fontSize: Typography.md,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 2,
  },
  seller: {
    fontSize: 10,
    color: Colors.textMuted,
  },
});

export default ProductCard;
