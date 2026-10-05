import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPendingConfirmation, clearPendingConfirmation } from '../services/phoneAuth';
import { RootStackParamList } from '../types';
import { FONTS, SPACING, RADIUS } from '../constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OTPVerify'>;
  route: RouteProp<RootStackParamList, 'OTPVerify'>;
};

// Same white-background palette as PhoneNumberScreen — this is a direct
// continuation of that step.
const C = {
  bg: '#FAFAFA',
  heading: '#16213E',
  sub: '#888888',
  boxBorder: '#E1E3E8',
  boxBorderFilled: '#4B5BD9',
  boxBg: '#F2F2F5',
  resendMuted: '#9AA0AC',
  resendLink: '#4B5BD9',
  btnDisabled: '#CBD3F7',
  btnEnabled: '#3D3081',
  btnText: '#FFFFFF',
};

export default function OTPVerifyScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { phone } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => setResendTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (val: string, idx: number) => {
    const cleaned = val.replace(/[^0-9]/g, '');

    // SMS autofill (and a manual paste) delivers the whole code into whichever
    // box is focused, not one digit — spread it across all six boxes instead
    // of dropping everything but the last character.
    if (cleaned.length > 1) {
      const fullDigits = cleaned.slice(0, 6).split('');
      setOtp((prev) => {
        const next = [...prev];
        fullDigits.forEach((d, i) => { next[i] = d; });
        return next;
      });
      const lastIdx = Math.min(fullDigits.length, 6) - 1;
      inputs.current[lastIdx]?.focus();
      return;
    }

    const digits = [...otp];
    digits[idx] = cleaned;
    setOtp(digits);
    if (cleaned && idx < 5) inputs.current[idx + 1]?.focus();
    if (!cleaned && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const verify = async () => {
    const code = otp.join('');
    if (code.length < 6 || loading) return;
    setLoading(true);
    try {
      const confirmation = getPendingConfirmation();
      if (!confirmation) {
        Alert.alert('Session expired', 'Please go back and request a new code.');
        setLoading(false);
        return;
      }
      await confirmation.confirm(code);
      clearPendingConfirmation();
      // AppNavigator watches the Firebase auth state and swaps to the
      // profile-setup stack automatically once this resolves.
    } catch (err: any) {
      const msg =
        err?.code === 'auth/invalid-verification-code' ? 'That code is incorrect. Please try again.' :
        err?.code === 'auth/code-expired' ? 'This code has expired — go back and request a new one.' :
        err?.code === 'auth/session-expired' ? 'Session expired — go back and request a new code.' :
        err?.message || 'Verification failed. Please try again.';
      Alert.alert('Error', msg);
    }
    setLoading(false);
  };

  // Auto-submits as soon as all six digits are in, whether typed, pasted, or
  // filled by SMS autofill — no need to also tap Verify.
  useEffect(() => {
    if (otp.join('').length === 6 && !loading) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={C.heading} />
        </TouchableOpacity>

        <Text style={styles.title}>Enter verification code</Text>
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
              onChangeText={(v) => handleChange(v, i)}
              keyboardType="numeric"
              // No maxLength — SMS autofill delivers the full 6-digit code into
              // whichever box is focused, and handleChange splits it apart.
              // A maxLength here would truncate that to one character first.
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              selectTextOnFocus
            />
          ))}
        </View>

        <View style={styles.resendRow}>
          {resendTimer > 0 ? (
            <Text style={styles.resendHint}>Resend code in {resendTimer}s</Text>
          ) : (
            <TouchableOpacity onPress={() => { navigation.goBack(); }}>
              <Text style={styles.resendLink}>Resend code</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.changeNumberRow} onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.changeNumberLink}>Change number</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.btn, (otp.join('').length < 6 || loading) && styles.btnDisabled]}
          onPress={verify}
          disabled={otp.join('').length < 6 || loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color={C.btnText} /> : <Text style={styles.btnText}>Verify</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingBottom: 140 },
  back: { paddingTop: 56, paddingBottom: SPACING.lg, alignSelf: 'flex-start' },
  title: { fontFamily: FONTS.bold, fontSize: 24, color: C.heading, marginBottom: 8 },
  subtitle: { fontFamily: FONTS.regular, fontSize: 13.5, color: C.sub, lineHeight: 20, marginBottom: SPACING.xl },
  phone: { fontFamily: FONTS.semiBold, color: C.heading },

  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg },
  otpBox: {
    width: 48, height: 56, borderRadius: RADIUS.md, borderWidth: 1.5,
    borderColor: C.boxBorder, textAlign: 'center', fontSize: 22,
    fontFamily: FONTS.bold, color: C.heading, backgroundColor: C.boxBg,
  },
  otpBoxFilled: { borderColor: C.boxBorderFilled, backgroundColor: '#EEF0FD' },

  resendRow: { alignItems: 'center' },
  resendHint: { fontFamily: FONTS.regular, fontSize: 13, color: C.resendMuted },
  resendLink: { fontFamily: FONTS.semiBold, fontSize: 13, color: C.resendLink },

  changeNumberRow: { alignItems: 'center', marginTop: SPACING.md },
  changeNumberLink: { fontFamily: FONTS.medium, fontSize: 13, color: C.resendLink },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md,
    backgroundColor: C.bg,
  },
  btn: {
    backgroundColor: C.btnEnabled, borderRadius: RADIUS.full,
    paddingVertical: SPACING.md, alignItems: 'center',
  },
  btnDisabled: { backgroundColor: C.btnDisabled },
  btnText: { fontFamily: FONTS.bold, fontSize: 16, color: C.btnText },
});
