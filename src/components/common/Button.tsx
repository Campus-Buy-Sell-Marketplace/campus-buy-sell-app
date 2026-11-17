import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const isInteractive = !disabled && !loading;

  const variantStyle = (styles as Record<string, any>)[variant] || styles.primary;
  const sizeStyle = (styles as Record<string, any>)[`size_${size}`] || styles.size_md;
  const textVariantStyle = (styles as Record<string, any>)[`text_${variant}`] || styles.text_primary;
  const textSizeStyle = (styles as Record<string, any>)[`textSize_${size}`] || styles.textSize_md;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      style={[
        styles.base,
        variantStyle,
        sizeStyle,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'outline' || variant === 'ghost'
              ? Colors.primary
              : Colors.white
          }
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              styles.textBase,
              textVariantStyle,
              textSizeStyle,
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: Spacing.xs,
  },
  // Variants
  primary: {
    backgroundColor: Colors.black,
  },
  secondary: {
    backgroundColor: Colors.borderLight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.black,
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // Sizes
  size_sm: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    minHeight: 32,
  },
  size_md: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    minHeight: 46,
  },
  size_lg: {
    paddingVertical: 15,
    paddingHorizontal: Spacing.xl,
    minHeight: 52,
  },
  // Disabled
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: Colors.textMuted,
  },
  // Text
  textBase: {
    fontWeight: '600',
    textAlign: 'center',
  },
  text_primary: {
    color: Colors.white,
  },
  text_secondary: {
    color: Colors.text,
  },
  text_outline: {
    color: Colors.black,
  },
  text_danger: {
    color: Colors.white,
  },
  text_ghost: {
    color: Colors.primary,
  },
  textSize_sm: {
    fontSize: Typography.sm,
  },
  textSize_md: {
    fontSize: Typography.base,
  },
  textSize_lg: {
    fontSize: Typography.lg,
  },
});

export default Button;
