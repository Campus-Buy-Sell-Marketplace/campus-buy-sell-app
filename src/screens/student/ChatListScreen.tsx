import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, Typography, BorderRadius } from '../../constants/theme';
import Avatar from '../../components/common/Avatar';
import EmptyState from '../../components/common/EmptyState';
import { orderService } from '../../services/orderService';
import { chatService } from '../../services/chatService';
import { Order, ChatMessage } from '../../types';

interface ChatListScreenProps {
  navigation: any;
}

interface ChatConversation {
  order: Order;
  lastMessage?: ChatMessage | null;
}

export const ChatListScreen: React.FC<ChatListScreenProps> = ({ navigation }) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const orders = await orderService.getOrders();
      // Filter orders that are relevant for chats (Active or completed)
      const chatOrders = orders.filter((o) =>
        ['PENDING_MEETUP', 'PAID_PENDING_MEETUP', 'PENDING_PAYMENT', 'COMPLETED', 'CONFIRMED'].includes(o.status)
      );

      // Fetch last message for each conversation
      const conversationList: ChatConversation[] = await Promise.all(
        chatOrders.map(async (order) => {
          try {
            const messages = await chatService.getMessages(order.id);
            const lastMsg =
              Array.isArray(messages) && messages.length > 0
                ? messages[messages.length - 1]
                : null;
            return { order, lastMessage: lastMsg };
          } catch {
            return { order, lastMessage: null };
          }
        })
      );

      // Sort by newest message or newest order
      conversationList.sort((a, b) => {
        const dateA = a.lastMessage?.created_at || a.order.created_at;
        const dateB = b.lastMessage?.created_at || b.order.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      setConversations(conversationList);
    } catch (err: any) {
      setError('Could not load chat conversations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats(true);
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.order.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <EmptyState
              icon="💬"
              title="No conversations yet"
              subtitle="Place an order to start chatting with sellers about item details or pickup arrangements."
              actionLabel="Browse Marketplace"
              onAction={() => navigation.navigate('BrowseTab')}
            />
          }
          renderItem={({ item }) => {
            const { order, lastMessage } = item;
            const seller = order.seller;
            const product = order.product;
            const previewText = lastMessage
              ? lastMessage.message
              : 'Tap to start coordinating pickup...';
            const timestamp = formatTimestamp(
              lastMessage?.created_at || order.created_at
            );

            return (
              <TouchableOpacity
                style={styles.chatRow}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('ChatRoom', {
                    orderId: order.id,
                    sellerName: seller?.name || 'Seller',
                    productName: product?.title || 'Campus Item',
                  })
                }
              >
                {/* Left: Seller Avatar (size="lg") */}
                <Avatar
                  name={seller?.name}
                  uri={seller?.avatar_url}
                  size="lg"
                />

                {/* Middle: Info */}
                <View style={styles.middleContainer}>
                  <View style={styles.nameRow}>
                    <Text numberOfLines={1} style={styles.sellerName}>
                      {seller?.name || 'Seller'}
                    </Text>
                    {timestamp ? (
                      <Text style={styles.timestampText}>{timestamp}</Text>
                    ) : null}
                  </View>

                  <Text numberOfLines={1} style={styles.productName}>
                    {product?.title || 'Item'} • #{order.id.slice(0, 8)}
                  </Text>

                  <Text numberOfLines={1} style={styles.messagePreview}>
                    {previewText}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
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
  listContent: {
    paddingBottom: Spacing['3xl'],
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  middleContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sellerName: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  timestampText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  productName: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.lg + 56 + Spacing.md,
  },
});

export default ChatListScreen;
