import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { FONTS, SPACING, RADIUS } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'> };

// Colors specific to this screen's light theme (distinct from the app's dark gradient elsewhere).
const C = {
  textPrimary: '#2E2260',
  textSecondary: 'rgba(75,59,140,0.55)',
  textMuted: 'rgba(75,59,140,0.5)',
  label: 'rgba(75,59,140,0.45)',
  border: 'rgba(75,59,140,0.12)',
  cardBg: 'rgba(255,255,255,0.6)',
  purple: '#4B3B8C',
  lime: '#C5E637',
  cream: '#F0EDE4',
  danger: 'rgba(220,60,60,0.9)',
};

const initials = (name?: string) =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

function GradientBg() {
  return (
    <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Defs>
        <SvgLinearGradient id="settingsGrad" x1="5%" y1="0%" x2="95%" y2="100%">
          <Stop offset="0.0849" stopColor="#D4CEF0" />
          <Stop offset="0.5" stopColor="#C8C0EC" />
          <Stop offset="0.9151" stopColor="#BEB5E8" />
        </SvgLinearGradient>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#settingsGrad)" />
    </Svg>
  );
}

function Row({
  icon, label, sub, danger, onPress,
}: { icon: any; label: string; sub?: string; danger?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowIconWrap}>
        <Ionicons name={icon} size={16} color={danger ? C.danger : C.purple} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && { color: C.danger }]}>{label}</Text>
        {sub ? <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {!danger && <Ionicons name="chevron-forward" size={13} color={C.purple} />}
    </TouchableOpacity>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={[styles.card, { marginTop: 0 }]}>{children}</View>
    </View>
  );
}

export default function SettingsScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const soon = () => Alert.alert('Coming soon', 'This section will be available in a future update.');

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const trialDaysLeft = user?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <View style={{ flex: 1 }}>
      <GradientBg />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="close" size={20} color={C.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.identityRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name || 'Your Name'}</Text>
            <Text style={styles.trial}>
              {trialDaysLeft > 0 ? `Free trial · ${trialDaysLeft}d left` : 'Free trial'}
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.name)}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.goProBtn} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.85}>
            <Text style={styles.goProBtnText}>Go Pro ✦</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} activeOpacity={0.85} onPress={soon}>
            <Ionicons name="share-outline" size={13} color={C.purple} />
            <Text style={styles.shareBtnText}>Share profile</Text>
          </TouchableOpacity>
        </View>

        <Section label="Your account">
          <Row icon="person-outline" label="Edit profile" sub="Name, email, phone, location, gender..." onPress={() => navigation.navigate('EditProfile')} />
          <Row icon="time-outline" label="Your activity" sub="Matches, classes, competitions, groups..." onPress={() => navigation.navigate('YourActivity')} />
          <Row icon="card-outline" label="Your payments" sub="Payment methods, transactions, club..." onPress={soon} />
          <Row icon="settings-outline" label="Settings" sub="Configure privacy, notifications, security..." onPress={soon} />
        </Section>

        <Section label="Support">
          <Row icon="chatbubble-outline" label="Help" onPress={soon} />
          <Row icon="document-text-outline" label="How Sweatbud works" onPress={soon} />
        </Section>

        <Section label="Legal information">
          <Row icon="document-outline" label="Terms of use" onPress={soon} />
          <Row icon="document-outline" label="Privacy Policy" onPress={soon} />
        </Section>

        <View style={styles.card}>
          <Row icon="log-out-outline" label="Log out" danger onPress={handleLogout} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xxl },
  header: { paddingTop: 56, paddingBottom: SPACING.sm },
  identityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontFamily: FONTS.bold, fontSize: 16, color: C.textPrimary },
  trial: { fontFamily: FONTS.regular, fontSize: 10.5, color: C.textSecondary, marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.purple, borderWidth: 1.6, borderColor: 'rgba(75,59,140,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: FONTS.extraBold, fontSize: 13.7, color: C.cream, letterSpacing: 0.5 },

  actionsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  goProBtn: {
    height: 29, paddingHorizontal: SPACING.md, borderRadius: RADIUS.lg,
    backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center',
  },
  goProBtnText: { fontFamily: FONTS.extraBold, fontSize: 10.5, color: C.lime },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    height: 29, paddingHorizontal: SPACING.md, borderRadius: RADIUS.lg,
    borderWidth: 1.2, borderColor: 'rgba(75,59,140,0.4)',
  },
  shareBtnText: { fontFamily: FONTS.semiBold, fontSize: 10.5, color: C.purple },

  section: { marginTop: SPACING.lg },
  sectionLabel: {
    fontFamily: FONTS.bold, fontSize: 9.7, color: C.label,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: C.cardBg, borderWidth: 0.8, borderColor: C.border,
    borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.lg,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 0.8, borderBottomColor: 'rgba(75,59,140,0.1)',
  },
  rowIconWrap: { width: 26, alignItems: 'center' },
  rowLabel: { fontFamily: FONTS.semiBold, fontSize: 11.3, color: C.textPrimary },
  rowSub: { fontFamily: FONTS.regular, fontSize: 8.9, color: C.textMuted, marginTop: 2 },
});
