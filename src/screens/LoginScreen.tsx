import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { auth } from '../services/firebase';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = /\S+@\S+\.\S+/.test(email.trim()) && password.length > 0;

  const login = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // onAuthStateChanged in AuthContext handles navigation from here.
    } catch (err: any) {
      const msg =
        err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password' ? 'Incorrect email or password.' :
        err?.code === 'auth/user-not-found' ? 'No account found with that email.' :
        err?.code === 'auth/too-many-requests' ? 'Too many attempts. Please try again later.' :
        err?.message || 'Failed to log in. Please try again.';
      Alert.alert('Error', msg);
    }
    setLoading(false);
  };

  const forgotPassword = async () => {
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      Alert.alert('Enter your email', 'Type your email above first, then tap "Forgot password?" again.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Check your inbox', `We sent a password reset link to ${email.trim()}.`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not send reset email.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.eyebrow}>SIGN IN TO CONTINUE</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Username or Email</Text>
          <TextInput
            style={styles.input}
            placeholder="james@example.com"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Your password"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        <TouchableOpacity onPress={forgotPassword} style={styles.forgotWrap}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[styles.ctaBtn, (!isValid || loading) && styles.ctaBtnDisabled]}
          onPress={login}
          disabled={!isValid || loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.ctaText} />
          ) : (
            <Text style={styles.ctaBtnText}>Log In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace('CreateAccount')} style={styles.switchWrap}>
          <Text style={styles.switchText}>
            Don't have an account? <Text style={styles.switchTextBold}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: 56,
    paddingBottom: SPACING.xl,
  },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl, alignSelf: 'flex-start' },
  backText: { fontSize: 16, color: COLORS.textPrimary, marginLeft: 2 },
  title: {
    fontSize: 34,
    fontFamily: FONTS.serif,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  field: { marginBottom: SPACING.lg },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  forgotWrap: { alignItems: 'center', marginTop: SPACING.xs },
  forgotText: { fontSize: 13, color: COLORS.textSecondary, textDecorationLine: 'underline' },
  ctaBtn: {
    backgroundColor: COLORS.ctaBg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: { color: COLORS.ctaText, fontSize: 16, fontWeight: '700' },
  switchWrap: { alignItems: 'center', marginTop: SPACING.lg },
  switchText: { fontSize: 13, color: COLORS.textSecondary },
  switchTextBold: { color: COLORS.textPrimary, fontWeight: '700' },
});
