import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, doc, setDoc, updateDoc, increment,
} from 'firebase/firestore';
import { auth } from '../services/firebase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Chat'>;
  route: RouteProp<RootStackParamList, 'Chat'>;
};

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
  read: boolean;
}

export default function ChatScreen({ navigation, route }: Props) {
  const { chatId, activityTitle, participantName, recipientId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Chat requires an active Firebase session
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const myUid = user?.uid || '';
    const chatRef = doc(db, 'chats', chatId);

    // Create or update chat doc — include both participants
    const participants = recipientId
      ? [myUid, recipientId].filter(Boolean)
      : [myUid];
    setDoc(chatRef, {
      activityTitle: activityTitle || '',
      participants,
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      unreadCounts: { [myUid]: 0 },
    }, { merge: true });

    // Reset my unread count to 0 when I open the chat
    if (myUid) {
      updateDoc(chatRef, { [`unreadCounts.${myUid}`]: 0 }).catch(() => {});
    }

    // Subscribe to messages subcollection in real-time
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data() as Omit<Message, 'id'>,
      }));
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, (err) => {
      console.error('Chat error:', err.code);
      setLoading(false);
    });

    return unsubscribe;
  }, [chatId]);

  const send = async () => {
    const text = input.trim();
    if (!text || !user) return;
    setInput('');

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const chatRef = doc(db, 'chats', chatId);

    // Add message to subcollection
    await addDoc(messagesRef, {
      senderId: user.uid,
      senderName: user.name || 'You',
      text,
      createdAt: serverTimestamp(),
      read: false,
    });

    // Update last message + increment recipient's unread count
    const update: Record<string, any> = {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
    };
    if (recipientId) {
      update[`unreadCounts.${recipientId}`] = increment(1);
    }
    await updateDoc(chatRef, update);
  };

  const formatTime = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // Require active Firebase session for chat
  if (!auth.currentUser && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{participantName || activityTitle || 'Chat'}</Text>
          </View>
        </View>
        <View style={styles.sessionWrap}>
          <Ionicons name="lock-closed-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.sessionText}>Sign in required to use chat</Text>
          <Text style={styles.sessionSub}>Please log out and sign in again to activate messaging.</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{participantName || activityTitle || 'Chat'}</Text>
            {activityTitle && participantName && (
              <Text style={styles.headerSub} numberOfLines={1}>{activityTitle}</Text>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={[styles.msgList, messages.length === 0 && styles.msgListEmpty]}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No messages yet.{'\n'}Say hello! 👋</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMe = item.senderId === user?.uid;
              return (
                <View style={[styles.bubbleWrap, isMe && styles.bubbleWrapMe]}>
                  {!isMe && (
                    <View style={styles.senderAvatar}>
                      <Text style={styles.senderAvatarText}>{item.senderName?.[0] || '?'}</Text>
                    </View>
                  )}
                  <View style={[styles.bubble, isMe && styles.bubbleMe]}>
                    {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
                    <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.text}</Text>
                    <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                      {formatTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            returnKeyType="send"
            onSubmitEditing={send}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingTop: 56, paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: 12, color: COLORS.textMuted },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msgList: { padding: SPACING.lg, gap: SPACING.sm },
  msgListEmpty: { flex: 1, justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', gap: SPACING.md },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
  bubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, marginBottom: SPACING.sm },
  bubbleWrapMe: { flexDirection: 'row-reverse' },
  senderAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  senderAvatarText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  bubble: {
    maxWidth: '75%', backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, borderBottomLeftRadius: 4,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  bubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: 4,
  },
  senderName: { fontSize: 11, fontWeight: '700', color: COLORS.primary, marginBottom: 3 },
  bubbleText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  bubbleTextMe: { color: COLORS.white },
  bubbleTime: { fontSize: 10, color: COLORS.textMuted, marginTop: 3, alignSelf: 'flex-end' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: COLORS.surface,
    padding: SPACING.md, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  input: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, fontSize: 14,
    color: COLORS.textPrimary, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: COLORS.textMuted },
  sessionWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, paddingHorizontal: SPACING.xl },
  sessionText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  sessionSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});
