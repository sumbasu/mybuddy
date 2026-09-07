import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { FONTS, SPACING, RADIUS } from '../constants/theme';
import SoccerGoalIllustration from '../components/SoccerGoalIllustration';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'YourMatches'> };

// White page, matching the Playtomic reference (departs from the app's purple gradient elsewhere).
const C = {
  text: '#111111',
  sub: '#8A8A93',
  border: '#ECECEF',
  pillBg: '#181824',
  pillText: '#FFFFFF',
  purple: '#4B3B8C',
};

export default function YourMatchesScreen({ navigation }: Props) {
  const [showCanceled, setShowCanceled] = useState(true);

  const uploadScore = () => Alert.alert('Coming soon', 'Uploading match scores will be available in a future update.');

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
        <Ionicons name="chevron-back" size={24} color={C.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Your matches</Text>

      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.todayPill} activeOpacity={0.85}>
          <Text style={styles.todayPillText}>TODAY</Text>
        </TouchableOpacity>
        <Text style={styles.filterLabel}>Show canceled matches</Text>
        <Switch
          value={showCanceled}
          onValueChange={setShowCanceled}
          trackColor={{ false: '#D8D8DE', true: C.purple }}
          thumbColor="#FFFFFF"
        />
      </View>
      <View style={styles.divider} />

      <View style={styles.empty}>
        <SoccerGoalIllustration size={220} />
        <Text style={styles.emptyTitle}>You haven't played any{'\n'}matches yet</Text>
        <Text style={styles.emptySub}>Play your first match and remember to{'\n'}upload your result at the end</Text>
      </View>

      <TouchableOpacity style={styles.uploadBtn} onPress={uploadScore} activeOpacity={0.85}>
        <Ionicons name="add" size={18} color="#FFFFFF" />
        <Text style={styles.uploadBtnText}>Upload a score</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  backBtn: { paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.sm },
  title: {
    fontFamily: FONTS.extraBold, fontSize: 28, color: C.text,
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg,
  },

  filterRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md,
  },
  todayPill: {
    backgroundColor: C.pillBg, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 8,
  },
  todayPillText: { fontFamily: FONTS.extraBold, fontSize: 12, color: C.pillText, letterSpacing: 0.5 },
  filterLabel: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: C.text },
  divider: { height: 1, backgroundColor: C.border },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  emptyTitle: {
    fontFamily: FONTS.extraBold, fontSize: 20, color: C.text,
    textAlign: 'center', marginTop: SPACING.lg,
  },
  emptySub: {
    fontFamily: FONTS.regular, fontSize: 13.5, color: C.sub,
    textAlign: 'center', marginTop: SPACING.sm, lineHeight: 19,
  },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.purple, borderRadius: RADIUS.full,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.xl,
    height: 54,
  },
  uploadBtnText: { fontFamily: FONTS.extraBold, fontSize: 15.5, color: '#FFFFFF' },
});
