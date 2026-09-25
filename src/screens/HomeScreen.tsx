import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar, Alert, Linking, Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Activity } from '../types';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { INTERESTS } from '../constants/interests';
import { FONTS, SPACING, RADIUS } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

// White-body layout matching the Playtomic reference — purple header, white sheet below.
const C = {
  headerBg: '#3F2F86',
  page: '#FFFFFF',
  card: '#FFFFFF',
  heading: '#16213E',
  sub: '#767683',
  muted: '#9A9AA6',
  border: '#ECEBF2',
  purple: '#3F2F86',
  purpleTint: 'rgba(63,47,134,0.08)',
  purpleLight: '#52449A',
  lime: '#C8DB2E',
  limeDark: '#3F2F86',
};

const initials = (name?: string) =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

// Each sport gets its own accent color on Home game cards, e.g. Tennis = lime, Pickleball = teal.
const CATEGORY_COLORS: Record<string, string> = {
  tennis: '#C8DB2E',
  pickleball: '#5CE6B8',
};
const CATEGORY_PALETTE = ['#C8DB2E', '#5CE6B8', '#FF9F5A', '#5B9EF6', '#F06292', '#B388FF', '#4DD0E1', '#FFB84D'];
const AVATAR_COLORS = ['#C8DB2E', '#C7BEEE', '#F3C08C', '#7FD8C9', '#F5A6B8'];
const colorForInterest = (id: string) => {
  if (CATEGORY_COLORS[id]) return CATEGORY_COLORS[id];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
};

const QUICK_ACTIONS = [
  { key: 'find',  label: 'Find a game',  icon: 'magnify' as const,                  onPress: (nav: any) => nav.navigate('Community') },
  { key: 'host',  label: 'Add a game',   icon: 'calendar-plus-outline' as const,    onPress: (nav: any) => nav.navigate('CreateActivity') },
  { key: 'book',  label: 'Book a court', icon: 'view-grid-outline' as const,        onPress: (nav: any) => {} },
  { key: 'learn', label: 'Learn',        icon: 'school-outline' as const,           onPress: (nav: any) => {} },
];

const titleCase = (s: string) => s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());

const formatTime12h = (time24: string) => {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

export default function HomeScreen({ navigation }: Props) {
  const { user, isSubscribed, isTrialActive } = useAuth();
  const { activities } = useActivities();
  const [refreshing, setRefreshing] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const enableLocation = async () => {
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

    // Already asked before and said no — iOS/Android won't show the system
    // prompt again, so the only way to turn it on is through device Settings.
    if (existingStatus === 'denied') {
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setLocationEnabled(true);
    } else {
      // Denied just now — send them to Settings so they can turn it on there.
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    }
  };

  const subscribed = isSubscribed();
  const openActivities = activities.filter((a) => a.status === 'open');
  const visibleGames = subscribed ? openActivities : openActivities.slice(0, 5);
  const hiddenGamesCount = openActivities.length - visibleGames.length;

  const upgradeBanner = !subscribed && (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.banner}
        onPress={() => navigation.navigate('Subscription')}
        activeOpacity={0.85}
      >
        <View style={styles.bannerIconWrap}>
          <MaterialCommunityIcons name="crown-outline" size={16} color={C.lime} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Upgrade to Premium Now</Text>
          <Text style={styles.bannerSub}>Unlimited games, connections & more</Text>
        </View>
        {!bannerDismissed && (
          <TouchableOpacity style={styles.bannerDismissBtn} onPress={() => setBannerDismissed(true)}>
            <Ionicons name="close" size={13} color={C.muted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header — stays on the app's purple */}
      <View style={styles.headerTopBox}>
        <Text style={styles.headerTitle}>sweatbud</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.bellIconBtn} onPress={() => (navigation as any).navigate('Chats')}>
            <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Body — white sheet */}
      <ScrollView
        style={styles.sheet}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.purple} />}
      >
        <Text style={styles.greeting}>Hey {user?.name?.split(' ')[0] || 'there'}, let's get moving</Text>

        {/* Upgrade banner — sits up top until dismissed, then moves to the bottom */}
        {!bannerDismissed && upgradeBanner}

        {/* Quick actions */}
        <View style={styles.section}>
          <View style={styles.quickRow}>
            {QUICK_ACTIONS.map((qa) => (
              <TouchableOpacity
                key={qa.key}
                style={styles.quickItem}
                onPress={() => qa.onPress(navigation)}
                activeOpacity={0.8}
              >
                <View style={styles.quickIconWrap}>
                  <MaterialCommunityIcons name={qa.icon} size={22} color={C.limeDark} />
                </View>
                <Text style={styles.quickLabel}>{qa.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location prompt */}
        {!locationEnabled && (
          <View style={styles.section}>
            <View style={styles.locationCard}>
              <View style={styles.locationIconWrap}>
                <Ionicons name="location-outline" size={20} color={C.heading} />
              </View>
              <Text style={styles.locationCardText}>
                Turn on location to see games near you
              </Text>
              <TouchableOpacity
                style={styles.locationEnableBtn}
                onPress={() =>
                  Alert.alert('Enable location', 'Do you want to enable location now?', [
                    { text: 'Not now', style: 'cancel' },
                    { text: 'Yes', onPress: enableLocation },
                  ])
                }
                activeOpacity={0.85}
              >
                <Text style={styles.locationEnableBtnText}>Enable</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Games near you */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Games near you</Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Games near you', 'Matched to your interests and location, closest first.')}
                hitSlop={16}
              >
                <Ionicons name="information-circle-outline" size={13} color={C.muted} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Community')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gameRow}>
            {visibleGames.map((activity) => (
              <GameCard
                key={activity.id}
                activity={activity}
                onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.id })}
              />
            ))}
            {hiddenGamesCount > 0 && (
              <TouchableOpacity
                style={styles.moreCard}
                onPress={() => navigation.navigate('Subscription')}
                activeOpacity={0.85}
              >
                <Ionicons name="lock-closed" size={20} color={C.sub} />
                <Text style={styles.moreCardCount}>+{hiddenGamesCount} more</Text>
                <Text style={styles.moreCardLabel}>Go Pro to unlock all</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Dismissed upgrade banner sinks to the bottom of the screen, reachable by scrolling down */}
        {bannerDismissed && <View style={{ marginTop: 55 }}>{upgradeBanner}</View>}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function GameCard({ activity, onPress }: { activity: Activity; onPress: () => void }) {
  const interest = INTERESTS.find((i) => i.id === activity.interest);
  const spotsLeft = activity.slots - activity.joinedCount;
  const date = new Date(activity.date);
  const dateStr = date.toLocaleDateString('en-IN', { weekday: 'short' }) + ', ' + formatTime12h(activity.time);
  const avatars = [activity.creatorName, ...activity.participants].slice(0, 2);
  const accentColor = colorForInterest(activity.interest);

  return (
    <TouchableOpacity style={styles.gameCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.gameCardTop}>
        <View style={[styles.tagPill, { backgroundColor: accentColor + '33' }]}>
          <Text style={styles.tagPillText}>{interest?.label || activity.interest}</Text>
        </View>
        <Text style={styles.spotsLeft}>{spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left` : 'Full'}</Text>
      </View>
      <View style={styles.gameCardBody}>
        <Text style={styles.gameTitle} numberOfLines={2}>{activity.title}</Text>
        {!!activity.description && (
          <Text style={styles.gameDesc} numberOfLines={2}>{activity.description}</Text>
        )}
        <Text style={styles.gameMetaText} numberOfLines={1}>{titleCase(activity.location.name)}</Text>
        <Text style={styles.gameMetaText}>{dateStr}</Text>
        <View style={styles.gameFooter}>
          <View style={styles.avatarStackRow}>
            <View style={styles.avatarStack}>
              {avatars.map((name, i) => (
                <View
                  key={i}
                  style={[styles.stackAvatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }, i > 0 && { marginLeft: -8 }]}
                >
                  <Text style={styles.stackAvatarText}>{initials(name)}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.spotsFraction}>{activity.joinedCount}/{activity.slots}</Text>
          </View>
          <View style={styles.joinBtn}>
            <Text style={styles.joinBtnText}>Join</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.headerBg },
  sheet: {
    flex: 1, backgroundColor: C.page,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  scrollContent: { paddingBottom: SPACING.md },
  headerTopBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.headerBg,
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
  },
  headerTitle: { fontFamily: FONTS.display, fontSize: 26, color: '#FFFFFF', letterSpacing: 0.5 },
  headerIcons: { flexDirection: 'row', gap: SPACING.md },
  headerIconBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  bellIconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.purpleLight,
    alignItems: 'center', justifyContent: 'center',
  },

  greeting: {
    fontSize: 18, fontFamily: FONTS.bold, color: C.heading,
    paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, paddingBottom: SPACING.sm,
  },

  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.lg },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: C.purpleTint, borderWidth: 0.8, borderColor: C.border,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
  },
  bannerIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#FFFFFF', borderWidth: 0.8, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  bannerDismissBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontFamily: FONTS.semiBold, fontSize: 11.3, color: C.purple },
  bannerSub: { fontFamily: FONTS.regular, fontSize: 9.7, color: C.sub, marginTop: 2 },

  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickItem: { alignItems: 'center', gap: 8, width: 64 },
  quickIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontFamily: FONTS.semiBold, fontSize: 9.7, color: C.heading, textAlign: 'center' },

  locationCard: {
    flexDirection: 'row',
    backgroundColor: '#F4F3F9', borderRadius: RADIUS.lg,
    padding: SPACING.md, gap: SPACING.sm, alignItems: 'center',
  },
  locationIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  locationCardText: { flex: 1, fontFamily: FONTS.medium, fontSize: 12.5, color: C.heading, lineHeight: 17 },
  locationEnableBtn: {
    backgroundColor: C.purple, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg, height: 44, alignItems: 'center', justifyContent: 'center',
  },
  locationEnableBtnText: { fontFamily: FONTS.bold, fontSize: 12.5, color: '#FFFFFF' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 16, color: C.heading },
  seeAll: { fontFamily: FONTS.semiBold, fontSize: 12.5, color: C.purple },

  gameRow: { gap: SPACING.md, paddingRight: SPACING.md },
  gameCard: {
    width: 265, backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.xl,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  gameCardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.md,
  },
  tagPill: { borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  tagPillText: { fontFamily: FONTS.bold, fontSize: 12.5, color: C.heading },
  spotsLeft: { fontFamily: FONTS.bold, fontSize: 11.5, color: '#D14343' },
  gameCardBody: { padding: SPACING.md, paddingTop: SPACING.sm },
  gameTitle: { fontFamily: FONTS.bold, fontSize: 16, color: C.heading, lineHeight: 21 },
  gameDesc: { fontFamily: FONTS.regular, fontSize: 12, color: C.sub, marginTop: 3, lineHeight: 16 },
  gameMetaText: { fontFamily: FONTS.regular, fontSize: 12.5, color: C.sub, marginTop: 4 },
  gameFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md },
  avatarStackRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  avatarStack: { flexDirection: 'row' },
  spotsFraction: { fontFamily: FONTS.semiBold, fontSize: 13, color: C.sub },
  stackAvatar: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: C.lime,
    borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  stackAvatarText: { fontFamily: FONTS.extraBold, fontSize: 10, color: 'rgba(0,0,0,0.7)' },
  joinBtn: { backgroundColor: C.purple, borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2 },
  joinBtnText: { fontFamily: FONTS.bold, fontSize: 13.5, color: '#FFFFFF' },

  moreCard: {
    width: 130, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', gap: 4,
    borderWidth: 0.8, borderColor: C.border, borderStyle: 'dashed',
  },
  moreCardCount: { fontFamily: FONTS.semiBold, fontSize: 12, color: C.heading, marginTop: 4 },
  moreCardLabel: { fontFamily: FONTS.regular, fontSize: 10, color: C.sub },
});
