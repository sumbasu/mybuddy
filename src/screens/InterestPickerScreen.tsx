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
import { FONTS, SPACING, RADIUS, SHADOW } from '../constants/theme';

// White sheet with a purple header — matches the rest of the app, not the
// old dark-gradient theme this screen used to carry.
const C = {
  page: '#FAFAFA',
  purple: '#3F2F86',
  heading: '#16213E',
  sub: '#767683',
  muted: '#9A9AA6',
  border: '#ECEBF2',
};

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'InterestPicker'> };

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

  const save = async () => {
    if (selected.length < 2 || !user) return;
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
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Pick Your Interests</Text>
        <Text style={styles.subtitle}>
          Choose at least 2 — we'll match you with people who share them
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{selected.length} selected</Text>
        </View>
      </View>

      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
                      <InterestIcon id={interest.id} size={16} color={isSelected ? '#FFFFFF' : C.heading} />
                      <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                        {interest.label}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.btn, (selected.length < 2 || loading) && styles.btnDisabled]}
            onPress={save}
            disabled={selected.length < 2 || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : selected.length < 2 ? (
              <Text style={styles.btnText}>Pick at least 2</Text>
            ) : (
              <View style={styles.btnInner}>
                <Text style={styles.btnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.purple },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 56,
    paddingBottom: SPACING.lg,
    backgroundColor: C.purple,
  },
  backBtn: { marginBottom: SPACING.md, alignSelf: 'flex-start', minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontFamily: FONTS.extraBold, color: '#FFFFFF', marginBottom: SPACING.xs },
  subtitle: { fontFamily: FONTS.regular, fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 20 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
  },
  badgeText: { fontFamily: FONTS.bold, color: '#FFFFFF', fontSize: 13 },
  sheet: {
    flex: 1, backgroundColor: C.page,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
  },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  section: { marginBottom: SPACING.xl },
  categoryLabel: {
    fontFamily: FONTS.bold,
    fontSize: 12,
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
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    borderWidth: 1.5,
    borderColor: C.border,
    gap: SPACING.xs,
    ...SHADOW.sm,
  },
  chipSelected: {
    backgroundColor: C.purple,
    borderColor: C.purple,
  },
  chipLabel: { fontFamily: FONTS.medium, fontSize: 13, color: C.heading },
  chipLabelSelected: { fontFamily: FONTS.bold, color: '#FFFFFF' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: C.border,
    padding: SPACING.lg,
    ...SHADOW.lg,
  },
  btn: {
    backgroundColor: C.purple,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: C.muted },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { fontFamily: FONTS.bold, color: '#FFFFFF', fontSize: 16 },
});
