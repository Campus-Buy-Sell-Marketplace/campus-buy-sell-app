import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, Typography, BorderRadius } from '../../constants/theme';
import EmptyState from '../../components/common/EmptyState';
import { useNotifications } from '../../context/NotificationContext';
import { Notification } from '../../types';

interface NotificationsScreenProps {
  navigation: any;
}

interface GroupedNotifications {
  title: string;
  data: Notification[];
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { notifications, markAsRead, markAllRead, refreshNotifications } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await refreshNotifications();
    } catch {
      setError('Could not refresh notifications.');
    } finally {
      setRefreshing(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'order':
      case 'order_update':
        return '🛒';
      case 'chat':
      case 'new_message':
        return '💬';
      case 'product':
      case 'listing':
        return '📦';
      default:
        return '🔔';
    }
  };

  const handleNotificationPress = async (item: Notification) => {
    if (!item.is_read) {
      await markAsRead(item.id);
    }

    const type = item.type?.toLowerCase();
    const data = item.data || {};

    if (type.includes('order')) {
      navigation.navigate('OrdersScreen');
    } else if (type.includes('chat') && data.orderId) {
      navigation.navigate('ChatRoom', {
        orderId: data.orderId,
        sellerName: data.sellerName || 'Seller',
        productName: data.productName || 'Order Item',
      });
    } else if (type.includes('product') && data.productId) {
      navigation.navigate('ProductDetail', { productId: data.productId });
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group notifications by Today, Yesterday, Older
  const groupNotifications = (list: Notification[]): GroupedNotifications[] => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayItems: Notification[] = [];
    const yesterdayItems: Notification[] = [];
    const olderItems: Notification[] = [];

    list.forEach((item) => {
      const itemDate = new Date(item.created_at);
      if (
        itemDate.getDate() === today.getDate() &&
        itemDate.getMonth() === today.getMonth() &&
        itemDate.getFullYear() === today.getFullYear()
      ) {
        todayItems.push(item);
      } else if (
        itemDate.getDate() === yesterday.getDate() &&
        itemDate.getMonth() === yesterday.getMonth() &&
        itemDate.getFullYear() === yesterday.getFullYear()
      ) {
        yesterdayItems.push(item);
      } else {
        olderItems.push(item);
      }
    });

    const groups: GroupedNotifications[] = [];
    if (todayItems.length > 0) groups.push({ title: 'Today', data: todayItems });
    if (yesterdayItems.length > 0) groups.push({ title: 'Yesterday', data: yesterdayItems });
    if (olderItems.length > 0) groups.push({ title: 'Older', data: olderItems });

    return groups;
  };

  const grouped = groupNotifications(notifications);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={() => markAllRead()} activeOpacity={0.7}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {notifications.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No notifications yet"
          subtitle="We'll notify you when you have updates on your orders, messages, or saved items."
        />
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item: group }) => (
            <View style={styles.groupContainer}>
              <Text style={styles.groupHeader}>{group.title}</Text>
              {group.data.map((item) => {
                const unread = !item.is_read;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.notificationItem,
                      unread ? styles.itemUnread : styles.itemRead,
                    ]}
                    onPress={() => handleNotificationPress(item)}
                    activeOpacity={0.7}
                  >
                    {/* Left indicator */}
                    <View style={styles.leftIndicatorCol}>
                      {unread ? <View style={styles.blueDot} /> : <View style={styles.emptyDot} />}
                      <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
                    </View>

                    {/* Content */}
                    <View style={styles.contentCol}>
                      <Text
                        style={[
                          styles.notificationTitle,
                          unread ? styles.titleUnread : styles.titleRead,
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.notificationBody}>{item.body}</Text>
                      <Text style={styles.timestamp}>
                        {formatTimestamp(item.created_at)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
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
  markAllText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
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
  listContent: {
    paddingBottom: Spacing['3xl'],
  },
  groupContainer: {
    marginTop: Spacing.md,
  },
  groupHeader: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemUnread: {
    backgroundColor: Colors.surface,
  },
  itemRead: {
    backgroundColor: Colors.background,
  },
  leftIndicatorCol: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  blueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    marginRight: Spacing.xs,
  },
  emptyDot: {
    width: 8,
    marginRight: Spacing.xs,
  },
  typeIcon: {
    fontSize: 22,
  },
  contentCol: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: Typography.base,
    marginBottom: 2,
  },
  titleUnread: {
    fontWeight: '700',
    color: Colors.text,
  },
  titleRead: {
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  notificationBody: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
});

export default NotificationsScreen;
