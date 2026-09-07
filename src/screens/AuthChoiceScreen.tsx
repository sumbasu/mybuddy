import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { FONTS, SPACING, RADIUS } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'AuthChoice'> };

// This screen matches the Figma "Log in or sign up" frame, which uses a white
// background — a deliberate departure from the app's purple gradient theme.
const C = {
  bg: '#FFFFFF',
  heading: '#1A1A1A',
  sub: '#888888',
  pillBg: '#F2F2F2',
  divider: '#E5E5E5',
  dividerText: '#999999',
  legal: '#999999',
  link: '#4B3B8C',
  purple: '#4B3B8C',
};

const SOCIAL_PROVIDERS: { key: string; label: string; icon: any; color: string }[] = [
  { key: 'apple', label: 'Continue with Apple', icon: 'logo-apple', color: '#1A1A1A' },
  { key: 'google', label: 'Continue with Google', icon: 'logo-google', color: '#4285F4' },
  { key: 'facebook', label: 'Continue with Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { key: 'instagram', label: 'Continue with Instagram', icon: 'logo-instagram', color: '#E4405F' },
];

export default function AuthChoiceScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
        <Ionicons name="chevron-back" size={20} color={C.heading} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Ionicons name="person" size={30} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Log in or sign up</Text>
          <Text style={styles.subtitle}>Let's find your game buddy</Text>
        </View>

        <View style={styles.socialList}>
          {SOCIAL_PROVIDERS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={styles.pillBtn}
              onPress={() => navigation.navigate('PhoneNumber')}
              activeOpacity={0.8}
            >
              <Ionicons name={p.icon} size={16} color={p.color} style={styles.pillIcon} />
              <Text style={styles.pillText}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.pillBtn}
          onPress={() => navigation.navigate('PhoneNumber')}
          activeOpacity={0.8}
        >
          <Ionicons name="mail-outline" size={16} color={C.heading} style={styles.pillIcon} />
          <Text style={styles.pillText}>Continue with email</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, minHeight: SPACING.xl }} />

        <Text style={styles.legal}>
          By registering you are accepting our{' '}
          <Text style={styles.legalLink}>terms of use</Text> and{' '}
          <Text style={styles.legalLink}>privacy policy</Text>
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  back: { paddingTop: 56, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, alignSelf: 'flex-start' },
  content: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },

  hero: { alignItems: 'center', paddingVertical: SPACING.lg },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: C.purple, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  title: { fontFamily: FONTS.bold, fontSize: 24, color: C.heading, marginBottom: 6 },
  subtitle: { fontFamily: FONTS.regular, fontSize: 12, color: C.sub },

  socialList: { gap: SPACING.sm, marginBottom: SPACING.md },
  pillBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 45, borderRadius: RADIUS.lg, backgroundColor: C.pillBg,
    paddingHorizontal: SPACING.md,
  },
  pillIcon: { position: 'absolute', left: SPACING.md },
  pillText: { fontFamily: FONTS.semiBold, fontSize: 12, color: C.heading, textAlign: 'center' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  dividerLine: { flex: 1, height: 0.8, backgroundColor: C.divider },
  dividerText: { fontFamily: FONTS.regular, fontSize: 10.5, color: C.dividerText },

  legal: { fontFamily: FONTS.regular, fontSize: 9.7, color: C.legal, textAlign: 'center', lineHeight: 15.5 },
  legalLink: { fontFamily: FONTS.medium, color: C.link },
});
