import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { signInWithPhoneNumber } from 'firebase/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { auth } from '../services/firebase';
import app from '../services/firebase';
import { setConfirmation } from '../services/phoneAuth';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'PhoneAuth'> };

export default function PhoneAuthScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  const isValid = phone.length === 10 && /^[6-9]\d{9}$/.test(phone);

  const sendOTP = async () => {
    if (!isValid) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    try {
      const formattedPhone = `+91${phone}`;
      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifier.current!
      );
      setConfirmation(confirmation);
      navigation.navigate('OTPVerify', {
        phone: formattedPhone,
        verificationId: confirmation.verificationId,
      });
    } catch (err: any) {
      const msg =
        err?.code === 'auth/invalid-phone-number'  ? 'Invalid phone number format.' :
        err?.code === 'auth/too-many-requests'     ? 'Too many attempts. Please try again later.' :
        err?.code === 'auth/captcha-check-failed'  ? 'reCAPTCHA verification failed. Please try again.' :
        err?.message || 'Failed to send OTP. Please try again.';
      Alert.alert('Error', msg);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Firebase reCAPTCHA — invisible, required for phone auth */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        title="Verify you're human"
        cancelLabel="Cancel"
      />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Ionicons name="tennisball" size={40} color={COLORS.accent} />
            </View>
          </View>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.eyebrow}>YOUR GAME STARTS HERE</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.inputRow}>
            <View style={styles.countryCode}>
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={styles.code}>+91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              returnKeyType="done"
              onSubmitEditing={sendOTP}
            />
          </View>

          <Text style={styles.hint}>We'll send a one-time password to verify your number</Text>

          <TouchableOpacity
            style={[styles.btn, (!isValid || loading) && styles.btnDisabled]}
            onPress={sendOTP}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.btnText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>
          By continuing, you agree to MyBuddy's{' '}
          <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingTop: 80,
    paddingBottom: SPACING.xxl,
  },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  logoWrap: { alignItems: 'center', marginBottom: SPACING.lg },
  logoCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 40,
    fontFamily: FONTS.serif,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  card: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceSecondary,
    overflow: 'hidden',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: 6,
    borderRightWidth: 1.5,
    borderRightColor: COLORS.border,
  },
  flag: { fontSize: 20 },
  code: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 18,
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: COLORS.textMuted },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  legal: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xl,
    lineHeight: 18,
  },
  link: { color: COLORS.primary, fontWeight: '600' },
});
