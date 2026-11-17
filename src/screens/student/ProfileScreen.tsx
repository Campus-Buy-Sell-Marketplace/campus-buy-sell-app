import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { orderService } from '../../services/orderService';
import { chatService } from '../../services/chatService';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout, updateUser, refreshUser } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const [orders, wishlist] = await Promise.all([
        orderService.getOrders().catch(() => []),
        userService.getWishlist().catch(() => []),
      ]);
      setOrderCount(Array.isArray(orders) ? orders.length : 0);
      setWishlistCount(Array.isArray(wishlist) ? wishlist.length : 0);
      setChatCount(Array.isArray(orders) ? orders.filter((o: any) => o.status !== 'CANCELLED').length : 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), fetchStats()]);
    setRefreshing(false);
  };

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please allow photo gallery access to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        await userService.updateProfile({ avatar_url: uri });
        await refreshUser();
        Alert.alert('Avatar Updated', 'Your profile picture has been updated.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update avatar.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of LAVSA?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Notice', 'Could not open the link at this moment.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Top Profile Card */}
        <View style={[styles.profileCard, Shadow.sm]}>
          <View style={styles.avatarContainer}>
            <Avatar name={user?.name} uri={user?.avatar_url} size="xl" />
            <TouchableOpacity
              style={[styles.cameraBadge, Shadow.sm]}
              onPress={handlePickAvatar}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{user?.name || 'Campus Student'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'student@campus.edu'}</Text>

          <View style={styles.badgeRow}>
            <Badge label={user?.role || 'STUDENT'} type="role" />
            {user?.college ? (
              <Text style={styles.collegeName}>• {user.college}</Text>
            ) : null}
          </View>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsCard, Shadow.sm]}>
          <TouchableOpacity
            style={styles.statCol}
            onPress={() => navigation.navigate('OrdersScreen')}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{orderCount}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statCol}
            onPress={() => navigation.navigate('WishlistTab')}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{wishlistCount}</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statCol}
            onPress={() => navigation.navigate('ChatTab')}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{chatCount}</Text>
            <Text style={styles.statLabel}>Chats</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Account */}
        <Text style={styles.sectionHeader}>ACCOUNT</Text>
        <View style={[styles.menuCard, Shadow.sm]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuEmoji}>👤</Text>
            <Text style={styles.menuLabel}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuEmoji}>🔔</Text>
            <Text style={styles.menuLabel}>Notifications</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuEmoji}>⚙️</Text>
            <Text style={styles.menuLabel}>Settings</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section: Seller Mode / Onboarding */}
        <Text style={styles.sectionHeader}>CAMPUS COMMERCE</Text>
        <View style={[styles.menuCard, Shadow.sm]}>
          {user?.role === 'STUDENT' ? (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('SellerOnboarding')}
              activeOpacity={0.7}
            >
              <Text style={styles.menuEmoji}>💼</Text>
              <View style={styles.menuLabelCol}>
                <Text style={styles.menuLabel}>Become a Seller</Text>
                <Text style={styles.menuSubLabel}>Sell books, electronics, and supplies to peers</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                Alert.alert(
                  'Seller Dashboard',
                  'You are registered as a seller! Switch to the Seller Mode in the app to manage listings, orders, and payouts.'
                )
              }
              activeOpacity={0.7}
            >
              <Text style={styles.menuEmoji}>🏪</Text>
              <View style={styles.menuLabelCol}>
                <Text style={styles.menuLabel}>Seller Dashboard</Text>
                <Text style={styles.menuSubLabel}>Manage products & fulfill orders</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Section: Support */}
        <Text style={styles.sectionHeader}>SUPPORT & ABOUT</Text>
        <View style={[styles.menuCard, Shadow.sm]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => openUrl('https://lavsa.campus/help')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuEmoji}>❓</Text>
            <Text style={styles.menuLabel}>Help & Support</Text>
            <Ionicons name="open-outline" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => openUrl('https://lavsa.campus/terms')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuEmoji}>📜</Text>
            <Text style={styles.menuLabel}>Terms of Service</Text>
            <Ionicons name="open-outline" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => openUrl('https://lavsa.campus/privacy')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuEmoji}>🔒</Text>
            <Text style={styles.menuLabel}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={[styles.logoutBtn, Shadow.sm]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  userName: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  collegeName: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.lg,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.borderLight,
    alignSelf: 'center',
  },
  sectionHeader: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  menuEmoji: {
    fontSize: 18,
    marginRight: Spacing.md,
  },
  menuLabelCol: {
    flex: 1,
  },
  menuLabel: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  menuSubLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.lg + 18 + Spacing.md,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginTop: Spacing.xs,
  },
  logoutText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.danger,
  },
});

export default ProfileScreen;
