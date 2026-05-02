import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { INTERESTS, INTEREST_CATEGORIES } from '../constants/interests';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'InterestPicker'> };

export default function InterestPickerScreen({ navigation }: Props) {
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
    navigation.replace('MainTabs');
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
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
                    <Text style={styles.chipEmoji}>{interest.emoji}</Text>
                    <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                      {interest.label}
                    </Text>
                    {isSelected && <Text style={styles.check}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, (selected.length < 2 || loading) && styles.btnDisabled]}
          onPress={save}
          disabled={selected.length < 2 || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.btnText}>
              {selected.length < 2 ? 'Pick at least 2' : "Let's Go! 🚀"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 56,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    ...SHADOW.sm,
  },
  backBtn: { marginBottom: SPACING.md, alignSelf: 'flex-start', padding: 4 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
  },
  badgeText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  section: { marginBottom: SPACING.xl },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: SPACING.xs,
    ...SHADOW.sm,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipEmoji: { fontSize: 16 },
  chipLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  chipLabelSelected: { color: COLORS.white, fontWeight: '700' },
  check: { fontSize: 12, color: COLORS.white },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    paddingBottom: 36,
    ...SHADOW.lg,
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: COLORS.textMuted },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
