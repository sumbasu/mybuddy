import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar,
  ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  doc, onSnapshot, updateDoc, arrayUnion, arrayRemove,
  increment, collection, addDoc, serverTimestamp, setDoc, getDoc,
} from 'firebase/firestore';
import { auth } from '../services/firebase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Activity } from '../types';
import { useAuth } from '../context/AuthContext';
import { INTERESTS } from '../constants/interests';
import InterestIcon from '../components/InterestIcon';
import { FONTS, SPACING } from '../constants/theme';
import { DEMO_ACTIVITIES } from '../constants/demoData';
import { db } from '../services/firebase';
import StarRating from '../components/StarRating';
import { submitRating, hasAlreadyRated } from '../services/ratings';

// Flat light page, card-based layout — matches the Pick Interests redesign.
const C = {
  brand: '#695DA1',
  navy: '#3D3081',
  lime: '#C9E24B',
  bg: '#F7F7F9',
  surface: '#FFFFFF',
  border: '#E6E6EC',
  text: '#3D3081',
  textMuted: '#6E6E80',
  textSubtle: '#9A9AAB',
  tint: '#ECEBF4',
  success: '#1F9D6B',
  warning: '#B8860B',
  warningBg: '#FFF6DC',
  error: '#EF233C',
  errorBg: '#FDEDEF',
  disabled: '#DCDCE4',
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ActivityDetail'>;
  route: RouteProp<RootStackParamList, 'ActivityDetail'>;
};

export default function ActivityDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { activityId } = route.params;
  const { user, isSubscribed } = useAuth();
  const [requested, setRequested] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [organiserRating, setOrganiserRating] = useState<{ rating: number; reviewCount: number }>({ rating: 0, reviewCount: 0 });
  // Initialise from local cache for instant display, but always subscribe to Firestore for live data
  const [activity, setActivity] = useState<Activity | null>(
    DEMO_ACTIVITIES[activityId] || null
  );
  const [loadingActivity, setLoadingActivity] = useState(true);

  // ── ALL hooks must be before any conditional return ────────────────

  useEffect(() => {
    const ref = doc(db, 'activities', activityId);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setActivity({ id: snap.id, ...snap.data() } as Activity);
      } else if (DEMO_ACTIVITIES[activityId]) {
        setActivity(DEMO_ACTIVITIES[activityId]);
      }
      setLoadingActivity(false);
    }, () => {
      if (DEMO_ACTIVITIES[activityId]) setActivity(DEMO_ACTIVITIES[activityId]);
      setLoadingActivity(false);
    });
    return unsubscribe;
  }, [activityId]);

  // Load organiser rating
  useEffect(() => {
    if (!activity?.creatorId) return;
    getDoc(doc(db, 'users', activity.creatorId)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setOrganiserRating({ rating: d.rating || 0, reviewCount: d.reviewCount || 0 });
      }
    });
  }, [activity?.creatorId]);

  // Check if user already rated this activity's organiser
  useEffect(() => {
    if (!user?.uid || !activity?.id) return;
    const passed = activity?.date ? new Date(activity.date) < new Date() : false;
    if (!passed) return;
    hasAlreadyRated(activity.id, user.uid).then(setAlreadyRated);
  }, [activity?.id, user?.uid, activity?.date]);

  // ── Conditional returns AFTER all hooks ────────────────────────────

  if (loadingActivity) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.brand} size="large" />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={C.textSubtle} />
        <Text style={styles.notFoundText}>Activity not found</Text>
      </View>
    );
  }

  const interest = INTERESTS.find((i) => i.id === activity.interest);
  const spotsLeft = activity.slots - activity.joinedCount;
  const isFull = spotsLeft <= 0;
  const fillPct = activity.slots > 0 ? Math.min(100, (activity.joinedCount / activity.slots) * 100) : 0;
  const date = new Date(activity.date);
  const dateStr = date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const activityPassed = new Date(activity.date) < new Date();

  const submitRatingHandler = async () => {
    if (!user || selectedStars === 0) return;
    setRatingSubmitting(true);
    try {
      await submitRating({
        activityId: activity.id,
        activityTitle: activity.title,
        raterId: user.uid,
        ratedUserId: activity.creatorId,
        score: selectedStars,
      });
      setAlreadyRated(true);
      setShowRatingModal(false);
      Alert.alert('Thank you!', `You rated ${activity.creatorName} ${selectedStars} star${selectedStars > 1 ? 's' : ''}.`);
    } catch (err: any) {
      if (err.message === 'ALREADY_RATED') {
        setAlreadyRated(true);
        setShowRatingModal(false);
      } else {
        Alert.alert('Error', 'Could not submit rating. Please try again.');
      }
    }
    setRatingSubmitting(false);
  };
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
        [`pendingRequestNames.${currentUser.uid}`]: user.name || user.email || 'Anonymous',
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
        senderName: 'sweatbud',
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
        senderName: 'sweatbud',
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
            senderId: 'system', senderName: 'sweatbud',
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

  const openMessage = () => {
    if (!isSubscribed()) {
      Alert.alert('Subscription Required', 'Subscribe to message activity organisers.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') },
      ]);
      return;
    }
    navigation.navigate('Chat', { chatId: `activity_${activity.id}`, activityTitle: activity.title, participantName: activity.creatorName, recipientId: activity.creatorId });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.roundBtn} onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={C.brand} />
          </TouchableOpacity>
          {isCreator && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('CreateActivity', { activityId: activity.id })}
            >
              <Ionicons name="create-outline" size={16} color={C.brand} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sportTile}>
          <InterestIcon id={interest?.id} size={26} color={C.lime} />
        </View>
        <Text style={styles.title}>{activity.title}</Text>
        <View style={styles.sportPill}>
          <Text style={styles.sportPillText}>{interest?.label || activity.interest}</Text>
        </View>
      </View>

      <View style={styles.sheet}>
        <ScrollView
          contentContainerStyle={{ paddingTop: SPACING.lg, paddingHorizontal: SPACING.lg, paddingBottom: 140 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <DetailRow icon="calendar-outline" label="Date" value={dateStr} />
            <Divider />
            <DetailRow icon="time-outline" label="Time" value={activity.time} />
            <Divider />
            <DetailRow icon="location-outline" label="Location" value={activity.location.name} sub={activity.location.address} />
            {activity.skillLevel && activity.skillLevel !== 'any' && (
              <>
                <Divider />
                <DetailRow icon="bar-chart-outline" label="Skill Level" value={activity.skillLevel.charAt(0).toUpperCase() + activity.skillLevel.slice(1)} />
              </>
            )}
            {activity.genderPreference && activity.genderPreference !== 'any' && (
              <>
                <Divider />
                <DetailRow icon="person-outline" label="Looking for" value={activity.genderPreference.charAt(0).toUpperCase() + activity.genderPreference.slice(1)} />
              </>
            )}
          </View>

          <View style={[styles.card, styles.spotsCard]}>
            <View style={styles.spotsTop}>
              <View style={styles.rowIcon}>
                <Ionicons name="people-outline" size={20} color={C.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Spots</Text>
                <Text style={[styles.rowValue, { color: isFull ? C.textMuted : C.success }]}>
                  {isFull ? 'No spots left' : `${spotsLeft} of ${activity.slots} left`}
                </Text>
              </View>
            </View>
            <View style={styles.track}>
              <View style={[styles.trackFill, { width: `${fillPct}%` }]} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>About this activity</Text>
          <View style={styles.card}>
            <Text style={activity.description ? styles.body : [styles.body, { color: C.textSubtle }]}>
              {activity.description || 'No description provided.'}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Organiser</Text>
          <View style={[styles.card, styles.organiser]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{activity.creatorName[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.orgName}>{activity.creatorName}</Text>
              <StarRating
                rating={organiserRating.rating}
                size={14}
                showLabel
                reviewCount={organiserRating.reviewCount}
              />
            </View>
            <TouchableOpacity style={styles.msgBtn} onPress={openMessage} activeOpacity={0.8}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={C.brand} />
              <Text style={styles.msgText}>Message</Text>
            </TouchableOpacity>
          </View>

          {/* Pending join requests — always visible to creator */}
          {isCreator && (
            <>
              <Text style={styles.sectionTitle}>
                Join Requests{(activity.pendingRequests?.length || 0) > 0 ? ` (${activity.pendingRequests.length})` : ''}
              </Text>
              {(!activity.pendingRequests || activity.pendingRequests.length === 0) ? (
                <View style={[styles.card, styles.noRequestsRow]}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={C.textSubtle} />
                  <Text style={styles.noRequestsText}>No pending requests</Text>
                </View>
              ) : (
                activity.pendingRequests.map((uid) => {
                  const name = activity.pendingRequestNames?.[uid] || `User ${uid.slice(-6)}`;
                  return (
                    <View key={uid} style={[styles.card, styles.requestRow]}>
                      <View style={styles.requestAvatar}>
                        <Text style={styles.requestAvatarText}>{name[0].toUpperCase()}</Text>
                      </View>
                      <Text style={styles.requestUid} numberOfLines={1}>{name}</Text>
                      <View style={styles.requestActions}>
                        <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(uid, name)}>
                          <Ionicons name="checkmark" size={16} color="#fff" />
                          <Text style={styles.acceptBtnText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(uid, name)}>
                          <Ionicons name="close" size={16} color={C.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {isCreator ? (
            <TouchableOpacity
              style={styles.cta}
              onPress={() => navigation.navigate('Chat', { chatId: `activity_${activity.id}`, activityTitle: activity.title, participantName: activity.creatorName, recipientId: activity.creatorId })}
              activeOpacity={0.9}
            >
              <Ionicons name="chatbubbles" size={20} color={C.lime} />
              <Text style={styles.ctaText}>Chat with Participants</Text>
            </TouchableOpacity>
          ) : hasJoined ? (
            <View style={styles.joinedRow}>
              <View style={[styles.cta, styles.joinedCta, { flex: 1 }]}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.ctaText}>You've joined</Text>
              </View>
              <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave} activeOpacity={0.85}>
                <Ionicons name="exit-outline" size={18} color={C.error} />
                <Text style={styles.leaveBtnText}>Leave</Text>
              </TouchableOpacity>
            </View>
          ) : (requested || hasPendingRequest) ? (
            <View style={[styles.cta, styles.requestedCta]}>
              <Ionicons name="time" size={20} color="#fff" />
              <Text style={styles.ctaText}>Request pending</Text>
            </View>
          ) : isFull ? (
            <View style={[styles.cta, styles.ctaDisabled]}>
              <Text style={[styles.ctaText, { color: C.textSubtle }]}>Activity is full</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.cta} onPress={handleJoin} activeOpacity={0.9}>
              <Ionicons name="person-add-outline" size={20} color={C.lime} />
              <Text style={styles.ctaText}>Request to join</Text>
            </TouchableOpacity>
          )}

          {/* Rate organiser — only after activity date passes and user joined */}
          {!isCreator && activityPassed && hasJoined && (
            <TouchableOpacity
              style={[styles.rateBtn, alreadyRated && styles.rateBtnDone]}
              onPress={() => !alreadyRated && setShowRatingModal(true)}
              activeOpacity={alreadyRated ? 1 : 0.85}
            >
              <Ionicons
                name={alreadyRated ? 'star' : 'star-outline'}
                size={16}
                color={alreadyRated ? '#F59E0B' : C.brand}
              />
              <Text style={[styles.rateBtnText, alreadyRated && styles.rateBtnTextDone]}>
                {alreadyRated ? 'You rated this organiser' : `Rate ${activity.creatorName}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Rating Modal */}
      <Modal visible={showRatingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Rate {activity.creatorName}</Text>
            <Text style={styles.modalSub}>How was your experience with this organiser?</Text>

            <View style={styles.starsRow}>
              <StarRating
                rating={selectedStars}
                size={40}
                interactive
                onChange={setSelectedStars}
              />
            </View>

            <Text style={styles.starLabel}>
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][selectedStars] || 'Tap a star'}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowRatingModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, (selectedStars === 0 || ratingSubmitting) && styles.modalSubmitBtnDisabled]}
                onPress={submitRatingHandler}
                disabled={selectedStars === 0 || ratingSubmitting}
              >
                {ratingSubmitting
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={styles.modalSubmitText}>Submit Rating</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ icon, label, value, sub }: {
  icon: any; label: string; value: string; sub?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={C.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, backgroundColor: C.bg },
  notFoundText: { fontFamily: FONTS.semiBold, fontSize: 16, color: C.textSubtle },

  header: { paddingHorizontal: SPACING.lg, paddingBottom: 4 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg },
  roundBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    height: 40, paddingHorizontal: SPACING.md, borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
  },
  editBtnText: { fontFamily: FONTS.bold, color: C.brand, fontSize: 13 },
  sportTile: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: C.brand,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm + 2,
  },
  title: { fontFamily: FONTS.extraBold, fontSize: 26, lineHeight: 32, color: C.text, letterSpacing: -0.3 },
  sportPill: {
    alignSelf: 'flex-start', marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm + 2, paddingVertical: 6,
    borderRadius: 12, backgroundColor: C.tint,
  },
  sportPillText: { fontFamily: FONTS.semiBold, fontSize: 13, color: C.text },

  sheet: { flex: 1, backgroundColor: C.bg },

  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: SPACING.md, paddingVertical: 4,
    marginBottom: SPACING.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md },
  rowIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.tint,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { fontFamily: FONTS.regular, fontSize: 13, color: C.textSubtle, marginBottom: 2 },
  rowValue: { fontFamily: FONTS.semiBold, fontSize: 16, color: C.text },
  rowSub: { fontFamily: FONTS.regular, fontSize: 14, color: C.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: C.border, marginLeft: 54 },

  spotsCard: { marginTop: -SPACING.sm, paddingVertical: SPACING.md },
  spotsTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  track: { height: 8, borderRadius: 4, backgroundColor: C.tint, marginTop: SPACING.md, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 4, backgroundColor: C.brand },

  sectionTitle: { fontFamily: FONTS.extraBold, fontSize: 19, color: C.text, marginBottom: SPACING.sm + 2 },
  body: { fontFamily: FONTS.regular, fontSize: 15, lineHeight: 22, color: C.textMuted, paddingVertical: SPACING.sm },

  organiser: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: FONTS.extraBold, fontSize: 18, color: '#fff' },
  orgName: { fontFamily: FONTS.extraBold, fontSize: 16, color: C.text, marginBottom: 2 },
  msgBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    height: 38, paddingHorizontal: SPACING.md, borderRadius: 19,
    borderWidth: 1.5, borderColor: C.brand,
  },
  msgText: { fontFamily: FONTS.semiBold, fontSize: 14, color: C.brand },

  noRequestsRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md },
  noRequestsText: { fontFamily: FONTS.regular, fontSize: 13, color: C.textSubtle },
  requestRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm },
  requestAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
  requestAvatarText: { fontFamily: FONTS.bold, fontSize: 14, color: '#fff' },
  requestUid: { flex: 1, fontFamily: FONTS.medium, fontSize: 13, color: C.text },
  requestActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 36, backgroundColor: C.success, paddingHorizontal: SPACING.sm, borderRadius: 18 },
  acceptBtnText: { fontFamily: FONTS.bold, color: '#fff', fontSize: 12 },
  rejectBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.errorBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239,35,60,0.3)' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.bg,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  cta: {
    height: 56, borderRadius: 18,
    backgroundColor: C.brand,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
  },
  ctaDisabled: { backgroundColor: C.disabled },
  ctaText: { fontFamily: FONTS.extraBold, fontSize: 16, color: '#fff' },
  joinedRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  joinedCta: { backgroundColor: C.success },
  requestedCta: { backgroundColor: C.warning },
  leaveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    height: 56, paddingHorizontal: SPACING.md,
    borderRadius: 18, borderWidth: 1.5,
    borderColor: C.error, backgroundColor: C.errorBg,
  },
  leaveBtnText: { fontFamily: FONTS.bold, color: C.error, fontSize: 13 },
  rateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: SPACING.sm, borderRadius: 18,
    borderWidth: 1.5, borderColor: C.brand, backgroundColor: C.tint,
  },
  rateBtnDone: { borderColor: '#F59E0B', backgroundColor: '#FEF3C7' },
  rateBtnText: { fontFamily: FONTS.bold, fontSize: 13, color: C.brand },
  rateBtnTextDone: { color: '#B45309' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SPACING.xl, paddingBottom: 48, alignItems: 'center',
  },
  modalTitle: { fontFamily: FONTS.extraBold, fontSize: 19, color: C.text, marginBottom: SPACING.xs },
  modalSub: { fontFamily: FONTS.regular, fontSize: 14, color: C.textMuted, marginBottom: SPACING.xl },
  starsRow: { marginBottom: SPACING.md },
  starLabel: { fontFamily: FONTS.bold, fontSize: 16, color: C.text, height: 24, marginBottom: SPACING.xl },
  modalActions: { flexDirection: 'row', gap: SPACING.md, width: '100%' },
  modalCancelBtn: {
    flex: 1, paddingVertical: SPACING.md, borderRadius: 18,
    borderWidth: 1.5, borderColor: C.border, alignItems: 'center',
  },
  modalCancelText: { fontFamily: FONTS.semiBold, color: C.textMuted, fontSize: 15 },
  modalSubmitBtn: {
    flex: 2, paddingVertical: SPACING.md, borderRadius: 18,
    backgroundColor: C.brand, alignItems: 'center',
  },
  modalSubmitBtnDisabled: { backgroundColor: C.disabled },
  modalSubmitText: { fontFamily: FONTS.bold, color: '#fff', fontSize: 15 },
});
