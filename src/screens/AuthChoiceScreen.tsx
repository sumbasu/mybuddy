import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { FONTS, SPACING, RADIUS } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'AuthChoice'> };

// Plain white sign-up entry point — no purple hero, just the back chevron and the choices.
const C = {
  bg: '#FFFFFF',
  heading: '#16213E',
  sub: '#767683',
  pillBorder: '#E5E5E5',
  divider: '#E5E5E5',
  dividerText: '#999999',
  legal: '#999999',
  link: '#3F2F86',
  purple: '#3F2F86',
};

export default function AuthChoiceScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={22} color={C.heading} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Pick how you'd like to sign up. It takes less than a minute.</Text>

        <View style={styles.providerList}>
          <TouchableOpacity style={styles.appleBtn} onPress={() => navigation.navigate('PhoneNumber')} activeOpacity={0.85}>
            <Ionicons name="logo-apple" size={18} color="#FFFFFF" style={styles.providerIcon} />
            <Text style={styles.appleBtnText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('PhoneNumber')} activeOpacity={0.85}>
            <Ionicons name="logo-google" size={18} color="#4285F4" style={styles.providerIcon} />
            <Text style={styles.outlineBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('PhoneNumber')} activeOpacity={0.85}>
            <Ionicons name="call-outline" size={18} color={C.purple} style={styles.providerIcon} />
            <Text style={styles.outlineBtnText}>Continue with phone number</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.emailLinkWrap} onPress={() => navigation.navigate('CreateAccount')} activeOpacity={0.7}>
          <Text style={styles.emailLink}>Sign up with email</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, minHeight: SPACING.xl }} />

        <Text style={styles.legal}>
          By continuing you agree to our{' '}
          <Text style={styles.legalLink} onPress={() => Linking.openURL('https://sweatbud.app/terms')}>
            Terms of use
          </Text>{' '}
          and{' '}
          <Text style={styles.legalLink} onPress={() => Linking.openURL('https://sweatbud.app/privacy')}>
            Privacy policy
          </Text>
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  back: { paddingTop: 56, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm, minWidth: 44, minHeight: 44, alignSelf: 'flex-start' },

  content: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xl },

  title: { fontFamily: FONTS.extraBold, fontSize: 26, color: C.heading, marginBottom: 6 },
  subtitle: { fontFamily: FONTS.regular, fontSize: 14, color: C.sub, lineHeight: 20, marginBottom: SPACING.xl },

  providerList: { gap: SPACING.sm, marginBottom: SPACING.md },
  appleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 54, borderRadius: RADIUS.lg, backgroundColor: C.heading,
    paddingHorizontal: SPACING.md,
  },
  appleBtnText: { fontFamily: FONTS.bold, fontSize: 14.5, color: '#FFFFFF' },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 54, borderRadius: RADIUS.lg, backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: C.pillBorder,
    paddingHorizontal: SPACING.md,
  },
  outlineBtnText: { fontFamily: FONTS.bold, fontSize: 14.5, color: C.heading },
  providerIcon: { position: 'absolute', left: SPACING.lg },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  dividerLine: { flex: 1, height: 0.8, backgroundColor: C.divider },
  dividerText: { fontFamily: FONTS.regular, fontSize: 12, color: C.dividerText },

  emailLinkWrap: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  emailLink: { fontFamily: FONTS.bold, fontSize: 14.5, color: C.link },

  legal: { fontFamily: FONTS.regular, fontSize: 11.5, color: C.legal, textAlign: 'center', lineHeight: 17 },
  legalLink: { fontFamily: FONTS.medium, color: C.heading, textDecorationLine: 'underline' },
});
