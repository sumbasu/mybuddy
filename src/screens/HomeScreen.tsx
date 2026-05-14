import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Dimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Activity } from '../types';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { INTERESTS } from '../constants/interests';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';

const CARD_WIDTH = Dimensions.get('window').width - SPACING.lg * 2;

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

const CATEGORIES = [
  { id: 'sports',  label: 'Sports',  emoji: '🏆', color: '#FF6B35' },
  { id: 'fitness', label: 'Fitness', emoji: '💪', color: '#06D6A0' },
];

export default function HomeScreen({ navigation }: Props) {
  const { user, isSubscribed, isTrialActive } = useAuth();
  const { activities } = useActivities();
  const unreadCount = useUnreadCount(user?.uid);
  const [refreshing, setRefreshing] = useState(false);

  const trialDaysLeft = user?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const myUid = user?.uid || 'demo_user';
  const myActivities = activities.filter(a => a.creatorId === myUid);
  const myJoined = activities.filter(a => a.participants.includes(myUid) && a.creatorId !== myUid);
  const openActivities = activities.filter(a => a.status === 'open');
  const featuredActivities = openActivities.slice(0, 6);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const getInterestActivities = (interestId: string) =>
    activities.filter(a => {
      const interest = INTERESTS.find(i => i.id === a.interest);
      return interest?.category === interestId || a.interest === interestId;
    }).slice(0, 6);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hey, {user?.name?.split(' ')[0] || 'there'}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={12} color={COLORS.primary} />
              <Text style={styles.locationText}>{user?.city || 'India'}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => (navigation as any).navigate('Chats')}
          >
            {isTrialActive() && trialDaysLeft <= 3 ? (
              <View style={styles.trialPill}>
                <Text style={styles.trialPillText}>{trialDaysLeft}d left</Text>
              </View>
            ) : (
              <View style={styles.notifIconWrap}>
                <Ionicons name="notifications" size={20} color={COLORS.textPrimary} />
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Trial banner */}
        {isTrialActive() && (
          <TouchableOpacity style={styles.trialBanner} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.9}>
            <Ionicons name="star" size={14} color={COLORS.white} />
            <Text style={styles.trialBannerText}>
              Free trial — {trialDaysLeft} days left. Upgrade to keep access!
            </Text>
            <Text style={styles.trialBannerCta}>Upgrade →</Text>
          </TouchableOpacity>
        )}

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          <StatCard icon="calendar-outline" label="Open" value={String(openActivities.length)} color={COLORS.primary} onPress={() => (navigation as any).navigate('Activities', {})} />
          <View style={styles.statDivider} />
          <StatCard icon="create-outline" label="Created" value={String(myActivities.length)} color={COLORS.accent} onPress={() => (navigation as any).navigate('Activities', { initialTab: 'Created by Me' })} />
          <View style={styles.statDivider} />
          <StatCard icon="people-outline" label="Joined" value={String(myJoined.length)} color={COLORS.success} onPress={() => (navigation as any).navigate('Activities', { initialTab: 'Joined' })} />
          <View style={styles.statDivider} />
          <StatCard icon="location-outline" label="City" value={user?.city?.split(' ')[0] || 'India'} color="#9B5DE5" />
        </View>

        {/* Featured Today — horizontal carousel */}
        {featuredActivities.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚡ Featured Today</Text>
              <Text style={styles.seeAll}>{featuredIndex + 1} / {featuredActivities.length}</Text>
            </View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToAlignment="center"
              onScroll={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
                setFeaturedIndex(Math.max(0, Math.min(idx, featuredActivities.length - 1)));
              }}
              scrollEventThrottle={16}
              contentContainerStyle={styles.featuredCarousel}
            >
              {featuredActivities.map((activity) => (
                <FeaturedCard
                  key={activity.id}
                  activity={activity}
                  onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.id })}
                />
              ))}
            </ScrollView>
            {/* Dot indicators */}
            {featuredActivities.length > 1 && (
              <View style={styles.carouselDots}>
                {featuredActivities.map((_, i) => (
                  <View key={i} style={[styles.dot, i === featuredIndex && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse by Category</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Activities')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, { backgroundColor: cat.color + '18' }]}
                onPress={() => (navigation as any).navigate('Activities', { category: cat.id })}
                activeOpacity={0.85}
              >
                <View style={[styles.categoryIconWrap, { backgroundColor: cat.color + '25' }]}>
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                </View>
                <Text style={[styles.categoryLabel, { color: cat.color }]}>{cat.label}</Text>
                <Text style={styles.categoryCount}>
                  {getInterestActivities(cat.id).length} activities
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nearby — horizontal scroll cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Near You</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Activities')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {openActivities.map(activity => (
              <HorizontalCard
                key={activity.id}
                activity={activity}
                onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.id })}
              />
            ))}
          </ScrollView>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('CreateActivity')} activeOpacity={0.85}>
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="add-circle" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.quickActionLabel}>Post Activity</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => (navigation as any).navigate('Activities')} activeOpacity={0.85}>
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.accent + '20' }]}>
                <Ionicons name="search" size={24} color={COLORS.accent} />
              </View>
              <Text style={styles.quickActionLabel}>Discover</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => (navigation as any).navigate('Chats')} activeOpacity={0.85}>
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="chatbubbles" size={24} color={COLORS.success} />
              </View>
              <Text style={styles.quickActionLabel}>Messages</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.85}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#9B5DE5' + '20' }]}>
                <Ionicons name="star" size={24} color="#9B5DE5" />
              </View>
              <Text style={styles.quickActionLabel}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value, color, onPress }: { icon: any; label: string; value: string; color: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={16} color={color} />
      <Text
        style={[styles.statValue, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function FeaturedCard({ activity, onPress }: { activity: Activity; onPress: () => void }) {
  const interest = INTERESTS.find(i => i.id === activity.interest);
  const spotsLeft = activity.slots - activity.joinedCount;
  const date = new Date(activity.date);
  const dateStr = date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity style={styles.featuredCard} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.featuredTop}>
        <View style={styles.featuredEmojiWrap}>
          <Text style={styles.featuredEmoji}>{interest?.emoji || '🎯'}</Text>
        </View>
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>{spotsLeft} spots left</Text>
        </View>
      </View>
      <Text style={styles.featuredTitle}>{activity.title}</Text>
      {activity.description && (
        <Text style={styles.featuredDesc} numberOfLines={2}>{activity.description}</Text>
      )}
      <View style={styles.featuredMeta}>
        <View style={styles.featuredMetaItem}>
          <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.8)" />
          <Text style={styles.featuredMetaText}>{dateStr}</Text>
        </View>
        <View style={styles.featuredMetaItem}>
          <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
          <Text style={styles.featuredMetaText}>{activity.time}</Text>
        </View>
        <View style={styles.featuredMetaItem}>
          <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.8)" />
          <Text style={styles.featuredMetaText} numberOfLines={1}>{activity.location.name}</Text>
        </View>
      </View>
      <View style={styles.featuredFooter}>
        <Text style={styles.featuredCreator}>By {activity.creatorName}</Text>
        <View style={styles.featuredBtn}>
          <Text style={styles.featuredBtnText}>View Details</Text>
          <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function HorizontalCard({ activity, onPress }: { activity: Activity; onPress: () => void }) {
  const interest = INTERESTS.find(i => i.id === activity.interest);
  const spotsLeft = activity.slots - activity.joinedCount;
  const date = new Date(activity.date);
  const dateStr = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity style={styles.hCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.hCardTop}>
        <View style={styles.hCardEmoji}>
          <Text style={{ fontSize: 22 }}>{interest?.emoji || '🎯'}</Text>
        </View>
        <View style={[styles.hCardSpots, spotsLeft === 0 && styles.hCardSpotsFull]}>
          <Text style={[styles.hCardSpotsText, spotsLeft === 0 && styles.hCardSpotsTextFull]}>
            {spotsLeft === 0 ? 'Full' : `${spotsLeft} left`}
          </Text>
        </View>
      </View>
      <Text style={styles.hCardTitle} numberOfLines={2}>{activity.title}</Text>
      <View style={styles.hCardMeta}>
        <Ionicons name="calendar-outline" size={11} color={COLORS.textMuted} />
        <Text style={styles.hCardMetaText}>{dateStr}</Text>
      </View>
      <View style={styles.hCardMeta}>
        <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
        <Text style={styles.hCardMetaText} numberOfLines={1}>{activity.location.name}</Text>
      </View>
      <Text style={styles.hCardCreator}>By {activity.creatorName}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  locationText: { fontSize: 12, color: COLORS.textSecondary },
  notifBtn: {},
  notifIconWrap: { position: 'relative', padding: 8, backgroundColor: COLORS.surfaceSecondary, borderRadius: RADIUS.full },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.error, borderWidth: 1.5, borderColor: COLORS.surface },
  unreadBadge: { position: 'absolute', top: 2, right: 2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: COLORS.surface },
  unreadBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
  trialPill: { backgroundColor: COLORS.warning, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  trialPillText: { fontSize: 11, fontWeight: '700', color: '#000' },

  trialBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
  },
  trialBannerText: { fontSize: 12, color: COLORS.white, flex: 1 },
  trialBannerCta: { fontSize: 12, color: COLORS.white, fontWeight: '700' },

  statsStrip: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    borderRadius: RADIUS.lg, paddingVertical: SPACING.md,
    ...SHADOW.sm,
  },
  statCard: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: 6 },

  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  // Featured carousel
  featuredCarousel: { gap: SPACING.md },
  carouselDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: SPACING.md },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  dotActive: { width: 20, backgroundColor: COLORS.primary },

  // Featured card — fixed width so pagingEnabled snaps per card
  featuredCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl,
    padding: SPACING.lg, ...SHADOW.lg,
  },
  featuredTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  featuredEmojiWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  featuredEmoji: { fontSize: 26 },
  featuredBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  featuredBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  featuredTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white, marginBottom: 6 },
  featuredDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 19, marginBottom: SPACING.md },
  featuredMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.md },
  featuredMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featuredMetaText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500' },
  featuredFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  featuredCreator: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontStyle: 'italic' },
  featuredBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.white, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full },
  featuredBtnText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },

  // Category grid
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  categoryCard: { width: '47.5%', borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOW.sm },
  categoryIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  categoryEmoji: { fontSize: 22 },
  categoryLabel: { fontSize: 14, fontWeight: '700' },
  categoryCount: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  // Horizontal cards
  horizontalList: { paddingRight: SPACING.lg, gap: SPACING.md },
  hCard: {
    width: 160, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, ...SHADOW.sm,
  },
  hCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  hCardEmoji: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center' },
  hCardSpots: { backgroundColor: COLORS.success + '20', paddingHorizontal: 6, paddingVertical: 3, borderRadius: RADIUS.full },
  hCardSpotsFull: { backgroundColor: COLORS.textMuted + '20' },
  hCardSpotsText: { fontSize: 10, color: COLORS.success, fontWeight: '700' },
  hCardSpotsTextFull: { color: COLORS.textMuted },
  hCardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm, lineHeight: 18 },
  hCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 3 },
  hCardMetaText: { fontSize: 11, color: COLORS.textSecondary, flex: 1 },
  hCardCreator: { fontSize: 10, color: COLORS.textMuted, fontStyle: 'italic', marginTop: 4 },

  // Quick actions
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickActionBtn: { alignItems: 'center', gap: SPACING.xs },
  quickActionIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
});
