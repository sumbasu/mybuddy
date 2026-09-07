import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import TennisBall from '../components/TennisBall';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'> };

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.ballWrap}>
        <TennisBall size={140} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.eyebrow}>Let's find your game buddy</Text>

        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => navigation.navigate('AuthChoice')}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaBtnText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => navigation.navigate('AuthChoice')}
          activeOpacity={0.85}
        >
          <Text style={styles.outlineBtnText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between' },
  ballWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: SPACING.xl, paddingBottom: 56 },
  title: {
    fontSize: 44,
    fontFamily: FONTS.light,
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: FONTS.light,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  ctaBtn: {
    backgroundColor: COLORS.ctaBg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  ctaBtnText: { color: COLORS.ctaText, fontSize: 16, fontFamily: FONTS.regular, letterSpacing: 0.5 },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(240,237,228,0.3)',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  outlineBtnText: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONTS.light, letterSpacing: 0.5 },
});
