import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, User } from '../types';
import { auth, db } from '../services/firebase';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'CreateAccount'> };

export default function CreateAccountScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = name.trim().length >= 2 && /\S+@\S+\.\S+/.test(email.trim()) && password.length >= 8;

  const createAccount = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(result.user, { displayName: name.trim() });

      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);
      const newUser: User = {
        uid: result.user.uid,
        email: email.trim(),
        name: name.trim(),
        city: '',
        state: '',
        interests: [],
        subscription: { plan: 'free_trial' },
        trialEndsAt: trialEnd.toISOString(),
        createdAt: new Date().toISOString(),
        myInviteCode: 'MB' + result.user.uid.slice(-4).toUpperCase(),
        referralCount: 0,
        freeMonthsEarned: 0,
        discountPct: 0,
      };
      await setDoc(doc(db, 'users', result.user.uid), newUser);
      // onAuthStateChanged in AuthContext picks this up and routes to About You next.
    } catch (err: any) {
      const msg =
        err?.code === 'auth/email-already-in-use' ? 'An account with that email already exists.' :
        err?.code === 'auth/invalid-email' ? 'That email address looks invalid.' :
        err?.code === 'auth/weak-password' ? 'Password is too weak — use at least 8 characters.' :
        err?.message || 'Failed to create account. Please try again.';
      Alert.alert('Error', msg);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Create account</Text>
        <Text style={styles.eyebrow}>JOIN THE CLUB</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="James Harlow"
            placeholderTextColor={COLORS.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
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
            placeholder="Min. 8 characters"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
          />
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[styles.ctaBtn, (!isValid || loading) && styles.ctaBtnDisabled]}
          onPress={createAccount}
          disabled={!isValid || loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.ctaText} />
          ) : (
            <Text style={styles.ctaBtnText}>Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.switchWrap}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchTextBold}>Log in</Text>
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
