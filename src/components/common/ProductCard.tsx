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
  const imageUrl = product.images?.[0];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
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
              size={18}
              color={isWishlisted ? Colors.danger : Colors.text}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <Badge label={product.condition} type="condition" />
        </View>

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
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.sm,
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.full,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  content: {
    padding: Spacing.sm,
  },
  badgeRow: {
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.base,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
    minHeight: 36,
  },
  price: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  seller: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
});

export default ProductCard;
