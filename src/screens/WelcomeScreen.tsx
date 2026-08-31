import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'> };

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.ballWrap}>
        <Ionicons name="tennisball" size={110} color={COLORS.accent} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.eyebrow}>YOUR GAME STARTS HERE</Text>

        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => navigation.navigate('CreateAccount')}
          activeOpacity={0.88}
        >
          <Text style={styles.ctaBtnText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => navigation.navigate('Login')}
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
    fontFamily: FONTS.serif,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
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
  ctaBtnText: { color: COLORS.ctaText, fontSize: 16, fontWeight: '700' },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  outlineBtnText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
});
