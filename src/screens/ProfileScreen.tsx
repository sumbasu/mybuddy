import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { INTERESTS } from '../constants/interests';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

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
  const { user, logout } = useAuth();
  const { activities } = useActivities();
  const [resultFilter, setResultFilter] = useState(RESULT_FILTERS[0]);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Chats')} hitSlop={8}>
              <Ionicons name="notifications-outline" size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} hitSlop={8}>
              <Ionicons name="settings-outline" size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name || 'Your Name'}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={9} color={COLORS.locationGreen} />
              <Text style={styles.locationText}>{user?.city || 'India'}</Text>
            </View>
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
            <Text style={styles.statLabel}>Followers</Text>
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
            <Text style={styles.goProBtnText}>Go Pro ✦</Text>
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
            {RESULT_FILTERS.map((f) => {
              const active = f === resultFilter;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setResultFilter(f)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.progressCard}>
            <Ionicons name="stats-chart" size={40} color="rgba(240,237,228,0.35)" />
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
  container: { flex: 1 },
  header: {
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: {
    fontFamily: FONTS.display,
    fontSize: 21,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1.7,
  },
  headerIcons: { flexDirection: 'row', gap: SPACING.md },

  sheet: { flex: 1 },
  sheetContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.xxl },

  identityRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  avatar: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(240,237,228,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.textPrimary, letterSpacing: 0.7 },
  name: { fontFamily: FONTS.extraBold, fontSize: 16, color: COLORS.textPrimary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  locationText: { fontSize: 10.5, fontFamily: FONTS.medium, color: COLORS.locationGreen },

  statsCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 0.8, borderColor: 'rgba(240,237,228,0.14)',
    borderRadius: RADIUS.md, paddingVertical: SPACING.sm, marginBottom: SPACING.md,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: FONTS.extraBold, fontSize: 17, color: COLORS.textPrimary },
  statLabel: { fontFamily: FONTS.regular, fontSize: 8.5, color: 'rgba(240,237,228,0.55)', marginTop: 2 },
  statDivider: { width: 0.8, height: '70%', backgroundColor: 'rgba(240,237,228,0.15)' },

  actionsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  editBtn: {
    flex: 1, height: 32, borderRadius: RADIUS.lg,
    borderWidth: 1.2, borderColor: 'rgba(240,237,228,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  editBtnText: { fontFamily: FONTS.bold, fontSize: 10.5, color: COLORS.textPrimary },
  goProBtn: {
    flex: 1, height: 32, borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(197,230,55,0.18)',
    borderWidth: 1.2, borderColor: 'rgba(197,230,55,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  goProBtnText: { fontFamily: FONTS.extraBold, fontSize: 10.5, color: COLORS.accent },

  interestsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.lg },
  interestChip: {
    borderRadius: RADIUS.lg, paddingVertical: 5, paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.2, borderColor: 'rgba(240,237,228,0.3)',
  },
  interestChipActive: { backgroundColor: COLORS.ctaBg, borderColor: COLORS.ctaBg },
  interestChipText: { fontFamily: FONTS.bold, fontSize: 9.7, color: COLORS.textPrimary },
  interestChipTextActive: { color: COLORS.ctaText },
  addChip: {
    borderRadius: RADIUS.lg, paddingVertical: 5, paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.2, borderColor: 'rgba(240,237,228,0.3)',
  },
  addChipText: { fontFamily: FONTS.bold, fontSize: 9.7, color: COLORS.textPrimary },

  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.textPrimary },
  filterRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.sm, marginBottom: SPACING.sm },
  filterChip: {
    height: 26, paddingHorizontal: SPACING.md, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 0.8, borderColor: 'rgba(240,237,228,0.25)',
  },
  filterChipActive: { backgroundColor: COLORS.ctaBg, borderColor: COLORS.ctaBg },
  filterChipText: { fontFamily: FONTS.bold, fontSize: 8.9, color: 'rgba(240,237,228,0.6)' },
  filterChipTextActive: { color: COLORS.ctaText },
  progressCard: {
    alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 0.8, borderColor: 'rgba(240,237,228,0.14)',
    borderRadius: RADIUS.lg, paddingVertical: SPACING.xl, paddingHorizontal: SPACING.md,
  },
  progressTitle: { fontFamily: FONTS.bold, fontSize: 11.3, color: COLORS.textPrimary, marginTop: 6 },
  progressSub: { fontFamily: FONTS.regular, fontSize: 8.9, color: 'rgba(240,237,228,0.5)', textAlign: 'center' },

  prefsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  prefsEdit: { fontFamily: FONTS.semiBold, fontSize: 10.5, color: COLORS.locationGreen },
  prefRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 0.8, borderColor: 'rgba(240,237,228,0.13)',
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  prefEmoji: { fontSize: 19 },
  prefLabel: { fontFamily: FONTS.medium, fontSize: 10.5, color: 'rgba(240,237,228,0.75)' },
  prefValue: { fontFamily: FONTS.bold, fontSize: 10.5, color: COLORS.accent, marginTop: 2 },

  logoutBtn: {
    height: 39, borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.2, borderColor: 'rgba(240,237,228,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoutBtnText: { fontFamily: FONTS.bold, fontSize: 11.3, color: 'rgba(240,237,228,0.55)', letterSpacing: 0.3 },
});
