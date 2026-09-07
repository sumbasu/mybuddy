import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { FONTS, SPACING, RADIUS } from '../constants/theme';
import ShuttlecockIllustration from '../components/ShuttlecockIllustration';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'YourClasses'> };

// White page, matching the Playtomic reference (departs from the app's purple gradient elsewhere).
const C = {
  text: '#111111',
  sub: '#8A8A93',
  border: '#D8D8DE',
};

const FILTERS = ['Any date', 'All sports', 'All classes'];

export default function YourClassesScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
        <Ionicons name="chevron-back" size={24} color={C.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Your classes</Text>

      <ScrollView
        horizontal
        style={styles.filterScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f, i) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, i === FILTERS.length - 1 && styles.filterPillLast]}
            activeOpacity={0.8}
          >
            <Text style={styles.filterPillText}>{f}</Text>
            <Ionicons name="chevron-down" size={14} color={C.text} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.empty}>
        <ShuttlecockIllustration size={180} />
        <Text style={styles.emptyTitle}>No classes</Text>
        <Text style={styles.emptySub}>You have no classes planned, but you can{'\n'}always look for one to join!</Text>
      </View>
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

  filterScroll: { flexGrow: 0, height: 52 },
  filterRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: SPACING.lg, gap: 7,
  },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.2, borderColor: C.border, borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  filterPillLast: { marginRight: SPACING.lg },
  filterPillText: { fontFamily: FONTS.medium, fontSize: 14, color: C.text },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl },
  emptyTitle: {
    fontFamily: FONTS.extraBold, fontSize: 20, color: C.text,
    textAlign: 'center', marginTop: SPACING.lg,
  },
  emptySub: {
    fontFamily: FONTS.regular, fontSize: 13.5, color: C.sub,
    textAlign: 'center', marginTop: SPACING.sm, lineHeight: 19,
  },
});
