import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { FONTS, SPACING, RADIUS } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'YourGroups'> };

// White page, matching the Playtomic reference (departs from the app's purple gradient elsewhere).
const C = {
  text: '#111111',
  sub: '#8A8A93',
  border: '#E4E4E9',
  iconBg: '#EFEFF2',
  icon: '#8A8A93',
  purple: '#3F2F86',
};

export default function YourGroupsScreen({ navigation }: Props) {
  const newGroup = () => Alert.alert('Coming soon', 'Creating a group will be available in a future update.');

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
        <Ionicons name="chevron-back" size={24} color={C.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Your groups</Text>

      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="people-outline" size={30} color={C.icon} />
        </View>
        <Text style={styles.cardTitle}>You are not a member of any{'\n'}group yet</Text>
        <Text style={styles.cardSub}>
          Do not hesitate to create your own group, invite{'\n'}your friends, play, and improve together!
        </Text>
      </View>

      <TouchableOpacity style={styles.newGroupBtn} onPress={newGroup} activeOpacity={0.85}>
        <Ionicons name="add" size={18} color="#FFFFFF" />
        <Text style={styles.newGroupBtnText}>New group</Text>
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

  card: {
    marginHorizontal: SPACING.lg,
    borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.lg,
    alignItems: 'center', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg,
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.iconBg, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontFamily: FONTS.extraBold, fontSize: 16.5, color: C.text,
    textAlign: 'center', marginBottom: SPACING.sm,
  },
  cardSub: {
    fontFamily: FONTS.regular, fontSize: 13.5, color: C.sub,
    textAlign: 'center', lineHeight: 19,
  },

  newGroupBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.purple, borderRadius: RADIUS.full,
    marginHorizontal: SPACING.lg, marginTop: 'auto', marginBottom: SPACING.xl,
    height: 54,
  },
  newGroupBtnText: { fontFamily: FONTS.extraBold, fontSize: 15.5, color: '#FFFFFF' },
});
