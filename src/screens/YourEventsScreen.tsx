import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { FONTS, SPACING } from '../constants/theme';
import CricketEventsIllustration from '../components/CricketEventsIllustration';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'YourEvents'> };

// White page, matching the Playtomic reference (departs from the app's purple gradient elsewhere).
const C = {
  text: '#111111',
  sub: '#8A8A93',
};

export default function YourEventsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
        <Ionicons name="chevron-back" size={24} color={C.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Your events</Text>

      <View style={styles.empty}>
        <CricketEventsIllustration size={200} />
        <Text style={styles.emptyTitle}>Oops! No results</Text>
        <Text style={styles.emptySub}>You have no activities planned, but you{'\n'}can always book a court and start playing!</Text>
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
