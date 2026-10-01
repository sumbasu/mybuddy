import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { INTERESTS, INTEREST_CATEGORIES } from '../constants/interests';
import { useAuth } from '../context/AuthContext';
import InterestIcon from '../components/InterestIcon';
import { FONTS, SPACING } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'InterestPicker'> };

const MIN_SELECTED = 2;

// Flat light page, no purple header — matches the Activity Detail redesign.
const C = {
  brand: '#695DA1',
  lime: '#C9E24B',
  bg: '#F7F7F9',
  surface: '#FFFFFF',
  border: '#E6E6EC',
  text: '#1B1F3B',
  textMuted: '#6E6E80',
  textSubtle: '#9A9AAB',
  tint: '#ECEBF4',
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
    // (go back to it), or shown by AppNavigator during onboarding.
    //
    // The onboarding case can't rely on AppNavigator's conditional screen
    // list to auto-navigate away: "InterestPicker" is registered as a route
    // name in BOTH the gated onboarding stack and the main app stack (so it
    // can also be reached later from Profile), so when `user.interests`
    // flips the routing condition, React Navigation sees the same active
    // route name persist across the re-render and never treats it as a
    // navigation — the screen just sits there even though the underlying
    // stack config changed. Reset explicitly instead of waiting for it.
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
    setLoading(false);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={C.brand} />
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
                      <InterestIcon id={interest.id} size={18} color={isSelected ? C.lime : C.textSubtle} />
                      <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                        {interest.label}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
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
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.btnInner}>
                <Text style={[styles.btnText, !canContinue && styles.btnTextDisabled]}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color={canContinue ? C.lime : C.textSubtle} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: { paddingHorizontal: SPACING.lg, paddingBottom: 4 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: SPACING.lg,
  },
  title: { fontFamily: FONTS.extraBold, fontSize: 28, lineHeight: 34, color: C.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, lineHeight: 22, color: C.textMuted, marginTop: SPACING.xs },

  sheet: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },

  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  countPill: {
    backgroundColor: C.tint,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
  },
  countPillText: { fontWeight: '700', fontSize: 14, color: C.text },
  statusHint: { fontSize: 14, color: C.textMuted },

  section: { marginTop: SPACING.xl },
  categoryLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 20,
    color: C.text,
    marginBottom: SPACING.sm + 2,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    height: 44,
    paddingHorizontal: SPACING.md,
    borderRadius: 22,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  chipSelected: {
    backgroundColor: C.brand,
    borderColor: C.brand,
  },
  chipLabel: { fontWeight: '700', fontSize: 15, color: C.textMuted },
  chipLabelSelected: { color: '#fff' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.bg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  btn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: C.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnDisabled: { backgroundColor: C.disabled },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { fontFamily: FONTS.extraBold, color: '#fff', fontSize: 17 },
  btnTextDisabled: { color: C.textSubtle },
});
