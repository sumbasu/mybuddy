import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'> };

export default function SplashScreen({ navigation }: Props) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const opacity  = useRef(new Animated.Value(0)).current;
  const scale    = useRef(new Animated.Value(0.6)).current;
  const rotate   = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      // Icon spins and scales in
      Animated.parallel([
        Animated.spring(scale,  { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
      // Text slides up
      Animated.timing(taglineY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      if (isAuthenticated && user?.name) {
        navigation.replace('MainTabs');
      } else if (isAuthenticated) {
        navigation.replace('ProfileSetup');
      } else {
        navigation.replace('Onboarding');
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] });

  return (
    <View style={styles.container}>

      {/* Background accent circles */}
      <View style={[styles.bgCircle, styles.bgCircle1]} />
      <View style={[styles.bgCircle, styles.bgCircle2]} />

      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>

        {/* Layered icon badge */}
        <Animated.View style={[styles.badge, { transform: [{ rotate: spin }] }]}>
          <View style={styles.badgeOuter}>
            <View style={styles.badgeInner}>
              <Ionicons name="navigate" size={48} color={COLORS.primary} />
            </View>
          </View>
        </Animated.View>

        {/* App name */}
        <Text style={styles.appName}>MyBuddy</Text>

        {/* Tagline slides up */}
        <Animated.Text style={[styles.tagline, { transform: [{ translateY: taglineY }] }]}>
          Discover · Connect · Play
        </Animated.Text>

        {/* Pill badge */}
        <View style={styles.pill}>
          <View style={styles.pillDot} />
          <Text style={styles.pillText}>India</Text>
        </View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Decorative background circles
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  bgCircle1: { width: 340, height: 340, top: -80, right: -100 },
  bgCircle2: { width: 260, height: 260, bottom: -60, left: -80 },

  content: { alignItems: 'center' },

  // Icon badge — white card with icon inside
  badge: { marginBottom: SPACING.xl },
  badgeOuter: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  badgeInner: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  appName: {
    fontSize: 44,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: SPACING.xl,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  pillText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
