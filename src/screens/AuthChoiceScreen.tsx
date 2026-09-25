import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signInWithPhoneNumber } from 'firebase/auth';
import { RootStackParamList } from '../types';
import { FONTS, SPACING, RADIUS } from '../constants/theme';
import { auth, firebaseConfig } from '../services/firebase';
import FirebaseRecaptchaVerifier, { FirebaseRecaptchaVerifierHandle } from '../components/FirebaseRecaptchaVerifier';
import { setPendingConfirmation } from '../services/phoneAuth';
import { useGoogleSignIn } from '../services/googleAuth';
import { signInWithApple, isAppleSignInAvailable } from '../services/appleAuth';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'AuthChoice'> };

// This screen matches the Figma "Log in or sign up" frame, which uses a white
// background — a deliberate departure from the app's purple gradient theme.
// Phone entry lives directly on this screen (no separate "continue with
// phone" tap) so sign-in is a single step no matter which method is used.
const C = {
  bg: '#FFFFFF',
  heading: '#1A1A1A',
  sub: '#888888',
  fieldBg: '#F2F2F5',
  fieldText: '#16213E',
  placeholder: '#9AA0AC',
  pillBg: '#F2F2F2',
  checkboxBorder: '#4B5BD9',
  checkText: '#16213E',
  checkDesc: '#888888',
  divider: '#E5E5E5',
  dividerText: '#999999',
  legal: '#999999',
  link: '#4B3B8C',
  purple: '#4B3B8C',
  btnDisabled: '#CBD3F7',
  btnEnabled: '#4B5BD9',
  btnText: '#FFFFFF',
};

const TERMS_URL = 'https://mybuddy-bd717.web.app/terms-of-service.html';
const PRIVACY_URL = 'https://mybuddy-bd717.web.app/privacy-policy.html';

// Sign In with Apple's capability was pulled from app.json/entitlements —
// the free signing team can't hold it, so it's disabled here too to avoid
// showing a button that would fail every tap. Flip this back to true (and
// re-add the "expo-apple-authentication" plugin to app.json) once signed
// with a paid Apple Developer Program team.
const APPLE_SIGNIN_ENABLED = false;

export default function AuthChoiceScreen({ navigation }: Props) {
  const [countryCode] = useState('+91');
  const [countryLabel] = useState('IN');
  const [phone, setPhone] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierHandle>(null);

  const { signIn: signInWithGoogle, loading: googleLoading, ready: googleReady } = useGoogleSignIn();

  const [appleAvailable, setAppleAvailable] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  useEffect(() => {
    if (APPLE_SIGNIN_ENABLED && Platform.OS === 'ios') isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const isPhoneValid = phone.trim().length >= 7;

  const onContinueWithPhone = async () => {
    if (!isPhoneValid || phoneLoading) return;
    const fullPhone = `${countryCode}${phone.trim()}`;
    setPhoneLoading(true);
    try {
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifier.current!);
      setPendingConfirmation(confirmation);
      navigation.navigate('OTPVerify', { phone: fullPhone });
    } catch (err: any) {
      const msg =
        err?.code === 'auth/invalid-phone-number' ? 'That phone number looks invalid.' :
        err?.code === 'auth/too-many-requests' ? 'Too many attempts — try again later.' :
        err?.message || 'Could not send the verification code. Please try again.';
      Alert.alert('Error', msg);
    }
    setPhoneLoading(false);
  };

  const onPressGoogle = async () => {
    if (googleLoading || !googleReady) return;
    try {
      await signInWithGoogle();
      // AppNavigator watches Firebase auth state and swaps stacks automatically.
    } catch {
      Alert.alert('Error', 'Could not sign in with Google. Please try again.');
    }
  };

  const onPressApple = async () => {
    if (appleLoading) return;
    setAppleLoading(true);
    try {
      await signInWithApple();
      // AppNavigator watches Firebase auth state and swaps stacks automatically.
    } catch {
      Alert.alert('Error', 'Could not sign in with Apple. Please try again.');
    }
    setAppleLoading(false);
  };

  return (
    <View style={styles.container}>
      <FirebaseRecaptchaVerifier
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification
      />

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

        <View style={styles.row}>
          <TouchableOpacity style={styles.codeBox} activeOpacity={0.8}>
            <Text style={styles.codeText}>{countryLabel} ({countryCode})</Text>
            <Ionicons name="chevron-down" size={16} color={C.heading} />
          </TouchableOpacity>
          <View style={styles.phoneBox}>
            <TextInput
              style={styles.phoneInput}
              placeholder="Phone number"
              placeholderTextColor={C.placeholder}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={15}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.checkRow} onPress={() => setOptIn((v) => !v)} activeOpacity={0.8}>
          <View style={[styles.checkbox, optIn && styles.checkboxOn]}>
            {optIn && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.checkLabel}>I want to Stay Updated with Exclusive Offers!</Text>
            <Text style={styles.checkDesc}>
              Opt-in to receive the latest promotions, match updates and special offers. Don't miss out!
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueBtn, (!isPhoneValid || phoneLoading) && styles.continueBtnDisabled]}
          onPress={onContinueWithPhone}
          disabled={!isPhoneValid || phoneLoading}
          activeOpacity={0.85}
        >
          {phoneLoading ? <ActivityIndicator color={C.btnText} /> : <Text style={styles.continueBtnText}>Continue</Text>}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {appleAvailable && (
          <TouchableOpacity
            style={[styles.pillBtn, styles.appleBtn]}
            onPress={onPressApple}
            disabled={appleLoading}
            activeOpacity={0.8}
          >
            {appleLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={18} color="#FFFFFF" style={styles.pillIcon} />
                <Text style={styles.appleBtnText}>Continue with Apple</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.pillBtn}
          onPress={onPressGoogle}
          disabled={googleLoading}
          activeOpacity={0.8}
        >
          {googleLoading ? (
            <ActivityIndicator color={C.heading} />
          ) : (
            <>
              <Ionicons name="logo-google" size={16} color="#4285F4" style={styles.pillIcon} />
              <Text style={styles.pillText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ flex: 1, minHeight: SPACING.xl }} />

        <Text style={styles.legal}>
          By registering you are accepting our{' '}
          <Text style={styles.legalLink} onPress={() => Linking.openURL(TERMS_URL)}>terms of use</Text> and{' '}
          <Text style={styles.legalLink} onPress={() => Linking.openURL(PRIVACY_URL)}>privacy policy</Text>
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

  row: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  codeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.fieldBg, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
  },
  codeText: { fontFamily: FONTS.medium, fontSize: 14.5, color: C.fieldText },
  phoneBox: { flex: 1, backgroundColor: C.fieldBg, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md },
  phoneInput: { flex: 1, fontFamily: FONTS.medium, fontSize: 14.5, color: C.fieldText, height: '100%', paddingVertical: 14 },

  checkRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start', marginBottom: SPACING.md },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: C.checkboxBorder,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  checkboxOn: { backgroundColor: C.checkboxBorder },
  checkLabel: { fontFamily: FONTS.semiBold, fontSize: 14.5, color: C.checkText, marginBottom: 4, lineHeight: 19 },
  checkDesc: { fontFamily: FONTS.regular, fontSize: 12, color: C.checkDesc, lineHeight: 17 },

  continueBtn: {
    backgroundColor: C.btnEnabled, borderRadius: RADIUS.full,
    paddingVertical: SPACING.md, alignItems: 'center', marginBottom: SPACING.md,
  },
  continueBtnDisabled: { backgroundColor: C.btnDisabled },
  continueBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: C.btnText },

  pillBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 45, borderRadius: RADIUS.lg, backgroundColor: C.pillBg,
    paddingHorizontal: SPACING.md,
  },
  pillIcon: { position: 'absolute', left: SPACING.md },
  pillText: { fontFamily: FONTS.semiBold, fontSize: 12, color: C.heading, textAlign: 'center' },

  appleBtn: { backgroundColor: '#000000', marginBottom: SPACING.sm },
  appleBtnText: { fontFamily: FONTS.semiBold, fontSize: 12, color: '#FFFFFF', textAlign: 'center' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  dividerLine: { flex: 1, height: 0.8, backgroundColor: C.divider },
  dividerText: { fontFamily: FONTS.regular, fontSize: 10.5, color: C.dividerText },

  legal: { fontFamily: FONTS.regular, fontSize: 9.7, color: C.legal, textAlign: 'center', lineHeight: 15.5 },
  legalLink: { fontFamily: FONTS.medium, color: C.link },
});
