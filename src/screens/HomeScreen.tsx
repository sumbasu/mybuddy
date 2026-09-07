import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Activity } from '../types';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { INTERESTS } from '../constants/interests';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

const initials = (name?: string) =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

// Each sport gets its own accent color on Home game cards, e.g. Tennis = lime, Pickleball = teal.
const CATEGORY_COLORS: Record<string, string> = {
  tennis: '#C5E637',
  pickleball: '#5CE6B8',
};
const CATEGORY_PALETTE = ['#C5E637', '#5CE6B8', '#FF9F5A', '#5B9EF6', '#F06292', '#B388FF', '#4DD0E1', '#FFB84D'];
const colorForInterest = (id: string) => {
  if (CATEGORY_COLORS[id]) return CATEGORY_COLORS[id];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
};

const QUICK_ACTIONS = [
  { key: 'find',  label: 'Find a game',  icon: 'view-grid-plus-outline' as const,   onPress: (nav: any) => nav.navigate('Community') },
  { key: 'add',   label: 'Add a game',   icon: 'calendar-plus-outline' as const,    onPress: (nav: any) => nav.navigate('CreateActivity') },
  { key: 'book',  label: 'Book a court', icon: 'credit-card-marker-outline' as const, onPress: (nav: any) => {} },
  { key: 'learn', label: 'Learn',        icon: 'school-outline' as const,           onPress: (nav: any) => {} },
];

export default function HomeScreen({ navigation }: Props) {
  const { user, isSubscribed, isTrialActive } = useAuth();
  const { activities } = useActivities();
  const [refreshing, setRefreshing] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const subscribed = isSubscribed();
  const openActivities = activities.filter((a) => a.status === 'open');
  const visibleGames = subscribed ? openActivities : openActivities.slice(0, 5);
  const hiddenGamesCount = openActivities.length - visibleGames.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.textPrimary} />}
      >
        {/* Header */}
        <View style={styles.headerTopBox}>
          <Text style={styles.headerTitle}>SWEATBUD</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Chats')} hitSlop={8}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} hitSlop={8}>
              <Ionicons name="menu-outline" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerSubRow}>
          <Ionicons name="location-sharp" size={9} color={COLORS.textSecondary} />
          <Text style={styles.headerSub}>Hi, {user?.name?.split(' ')[0] || 'there'} · {user?.city || 'India'}</Text>
        </View>

        {/* Body — sections spread evenly across the remaining screen height */}
        <View style={styles.body}>
          {/* Upgrade banner */}
          {!subscribed && !bannerDismissed && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.banner}
                onPress={() => navigation.navigate('Subscription')}
                activeOpacity={0.85}
              >
                <View style={styles.bannerIconWrap}>
                  <MaterialCommunityIcons name="crown-outline" size={16} color={COLORS.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>Upgrade to Club Pro</Text>
                  <Text style={styles.bannerSub}>Unlimited games, connections & more</Text>
                </View>
                <TouchableOpacity onPress={() => setBannerDismissed(true)} hitSlop={8}>
                  <Ionicons name="close" size={13} color={COLORS.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          )}

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
                    <MaterialCommunityIcons name={qa.icon} size={22} color={COLORS.ctaText} />
                  </View>
                  <Text style={styles.quickLabel}>{qa.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Games near you */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Games near you</Text>
                <TouchableOpacity
                  onPress={() => Alert.alert('Games near you', 'Matched to your interests and location, closest first.')}
                  hitSlop={8}
                >
                  <Ionicons name="information-circle-outline" size={13} color={COLORS.textMuted} />
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
                  <Ionicons name="lock-closed" size={20} color={COLORS.textSecondary} />
                  <Text style={styles.moreCardCount}>+{hiddenGamesCount} more</Text>
                  <Text style={styles.moreCardLabel}>Go Pro to unlock all</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function GameCard({ activity, onPress }: { activity: Activity; onPress: () => void }) {
  const interest = INTERESTS.find((i) => i.id === activity.interest);
  const spotsLeft = activity.slots - activity.joinedCount;
  const date = new Date(activity.date);
  const dateStr = date.toLocaleDateString('en-IN', { weekday: 'short' }) + ' ' + activity.time;
  const avatars = [activity.creatorName, ...activity.participants].slice(0, 2);
  const accentColor = colorForInterest(activity.interest);

  return (
    <TouchableOpacity style={styles.gameCard} onPress={onPress} activeOpacity={0.9}>
      <View style={[styles.gameCardTop, { backgroundColor: accentColor }]}>
        <View style={styles.tagPill}>
          <Text style={styles.tagPillText}>{(interest?.label || activity.interest).toUpperCase()}</Text>
        </View>
        <Text style={styles.spotsLeft}>{spotsLeft > 0 ? `${spotsLeft} left` : 'Full'}</Text>
      </View>
      <View style={styles.gameCardBody}>
        <Text style={styles.gameTitle} numberOfLines={1}>{activity.title}</Text>
        {!!activity.description && (
          <Text style={styles.gameDesc} numberOfLines={2}>{activity.description}</Text>
        )}
        <View style={styles.gameMetaRow}>
          <Ionicons name="location-outline" size={9} color="rgba(240,237,228,0.6)" />
          <Text style={styles.gameMetaText} numberOfLines={1}>{activity.location.name}</Text>
        </View>
        <View style={styles.gameMetaRow}>
          <Ionicons name="time-outline" size={9} color="rgba(240,237,228,0.6)" />
          <Text style={styles.gameMetaText}>{dateStr}</Text>
        </View>
        <View style={styles.gameFooter}>
          <View style={styles.avatarStack}>
            {avatars.map((name, i) => (
              <View
                key={i}
                style={[styles.stackAvatar, { backgroundColor: accentColor }, i > 0 && { marginLeft: -6 }]}
              >
                <Text style={styles.stackAvatarText}>{initials(name)}</Text>
              </View>
            ))}
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
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  body: { flex: 1, justifyContent: 'center', gap: SPACING.xl, paddingBottom: 160 },
  headerTopBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
  },
  headerTitle: { fontFamily: FONTS.display, fontSize: 26, color: COLORS.textPrimary, letterSpacing: 0.5 },
  headerIcons: { flexDirection: 'row', gap: SPACING.md },
  headerSubRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm,
  },
  headerSub: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textSecondary },

  section: { paddingHorizontal: SPACING.md },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.surface, borderWidth: 0.8, borderColor: 'rgba(240,237,228,0.18)',
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
  },
  bannerIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 0.8, borderColor: 'rgba(240,237,228,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle: { fontFamily: FONTS.semiBold, fontSize: 10.5, color: COLORS.textPrimary },
  bannerSub: { fontFamily: FONTS.regular, fontSize: 8.9, color: 'rgba(240,237,228,0.55)', marginTop: 2 },

  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickItem: { alignItems: 'center', gap: 8, width: 64 },
  quickIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.accent, shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  quickLabel: { fontFamily: FONTS.semiBold, fontSize: 8.9, color: 'rgba(240,237,228,0.85)', textAlign: 'center' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.textPrimary },
  seeAll: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textSecondary },

  gameRow: { gap: SPACING.sm, paddingRight: SPACING.md },
  gameCard: {
    width: 155, backgroundColor: COLORS.surface, borderWidth: 0.8, borderColor: 'rgba(240,237,228,0.14)',
    borderRadius: RADIUS.lg, overflow: 'hidden',
  },
  gameCardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.sm, paddingVertical: 6,
  },
  tagPill: { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2 },
  tagPillText: { fontFamily: FONTS.extraBold, fontSize: 7.3, color: 'rgba(0,0,0,0.65)', letterSpacing: 0.5 },
  spotsLeft: { fontFamily: FONTS.bold, fontSize: 8.1, color: 'rgba(0,0,0,0.65)' },
  gameCardBody: { padding: SPACING.sm },
  gameTitle: { fontFamily: FONTS.bold, fontSize: 10.5, color: COLORS.textPrimary },
  gameDesc: { fontFamily: FONTS.regular, fontSize: 8.1, color: 'rgba(240,237,228,0.55)', marginTop: 2, lineHeight: 11.3 },
  gameMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  gameMetaText: { fontFamily: FONTS.regular, fontSize: 8.1, color: 'rgba(240,237,228,0.6)', flex: 1 },
  gameFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm },
  avatarStack: { flexDirection: 'row' },
  stackAvatar: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.accent,
    borderWidth: 1.6, borderColor: 'rgba(75,59,140,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  stackAvatarText: { fontFamily: FONTS.extraBold, fontSize: 5.6, color: 'rgba(0,0,0,0.7)' },
  joinBtn: { backgroundColor: COLORS.ctaBg, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 5 },
  joinBtnText: { fontFamily: FONTS.bold, fontSize: 8.9, color: COLORS.ctaText },

  moreCard: {
    width: 130, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', gap: 4,
    borderWidth: 0.8, borderColor: 'rgba(240,237,228,0.14)', borderStyle: 'dashed',
  },
  moreCardCount: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.textPrimary, marginTop: 4 },
  moreCardLabel: { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.textSecondary },
});
