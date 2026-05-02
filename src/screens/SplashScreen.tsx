import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'> };

export default function SplashScreen({ navigation }: Props) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const opacity = new Animated.Value(0);
  const scale = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
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
    }, 1800);
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Text style={styles.logo}>🤝</Text>
        <Text style={styles.appName}>MyBuddy</Text>
        <Text style={styles.tagline}>Find your activity partner</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 72,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: SPACING.sm,
    letterSpacing: 0.5,
  },
});
