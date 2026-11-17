import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography, Spacing } from '../../constants/theme';

export const SplashScreen: React.FC = () => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoOpacity, logoScale, subtitleOpacity]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Text style={styles.brandTitle}>UniTrade.</Text>
      </Animated.View>

      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: subtitleOpacity,
          },
        ]}
      >
        Campus Buy & Sell Marketplace
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: Spacing.md,
    fontSize: Typography.md,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
