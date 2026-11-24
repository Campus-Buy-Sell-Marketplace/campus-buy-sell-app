import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { adminService } from '../../services/adminService';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { User, UserRole } from '../../types';

type UserFilter = 'All' | 'Students' | 'Sellers' | 'Admins' | 'Banned';

const FILTER_TABS: UserFilter[] = ['All', 'Students', 'Sellers', 'Admins', 'Banned'];

interface AdminUsersScreenProps {
  navigation: any;
}

export const AdminUsersScreen: React.FC<AdminUsersScreenProps> = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<UserFilter>('All');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (pageToLoad = 1, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else if (pageToLoad === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const roleParam =
          activeFilter === 'Students'
            ? 'STUDENT'
            : activeFilter === 'Sellers'
            ? 'SELLER'
            : activeFilter === 'Admins'
            ? 'ADMIN'
            : undefined;

        const data = await adminService.getUsers({
          role: roleParam,
          q: search.trim() || undefined,
          page: pageToLoad,
        });

        if (Array.isArray(data)) {
          if (pageToLoad === 1) {
            setUsers(data);
          } else {
            setUsers((prev) => {
              const existingIds = new Set(prev.map((u) => u.id));
              return [...prev, ...data.filter((u: any) => !existingIds.has(u.id))];
            });
          }
          setHasMore(data.length >= 10);
        } else {
          setHasMore(false);
        }
      } catch (err) {
        if (pageToLoad === 1) setUsers([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activeFilter, search]
  );

  useEffect(() => {
    setPage(1);
    fetchUsers(1);
  }, [fetchUsers]);

  const onRefresh = () => {
    setPage(1);
    fetchUsers(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchUsers(nextPage);
    }
  };

  const handleToggleBan = (user: User) => {
    const isBanned = Boolean(user.is_banned);
    if (!isBanned) {
      Alert.alert(
        'Ban User',
        `Ban ${user.name}? They will lose access to campus marketplace.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Ban User',
            style: 'destructive',
            onPress: async () => {
              setProcessingId(user.id);
              try {
                await adminService.banUser(user.id);
                setUsers((prev) =>
                  prev.map((u) => (u.id === user.id ? { ...u, is_banned: true } : u))
                );
                Alert.alert('User Banned', `${user.name} has been banned.`);
              } catch (err) {
                Alert.alert('Error', 'Failed to ban user.');
              } finally {
                setProcessingId(null);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Unban User',
        `Restore access for ${user.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unban User',
            onPress: async () => {
              setProcessingId(user.id);
              try {
                await adminService.unbanUser(user.id);
                setUsers((prev) =>
                  prev.map((u) => (u.id === user.id ? { ...u, is_banned: false } : u))
                );
                Alert.alert('User Unbanned', `${user.name} access restored.`);
              } catch (err) {
                Alert.alert('Error', 'Failed to unban user.');
              } finally {
                setProcessingId(null);
              }
            },
          },
        ]
      );
    }
  };

  const filteredUsers = users.filter((u) => {
    // Client-side search match
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (u.name || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }

    // Filter tab
    if (activeFilter === 'Students') return u.role === 'STUDENT';
    if (activeFilter === 'Sellers') return u.role === 'SELLER';
    if (activeFilter === 'Admins') return u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
    if (activeFilter === 'Banned') return Boolean(u.is_banned);
    return true;
  });

  const renderUserItem = ({ item }: { item: User }) => {
    const isBanned = Boolean(item.is_banned);
    const joinedDate = item.created_at
      ? new Date(item.created_at).toLocaleDateString()
      : 'Active';

    return (
      <View style={[styles.userCard, Shadow.sm]}>
        {/* Avatar */}
        <Avatar uri={item.avatar_url} name={item.name} size="md" />

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.name}
            </Text>
            {isBanned && (
              <View style={styles.bannedPill}>
                <Text style={styles.bannedPillText}>BANNED</Text>
              </View>
            )}
          </View>

          <Text style={styles.userEmail} numberOfLines={1}>
            {item.email}
          </Text>

          <View style={styles.badgeRow}>
            <Badge label={item.role || 'STUDENT'} type="role" />
            <Text style={styles.joinedText}>Joined {joinedDate}</Text>
          </View>
        </View>

        {/* Ban / Unban Toggle Button */}
        <View style={styles.rightAction}>
          {processingId === item.id ? (
            <ActivityIndicator size="small" color={isBanned ? Colors.success : Colors.danger} />
          ) : (
            <TouchableOpacity
              style={[
                styles.banToggleBtn,
                isBanned ? styles.unbanBtn : styles.banBtn,
              ]}
              activeOpacity={0.7}
              onPress={() => handleToggleBan(item)}
            >
              <Text
                style={[
                  styles.banToggleText,
                  isBanned ? styles.unbanText : styles.banText,
                ]}
              >
                {isBanned ? 'Unban' : 'Ban'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users</Text>
        <Text style={styles.headerCount}>{users.length} accounts</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or campus email..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_TABS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSelected = activeFilter === item;
            return (
              <TouchableOpacity
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                activeOpacity={0.7}
                onPress={() => setActiveFilter(item)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* User FlatList */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading user directory...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptySub}>
                {search ? `No results matching "${search}"` : 'No users in this category.'}
              </Text>
            </View>
          }
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
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography['2xl'],
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerCount: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.base,
    color: Colors.text,
  },
  filterWrap: {
    paddingVertical: Spacing.sm,
  },
  filterList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing['3xl'],
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
  },
  bannedPill: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bannedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#dc2626',
  },
  userEmail: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  joinedText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  rightAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  banToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  banBtn: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  unbanBtn: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  banToggleText: {
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  banText: {
    color: '#dc2626',
  },
  unbanText: {
    color: '#059669',
  },
  footerLoader: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySub: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});

export default AdminUsersScreen;
