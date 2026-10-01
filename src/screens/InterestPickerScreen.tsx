import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { INTERESTS, INTEREST_CATEGORIES } from '../constants/interests';
import { useAuth } from '../context/AuthContext';
import InterestIcon from '../components/InterestIcon';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'InterestPicker'> };

const MIN_SELECTED = 2;

// Purple header + rounded white sheet — same convention as Welcome/Settings/Profile.
const C = {
  purple: '#3F2F86',
  page: '#FAFAFA',
  card: '#FFFFFF',
  heading: '#16213E',
  sub: '#767683',
  subtle: '#9A9AA6',
  border: '#ECEBF2',
  tint: '#ECEBF4',
  onBrandMuted: 'rgba(255,255,255,0.72)',
  disabled: '#DCDCE4',
};

export default function InterestPickerScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();
  const [selected, setSelected] = useState<string[]>(user?.interests || []);
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const count = selected.length;
  const canContinue = count >= MIN_SELECTED && !loading;
  const remaining = Math.max(0, MIN_SELECTED - count);

  const save = async () => {
    if (count < MIN_SELECTED || !user) return;
    setLoading(true);
    await setUser({ ...user, interests: selected });
    // Reached two ways: pushed from Profile/EditProfile inside the main stack
    // (go back to it), or shown by AppNavigator during onboarding, in which
    // case there's nothing to go back to — it swaps to the main stack itself
    // once `user.interests` has 2+ entries.
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
    setLoading(false);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Choose an activity</Text>
        <Text style={styles.subtitle}>
          Choose at least {MIN_SELECTED} and we'll match you with people who share them.
        </Text>
      </View>

      <View style={styles.sheet}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 120 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statusRow}>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{count} selected</Text>
            </View>
            <Text style={styles.statusHint}>
              {canContinue ? "You're all set" : `Pick ${remaining} more`}
            </Text>
          </View>

          {INTEREST_CATEGORIES.map((cat) => (
            <View key={cat.id} style={styles.section}>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
              <View style={styles.grid}>
                {INTERESTS.filter((i) => i.category === cat.id).map((interest) => {
                  const isSelected = selected.includes(interest.id);
                  return (
                    <TouchableOpacity
                      key={interest.id}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => toggle(interest.id)}
                      activeOpacity={0.8}
                    >
                      <InterestIcon id={interest.id} size={18} color={isSelected ? COLORS.accent : C.subtle} />
                      <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                        {interest.label}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.btn, !canContinue && styles.btnDisabled]}
            onPress={save}
            disabled={!canContinue}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <View style={styles.btnInner}>
                <Text style={[styles.btnText, !canContinue && styles.btnTextDisabled]}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color={canContinue ? COLORS.accent : C.subtle} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.purple },

  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginBottom: SPACING.lg,
  },
  title: { fontFamily: FONTS.semiBold, fontSize: 30, lineHeight: 36, color: COLORS.white, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, lineHeight: 22, color: C.onBrandMuted, marginTop: SPACING.xs },

  sheet: {
    flex: 1,
    backgroundColor: C.page,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },

  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  countPill: {
    backgroundColor: C.tint,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  countPillText: { fontWeight: '700', fontSize: 14, color: C.heading },
  statusHint: { fontSize: 14, color: C.sub },

  section: { marginTop: SPACING.xl },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    backgroundColor: C.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    borderWidth: 1.5,
    borderColor: C.border,
    gap: SPACING.xs,
    ...SHADOW.sm,
  },
  chipSelected: {
    backgroundColor: C.heading,
    borderColor: C.heading,
  },
  chipLabel: { fontSize: 13, fontWeight: '500', color: C.heading },
  chipLabelSelected: { color: COLORS.white, fontWeight: '700' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.page,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  btn: {
    height: 56,
    backgroundColor: C.heading,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { backgroundColor: C.disabled },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  btnTextDisabled: { color: C.subtle },
});
