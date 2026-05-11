import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, Animated, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'tennisball-outline' as const,
    iconBg: 'rgba(255,255,255,0.2)',
    title: 'Find Your Game Partner',
    subtitle: 'Connect with people who love the same sports and activities as you — tennis, badminton, cricket and more.',
    bg: COLORS.primary,
  },
  {
    id: '2',
    icon: 'cafe-outline' as const,
    iconBg: 'rgba(255,255,255,0.15)',
    title: 'Not Just Sports',
    subtitle: 'Looking for a coffee buddy, a movie companion, or a morning jogging partner? We have got you covered.',
    bg: '#2D3142',
  },
  {
    id: '3',
    icon: 'navigate-outline' as const,
    iconBg: 'rgba(255,255,255,0.2)',
    title: 'Find People Near You',
    subtitle: 'Discover activity partners in your city. Post an activity or join one that fits your schedule.',
    bg: '#06D6A0',
  },
];

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'> };

export default function OnboardingScreen({ navigation }: Props) {
  const [current, setCurrent] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const next = () => {
    if (current < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: current + 1 });
      setCurrent(current + 1);
    } else {
      navigation.replace('PhoneAuth');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.bg }]}>
            <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon} size={56} color={COLORS.white} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === current && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={next} activeOpacity={0.85}>
          <Text style={styles.btnText}>
            {current === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

        {current < SLIDES.length - 1 && (
          <TouchableOpacity onPress={() => navigation.replace('PhoneAuth')} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  slide: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconWrap: {
    width: 120, height: 120, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  dots: { flexDirection: 'row', marginBottom: SPACING.lg },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: COLORS.white,
    width: 24,
  },
  btn: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.full,
    width: '100%',
    alignItems: 'center',
  },
  btnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: { marginTop: SPACING.md },
  skipText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
});
