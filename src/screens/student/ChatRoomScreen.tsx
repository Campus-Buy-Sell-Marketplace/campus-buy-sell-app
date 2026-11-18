import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Shadow, Spacing, Typography, BorderRadius } from '../../constants/theme';
import Avatar from '../../components/common/Avatar';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage } from '../../types';

interface ChatRoomScreenProps {
  navigation: any;
  route: any;
}

interface MessageWithDivider {
  type: 'message' | 'divider';
  id: string;
  dateLabel?: string;
  message?: ChatMessage;
}

export const ChatRoomScreen: React.FC<ChatRoomScreenProps> = ({
  navigation,
  route,
}) => {
  const { orderId, sellerName, productName } = route.params || {};
  const { user } = useAuth();
  const myUserId = user?.id || '';

  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDayLabel = (dateStr: string) => {
    const msgDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (
      msgDate.getDate() === today.getDate() &&
      msgDate.getMonth() === today.getMonth() &&
      msgDate.getFullYear() === today.getFullYear()
    ) {
      return 'Today';
    }
    if (
      msgDate.getDate() === yesterday.getDate() &&
      msgDate.getMonth() === yesterday.getMonth() &&
      msgDate.getFullYear() === yesterday.getFullYear()
    ) {
      return 'Yesterday';
    }

    return msgDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Fetch Message History
  const loadHistory = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const history = await chatService.getMessages(orderId);
      setMessages(Array.isArray(history) ? history : []);
    } catch (err: any) {
      setError('Could not load chat history.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Socket Connection and Event Listeners
  useEffect(() => {
    let activeSocket: any = null;

    const setupSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token && orderId) {
          activeSocket = chatService.connectSocket(token);
          chatService.joinRoom(orderId);

          activeSocket.on('new_message', (newMsg: ChatMessage) => {
            if (newMsg.order_id === orderId) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            }
          });
        }
      } catch {
        // Socket setup error
      }
    };

    loadHistory();
    setupSocket();

    return () => {
      if (orderId) {
        chatService.leaveRoom(orderId);
      }
      chatService.disconnectSocket();
    };
  }, [orderId, loadHistory]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || sending || !orderId) return;

    setSending(true);
    setInputText('');

    try {
      const socket = chatService.getSocket();
      if (socket) {
        socket.emit('send_message', {
          order_id: orderId,
          message: trimmed,
        });
      }

      const sentMsg = await chatService.sendMessage(orderId, trimmed);
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
    } catch (err: any) {
      setError('Failed to send message. Please retry.');
    } finally {
      setSending(false);
    }
  };

  // Prepare messages with date dividers
  const renderList: MessageWithDivider[] = [];
  let lastDateStr = '';

  messages.forEach((msg, idx) => {
    const dateStr = new Date(msg.created_at).toDateString();
    if (dateStr !== lastDateStr) {
      renderList.push({
        type: 'divider',
        id: `divider-${dateStr}-${idx}`,
        dateLabel: formatDayLabel(msg.created_at),
      });
      lastDateStr = dateStr;
    }
    renderList.push({
      type: 'message',
      id: msg.id || `msg-${idx}`,
      message: msg,
    });
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={[styles.header, Shadow.sm]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Avatar name={sellerName} size="sm" />
          <View style={styles.headerInfo}>
            <Text numberOfLines={1} style={styles.sellerName}>
              {sellerName || 'Seller'}
            </Text>
            <Text numberOfLines={1} style={styles.productName}>
              {productName || 'Order Chat'}
            </Text>
          </View>
        </View>

        <View style={{ width: 36 }} />
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Messages Area & Input */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading conversation...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={renderList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item, index }) => {
              if (item.type === 'divider') {
                return (
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerPill}>
                      <Text style={styles.dividerText}>{item.dateLabel}</Text>
                    </View>
                  </View>
                );
              }

              const msg = item.message!;
              const isMine = msg.sender_id === myUserId;
              const prevItem = index > 0 ? renderList[index - 1] : null;
              const isDifferentSender =
                prevItem?.type === 'message' &&
                prevItem.message?.sender_id !== msg.sender_id;

              return (
                <View
                  style={[
                    styles.messageRow,
                    isMine ? styles.myMessageRow : styles.theirMessageRow,
                    isDifferentSender ? { marginTop: 12 } : { marginTop: 4 },
                  ]}
                >
                  {/* Their message bubble */}
                  {!isMine && (
                    <View style={styles.theirBubbleWrapper}>
                      <Text style={styles.senderLabel}>
                        {msg.sender_name || sellerName || 'Seller'}
                      </Text>
                      <View style={styles.theirBubble}>
                        <Text style={styles.theirText}>{msg.message}</Text>
                      </View>
                      <Text style={styles.theirTimestamp}>
                        {formatTime(msg.created_at)}
                      </Text>
                    </View>
                  )}

                  {/* My message bubble */}
                  {isMine && (
                    <View style={styles.myBubbleWrapper}>
                      <View style={styles.myBubble}>
                        <Text style={styles.myText}>{msg.message}</Text>
                      </View>
                      <Text style={styles.myTimestamp}>
                        {formatTime(msg.created_at)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}

        {/* Input Area */}
        <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
          <View style={[styles.inputContainer, Shadow.sm]}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />

            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
              style={[
                styles.sendBtn,
                (!inputText.trim() || sending) && styles.sendBtnDisabled,
              ]}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="paper-plane" size={18} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  sellerName: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
  },
  productName: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  errorBanner: {
    backgroundColor: Colors.danger,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontWeight: '500',
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  dividerContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerPill: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  dividerText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  theirMessageRow: {
    justifyContent: 'flex-start',
  },
  myBubbleWrapper: {
    maxWidth: '75%',
    alignItems: 'flex-end',
  },
  myBubble: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  myText: {
    color: Colors.white,
    fontSize: Typography.base,
    lineHeight: 20,
  },
  myTimestamp: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 3,
    marginRight: 4,
  },
  theirBubbleWrapper: {
    maxWidth: '75%',
    alignItems: 'flex-start',
  },
  senderLabel: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 3,
    marginLeft: 4,
  },
  theirBubble: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  theirText: {
    color: Colors.text,
    fontSize: Typography.base,
    lineHeight: 20,
  },
  theirTimestamp: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 3,
    marginLeft: 4,
  },
  inputSafeArea: {
    backgroundColor: Colors.surface,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 6,
    fontSize: Typography.base,
    color: Colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});

export default ChatRoomScreen;
