import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { signInWithPhoneNumber } from 'firebase/auth';
import { RootStackParamList } from '../types';
import { FONTS, SPACING, RADIUS } from '../constants/theme';
import PhoneIllustration from '../components/PhoneIllustration';
import { auth, firebaseConfig } from '../services/firebase';
import { setPendingConfirmation } from '../services/phoneAuth';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'PhoneNumber'> };

// White-background phone-collection step shown after any Log in / Sign up
// button — matches the reference screen exactly: country code + number,
// an opt-in checkbox, and a Sign up pill that lights up once the number
// looks valid.
const C = {
  bg: '#FFFFFF',
  heading: '#16213E',
  sub: '#888888',
  fieldBg: '#F2F2F5',
  fieldText: '#16213E',
  placeholder: '#9AA0AC',
  checkboxBorder: '#4B5BD9',
  checkText: '#16213E',
  checkDesc: '#888888',
  btnDisabled: '#CBD3F7',
  btnEnabled: '#4B5BD9',
  btnText: '#FFFFFF',
};

export default function PhoneNumberScreen({ navigation }: Props) {
  const [countryCode] = useState('+91');
  const [countryLabel] = useState('IN');
  const [phone, setPhone] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  const isValid = phone.trim().length >= 7;

  const onVerify = async () => {
    if (!isValid || loading) return;
    const fullPhone = `${countryCode}${phone.trim()}`;
    setLoading(true);
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
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification
      />

      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
        <Ionicons name="chevron-back" size={24} color={C.heading} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <PhoneIllustration size={140} />
        </View>

        <Text style={styles.title}>Enter your phone number</Text>
        <Text style={styles.subtitle}>Add your phone to validate your account</Text>

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
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.signUpBtn, (!isValid || loading) && styles.signUpBtnDisabled]}
          onPress={onVerify}
          disabled={!isValid || loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color={C.btnText} /> : <Text style={styles.signUpText}>Verify</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  back: { paddingTop: 56, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, alignSelf: 'flex-start' },
  content: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingBottom: 140 },

  hero: { alignItems: 'center', paddingVertical: SPACING.lg },

  title: { fontFamily: FONTS.bold, fontSize: 24, color: C.heading, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontFamily: FONTS.regular, fontSize: 13.5, color: C.sub, textAlign: 'center', marginBottom: SPACING.xl },

  row: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  codeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.fieldBg, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
  },
  codeText: { fontFamily: FONTS.medium, fontSize: 14.5, color: C.fieldText },
  phoneBox: { flex: 1, backgroundColor: C.fieldBg, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md },
  phoneInput: { flex: 1, fontFamily: FONTS.medium, fontSize: 14.5, color: C.fieldText, height: '100%', paddingVertical: 14 },

  checkRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: C.checkboxBorder,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  checkboxOn: { backgroundColor: C.checkboxBorder },
  checkLabel: { fontFamily: FONTS.semiBold, fontSize: 14.5, color: C.checkText, marginBottom: 4, lineHeight: 19 },
  checkDesc: { fontFamily: FONTS.regular, fontSize: 12, color: C.checkDesc, lineHeight: 17 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: 36,
    backgroundColor: C.bg,
  },
  signUpBtn: {
    backgroundColor: C.btnEnabled, borderRadius: RADIUS.full,
    paddingVertical: SPACING.md, alignItems: 'center',
  },
  signUpBtnDisabled: { backgroundColor: C.btnDisabled },
  signUpText: { fontFamily: FONTS.bold, fontSize: 16, color: C.btnText },
});
