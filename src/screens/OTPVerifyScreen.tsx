import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAdditionalUserInfo } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getConfirmation, clearConfirmation } from '../services/phoneAuth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../services/firebase';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OTPVerify'>;
  route: RouteProp<RootStackParamList, 'OTPVerify'>;
};

// Valid invite codes → each gives 10% off
const VALID_INVITE_CODES = ['BUDDY10', 'MYBUDDY', 'WELCOME'];

export default function OTPVerifyScreen({ navigation, route }: Props) {
  const { phone } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [inviteCode, setInviteCode] = useState('');
  const [codeStatus, setCodeStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setResendTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (val: string, idx: number) => {
    const digits = [...otp];
    digits[idx] = val;
    setOtp(digits);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
    if (!val && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const validateCode = (code: string) => {
    const upper = code.trim().toUpperCase();
    if (!upper) { setCodeStatus('idle'); return; }
    const isValid = VALID_INVITE_CODES.includes(upper) || /^MB\d{4}$/.test(upper);
    setCodeStatus(isValid ? 'valid' : 'invalid');
  };

  const verify = async () => {
    const code = otp.join('');
    if (code.length < 6) return;
    setLoading(true);
    try {
      const upper = inviteCode.trim().toUpperCase();
      const hasDiscount = codeStatus === 'valid';

      // Use stored confirmation object — more reliable than rebuilding credential
      const confirmation = getConfirmation();
      if (!confirmation) {
        Alert.alert('Session Expired', 'Please go back and request a new OTP.');
        setLoading(false);
        return;
      }
      const result = await confirmation.confirm(code);
      clearConfirmation();
      const uid = result.user.uid;

      // If invite code was used, save discount to Firestore and track referral
      if (hasDiscount) {
        await updateDoc(doc(db, 'users', uid), {
          appliedInviteCode: upper,
          discountPct: 10,
        });

        // Track referral count locally
        const key = `referral_${upper}`;
        const existing = await AsyncStorage.getItem(key);
        const count = (existing ? parseInt(existing) : 0) + 1;
        await AsyncStorage.setItem(key, String(count));

        const milestone = count % 5 === 0;
        Alert.alert(
          '🎉 Invite Code Applied!',
          `10% discount added to your account.${milestone ? '\n\nThe person who invited you just earned a free month! 🏆' : ''}`,
          [{ text: 'Awesome!' }]
        );
      }

      // onAuthStateChanged in AuthContext will handle navigation automatically
    } catch (err: any) {
      console.log('OTP Error code:', err?.code, err?.message);
      const msg = err?.code === 'auth/invalid-verification-code'
        ? 'Wrong OTP. Enter the exact OTP from Firebase console test numbers (e.g. 123456).'
        : err?.code === 'auth/code-expired'
        ? 'OTP has expired. Go back and request a new one.'
        : err?.code === 'auth/session-expired'
        ? 'Session expired. Go back and request a new OTP.'
        : `Verification failed: ${err?.code || err?.message}`;
      Alert.alert('Error', msg);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.phone}>{phone}</Text>
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputs.current[i] = r; }}
              style={[styles.otpBox, digit && styles.otpBoxFilled]}
              value={digit}
              onChangeText={(v) => handleChange(v.replace(/[^0-9]/g, '').slice(-1), i)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, otp.join('').length < 6 && styles.btnDisabled]}
          onPress={verify}
          disabled={otp.join('').length < 6 || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.btnText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          {resendTimer > 0 ? (
            <Text style={styles.resendHint}>Resend OTP in {resendTimer}s</Text>
          ) : (
            <TouchableOpacity onPress={() => setResendTimer(30)}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Invite code section */}
        <View style={styles.inviteSection}>
          <View style={styles.inviteHeader}>
            <Ionicons name="gift-outline" size={16} color={COLORS.primary} />
            <Text style={styles.inviteTitle}>Have an invite code?</Text>
            <Text style={styles.inviteSubtitle}>Get 10% off your first subscription</Text>
          </View>
          <View style={[
            styles.inviteInputRow,
            codeStatus === 'valid' && styles.inviteInputValid,
            codeStatus === 'invalid' && styles.inviteInputInvalid,
          ]}>
            <TextInput
              style={styles.inviteInput}
              placeholder="Enter invite code (optional)"
              placeholderTextColor={COLORS.textMuted}
              value={inviteCode}
              onChangeText={(t) => {
                setInviteCode(t);
                validateCode(t);
              }}
              autoCapitalize="characters"
              returnKeyType="done"
            />
            {codeStatus === 'valid' && <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />}
            {codeStatus === 'invalid' && <Ionicons name="close-circle" size={20} color={COLORS.error} />}
          </View>
          {codeStatus === 'valid' && (
            <Text style={styles.discountTag}>✓ 10% discount will be applied at checkout</Text>
          )}
          {codeStatus === 'invalid' && (
            <Text style={styles.invalidTag}>✗ Invalid invite code</Text>
          )}
        </View>

        {/* DEV: test number reminder */}
        <View style={styles.devBox}>
          <Text style={styles.devBoxTitle}>⚡ Dev / Testing</Text>
          <Text style={styles.devBoxText}>
            Only test numbers added in Firebase Console work.{'\n'}
            Go to: Authentication → Sign-in method → Phone → Phone numbers for testing
          </Text>
          <TouchableOpacity style={styles.devBtn} onPress={() => setOtp(['1','2','3','4','5','6'])}>
            <Text style={styles.devBtnText}>Fill test OTP: 123456</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: 40,
  },
  back: { marginBottom: SPACING.xl },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22, marginBottom: SPACING.xl },
  phone: { fontWeight: '700', color: COLORS.textPrimary },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xl },
  otpBox: {
    width: 48, height: 56, borderRadius: RADIUS.md, borderWidth: 1.5,
    borderColor: COLORS.border, textAlign: 'center', fontSize: 22,
    fontWeight: '700', color: COLORS.textPrimary, backgroundColor: COLORS.surface, ...SHADOW.sm,
  },
  otpBoxFilled: { borderColor: COLORS.primary, backgroundColor: '#FFF5F0' },
  btn: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.md,
    borderRadius: RADIUS.full, alignItems: 'center', marginBottom: SPACING.md,
  },
  btnDisabled: { backgroundColor: COLORS.textMuted },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  resendRow: { alignItems: 'center', marginBottom: SPACING.xl },
  resendHint: { color: COLORS.textMuted, fontSize: 13 },
  resendLink: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },

  inviteSection: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, ...SHADOW.sm, marginBottom: SPACING.lg,
    borderWidth: 1.5, borderColor: COLORS.primary + '25',
  },
  inviteHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.sm, flexWrap: 'wrap' },
  inviteTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  inviteSubtitle: { fontSize: 12, color: COLORS.textSecondary, width: '100%' },
  inviteInputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
  },
  inviteInputValid: { borderColor: COLORS.success, backgroundColor: COLORS.success + '08' },
  inviteInputInvalid: { borderColor: COLORS.error, backgroundColor: COLORS.error + '08' },
  inviteInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: COLORS.textPrimary, letterSpacing: 2, fontWeight: '600' },
  discountTag: { fontSize: 12, color: COLORS.success, fontWeight: '600', marginTop: 6 },
  invalidTag: { fontSize: 12, color: COLORS.error, marginTop: 6 },

  devBox: { marginTop: SPACING.lg, backgroundColor: '#fffbea', borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: '#f0d060', borderStyle: 'dashed' },
  devBoxTitle: { fontSize: 13, fontWeight: '700', color: '#b45309', marginBottom: 4 },
  devBoxText: { fontSize: 12, color: '#92400e', lineHeight: 18, marginBottom: SPACING.sm },
  devBtn: { alignSelf: 'flex-start', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full, backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#f0d060' },
  devBtnText: { color: '#92400e', fontSize: 12, fontWeight: '700' },
});
