import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';
// import RazorpayCheckout from 'react-native-razorpay'; // uncomment when ready

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '₹99',
    perMonth: '₹99/month',
    billing: 'Billed monthly',
    badge: null,
    features: ['Unlimited activity joins', 'In-app messaging', 'See all participants', 'Request to join'],
  },
  {
    id: 'quarterly',
    label: 'Quarterly',
    price: '₹249',
    perMonth: '₹83/month',
    billing: 'Billed every 3 months · Save 16%',
    badge: 'Best Value',
    features: ['Everything in Monthly', 'Priority in activity feed', 'Profile badge', 'Early access to new features'],
  },
];

export default function SubscriptionScreen({ navigation }: Props) {
  const { user, setUser, isTrialActive } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('quarterly');
  const discount = user?.discountPct || 0;
  const applyDiscount = (amount: number) => Math.round(amount * (1 - discount / 100));
  const monthlyPrice = applyDiscount(99);
  const quarterlyPrice = applyDiscount(249);
  const [loading, setLoading] = useState(false);

  const trialDaysLeft = user?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Razorpay — uncomment once react-native-razorpay is installed:
      // const amount = selectedPlan === 'monthly' ? monthlyPrice * 100 : quarterlyPrice * 100;
      // const data = await RazorpayCheckout.open({
      //   description: `MyBuddy ${selectedPlan === 'monthly' ? 'Monthly' : 'Quarterly'} Plan`,
      //   currency: 'INR',
      //   key: 'rzp_test_XXXXXXXX',
      //   amount,
      //   name: 'MyBuddy',
      //   prefill: { contact: user.phone },
      //   theme: { color: '#FF6B35' },
      // });
      // const razorpaySubscriptionId = data.razorpay_payment_id;

      // --- DEMO fallback (remove once Razorpay is wired) ---
      await new Promise((r) => setTimeout(r, 1000));
      const razorpaySubscriptionId = 'demo_pay_' + Date.now();
      // -----------------------------------------------------

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
        'Welcome to MyBuddy Premium. Start finding your activity partners!',
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Unlock MyBuddy</Text>

      {isTrialActive() ? (
        <View style={styles.trialBanner}>
          <Ionicons name="time-outline" size={18} color={COLORS.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.trialText}>
              Free trial ends in <Text style={styles.trialBold}>{trialDaysLeft} days</Text>
            </Text>
            <Text style={styles.trialSub}>Subscribe now to keep access to all features</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.trialBanner, styles.trialExpired]}>
          <Ionicons name="lock-closed-outline" size={18} color={COLORS.error} />
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
              <Ionicons name={f.icon as any} size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.feature}>{f.text}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.plansTitle}>Choose a Plan</Text>

      {discount > 0 && (
        <View style={styles.discountBanner}>
          <Ionicons name="gift" size={16} color={COLORS.success} />
          <Text style={styles.discountBannerText}>{discount}% invite discount applied to your prices!</Text>
        </View>
      )}

      {PLANS.map((plan) => {
        const finalPrice = plan.id === 'monthly' ? monthlyPrice : quarterlyPrice;
        const originalPrice = plan.id === 'monthly' ? 99 : 249;
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
              <Ionicons name="checkmark" size={14} color={COLORS.white} />
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
          <ActivityIndicator color={COLORS.white} />
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  header: { paddingTop: 56, paddingBottom: SPACING.md },
  back: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  backBtn: { alignSelf: 'flex-start', padding: 4 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.lg },
  trialBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: COLORS.warning + '30', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.warning + '50' },
  trialExpired: { backgroundColor: COLORS.error + '15', borderColor: COLORS.error + '40' },
  trialText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  trialBold: { color: COLORS.primary },
  trialSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  featuresBox: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOW.sm },
  featuresTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  featureIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center' },
  feature: { fontSize: 14, color: COLORS.textSecondary, flex: 1, lineHeight: 20 },
  plansTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  planCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 2, borderColor: COLORS.border, ...SHADOW.sm, position: 'relative', overflow: 'hidden' },
  planCardActive: { borderColor: COLORS.primary, backgroundColor: '#FFF5F0' },
  discountBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.success + '18', borderRadius: RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.success + '40',
  },
  discountBannerText: { fontSize: 13, color: COLORS.success, fontWeight: '700' },
  strikePrice: { fontSize: 12, color: COLORS.textMuted, textDecorationLine: 'line-through', textAlign: 'right' },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planLabel: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  planLabelActive: { color: COLORS.primary },
  planBilling: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  planPrice: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'right' },
  planPriceActive: { color: COLORS.primary },
  planPerMonth: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right' },
  badge: { alignSelf: 'flex-start', backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 3, marginTop: SPACING.sm },
  badgeText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  checkMark: { position: 'absolute', top: SPACING.sm, right: SPACING.sm, width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  subscribeBtn: { backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.full, alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.md },
  subscribeBtnDisabled: { backgroundColor: COLORS.textMuted },
  subscribeBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  subscribeBtnSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 3 },
  legal: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', lineHeight: 16 },
});
