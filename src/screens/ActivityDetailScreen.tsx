import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Share,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  doc, onSnapshot, updateDoc, arrayUnion, arrayRemove,
  increment, collection, addDoc, serverTimestamp, setDoc,
} from 'firebase/firestore';
import { auth } from '../services/firebase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Activity } from '../types';
import { useAuth } from '../context/AuthContext';
import { INTERESTS } from '../constants/interests';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import { DEMO_ACTIVITIES } from '../constants/demoData';
import { db } from '../services/firebase';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ActivityDetail'>;
  route: RouteProp<RootStackParamList, 'ActivityDetail'>;
};

export default function ActivityDetailScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { user, isSubscribed } = useAuth();
  const [requested, setRequested] = useState(false);
  // Initialise from local cache for instant display, but always subscribe to Firestore for live data
  const [activity, setActivity] = useState<Activity | null>(
    DEMO_ACTIVITIES[activityId] || null
  );
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    const ref = doc(db, 'activities', activityId);

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        // Firestore is source of truth — always prefer it
        setActivity({ id: snap.id, ...snap.data() } as Activity);
      } else if (DEMO_ACTIVITIES[activityId]) {
        // Document not in Firestore — fall back to local demo data
        setActivity(DEMO_ACTIVITIES[activityId]);
      }
      setLoadingActivity(false);
    }, () => {
      // On Firestore error, fall back to local cache
      if (DEMO_ACTIVITIES[activityId]) setActivity(DEMO_ACTIVITIES[activityId]);
      setLoadingActivity(false);
    });

    return unsubscribe;
  }, [activityId]);

  if (loadingActivity) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.notFoundText}>Activity not found</Text>
      </View>
    );
  }

  const interest = INTERESTS.find((i) => i.id === activity.interest);
  const spotsLeft = activity.slots - activity.joinedCount;
  const date = new Date(activity.date);
  const dateStr = date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const isCreator = user?.uid === activity.creatorId || activity.creatorId === 'demo_user';
  const hasJoined = activity.participants.includes(user?.uid || '');

  const hasPendingRequest = activity.pendingRequests?.includes(user?.uid || '');

  const handleJoin = async () => {
    if (!isSubscribed()) {
      Alert.alert('Subscription Required',
        'Your free trial has ended. Subscribe to join activities.',
        [{ text: 'Cancel', style: 'cancel' },
         { text: 'Subscribe Now', onPress: () => navigation.navigate('Subscription') }]);
      return;
    }
    if (!user || !auth.currentUser || auth.currentUser.uid !== user.uid) {
      Alert.alert('Error', 'Please log in to send a join request.');
      return;
    }

    const currentUser = auth.currentUser;
    const actRef = doc(db, 'activities', activity.id);
    const chatId = `join_${activity.id}_${currentUser.uid}`;
    const chatRef = doc(db, 'chats', chatId);

    try {
      // 1. Add requester to pendingRequests + store their name
      await updateDoc(actRef, {
        pendingRequests: arrayUnion(currentUser.uid),
        [`pendingRequestNames.${currentUser.uid}`]: user.name || user.phone || 'Anonymous',
      });

      // 2. Ensure chat document exists with both participants
      await setDoc(chatRef, {
        activityId: activity.id,
        activityTitle: activity.title,
        participants: [currentUser.uid, activity.creatorId],
        lastMessage: `${user.name || 'Someone'} wants to join your activity`,
        lastMessageAt: serverTimestamp(),
      }, { merge: true });

      // 3. Increment organiser's unread count separately (increment must be in updateDoc)
      await updateDoc(chatRef, {
        [`unreadCounts.${activity.creatorId}`]: increment(1),
      });

      // 4. Send the notification message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: 'system',
        senderName: 'MyBuddy',
        text: `👋 ${user.name || 'Someone'} has requested to join "${activity.title}". Open the activity to Accept or Reject.`,
        createdAt: serverTimestamp(),
        read: false,
      });

      setRequested(true);
      Alert.alert('Request Sent! 🎉',
        `${activity.creatorName} has been notified and will accept or reject your request.`);
    } catch (err: any) {
      console.error('Join request error:', err?.code, err?.message);
      Alert.alert('Error',
        err?.code === 'permission-denied'
          ? 'Permission denied. Make sure Firestore rules allow pendingRequests updates.'
          : err?.message || 'Could not send request. Please try again.');
    }
  };

  const handleAccept = async (uid: string, name: string) => {
    try {
      const actRef = doc(db, 'activities', activity.id);
      await updateDoc(actRef, {
        pendingRequests: arrayRemove(uid),
        participants: arrayUnion(uid),
        joinedCount: increment(1),
        [`pendingRequestNames.${uid}`]: null,
      });
      // Notify the requester via chat
      const chatId = `join_${activity.id}_${uid}`;
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: 'system',
        senderName: 'MyBuddy',
        text: `✅ Your request to join "${activity.title}" has been accepted! See you there.`,
        createdAt: serverTimestamp(),
        read: false,
      });
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: 'Your join request was accepted!',
        lastMessageAt: serverTimestamp(),
        [`unreadCounts.${uid}`]: increment(1),
      });
      Alert.alert('Accepted!', `${name} has been added to the activity.`);
    } catch (err) {
      Alert.alert('Error', 'Could not accept request.');
    }
  };

  const handleLeave = () => {
    if (!auth.currentUser) {
      Alert.alert(
        'Session Expired',
        'Your login session is not active. Please log out and sign in again to leave this activity.'
      );
      return;
    }
    Alert.alert(
      'Leave Activity',
      `Are you sure you want to leave "${activity.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'activities', activity.id), {
                participants: arrayRemove(user!.uid),
                joinedCount: increment(-1),
              });
            } catch (err: any) {
              console.error('Leave error:', err?.code, err?.message);
              Alert.alert('Error',
                err?.code === 'permission-denied'
                  ? 'Permission denied. Please publish the Firestore rules from the README.'
                  : err?.message || 'Could not leave the activity. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (uid: string, name: string) => {
    Alert.alert('Reject Request', `Reject ${name}'s request to join?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        try {
          await updateDoc(doc(db, 'activities', activity.id), {
            pendingRequests: arrayRemove(uid),
            [`pendingRequestNames.${uid}`]: null,
          });
          const chatId = `join_${activity.id}_${uid}`;
          await addDoc(collection(db, 'chats', chatId, 'messages'), {
            senderId: 'system', senderName: 'MyBuddy',
            text: `Sorry, your request to join "${activity.title}" was not accepted this time.`,
            createdAt: serverTimestamp(), read: false,
          });
          await updateDoc(doc(db, 'chats', chatId), {
            lastMessage: 'Join request not accepted.',
            lastMessageAt: serverTimestamp(),
            [`unreadCounts.${uid}`]: increment(1),
          });
        } catch { }
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.heroBar}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          {isCreator && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('CreateActivity', { activityId: activity.id })}
            >
              <Ionicons name="create-outline" size={16} color={COLORS.white} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.heroEmoji}>{interest?.emoji || '🎯'}</Text>
        <Text style={styles.heroTitle}>{activity.title}</Text>
        <Text style={styles.heroInterest}>{interest?.label || activity.interest}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Row icon="calendar" label="Date" value={dateStr} />
          <Row icon="time-outline" label="Time" value={activity.time} />
          <Row icon="location-outline" label="Location" value={`${activity.location.name}\n${activity.location.address}`} />
          <Row icon="people-outline" label="Spots" value={`${spotsLeft} of ${activity.slots} remaining`} color={spotsLeft === 0 ? COLORS.error : COLORS.success} />
          {activity.skillLevel && activity.skillLevel !== 'any' && (
            <Row icon="bar-chart-outline" label="Skill Level" value={activity.skillLevel.charAt(0).toUpperCase() + activity.skillLevel.slice(1)} />
          )}
          {activity.genderPreference && activity.genderPreference !== 'any' && (
            <Row icon="person-outline" label="Looking for" value={activity.genderPreference.charAt(0).toUpperCase() + activity.genderPreference.slice(1)} last />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this Activity</Text>
          <Text style={styles.description}>{activity.description || 'No description provided.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organiser</Text>
          <View style={styles.creatorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{activity.creatorName[0]}</Text>
            </View>
            <View>
              <Text style={styles.creatorName}>{activity.creatorName}</Text>
              <Text style={styles.creatorSub}>Activity Organiser</Text>
            </View>
          </View>
        </View>

        {/* Pending join requests — always visible to creator */}
        {isCreator && (
          <View style={styles.section}>
            <View style={styles.requestsHeader}>
              <Ionicons name="people-outline" size={16} color={COLORS.warning} />
              <Text style={styles.requestsTitle}>
                Join Requests
                {(activity.pendingRequests?.length || 0) > 0
                  ? ` (${activity.pendingRequests.length})`
                  : ''}
              </Text>
            </View>

            {(!activity.pendingRequests || activity.pendingRequests.length === 0) ? (
              <View style={styles.noRequestsRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.noRequestsText}>No pending requests</Text>
              </View>
            ) : (
              activity.pendingRequests.map((uid) => {
                const name = activity.pendingRequestNames?.[uid] || `User ${uid.slice(-6)}`;
                return (
                  <View key={uid} style={styles.requestRow}>
                    <View style={styles.requestAvatar}>
                      <Text style={styles.requestAvatarText}>{name[0].toUpperCase()}</Text>
                    </View>
                    <Text style={styles.requestUid} numberOfLines={1}>{name}</Text>
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleAccept(uid, name)}
                      >
                        <Ionicons name="checkmark" size={16} color={COLORS.white} />
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleReject(uid, name)}
                      >
                        <Ionicons name="close" size={16} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        {isCreator ? (
          // Creator actions
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Chat', { chatId: `activity_${activity.id}`, activityTitle: activity.title, participantName: activity.creatorName, recipientId: activity.creatorId })}
            activeOpacity={0.85}
          >
            <View style={styles.actionBtnInner}>
              <Ionicons name="chatbubbles" size={18} color={COLORS.white} />
              <Text style={styles.actionBtnText}>Chat with Participants</Text>
            </View>
          </TouchableOpacity>
        ) : (
          // Non-creator actions
          <View style={styles.actionRow}>
            {/* Join / status button */}
            {hasJoined ? (
              <View style={[styles.joinedRow, styles.actionBtnFlex]}>
                <View style={[styles.actionBtn, styles.joinedBtn, { flex: 1 }]}>
                  <View style={styles.actionBtnInner}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                    <Text style={styles.actionBtnText}>You've Joined</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave} activeOpacity={0.85}>
                  <Ionicons name="exit-outline" size={18} color={COLORS.error} />
                  <Text style={styles.leaveBtnText}>Leave</Text>
                </TouchableOpacity>
              </View>
            ) : (requested || hasPendingRequest) ? (
              <View style={[styles.actionBtn, styles.requestedBtn, styles.actionBtnFlex]}>
                <View style={styles.actionBtnInner}>
                  <Ionicons name="time" size={18} color={COLORS.white} />
                  <Text style={styles.actionBtnText}>Request Pending</Text>
                </View>
              </View>
            ) : spotsLeft === 0 ? (
              <View style={[styles.actionBtn, styles.fullBtn, styles.actionBtnFlex]}>
                <Text style={styles.actionBtnText}>Activity Full</Text>
              </View>
            ) : (
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnFlex]} onPress={handleJoin} activeOpacity={0.85}>
                <View style={styles.actionBtnInner}>
                  <Ionicons name="person-add" size={18} color={COLORS.white} />
                  <Text style={styles.actionBtnText}>Request to Join</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Chat button — always visible to contact organiser */}
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => {
                if (!isSubscribed()) {
                  Alert.alert('Subscription Required', 'Subscribe to message activity organisers.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') },
                  ]);
                  return;
                }
                navigation.navigate('Chat', { chatId: `activity_${activity.id}`, activityTitle: activity.title, participantName: activity.creatorName, recipientId: activity.creatorId });
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.primary} />
              <Text style={styles.chatBtnText}>Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function Row({ icon, label, value, color, last }: {
  icon: any; label: string; value: string; color?: string; last?: boolean;
}) {
  return (
    <View style={[rowStyles.row, last && rowStyles.rowLast]}>
      <View style={rowStyles.iconWrap}>
        <Ionicons name={icon} size={18} color={color || COLORS.primary} />
      </View>
      <View style={rowStyles.content}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={[rowStyles.value, color ? { color } : {}]}>{value}</Text>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1, paddingTop: 2 },
  label: { fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: '600' },
  value: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500', marginTop: 3, lineHeight: 20 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  notFoundText: { fontSize: 16, color: COLORS.textMuted, fontWeight: '600' },
  heroBar: {
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backBtn: { padding: 4 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  editBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  heroEmoji: { fontSize: 40, marginBottom: SPACING.sm },
  heroTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white, lineHeight: 28 },
  heroInterest: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  body: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
    ...SHADOW.sm,
  },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  creatorName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  creatorSub: { fontSize: 12, color: COLORS.textMuted },
  requestsHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  requestsTitle: { fontSize: 14, fontWeight: '700', color: COLORS.warning },
  requestRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.sm,
  },
  requestAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  requestAvatarText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  requestUid: { flex: 1, fontSize: 13, color: COLORS.textPrimary, fontWeight: '500' },
  requestActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.success, paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.full },
  acceptBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  rejectBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.error + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.error + '40' },
  joinedRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  leaveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, borderWidth: 1.5,
    borderColor: COLORS.error, backgroundColor: COLORS.error + '10',
  },
  leaveBtnText: { color: COLORS.error, fontSize: 13, fontWeight: '700' },
  noRequestsRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm },
  noRequestsText: { fontSize: 13, color: COLORS.textMuted },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    paddingBottom: 36,
    ...SHADOW.lg,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnFlex: { flex: 1 },
  actionBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  joinedBtn: { backgroundColor: COLORS.success },
  requestedBtn: { backgroundColor: COLORS.warning },
  fullBtn: { backgroundColor: COLORS.textMuted },
  actionBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  chatBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  chatBtnText: { color: COLORS.primary, fontSize: 9, fontWeight: '700' },
});
