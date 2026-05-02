import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../services/firebase';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

type ChatItem = {
  id: string;
  activityTitle: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: any;
  unreadCounts: Record<string, number>;
};

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

export default function ChatsScreen({ navigation }: Props) {
  const { user, isSubscribed } = useAuth();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: ChatItem[] = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as ChatItem))
        .filter((c) => c.lastMessage)
        .sort((a, b) => {
          const tA = a.lastMessageAt?.toDate?.()?.getTime() || 0;
          const tB = b.lastMessageAt?.toDate?.()?.getTime() || 0;
          return tB - tA; // newest first
        });
      setChats(items);
      setLoading(false);
    }, (err) => {
      console.error('Chats fetch error:', err.code);
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.uid]);

  if (!isSubscribed()) {
    return (
      <View style={styles.gateContainer}>
        <Ionicons name="chatbubbles-outline" size={56} color={COLORS.textMuted} />
        <Text style={styles.gateTitle}>Messaging is a Premium Feature</Text>
        <Text style={styles.gateSub}>
          Subscribe to chat with your activity buddies and coordinate meetups.
        </Text>
        <TouchableOpacity style={styles.gateBtn} onPress={() => navigation.navigate('Subscription')}>
          <Text style={styles.gateBtnText}>Upgrade Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const unread = item.unreadCounts?.[user?.uid || ''] || 0;
            const otherUid = item.participants?.find((p) => p !== user?.uid) || '';
            const initials = (item.activityTitle || '?')[0].toUpperCase();
            const time = item.lastMessageAt?.toDate
              ? item.lastMessageAt.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <TouchableOpacity
                style={[styles.chatRow, unread > 0 && styles.chatRowUnread]}
                onPress={() => navigation.navigate('Chat', {
                  chatId: item.id,
                  activityTitle: item.activityTitle,
                  recipientId: otherUid,
                })}
                activeOpacity={0.85}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.chatInfo}>
                  <View style={styles.chatTop}>
                    <Text style={styles.chatName} numberOfLines={1}>
                      {item.activityTitle || 'Activity Chat'}
                    </Text>
                    <Text style={styles.chatTime}>{time}</Text>
                  </View>
                  <Text
                    style={[styles.chatLast, unread > 0 && styles.chatLastUnread]}
                    numberOfLines={1}
                  >
                    {item.lastMessage}
                  </Text>
                </View>
                {unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{unread > 9 ? '9+' : unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={56} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>
                Join or create an activity to start chatting with buddies!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.lg, paddingTop: 56,
    paddingBottom: SPACING.md, backgroundColor: COLORS.surface,
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flexGrow: 1 },
  chatRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chatRowUnread: { backgroundColor: COLORS.primary + '08' },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: COLORS.primary, alignItems: 'center',
    justifyContent: 'center', marginRight: SPACING.md,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  chatInfo: { flex: 1 },
  chatTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, flex: 1, marginRight: SPACING.sm },
  chatTime: { fontSize: 11, color: COLORS.textMuted },
  chatLast: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  chatLastUnread: { color: COLORS.textPrimary, fontWeight: '600' },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.primary, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 4, marginLeft: SPACING.sm,
  },
  unreadText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, gap: SPACING.md, paddingHorizontal: SPACING.xl,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  gateContainer: {
    flex: 1, backgroundColor: COLORS.background, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: SPACING.xl, gap: SPACING.md,
  },
  gateTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  gateSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  gateBtn: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl, borderRadius: RADIUS.full, marginTop: SPACING.sm,
  },
  gateBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
