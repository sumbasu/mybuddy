import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { FONTS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import Constants from 'expo-constants';

// White sheet with a purple header — matches Profile/Settings/Edit Profile,
// not the old dark-gradient onboarding theme this screen used to carry.
const C = {
  page: '#FFFFFF',
  purple: '#3F2F86',
  heading: '#16213E',
  sub: '#767683',
  border: '#ECEBF2',
  lime: '#C8DB2E',
  success: '#06D6A0',
  warning: '#B8860B',
  warningBg: '#FFF6DC',
  warningBorder: '#F2E2A8',
  error: '#EF233C',
  errorBg: '#FDEDEF',
  errorBorder: '#F5C6CD',
};

// Razorpay only works in native builds, not Expo Go
// executionEnvironment is 'storeClient' in Expo Go, 'standalone' or 'bare' in native builds
const isExpoGo = Constants.executionEnvironment === 'storeClient';
let RazorpayCheckout: any = null;
if (!isExpoGo) {
  try { RazorpayCheckout = require('react-native-razorpay').default; } catch { }
}

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '₹199',
    perMonth: '₹199/month',
    billing: 'Billed monthly',
    badge: null,
    features: ['Unlimited activity joins', 'In-app messaging', 'See all participants', 'Request to join'],
  },
  {
    id: 'quarterly',
    label: 'Quarterly',
    price: '₹399',
    perMonth: '₹133/month',
    billing: 'Billed every 3 months · Save 33%',
    badge: 'Best Value',
    features: ['Everything in Monthly', 'Priority in activity feed', 'Profile badge', 'Early access to new features'],
  },
];

export default function SubscriptionScreen({ navigation }: Props) {
  const { user, setUser, isTrialActive } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('quarterly');
  const discount = user?.discountPct || 0;
  const applyDiscount = (amount: number) => Math.round(amount * (1 - discount / 100));
  const monthlyPrice = applyDiscount(199);
  const quarterlyPrice = applyDiscount(399);
  const [loading, setLoading] = useState(false);

  const trialDaysLeft = user?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const amount = selectedPlan === 'monthly' ? monthlyPrice * 100 : quarterlyPrice * 100;
      let razorpaySubscriptionId: string;

      if (isExpoGo || !RazorpayCheckout) {
        // Expo Go — simulate payment for testing
        await new Promise((r) => setTimeout(r, 800));
        razorpaySubscriptionId = 'test_pay_' + Date.now();
        Alert.alert(
          '⚡ Test Mode',
          'Running in Expo Go — payment simulated. Build with expo run:ios for real Razorpay.',
          [{ text: 'OK' }]
        );
      } else {
        // Native build — real Razorpay checkout
        const data = await RazorpayCheckout.open({
          key: process.env.EXPO_PUBLIC_RAZORPAY_KEY || '',
          amount,
          currency: 'INR',
          name: 'sweatbud',
          description: `sweatbud ${selectedPlan === 'monthly' ? 'Monthly' : 'Quarterly'} Plan`,
          prefill: { email: user.email },
          theme: { color: C.purple },
        });
        razorpaySubscriptionId = data.razorpay_payment_id;
      }

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (selectedPlan === 'monthly' ? 1 : 3));

      await setUser({
        ...user,
        subscription: {
          plan: 'basic',
          expiresAt: expiresAt.toISOString(),
          razorpaySubscriptionId,
        },
      });

      Alert.alert(
        'Subscribed! 🎉',
        'Welcome to sweatbud Premium. Start finding your activity partners!',
        [{ text: "Let's Go!", onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      if (err?.code !== 'PAYMENT_CANCELLED') {
        Alert.alert('Payment Failed', err?.description || 'Something went wrong. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Unlock sweatbud</Text>

        {isTrialActive() ? (
          <View style={styles.trialBanner}>
            <Ionicons name="time-outline" size={18} color={C.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.trialText}>
                Free trial ends in <Text style={styles.trialBold}>{trialDaysLeft} days</Text>
              </Text>
              <Text style={styles.trialSub}>Subscribe now to keep access to all features</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.trialBanner, styles.trialExpired]}>
            <Ionicons name="lock-closed-outline" size={18} color={C.error} />
            <View style={{ flex: 1 }}>
              <Text style={styles.trialText}>Your free trial has ended</Text>
              <Text style={styles.trialSub}>Subscribe to find activity partners again</Text>
            </View>
          </View>
        )}

        <View style={styles.featuresBox}>
          <Text style={styles.featuresTitle}>What you get</Text>
          {[
            { icon: 'people-outline',   text: 'Connect with people who share your interests' },
            { icon: 'calendar-outline', text: 'Post and join activities near you' },
            { icon: 'chatbubbles-outline', text: 'Chat with your activity buddies' },
            { icon: 'location-outline', text: 'India-wide activity discovery' },
            { icon: 'star-outline',     text: 'Rate and review partners' },
          ].map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={f.icon as any} size={16} color={C.purple} />
              </View>
              <Text style={styles.feature}>{f.text}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.plansTitle}>Choose a Plan</Text>

        {discount > 0 && (
          <View style={styles.discountBanner}>
            <Ionicons name="gift" size={16} color={C.success} />
            <Text style={styles.discountBannerText}>{discount}% invite discount applied to your prices!</Text>
          </View>
        )}

      {PLANS.map((plan) => {
        const finalPrice = plan.id === 'monthly' ? monthlyPrice : quarterlyPrice;
        const originalPrice = plan.id === 'monthly' ? 199 : 399;
        const perMonthFinal = plan.id === 'monthly' ? finalPrice : Math.round(finalPrice / 3);
        return (
        <TouchableOpacity
          key={plan.id}
          style={[styles.planCard, selectedPlan === plan.id && styles.planCardActive]}
          onPress={() => setSelectedPlan(plan.id)}
          activeOpacity={0.9}
        >
          <View style={styles.planTop}>
            <View>
              <Text style={[styles.planLabel, selectedPlan === plan.id && styles.planLabelActive]}>
                {plan.label}
              </Text>
              <Text style={styles.planBilling}>{plan.billing}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {discount > 0 && (
                <Text style={styles.strikePrice}>₹{originalPrice}</Text>
              )}
              <Text style={[styles.planPrice, selectedPlan === plan.id && styles.planPriceActive]}>
                ₹{finalPrice}
              </Text>
              <Text style={styles.planPerMonth}>₹{perMonthFinal}/month</Text>
            </View>
          </View>
          {plan.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{plan.badge}</Text>
            </View>
          )}
          {selectedPlan === plan.id && (
            <View style={styles.checkMark}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
        );
      })}

        <TouchableOpacity
          style={[styles.subscribeBtn, loading && styles.subscribeBtnDisabled]}
          onPress={handleSubscribe}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.subscribeBtnText}>Subscribe with Razorpay</Text>
              <Text style={styles.subscribeBtnSub}>Secure payment · Cancel anytime</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.legal}>
          Payment processed securely by Razorpay. By subscribing you agree to our Terms of Service. Subscriptions auto-renew and can be cancelled at any time.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.purple },
  header: {
    paddingTop: 56, paddingBottom: SPACING.md, paddingHorizontal: SPACING.md,
    backgroundColor: C.purple,
  },
  backBtn: { alignSelf: 'flex-start', minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  sheet: {
    flex: 1, backgroundColor: C.page,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
  },
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.xxl },
  title: { fontFamily: FONTS.extraBold, fontSize: 24, color: C.heading, marginBottom: SPACING.lg },
  trialBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: C.warningBg, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: C.warningBorder },
  trialExpired: { backgroundColor: C.errorBg, borderColor: C.errorBorder },
  trialText: { fontFamily: FONTS.bold, fontSize: 14, color: C.heading },
  trialBold: { color: C.purple },
  trialSub: { fontFamily: FONTS.regular, fontSize: 12.5, color: C.sub, marginTop: 4 },
  featuresBox: { backgroundColor: '#FFFFFF', borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: C.border, ...SHADOW.sm },
  featuresTitle: { fontFamily: FONTS.bold, fontSize: 15, color: C.heading, marginBottom: SPACING.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  featureIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(63,47,134,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  feature: { fontFamily: FONTS.regular, fontSize: 13.5, color: C.sub, flex: 1, lineHeight: 19 },
  plansTitle: { fontFamily: FONTS.bold, fontSize: 15, color: C.heading, marginBottom: SPACING.sm },
  planCard: { backgroundColor: '#FFFFFF', borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 2, borderColor: C.border, ...SHADOW.sm, position: 'relative', overflow: 'hidden' },
  planCardActive: { borderColor: C.purple, backgroundColor: 'rgba(63,47,134,0.05)' },
  discountBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: 'rgba(6,214,160,0.12)', borderRadius: RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(6,214,160,0.35)',
  },
  discountBannerText: { fontFamily: FONTS.bold, fontSize: 12.5, color: C.success },
  strikePrice: { fontFamily: FONTS.regular, fontSize: 12, color: C.sub, textDecorationLine: 'line-through', textAlign: 'right' },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planLabel: { fontFamily: FONTS.bold, fontSize: 16, color: C.heading },
  planLabelActive: { color: C.purple },
  planBilling: { fontFamily: FONTS.regular, fontSize: 12, color: C.sub, marginTop: 2 },
  planPrice: { fontFamily: FONTS.extraBold, fontSize: 21, color: C.heading, textAlign: 'right' },
  planPriceActive: { color: C.purple },
  planPerMonth: { fontFamily: FONTS.regular, fontSize: 11.5, color: C.sub, textAlign: 'right' },
  badge: { alignSelf: 'flex-start', backgroundColor: C.purple, borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 3, marginTop: SPACING.sm },
  badgeText: { fontFamily: FONTS.bold, color: '#FFFFFF', fontSize: 11 },
  checkMark: { position: 'absolute', top: SPACING.sm, right: SPACING.sm, width: 24, height: 24, borderRadius: 12, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' },
  subscribeBtn: { backgroundColor: C.purple, paddingVertical: SPACING.md, borderRadius: RADIUS.full, alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.md },
  subscribeBtnDisabled: { backgroundColor: C.sub },
  subscribeBtnText: { fontFamily: FONTS.bold, color: '#FFFFFF', fontSize: 16 },
  subscribeBtnSub: { fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 3 },
  legal: { fontFamily: FONTS.regular, fontSize: 11, color: C.sub, textAlign: 'center', lineHeight: 16 },
});
