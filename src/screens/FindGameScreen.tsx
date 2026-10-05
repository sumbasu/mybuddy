import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Activity } from '../types';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { INTERESTS } from '../constants/interests';
import InterestIcon from '../components/InterestIcon';
import { FONTS, SPACING, RADIUS } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'FindGame'> };

const C = {
  headerBg: '#3F2F86',
  page: '#FAFAFA',
  card: '#FFFFFF',
  heading: '#16213E',
  sub: '#767683',
  muted: '#9A9AA6',
  border: '#ECEBF2',
  purple: '#3D3081',
  lime: '#C8DB2E',
};

const SKILL_LEVELS = ['any', 'beginner', 'intermediate', 'advanced'] as const;
const GENDER_PREFS = ['any', 'male', 'female'] as const;

const AVATAR_COLORS = ['#C8DB2E', '#C7BEEE', '#F3C08C', '#7FD8C9', '#F5A6B8'];
const CATEGORY_COLORS: Record<string, string> = { tennis: '#C8DB2E', pickleball: '#5CE6B8' };
const CATEGORY_PALETTE = ['#C8DB2E', '#5CE6B8', '#FF9F5A', '#5B9EF6', '#F06292', '#B388FF', '#4DD0E1', '#FFB84D'];
const colorForInterest = (id: string) => {
  if (CATEGORY_COLORS[id]) return CATEGORY_COLORS[id];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
};
const initials = (name?: string) => (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
const titleCase = (s: string) => s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
const formatTime12h = (time24: string) => {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

export default function FindGameScreen({ navigation }: Props) {
  const { isSubscribed } = useAuth();
  const { activities, loading } = useActivities();
  const subscribed = isSubscribed();

  const [interestFilter, setInterestFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<typeof SKILL_LEVELS[number]>('any');
  const [genderFilter, setGenderFilter] = useState<typeof GENDER_PREFS[number]>('any');

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (a.status !== 'open') return false;
      if (interestFilter !== 'all' && a.interest !== interestFilter) return false;
      if (skillFilter !== 'any' && a.skillLevel && a.skillLevel !== 'any' && a.skillLevel !== skillFilter) return false;
      if (genderFilter !== 'any' && a.genderPreference && a.genderPreference !== 'any' && a.genderPreference !== genderFilter) return false;
      return true;
    });
  }, [activities, interestFilter, skillFilter, genderFilter]);

  const visible = subscribed ? filtered : filtered.slice(0, 5);
  const hiddenCount = filtered.length - visible.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find a Game</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.sheet}>
        <View style={styles.filters}>
          <Text style={styles.filterLabel}>Sport</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <TouchableOpacity
              style={[styles.sportChip, interestFilter === 'all' && styles.sportChipActive]}
              onPress={() => setInterestFilter('all')}
            >
              <Text style={[styles.sportChipText, interestFilter === 'all' && styles.sportChipTextActive]}>All</Text>
            </TouchableOpacity>
            {INTERESTS.map((i) => (
              <TouchableOpacity
                key={i.id}
                style={[styles.sportChip, interestFilter === i.id && styles.sportChipActive]}
                onPress={() => setInterestFilter(i.id)}
              >
                <InterestIcon id={i.id} size={15} color={interestFilter === i.id ? '#FFFFFF' : C.sub} />
                <Text style={[styles.sportChipText, interestFilter === i.id && styles.sportChipTextActive]}>{i.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.filterRowsPair}>
            <View style={{ flex: 1 }}>
              <Text style={styles.filterLabel}>Skill level</Text>
              <View style={styles.pillRow}>
                {SKILL_LEVELS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.pill, skillFilter === s && styles.pillActive]}
                    onPress={() => setSkillFilter(s)}
                  >
                    <Text style={[styles.pillText, skillFilter === s && styles.pillTextActive]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.filterLabel}>Looking for</Text>
          <View style={styles.pillRow}>
            {GENDER_PREFS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.pill, genderFilter === g && styles.pillActive]}
                onPress={() => setGenderFilter(g)}
              >
                <Text style={[styles.pillText, genderFilter === g && styles.pillTextActive]}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.resultsContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={C.purple} />
            </View>
          ) : visible.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={44} color={C.muted} />
              <Text style={styles.emptyText}>No games match these filters.{'\n'}Try widening your search.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultsCount}>{filtered.length} game{filtered.length === 1 ? '' : 's'} found</Text>
              {visible.map((activity) => (
                <GameRow
                  key={activity.id}
                  activity={activity}
                  onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.id })}
                />
              ))}
              {hiddenCount > 0 && (
                <TouchableOpacity style={styles.upsell} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.85}>
                  <Ionicons name="lock-closed" size={18} color={C.purple} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.upsellTitle}>{hiddenCount} more game{hiddenCount === 1 ? '' : 's'} match</Text>
                    <Text style={styles.upsellSub}>Go Premium to see every result</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={C.muted} />
                </TouchableOpacity>
              )}
            </>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </View>
  );
}

function GameRow({ activity, onPress }: { activity: Activity; onPress: () => void }) {
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.headerBg,
    paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.md,
  },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.extraBold, fontSize: 18, color: '#FFFFFF' },
  sheet: {
    flex: 1, backgroundColor: C.page,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
  },

  filters: {
    paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, paddingBottom: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  filterLabel: {
    fontFamily: FONTS.semiBold, fontSize: 11.5, color: C.sub,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.xs,
  },
  chipRow: { gap: SPACING.sm, paddingBottom: SPACING.md },
  sportChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    minHeight: 40, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full,
    borderWidth: 1.2, borderColor: C.border, backgroundColor: '#FFFFFF',
  },
  sportChipActive: { backgroundColor: C.purple, borderColor: C.purple },
  sportChipText: { fontFamily: FONTS.medium, fontSize: 12.5, color: C.sub },
  sportChipTextActive: { fontFamily: FONTS.bold, color: '#FFFFFF' },

  filterRowsPair: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  pillRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.md, flexWrap: 'wrap' },
  pill: {
    minHeight: 36, justifyContent: 'center', paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full, borderWidth: 1.2, borderColor: C.border, backgroundColor: '#FFFFFF',
  },
  pillActive: { backgroundColor: C.purple, borderColor: C.purple },
  pillText: { fontFamily: FONTS.medium, fontSize: 12.5, color: C.sub },
  pillTextActive: { fontFamily: FONTS.bold, color: '#FFFFFF' },

  resultsContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: SPACING.md },
  resultsCount: { fontFamily: FONTS.semiBold, fontSize: 12.5, color: C.muted, marginBottom: -SPACING.xs },
  loadingWrap: { paddingTop: SPACING.xxl, alignItems: 'center' },
  emptyWrap: { paddingTop: SPACING.xxl, alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.xl },
  emptyText: { fontFamily: FONTS.regular, fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20 },

  upsell: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(63,47,134,0.06)', borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: 'rgba(63,47,134,0.15)',
    padding: SPACING.md,
  },
  upsellTitle: { fontFamily: FONTS.bold, fontSize: 13.5, color: C.heading },
  upsellSub: { fontFamily: FONTS.regular, fontSize: 12, color: C.sub, marginTop: 1 },

  gameCard: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
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
  stackAvatar: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFFFFF',
  },
  stackAvatarText: { fontFamily: FONTS.extraBold, fontSize: 10, color: 'rgba(0,0,0,0.7)' },
  spotsFraction: { fontFamily: FONTS.semiBold, fontSize: 13, color: C.sub },
  joinBtn: {
    backgroundColor: C.purple, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 8,
  },
  joinBtnText: { fontFamily: FONTS.bold, fontSize: 12.5, color: C.lime },
});
