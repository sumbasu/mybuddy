import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
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
  gold: '#E8B84B',
  lime: '#C8DB2E',
  error: '#EF233C',
};

const initials = (name?: string) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

const RESULT_FILTERS = ['5 results', '10 results', 'All results'];

const PREFERENCES: { key: 'bestHand' | 'courtPosition' | 'matchType' | 'preferredTime'; emoji: string; label: string }[] = [
  { key: 'bestHand', emoji: '🤚', label: 'Best hand' },
  { key: 'courtPosition', emoji: '📍', label: 'Court position' },
  { key: 'matchType', emoji: '🥇', label: 'Match type' },
  { key: 'preferredTime', emoji: '🌅', label: 'Preferred time to play' },
];

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout, isSubscribed, setUser } = useAuth();
  const { activities } = useActivities();
  const [resultFilter, setResultFilter] = useState(RESULT_FILTERS[0]);

  const subscribed = isSubscribed();
  const myUid = user?.uid || 'demo_user';
  const matches = activities.filter(
    (a) => a.creatorId === myUid || a.participants.includes(myUid)
  ).length;
  const followers = user?.followersCount ?? 0;
  const following = user?.followingCount ?? 0;

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const editPreferences = () => {
    Alert.alert('Coming soon', 'Editing player preferences will be available in a future update.');
  };

  const removeInterest = (id: string) => {
    if (!user) return;
    const remaining = (user.interests || []).filter((i) => i !== id);
    // Dropping below 2 kicks the whole app into the onboarding interest-picker
    // stack (AppNavigator), which has no way back — keep at least 2 here.
    if (remaining.length < 2) {
      Alert.alert('Keep at least 2', 'You need at least 2 interests so we can match you with people who share them.');
      return;
    }
    setUser({ ...user, interests: remaining });
  };

  return (
    <View style={styles.container}>
      {/* Header — stays on the app's purple */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Body — white sheet */}
      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name || 'Your Name'}</Text>
            {user?.city ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={10} color={C.sub} />
                <Text style={styles.locationText}>{user.city}</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.7}>
                <Text style={styles.addLocationText}>Add my location</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{matches}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{followers}</Text>
            <Text style={styles.statLabel}>{followers < 2 ? 'Follower' : 'Followers'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.85}>
            <Text style={styles.editBtnText}>Edit profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.goProBtn} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.85}>
            <Text style={styles.goProBtnText}>Go Premium</Text>
          </TouchableOpacity>
        </View>

        {/* Interests */}
        <View style={styles.interestsRow}>
          {(user?.interests || []).map((id, i) => {
            const interest = INTERESTS.find((it) => it.id === id);
            return (
              <View key={id} style={[styles.interestChip, i === 0 && styles.interestChipActive]}>
                <Text style={[styles.interestChipText, i === 0 && styles.interestChipTextActive]}>
                  {interest?.label || id}
                </Text>
                <TouchableOpacity onPress={() => removeInterest(id)} hitSlop={8}>
                  <Ionicons name="close" size={13} color={i === 0 ? '#FFFFFF' : C.sub} />
                </TouchableOpacity>
              </View>
            );
          })}
          <TouchableOpacity
            style={styles.addChip}
            onPress={() => navigation.navigate('InterestPicker')}
            activeOpacity={0.8}
          >
            <Text style={styles.addChipText}>+ Add new</Text>
          </TouchableOpacity>
        </View>

        {/* Level progression */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Level progression</Text>
          <View style={styles.filterRow}>
            {RESULT_FILTERS.map((f, i) => {
              const active = f === resultFilter;
              const locked = i > 0 && !subscribed;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setResultFilter(f)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f}</Text>
                  {locked && <Ionicons name="lock-closed" size={10} color={C.muted} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.progressCard}>
            <Ionicons name="stats-chart" size={40} color={C.border} />
            <Text style={styles.progressTitle}>Track your progress</Text>
            <Text style={styles.progressSub}>Play more games to level up your ranking</Text>
          </View>
        </View>

        {/* Player preferences */}
        <View style={styles.section}>
          <View style={styles.prefsHeader}>
            <Text style={styles.sectionTitle}>Player preferences</Text>
            <TouchableOpacity onPress={editPreferences}>
              <Text style={styles.prefsEdit}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={{ gap: SPACING.sm }}>
            {PREFERENCES.map((p) => (
              <View key={p.key} style={styles.prefRow}>
                <Text style={styles.prefEmoji}>{p.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prefLabel}>{p.label}</Text>
                  <Text style={styles.prefValue}>{user?.[p.key] || 'Not set'}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutBtnText}>Log out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.headerBg },
  header: {
    backgroundColor: C.headerBg,
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerIcons: { flexDirection: 'row', gap: SPACING.md },
  headerIconBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },

  sheet: {
    flex: 1, backgroundColor: C.page,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
  },
  sheetContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, paddingBottom: SPACING.xxl },

  identityRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.lg },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.heading,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: FONTS.bold, fontSize: 20, color: '#FFFFFF', letterSpacing: 0.7 },
  name: { fontFamily: FONTS.extraBold, fontSize: 19, color: C.heading },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  locationText: { fontSize: 12, fontFamily: FONTS.medium, color: C.sub },
  addLocationText: { fontSize: 13.5, fontFamily: FONTS.semiBold, color: C.purple, marginTop: 4 },

  statsCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.sm, marginBottom: SPACING.lg,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: FONTS.extraBold, fontSize: 22, color: C.heading },
  statLabel: { fontFamily: FONTS.regular, fontSize: 11, color: C.sub, marginTop: 2 },
  statDivider: { width: 1, height: '70%', backgroundColor: C.border },

  actionsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  editBtn: {
    flex: 1, height: 44, borderRadius: RADIUS.lg,
    borderWidth: 1.4, borderColor: C.purple,
    alignItems: 'center', justifyContent: 'center',
  },
  editBtnText: { fontFamily: FONTS.bold, fontSize: 13.5, color: C.purple },
  goProBtn: {
    flex: 1, height: 44, borderRadius: RADIUS.lg,
    backgroundColor: C.heading,
    alignItems: 'center', justifyContent: 'center',
  },
  goProBtnText: { fontFamily: FONTS.extraBold, fontSize: 13.5, color: C.lime },

  interestsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.lg },
  interestChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: RADIUS.lg, paddingVertical: 7, paddingHorizontal: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2, borderColor: C.border,
  },
  interestChipActive: { backgroundColor: C.heading, borderColor: C.heading },
  interestChipText: { fontFamily: FONTS.bold, fontSize: 12, color: C.sub },
  interestChipTextActive: { color: '#FFFFFF' },
  addChip: {
    borderRadius: RADIUS.lg, minHeight: 44, paddingHorizontal: SPACING.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2, borderColor: C.border,
  },
  addChipText: { fontFamily: FONTS.bold, fontSize: 12, color: C.sub },

  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 15.5, color: C.heading },
  filterRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.sm, marginBottom: SPACING.sm },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    height: 44, paddingHorizontal: SPACING.md, borderRadius: RADIUS.lg,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2, borderColor: C.border,
  },
  filterChipActive: { backgroundColor: C.border, borderColor: C.border },
  filterChipText: { fontFamily: FONTS.semiBold, fontSize: 11, color: C.sub },
  filterChipTextActive: { color: C.heading },
  progressCard: {
    alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.lg, paddingVertical: SPACING.xl, paddingHorizontal: SPACING.md,
  },
  progressTitle: { fontFamily: FONTS.bold, fontSize: 13, color: C.heading, marginTop: 6 },
  progressSub: { fontFamily: FONTS.regular, fontSize: 10.5, color: C.sub, textAlign: 'center' },

  prefsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  prefsEdit: { fontFamily: FONTS.semiBold, fontSize: 12, color: C.purple },
  prefRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  prefEmoji: { fontSize: 19 },
  prefLabel: { fontFamily: FONTS.medium, fontSize: 11.5, color: C.sub },
  prefValue: { fontFamily: FONTS.bold, fontSize: 11.5, color: C.heading, marginTop: 2 },

  logoutBtn: {
    height: 44, borderRadius: RADIUS.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  logoutBtnText: { fontFamily: FONTS.bold, fontSize: 13, color: C.error, letterSpacing: 0.3 },
});
