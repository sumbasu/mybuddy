import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { FONTS, SPACING } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'YourActivity'> };

// White page, deliberately departing from the app's purple gradient (matches the Playtomic reference).
const C = {
  text: '#111111',
  sub: '#8A8A93',
  border: '#ECECEF',
  chevron: '#B9B9C2',
};

export default function YourActivityScreen({ navigation }: Props) {
  const soon = () => Alert.alert('Coming soon', 'This section will be available in a future update.');

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
        <Ionicons name="chevron-back" size={24} color={C.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Your Activity</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.row}
            onPress={
              item.key === 'matches' ? () => navigation.navigate('YourMatches')
              : item.key === 'classes' ? () => navigation.navigate('YourClasses')
              : item.key === 'events' ? () => navigation.navigate('YourEvents')
              : item.key === 'groups' ? () => navigation.navigate('YourGroups')
              : item.key === 'favouriteClubs' ? () => navigation.navigate('YourFavourites')
              : soon
            }
            activeOpacity={0.7}
          >
            <View style={styles.rowIconWrap}>{item.icon}</View>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={C.chevron} />
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  list: { paddingHorizontal: SPACING.lg },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  rowIconWrap: { width: 30, alignItems: 'center', justifyContent: 'center' },
  ringIcon: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.4, borderColor: C.text,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontFamily: FONTS.semiBold, fontSize: 15.5, color: C.text },
});

const ITEMS: { key: string; label: string; icon: React.ReactNode }[] = [
  {
    key: 'matches',
    label: 'Matches',
    icon: (
      <View style={styles.ringIcon}>
        <MaterialCommunityIcons name="waves" size={14} color={C.text} />
      </View>
    ),
  },
  {
    key: 'classes',
    label: 'Classes',
    icon: <MaterialCommunityIcons name="school-outline" size={24} color={C.text} />,
  },
  {
    key: 'events',
    label: 'Events',
    icon: <MaterialCommunityIcons name="hexagon-outline" size={24} color={C.text} />,
  },
  {
    key: 'groups',
    label: 'Groups',
    icon: <MaterialCommunityIcons name="account-group-outline" size={24} color={C.text} />,
  },
  {
    key: 'favouriteClubs',
    label: 'Favourite clubs',
    icon: <MaterialCommunityIcons name="lock-outline" size={24} color={C.text} />,
  },
];
