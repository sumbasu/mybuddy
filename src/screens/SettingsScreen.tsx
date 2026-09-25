import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { FONTS, SPACING, RADIUS } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'> };

// White sheet between a purple header and the rest of the app — matches the Profile screen.
const C = {
  page: '#FFFFFF',
  purple: '#3F2F86',
  purpleBorder: 'rgba(255,255,255,0.15)',
  label: 'rgba(63,47,134,0.45)',
  sub: '#767683',
  heading: '#16213E',
  lime: '#C8DB2E',
  danger: '#FF6B6B',
};

const initials = (name?: string) =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

function Row({
  icon, label, sub, danger, onPress,
}: { icon: any; label: string; sub?: string; danger?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowIconWrap}>
        <Ionicons name={icon} size={16} color={danger ? C.danger : '#FFFFFF'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && { color: C.danger }]}>{label}</Text>
        {sub ? <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {!danger && <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />}
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
    <View style={styles.container}>
      {/* Purple header — minimal, matches the app's purple */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.headerLogoutBtn}>
          <Ionicons name="power" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* White sheet — all identity content and text lives here */}
      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
        <View style={styles.identityBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.name)}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Your Name'}</Text>
          <Text style={styles.trial}>
            {trialDaysLeft > 0 ? `Free trial · ${trialDaysLeft}d left` : 'Free trial'}
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.goProBtn} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.85}>
              <Text style={styles.goProBtnText}>Premium ✦</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} activeOpacity={0.85} onPress={soon}>
              <Ionicons name="share-outline" size={13} color={C.purple} />
              <Text style={styles.shareBtnText}>Share profile</Text>
            </TouchableOpacity>
          </View>
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

        <View style={{ height: 24 }} />
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.purple },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.purple,
    paddingHorizontal: SPACING.md, paddingTop: 56, paddingBottom: SPACING.md,
  },
  headerIconBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  headerLogoutBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },

  sheet: {
    flex: 1, backgroundColor: C.page,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
  },
  sheetContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, paddingBottom: SPACING.xxl },

  identityBlock: { alignItems: 'center', marginBottom: SPACING.lg },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.heading,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: FONTS.extraBold, fontSize: 19, color: '#FFFFFF', letterSpacing: 0.5 },
  name: { fontFamily: FONTS.bold, fontSize: 18, color: C.heading, marginTop: SPACING.sm, textAlign: 'center' },
  trial: { fontFamily: FONTS.regular, fontSize: 11.5, color: C.sub, marginTop: 2, textAlign: 'center' },

  actionsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  goProBtn: {
    width: 136, height: 44, borderRadius: RADIUS.lg,
    backgroundColor: C.heading, alignItems: 'center', justifyContent: 'center',
  },
  goProBtnText: { fontFamily: FONTS.extraBold, fontSize: 11.3, color: C.lime },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    width: 136, height: 44, borderRadius: RADIUS.lg,
    borderWidth: 1.2, borderColor: C.purple,
  },
  shareBtnText: { fontFamily: FONTS.semiBold, fontSize: 11.3, color: C.purple },

  section: { marginBottom: SPACING.lg },
  sectionLabel: {
    fontFamily: FONTS.bold, fontSize: 9.7, color: C.label,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: C.purple,
    borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.lg,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    minHeight: 64,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 0.8, borderBottomColor: C.purpleBorder,
  },
  rowIconWrap: { width: 26, alignItems: 'center' },
  rowLabel: { fontFamily: FONTS.semiBold, fontSize: 11.3, color: '#FFFFFF' },
  rowSub: { fontFamily: FONTS.regular, fontSize: 8.9, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
});
