import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Animated, LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Activity } from '../types';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { INTERESTS } from '../constants/interests';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

const TABS = ['Discover', 'Created by Me', 'Joined'] as const;
type TabType = typeof TABS[number];

export default function ActivitiesScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { activities: allActivities } = useActivities();
  const route = useRoute();
  const categoryFilter = (route.params as any)?.category as string | undefined;
  const initialTab = (route.params as any)?.initialTab as TabType | undefined;
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'Discover');
  const [refreshing, setRefreshing] = useState(false);
  const [tabWidth, setTabWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const switchTab = (tab: TabType) => {
    const idx = TABS.indexOf(tab);
    Animated.spring(slideAnim, {
      toValue: idx * tabWidth,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start();
    setActiveTab(tab);
  };

  const onTabBarLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width / TABS.length;
    setTabWidth(w);
    slideAnim.setValue(TABS.indexOf(activeTab) * w);
  };

  const myCreated = allActivities.filter(a => a.creatorId === (user?.uid || 'demo_user'));
  const myJoined  = allActivities.filter(a => a.participants.includes(user?.uid || 'demo_user') && a.creatorId !== (user?.uid || 'demo_user'));

  const discoverActivities = categoryFilter
    ? allActivities.filter(a => {
        const interest = INTERESTS.find(i => i.id === a.interest);
        return interest?.category === categoryFilter;
      })
    : allActivities;

  const data =
    activeTab === 'Discover'      ? discoverActivities :
    activeTab === 'Created by Me' ? myCreated :
    myJoined;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Activities</Text>
          {categoryFilter && (
            <View style={styles.filterTag}>
              <Ionicons name="funnel" size={11} color={COLORS.primary} />
              <Text style={styles.filterTagText}>
                {categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} only
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateActivity')}
        >
          <Ionicons name="add" size={20} color={COLORS.white} />
          <Text style={styles.createBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented control */}
      <View style={styles.segmentWrapper}>
        <View style={styles.segmentTrack} onLayout={onTabBarLayout}>
          {tabWidth > 0 && (
            <Animated.View
              style={[
                styles.segmentPill,
                { width: tabWidth - 6, transform: [{ translateX: Animated.add(slideAnim, new Animated.Value(3)) }] },
              ]}
            />
          )}
          {TABS.map((tab) => {
            const active = activeTab === tab;
            const cfg = {
              Discover:      { icon: 'compass-outline',   label: 'Discover' },
              'Created by Me': { icon: 'create-outline',  label: 'Mine' },
              Joined:        { icon: 'checkmark-done-outline', label: 'Joined' },
            } as const;
            const { icon, label } = cfg[tab];
            return (
              <TouchableOpacity
                key={tab}
                style={styles.segmentBtn}
                onPress={() => switchTab(tab)}
                activeOpacity={0.8}
              >
                <Ionicons name={icon} size={15} color={active ? COLORS.white : COLORS.textSecondary} />
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {activeTab === 'Created by Me' && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Activities you've posted. Tap to manage participants and join requests.
            </Text>
          </View>
        )}

        {activeTab === 'Joined' && (
          <View style={styles.infoBox}>
            <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.success} />
            <Text style={[styles.infoText, { color: COLORS.success }]}>
              Activities you've joined or been accepted into.
            </Text>
          </View>
        )}

        {data.length === 0 ? (
          <EmptyState tab={activeTab} onPress={() => navigation.navigate('CreateActivity')} />
        ) : (
          data.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              isOwner={activity.creatorId === (user?.uid || '')}
              onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.id })}
            />
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

function ActivityCard({
  activity, isOwner, onPress,
}: {
  activity: Activity; isOwner: boolean; onPress: () => void;
}) {
  const interest = INTERESTS.find((i) => i.id === activity.interest);
  const spotsLeft = activity.slots - activity.joinedCount;
  const date = new Date(activity.date);
  const dateStr = date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      {isOwner && (
        <View style={styles.ownerTag}>
          <Ionicons name="create-outline" size={11} color="#7C3AED" />
          <Text style={styles.ownerTagText}>Created by you</Text>
        </View>
      )}

      <View style={styles.cardTop}>
        <View style={styles.interestBadge}>
          <Text style={styles.interestEmoji}>{interest?.emoji || '🎯'}</Text>
          <Text style={styles.interestLabel}>{interest?.label || activity.interest}</Text>
        </View>
        <View style={[styles.spotsBadge, spotsLeft === 0 && styles.spotsBadgeFull]}>
          <Text style={[styles.spotsText, spotsLeft === 0 && styles.spotsTextFull]}>
            {spotsLeft === 0 ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
          </Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>{activity.title}</Text>

      <View style={styles.cardMeta}>
        <MetaItem icon="calendar-outline" text={dateStr} />
        <MetaItem icon="time-outline" text={activity.time} />
        <MetaItem icon="location-outline" text={activity.location.name} />
      </View>

      {isOwner && activity.pendingRequests.length > 0 && (
        <View style={styles.requestsAlert}>
          <Ionicons name="people-outline" size={14} color={COLORS.warning} />
          <Text style={styles.requestsAlertText}>
            {activity.pendingRequests.length} pending join request{activity.pendingRequests.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.creatorText}>
          {isOwner ? `${activity.joinedCount}/${activity.slots} joined` : `By ${activity.creatorName}`}
        </Text>
        <View style={styles.viewBtn}>
          <Text style={styles.viewBtnText}>{isOwner ? 'Manage →' : 'View →'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function MetaItem({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={12} color={COLORS.textMuted} />
      <Text style={styles.metaText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function EmptyState({ tab, onPress }: { tab: TabType; onPress: () => void }) {
  const config = {
    'Discover':      { emoji: '🔍', title: 'No activities found',       sub: 'Check back soon or create your own!' },
    'Created by Me': { emoji: '✏️',  title: 'No activities created yet', sub: 'Post your first activity and find a buddy.' },
    'Joined':        { emoji: '🤝',  title: 'You haven\'t joined any',   sub: 'Browse Discover to find activities near you.' },
  };
  const c = config[tab];
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>{c.emoji}</Text>
      <Text style={styles.emptyTitle}>{c.title}</Text>
      <Text style={styles.emptySub}>{c.sub}</Text>
      {tab === 'Created by Me' && (
        <TouchableOpacity style={styles.emptyBtn} onPress={onPress}>
          <Text style={styles.emptyBtnText}>+ Post an Activity</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full,
  },
  createBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  filterTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.sm, paddingVertical: 2,
    borderRadius: RADIUS.full, alignSelf: 'flex-start', marginTop: 3,
  },
  filterTagText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  segmentWrapper: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: '#EFEFEF',
    borderRadius: RADIUS.full,
    height: 42,
    position: 'relative',
  },
  segmentPill: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    zIndex: 1,
  },
  segmentText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  segmentTextActive: { color: COLORS.white, fontWeight: '700' },
  feed: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary + '12', borderRadius: RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.md,
  },
  infoText: { fontSize: 12, color: COLORS.primary, flex: 1, lineHeight: 18 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm,
  },
  ownerTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: 'rgba(124, 58, 237, 0.12)', paddingHorizontal: SPACING.sm,
    paddingVertical: 3, borderRadius: RADIUS.full, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.35)',
  },
  ownerTagText: { fontSize: 11, color: '#7C3AED', fontWeight: '700' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  interestBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary + '15', paddingHorizontal: SPACING.sm,
    paddingVertical: 4, borderRadius: RADIUS.full,
  },
  interestEmoji: { fontSize: 13 },
  interestLabel: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  spotsBadge: {
    backgroundColor: COLORS.success + '20', paddingHorizontal: SPACING.sm,
    paddingVertical: 4, borderRadius: RADIUS.full,
  },
  spotsBadgeFull: { backgroundColor: COLORS.textMuted + '30' },
  spotsText: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
  spotsTextFull: { color: COLORS.textMuted },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: COLORS.textSecondary, maxWidth: 120 },
  requestsAlert: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.warning + '20', borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 5, marginBottom: SPACING.sm,
    alignSelf: 'flex-start',
  },
  requestsAlertText: { fontSize: 12, color: COLORS.warning, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  creatorText: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  viewBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md,
    paddingVertical: 6, borderRadius: RADIUS.full,
  },
  viewBtnText: { fontSize: 12, color: COLORS.white, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: SPACING.xxl },
  emptyEmoji: { fontSize: 52, marginBottom: SPACING.md },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.lg },
  emptyBtn: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl, borderRadius: RADIUS.full,
  },
  emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
