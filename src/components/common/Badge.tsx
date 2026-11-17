import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography, BorderRadius } from '../../constants/theme';
import { ProductCondition, OrderStatus, UserRole } from '../../types';

export interface BadgeProps {
  label: string;
  type?: 'condition' | 'status' | 'role' | 'custom';
  color?: string;
  bgColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  type = 'custom',
  color,
  bgColor,
  style,
  textStyle,
}) => {
  let badgeTextColor = color || Colors.primary;
  let badgeBgColor = bgColor || Colors.borderLight;

  if (type === 'condition') {
    const condKey = label.toUpperCase().replace(/\s+/g, '_') as keyof typeof Colors.condition;
    if (Colors.condition[condKey]) {
      badgeTextColor = Colors.condition[condKey].text;
      badgeBgColor = Colors.condition[condKey].bg;
    }
  } else if (type === 'status') {
    const statusMap: Record<string, { text: string; bg: string }> = {
      PENDING: { text: '#d97706', bg: '#fffbeb' },
      CONFIRMED: { text: '#2563eb', bg: '#eff6ff' },
      SHIPPED: { text: '#7c3aed', bg: '#f5f3ff' },
      DELIVERED: { text: '#059669', bg: '#ecfdf5' },
      CANCELLED: { text: '#dc2626', bg: '#fef2f2' },
    };
    const s = statusMap[label.toUpperCase()];
    if (s) {
      badgeTextColor = s.text;
      badgeBgColor = s.bg;
    }
  } else if (type === 'role') {
    const roleMap: Record<string, { text: string; bg: string }> = {
      STUDENT: { text: '#2563eb', bg: '#eff6ff' },
      SELLER: { text: '#7c3aed', bg: '#f5f3ff' },
      ADMIN: { text: '#dc2626', bg: '#fef2f2' },
      SUPER_ADMIN: { text: '#dc2626', bg: '#fef2f2' },
    };
    const r = roleMap[label.toUpperCase()];
    if (r) {
      badgeTextColor = r.text;
      badgeBgColor = r.bg;
    }
  }

  return (
    <View style={[styles.badge, { backgroundColor: badgeBgColor }, style]}>
      <Text style={[styles.text, { color: badgeTextColor }, textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: Typography.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default Badge;
