import React from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

export interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: StyleProp<any>;
}

const SIZE_MAP = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const FONT_MAP = {
  sm: 12,
  md: 15,
  lg: 20,
  xl: 28,
};

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = '',
  size = 'md',
  style,
}) => {
  const dimension = SIZE_MAP[size] ?? SIZE_MAP.md;
  const fontSize = FONT_MAP[size] ?? FONT_MAP.md;

  const getInitials = (nameStr: string) => {
    if (!nameStr) return '?';
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.borderLight,
    resizeMode: 'cover',
  },
  fallback: {
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.textSecondary,
    fontWeight: '700',
  },
});

export default Avatar;
