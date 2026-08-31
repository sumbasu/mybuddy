import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { INTERESTS } from '../constants/interests';
import InterestIcon from '../components/InterestIcon';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

export default function ProfileScreen({ navigation }: Props) {
  const { user, setUser, logout, isSubscribed, isTrialActive } = useAuth();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const trialDaysLeft = user?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  const planLabel = () => {
    if (isTrialActive()) return `Free Trial · ${trialDaysLeft}d left`;
    if (user?.subscription.plan === 'basic') return 'Basic Plan';
    if (user?.subscription.plan === 'premium') return 'Premium Plan';
    return 'No Active Plan';
  };

  const myInviteCode = user?.myInviteCode ||
    ('MB' + (user?.uid || '').slice(-4).toUpperCase());

  const tier = (() => {
    if (user?.subscription.plan === 'premium') return 'premium';
    if (user?.subscription.plan === 'basic') return 'basic';
    if (isTrialActive()) return 'trial';
    return 'expired';
  })();

  const tierConfig = {
    premium: { color: '#F59E0B', label: 'Premium', icon: 'trophy' as const, bg: '#FFFBEB', border: '#F59E0B' },
    basic:   { color: '#06D6A0', label: 'Basic',   icon: 'checkmark-circle' as const, bg: '#F0FDF4', border: '#06D6A0' },
    trial:   { color: COLORS.primary, label: 'Free Trial', icon: 'time-outline' as const, bg: '#FFF5F0', border: COLORS.primary },
    expired: { color: COLORS.textMuted, label: 'No Plan', icon: 'lock-closed-outline' as const, bg: COLORS.surfaceSecondary, border: COLORS.border },
  }[tier];

  const subIcon = (): { name: any; color: string } => {
    if (isTrialActive()) return { name: 'time-outline', color: COLORS.warning };
    if (isSubscribed()) return { name: 'checkmark-circle', color: COLORS.success };
    return { name: 'lock-closed', color: COLORS.textMuted };
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to set a profile picture.');
      return;
    }
    Alert.alert('Profile Photo', 'Choose a photo', [
      {
        text: 'Camera',
        onPress: async () => {
          const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
          if (camStatus !== 'granted') return;
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
          if (!result.canceled && user) {
            setUploadingPhoto(true);
            await setUser({ ...user, photoURL: result.assets[0].uri });
            setUploadingPhoto(false);
          }
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
          if (!result.canceled && user) {
            setUploadingPhoto(true);
            await setUser({ ...user, photoURL: result.assets[0].uri });
            setUploadingPhoto(false);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Hero card — colour changes based on subscription tier */}
      <View style={[styles.heroCard, { backgroundColor: tierConfig.bg, borderWidth: 1.5, borderColor: tierConfig.border + '50' }]}>

        {/* Tier badge — top right corner */}
        <View style={[styles.tierCornerBadge, { backgroundColor: tierConfig.color }]}>
          <Ionicons name={tierConfig.icon} size={12} color="#fff" />
          <Text style={styles.tierCornerText}>{tierConfig.label}</Text>
        </View>

        <TouchableOpacity style={styles.avatarWrap} onPress={pickPhoto} activeOpacity={0.85}>
          {user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={[styles.avatarImage, { borderColor: tierConfig.color }]}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: tierConfig.color, borderColor: tierConfig.color + '50' }]}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
          <View style={[styles.cameraBtn, { backgroundColor: tierConfig.color }]}>
            {uploadingPhoto
              ? <ActivityIndicator size="small" color={COLORS.white} />
              : <Ionicons name="camera" size={14} color={COLORS.white} />
            }
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{user?.name || 'Your Name'}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={13} color={tierConfig.color} />
          <Text style={styles.locationText}>{user?.city || 'India'}</Text>
        </View>
        <View style={[styles.planBadge, { backgroundColor: tierConfig.color + '20' }]}>
          <Ionicons name={tierConfig.icon} size={11} color={tierConfig.color} />
          <Text style={[styles.planBadgeText, { color: tierConfig.color }]}>{planLabel()}</Text>
        </View>
      </View>

      {/* Interests */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Interests</Text>
          <TouchableOpacity style={styles.sectionAction} onPress={() => navigation.navigate('InterestPicker')}>
            <Ionicons name="pencil" size={13} color={COLORS.primary} />
            <Text style={styles.sectionActionText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.interestsWrap}>
          {(user?.interests || []).map((id) => {
            const interest = INTERESTS.find((i) => i.id === id);
            return (
              <View key={id} style={styles.interestChip}>
                <InterestIcon id={id} size={14} color={COLORS.textPrimary} />
                <Text style={styles.interestText}>{interest?.label || id}</Text>
              </View>
            );
          })}
          {(!user?.interests || user.interests.length === 0) && (
            <Text style={styles.noInterests}>No interests added yet</Text>
          )}
        </View>
      </View>

      {/* Subscription */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={styles.subCard}>
          <View style={[styles.subIconWrap, { backgroundColor: subIcon().color + '20' }]}>
            <Ionicons name={subIcon().name} size={26} color={subIcon().color} />
          </View>
          <View style={styles.subInfo}>
            <Text style={styles.subStatus}>{planLabel()}</Text>
            <Text style={styles.subSub}>
              {isSubscribed() ? 'Full access to all features' : 'Subscribe to unlock all features'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.subBtn}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={styles.subBtnText}>{isSubscribed() ? 'Manage' : 'Upgrade'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Invite friends */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invite Friends</Text>
        <View style={styles.inviteCard}>

          {/* Code + Share */}
          <View style={styles.inviteTop}>
            <View style={styles.inviteIconWrap}>
              <Ionicons name="gift" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.inviteInfo}>
              <Text style={styles.inviteLabel}>Your Invite Code</Text>
              <Text style={styles.inviteCode}>{myInviteCode}</Text>
            </View>
            <TouchableOpacity
              style={styles.inviteShareBtn}
              onPress={() => Share.share({
                message: `Hey! Join me on MyBuddy — the app to find activity partners near you. Use my invite code ${myInviteCode} to get 10% off your first subscription! Download now. 🤝`,
                title: 'Join MyBuddy',
              })}
            >
              <Ionicons name="share-social" size={16} color={COLORS.white} />
              <Text style={styles.inviteShareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Reward info */}
          <View style={styles.rewardInfoRow}>
            <View style={styles.rewardInfoItem}>
              <Ionicons name="people" size={14} color={COLORS.primary} />
              <Text style={styles.rewardInfoText}>Friends get <Text style={styles.rewardBold}>10% off</Text></Text>
            </View>
            <View style={styles.rewardInfoDivider} />
            <View style={styles.rewardInfoItem}>
              <Ionicons name="trophy" size={14} color={COLORS.warning} />
              <Text style={styles.rewardInfoText}>You get <Text style={styles.rewardBold}>1 free month</Text> per 5</Text>
            </View>
          </View>

          {/* Progress toward next free month */}
          {(() => {
            const count = user?.referralCount ?? 0;
            const earned = user?.freeMonthsEarned ?? 0;
            const progress = count % 5;
            const pct = (progress / 5) * 100;
            return (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>
                    {progress === 0 && count > 0 && (
                      <Ionicons name="trophy" size={13} color={COLORS.textPrimary} />
                    )}
                    {progress === 0 && count > 0 ? ' ' : ''}
                    {progress === 0 && count > 0
                      ? `${earned} free month${earned > 1 ? 's' : ''} earned!`
                      : `${progress}/5 friends joined`}
                  </Text>
                  <Text style={styles.progressSub}>
                    {5 - progress} more to earn a free month
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
                </View>
                <View style={styles.progressSteps}>
                  {[1,2,3,4,5].map(n => (
                    <View key={n} style={[styles.progressStep, n <= progress && styles.progressStepDone]}>
                      {n <= progress
                        ? <Ionicons name="checkmark" size={10} color={COLORS.white} />
                        : <Text style={styles.progressStepNum}>{n}</Text>
                      }
                    </View>
                  ))}
                </View>
                {earned > 0 && (
                  <View style={styles.earnedBadge}>
                    <Ionicons name="trophy" size={14} color={COLORS.warning} />
                    <Text style={styles.earnedBadgeText}>
                      {earned} free month{earned > 1 ? 's' : ''} waiting — contact support to redeem
                    </Text>
                  </View>
                )}
              </View>
            );
          })()}

          {/* Applied code badge */}
          {user?.appliedInviteCode && (
            <View style={styles.appliedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.appliedBadgeText}>
                You joined with <Text style={{ fontWeight: '800' }}>{user.appliedInviteCode}</Text> — 10% discount active
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="mail-outline"
            label="Email"
            value={user?.email || '-'}
          />
          <MenuItem
            icon="business-outline"
            label="City"
            value={user?.city || '-'}
          />
          <MenuItem
            icon="happy-outline"
            label="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
            showArrow
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            showArrow
            last
          />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
        <Text style={styles.logoutBtnText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>MyBuddy v1.0 · India only</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function MenuItem({
  icon, label, value, onPress, showArrow, last,
}: {
  icon: any; label: string; value?: string;
  onPress?: () => void; showArrow?: boolean; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, last && styles.menuItemLast]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={17} color={COLORS.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <View style={styles.menuRight}>
        {value && <Text style={styles.menuValue} numberOfLines={1}>{value}</Text>}
        {showArrow && <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.xxl },

  heroCard: {
    alignItems: 'center', paddingVertical: SPACING.xl,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    marginBottom: SPACING.lg, ...SHADOW.sm,
  },
  tierCornerBadge: {
    position: 'absolute', top: SPACING.md, right: SPACING.md,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  tierCornerText: { fontSize: 11, color: COLORS.white, fontWeight: '800' },
  avatarWrap: { position: 'relative', marginBottom: SPACING.md },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: COLORS.primary, alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3, borderColor: COLORS.primary + '30',
  },
  avatarImage: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 3, borderColor: COLORS.primary + '30',
  },
  avatarText: { fontSize: 34, fontWeight: '800', color: COLORS.white },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.surface,
  },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: SPACING.sm },
  locationText: { fontSize: 13, color: COLORS.textSecondary },
  planBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary + '15', paddingHorizontal: SPACING.md,
    paddingVertical: 4, borderRadius: RADIUS.full,
  },
  planBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },

  inviteCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, ...SHADOW.sm,
    borderWidth: 1.5, borderColor: COLORS.primary + '25',
  },
  inviteTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  inviteIconWrap: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  inviteInfo: { flex: 1 },
  inviteLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  inviteCode: { fontSize: 22, fontWeight: '900', color: COLORS.primary, letterSpacing: 3, marginTop: 2 },
  inviteShareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, borderRadius: RADIUS.full,
  },
  inviteShareBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  inviteHint: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },
  rewardInfoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceSecondary, borderRadius: RADIUS.md, padding: SPACING.sm, marginTop: SPACING.sm, marginBottom: SPACING.sm },
  rewardInfoItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' },
  rewardInfoDivider: { width: 1, height: 20, backgroundColor: COLORS.border },
  rewardInfoText: { fontSize: 12, color: COLORS.textSecondary },
  rewardBold: { fontWeight: '700', color: COLORS.textPrimary },
  progressSection: { marginTop: SPACING.xs },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  progressLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  progressSub: { fontSize: 11, color: COLORS.textMuted },
  progressTrack: { height: 8, backgroundColor: COLORS.surfaceSecondary, borderRadius: 4, marginBottom: SPACING.sm, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressSteps: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  progressStep: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.surfaceSecondary, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  progressStepDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  progressStepNum: { fontSize: 10, color: COLORS.textMuted, fontWeight: '700' },
  earnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.warning + '18', borderRadius: RADIUS.sm, padding: SPACING.sm, marginTop: SPACING.xs },
  earnedBadgeText: { fontSize: 12, color: COLORS.warning, fontWeight: '600', flex: 1 },
  appliedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.success + '15', borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 6, marginTop: SPACING.sm,
  },
  appliedBadgeText: { fontSize: 12, color: COLORS.success, flex: 1 },

  section: { marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, backgroundColor: COLORS.primary + '15' },
  sectionActionText: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },

  interestsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  interestChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.full,
    paddingVertical: 6, paddingHorizontal: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  interestText: { fontSize: 13, color: COLORS.textPrimary },
  noInterests: { fontSize: 13, color: COLORS.textMuted },

  subCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, ...SHADOW.sm,
  },
  subIconWrap: { width: 48, height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  subInfo: { flex: 1 },
  subStatus: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  subSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  subBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full,
  },
  subBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },

  menuCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, ...SHADOW.sm, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuIconWrap: {
    width: 32, height: 32, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  menuValue: { fontSize: 13, color: COLORS.textSecondary, maxWidth: 120 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.error + '10', paddingVertical: SPACING.md,
    borderRadius: RADIUS.full, borderWidth: 1,
    borderColor: COLORS.error + '30', marginBottom: SPACING.md,
  },
  logoutBtnText: { color: COLORS.error, fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 11, color: COLORS.textMuted },
});
