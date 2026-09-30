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
import { FONTS, SPACING, RADIUS } from '../constants/theme';

// White sheet with a purple header — matches Profile/Settings/Chat, not the
// old dark-gradient theme this screen used to carry.
const C = {
  page: '#FFFFFF',
  purple: '#3F2F86',
  heading: '#16213E',
  sub: '#767683',
  muted: '#9A9AA6',
  border: '#ECEBF2',
};

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
        <View style={styles.gateHeader}>
          {navigation.canGoBack() && (
            <TouchableOpacity style={styles.gateBackBtn} onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.gateBody}>
          <View style={styles.gateIconWrap}>
            <Ionicons name="chatbubbles-outline" size={40} color={C.purple} />
          </View>
          <Text style={styles.gateTitle}>Messaging is a Premium Feature</Text>
          <Text style={styles.gateSub}>
            Subscribe to chat with your activity buddies and coordinate meetups.
          </Text>
          <TouchableOpacity style={styles.gateBtn} onPress={() => navigation.navigate('Subscription')}>
            <Text style={styles.gateBtnText}>Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Messages</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={C.purple} />
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
              <Ionicons name="chatbubbles-outline" size={56} color={C.muted} />
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
  container: { flex: 1, backgroundColor: C.page },
  header: {
    paddingHorizontal: SPACING.lg, paddingTop: 56,
    paddingBottom: SPACING.md, backgroundColor: C.purple,
  },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center', marginLeft: -SPACING.sm, marginBottom: 4 },
  title: { fontFamily: FONTS.extraBold, fontSize: 24, color: '#FFFFFF' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flexGrow: 1 },
  chatRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  chatRowUnread: { backgroundColor: 'rgba(63,47,134,0.05)' },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: C.purple, alignItems: 'center',
    justifyContent: 'center', marginRight: SPACING.md,
  },
  avatarText: { fontFamily: FONTS.extraBold, fontSize: 20, color: '#FFFFFF' },
  chatInfo: { flex: 1 },
  chatTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontFamily: FONTS.bold, fontSize: 14, color: C.heading, flex: 1, marginRight: SPACING.sm },
  chatTime: { fontFamily: FONTS.regular, fontSize: 11, color: C.muted },
  chatLast: { fontFamily: FONTS.regular, fontSize: 13, color: C.sub, marginTop: 3 },
  chatLastUnread: { fontFamily: FONTS.semiBold, color: C.heading },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: C.purple, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 4, marginLeft: SPACING.sm,
  },
  unreadText: { fontFamily: FONTS.extraBold, color: '#FFFFFF', fontSize: 11 },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, gap: SPACING.md, paddingHorizontal: SPACING.xl,
  },
  emptyTitle: { fontFamily: FONTS.bold, fontSize: 17, color: C.heading },
  emptyText: { fontFamily: FONTS.regular, fontSize: 14, color: C.sub, textAlign: 'center', lineHeight: 22 },
  gateContainer: { flex: 1, backgroundColor: C.purple },
  gateHeader: { paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md, alignItems: 'flex-start' },
  gateBackBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -SPACING.sm },
  gateBody: {
    flex: 1, backgroundColor: C.page,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SPACING.xl, gap: SPACING.md,
  },
  gateIconWrap: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(63,47,134,0.08)',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  gateTitle: { fontFamily: FONTS.extraBold, fontSize: 20, color: C.heading, textAlign: 'center' },
  gateSub: { fontFamily: FONTS.regular, fontSize: 14, color: C.sub, textAlign: 'center', lineHeight: 22 },
  gateBtn: {
    backgroundColor: C.purple, paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl, borderRadius: RADIUS.full, marginTop: SPACING.sm,
  },
  gateBtnText: { fontFamily: FONTS.bold, color: '#FFFFFF', fontSize: 16 },
});
