import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { FONTS, SPACING, RADIUS } from '../constants/theme';
import BrandLogo from '../components/BrandLogo';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'> };

const C = {
  purple: '#3F2F86',
  page: '#FFFFFF',
  heading: '#16213E',
  sub: '#767683',
  link: '#3F2F86',
};

export default function WelcomeScreen({ navigation }: Props) {
  const goToSignUp = () => navigation.navigate('AuthChoice');
  const goToLogin = () => navigation.navigate('Login');

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <BrandLogo size={190} />
        <Text style={styles.brand}>sweatbud</Text>
      </View>

      <View style={styles.sheet}>
        <Text style={styles.headline}>Find your game buddy and more</Text>
        <Text style={styles.subtext}>
          Join games, book courts and meet players at your level, from tennis to cricket.
        </Text>

        <TouchableOpacity style={styles.ctaBtn} onPress={goToSignUp} activeOpacity={0.88}>
          <Text style={styles.ctaBtnText}>Get started</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginRow} onPress={goToLogin} activeOpacity={0.7}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginLink}>Log in</Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing you agree to our{' '}
          <Text style={styles.termsLink} onPress={() => Linking.openURL('https://sweatbud.app/terms')}>
            Terms of use
          </Text>{' '}
          and{' '}
          <Text style={styles.termsLink} onPress={() => Linking.openURL('https://sweatbud.app/privacy')}>
            Privacy policy
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.purple },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 56, gap: SPACING.md },
  brand: {
    fontFamily: FONTS.extraBold, fontSize: 30, color: '#FFFFFF', letterSpacing: 0.5,
  },

  sheet: {
    backgroundColor: C.page,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: 40,
  },
  headline: {
    fontFamily: FONTS.extraBold, fontSize: 30, color: C.heading, lineHeight: 36,
  },
  subtext: {
    fontFamily: FONTS.regular, fontSize: 15, color: C.sub, lineHeight: 21,
    marginTop: SPACING.sm, marginBottom: SPACING.xl,
  },

  ctaBtn: {
    backgroundColor: C.purple, minHeight: 54, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: '#FFFFFF' },

  loginRow: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xs },
  loginText: { fontFamily: FONTS.regular, fontSize: 14, color: C.heading },
  loginLink: { fontFamily: FONTS.bold, color: C.link },

  terms: {
    fontFamily: FONTS.regular, fontSize: 11.5, color: C.sub, textAlign: 'center',
    lineHeight: 17, marginTop: SPACING.sm,
  },
  termsLink: { fontFamily: FONTS.medium, color: C.heading, textDecorationLine: 'underline' },
});
