import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { useActivities } from '../hooks/useActivities';
import { INTERESTS } from '../constants/interests';
import StarRating from '../components/StarRating';
import { storage } from '../services/firebase';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

// White-body layout matching the Playtomic reference — purple header, white sheet below.
const C = {
  headerBg: '#3F2F86',
  page: '#FAFAFA',
  card: '#FFFFFF',
  heading: '#16213E',
  sub: '#767683',
  muted: '#9A9AA6',
  border: '#ECEBF2',
  purple: '#3d3081',
  gold: '#E8B84B',
  lime: '#C8DB2E',
  error: '#EF233C',
};

const initials = (name?: string) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

const RESULT_FILTERS = ['5 results', '10 results', 'All results'];

type PrefKey = 'bestHand' | 'courtPosition' | 'matchType' | 'preferredTime';

const PREFERENCES: { key: PrefKey; emoji: string; label: string; options: string[] }[] = [
  { key: 'bestHand', emoji: '🤚', label: 'Best hand', options: ['Right', 'Left', 'Ambidextrous'] },
  { key: 'courtPosition', emoji: '📍', label: 'Court position', options: ['Left court', 'Right court', 'Either'] },
  { key: 'matchType', emoji: '🥇', label: 'Match type', options: ['Singles', 'Doubles', 'Either'] },
  { key: 'preferredTime', emoji: '🌅', label: 'Preferred time to play', options: ['Morning', 'Afternoon', 'Evening', 'Night'] },
];

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout, isSubscribed, setUser } = useAuth();
  const { activities } = useActivities();
  const [resultFilter, setResultFilter] = useState(RESULT_FILTERS[0]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [prefsModalVisible, setPrefsModalVisible] = useState(false);
  const [draftPrefs, setDraftPrefs] = useState<Record<PrefKey, string>>({
    bestHand: '', courtPosition: '', matchType: '', preferredTime: '',
  });

  const subscribed = isSubscribed();
  const myUid = user?.uid || 'demo_user';
  const matches = activities.filter(
    (a) => a.creatorId === myUid || a.participants.includes(myUid)
  ).length;
  const followers = user?.followersCount ?? 0;
  const following = user?.followingCount ?? 0;

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const editPreferences = () => {
    setDraftPrefs({
      bestHand: user?.bestHand || '',
      courtPosition: user?.courtPosition || '',
      matchType: user?.matchType || '',
      preferredTime: user?.preferredTime || '',
    });
    setPrefsModalVisible(true);
  };

  const savePreferences = async () => {
    if (!user) return;
    await setUser({ ...user, ...draftPrefs });
    setPrefsModalVisible(false);
  };

  const uploadPhoto = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!user) return;
    setUploadingPhoto(true);
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const photoRef = ref(storage, `profiles/${user.uid}/avatar.jpg`);
      await uploadBytes(photoRef, blob);
      const photoURL = await getDownloadURL(photoRef);
      await setUser({ ...user, photoURL });
    } catch {
      Alert.alert('Error', 'Could not upload photo. Please try again.');
    }
    setUploadingPhoto(false);
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) uploadPhoto(result.assets[0]);
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to choose a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled) uploadPhoto(result.assets[0]);
  };

  const changePhoto = () => {
    if (uploadingPhoto) return;
    Alert.alert('Profile Photo', undefined, [
      { text: 'Take Photo', onPress: pickFromCamera },
      { text: 'Choose from Library', onPress: pickFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeInterest = (id: string) => {
    if (!user) return;
    const remaining = (user.interests || []).filter((i) => i !== id);
    // Dropping below 2 kicks the whole app into the onboarding interest-picker
    // stack (AppNavigator), which has no way back — keep at least 2 here.
    if (remaining.length < 2) {
      Alert.alert('Keep at least 2', 'You need at least 2 interests so we can match you with people who share them.');
      return;
    }
    setUser({ ...user, interests: remaining });
  };

  return (
    <View style={styles.container}>
      {/* Header — stays on the app's purple */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Body — white sheet */}
      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View style={styles.identityRow}>
          <TouchableOpacity style={styles.avatar} onPress={changePhoto} activeOpacity={0.85}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials(user?.name)}</Text>
            )}
            <View style={styles.avatarBadge}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={13} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name || 'Your Name'}</Text>
            <StarRating rating={user?.rating || 0} size={14} showLabel reviewCount={user?.reviewCount} />
            {user?.city ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={10} color={C.sub} />
                <Text style={styles.locationText}>{user.city}</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.7}>
                <Text style={styles.addLocationText}>Add my location</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{matches}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{followers}</Text>
            <Text style={styles.statLabel}>{followers < 2 ? 'Follower' : 'Followers'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.85}>
            <Text style={styles.editBtnText}>Edit profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.goProBtn} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.85}>
            <Text style={styles.goProBtnText}>Go Premium</Text>
          </TouchableOpacity>
        </View>

        {/* Interests */}
        <View style={styles.interestsRow}>
          {(user?.interests || []).map((id, i) => {
            const interest = INTERESTS.find((it) => it.id === id);
            return (
              <View key={id} style={[styles.interestChip, i === 0 && styles.interestChipActive]}>
                <Text style={[styles.interestChipText, i === 0 && styles.interestChipTextActive]}>
                  {interest?.label || id}
                </Text>
                <TouchableOpacity onPress={() => removeInterest(id)} hitSlop={8}>
                  <Ionicons name="close" size={13} color={i === 0 ? '#FFFFFF' : C.sub} />
                </TouchableOpacity>
              </View>
            );
          })}
          <TouchableOpacity
            style={styles.addChip}
            onPress={() => navigation.navigate('InterestPicker')}
            activeOpacity={0.8}
          >
            <Text style={styles.addChipText}>+ Add new</Text>
          </TouchableOpacity>
        </View>

        {/* Level progression */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Level progression</Text>
          <View style={styles.filterRow}>
            {RESULT_FILTERS.map((f, i) => {
              const active = f === resultFilter;
              const locked = i > 0 && !subscribed;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setResultFilter(f)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f}</Text>
                  {locked && <Ionicons name="lock-closed" size={10} color={C.muted} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.progressCard}>
            <Ionicons name="stats-chart" size={40} color={C.border} />
            <Text style={styles.progressTitle}>Track your progress</Text>
            <Text style={styles.progressSub}>Play more games to level up your ranking</Text>
          </View>
        </View>

        {/* Player preferences */}
        <View style={styles.section}>
          <View style={styles.prefsHeader}>
            <Text style={styles.sectionTitle}>Player preferences</Text>
            <TouchableOpacity onPress={editPreferences}>
              <Text style={styles.prefsEdit}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={{ gap: SPACING.sm }}>
            {PREFERENCES.map((p) => (
              <View key={p.key} style={styles.prefRow}>
                <Text style={styles.prefEmoji}>{p.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prefLabel}>{p.label}</Text>
                  <Text style={styles.prefValue}>{user?.[p.key] || 'Not set'}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutBtnText}>Log out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={prefsModalVisible} transparent animationType="slide" onRequestClose={() => setPrefsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Player Preferences</Text>
              <TouchableOpacity onPress={() => setPrefsModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={C.heading} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: SPACING.md }}>
              {PREFERENCES.map((p) => (
                <View key={p.key} style={styles.modalPrefBlock}>
                  <Text style={styles.modalPrefLabel}>{p.emoji} {p.label}</Text>
                  <View style={styles.modalOptionsRow}>
                    {p.options.map((opt) => {
                      const active = draftPrefs[p.key] === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.modalOptionChip, active && styles.modalOptionChipActive]}
                          onPress={() => setDraftPrefs((prev) => ({ ...prev, [p.key]: active ? '' : opt }))}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.modalOptionText, active && styles.modalOptionTextActive]}>{opt}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={savePreferences} activeOpacity={0.85}>
              <Text style={styles.modalSaveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.headerBg },
  header: {
    backgroundColor: C.headerBg,
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerIcons: { flexDirection: 'row', gap: SPACING.md },
  headerIconBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },

  sheet: {
    flex: 1, backgroundColor: C.page,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
  },
  sheetContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, paddingBottom: SPACING.xxl },

  identityRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.lg },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.purple,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarText: { fontFamily: FONTS.bold, fontSize: 20, color: '#FFFFFF', letterSpacing: 0.7 },
  avatarBadge: {
    position: 'absolute', right: -2, bottom: -2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.purple, borderWidth: 2, borderColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontFamily: FONTS.extraBold, fontSize: 19, color: C.heading },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  locationText: { fontSize: 12, fontFamily: FONTS.medium, color: C.sub },
  addLocationText: { fontSize: 13.5, fontFamily: FONTS.semiBold, color: C.purple, marginTop: 4 },

  statsCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.sm, marginBottom: SPACING.lg,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: FONTS.extraBold, fontSize: 22, color: C.heading },
  statLabel: { fontFamily: FONTS.regular, fontSize: 12.5, color: C.sub, marginTop: 2 },
  statDivider: { width: 1, height: '70%', backgroundColor: C.border },

  actionsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  editBtn: {
    flex: 1, height: 44, borderRadius: RADIUS.lg,
    borderWidth: 1.4, borderColor: C.purple,
    alignItems: 'center', justifyContent: 'center',
  },
  editBtnText: { fontFamily: FONTS.bold, fontSize: 13.5, color: C.purple },
  goProBtn: {
    flex: 1, height: 44, borderRadius: RADIUS.lg,
    backgroundColor: C.purple,
    alignItems: 'center', justifyContent: 'center',
  },
  goProBtnText: { fontFamily: FONTS.extraBold, fontSize: 13.5, color: C.lime },

  interestsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.lg },
  interestChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: RADIUS.lg, paddingVertical: 7, paddingHorizontal: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2, borderColor: C.border,
  },
  interestChipActive: { backgroundColor: C.purple, borderColor: C.purple },
  interestChipText: { fontFamily: FONTS.bold, fontSize: 13, color: C.sub },
  interestChipTextActive: { color: '#FFFFFF' },
  addChip: {
    borderRadius: RADIUS.lg, minHeight: 44, paddingHorizontal: SPACING.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2, borderColor: C.border,
  },
  addChipText: { fontFamily: FONTS.bold, fontSize: 13, color: C.sub },

  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 16, color: C.heading },
  filterRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.sm, marginBottom: SPACING.sm },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    height: 44, paddingHorizontal: SPACING.md, borderRadius: RADIUS.lg,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2, borderColor: C.border,
  },
  filterChipActive: { backgroundColor: C.border, borderColor: C.border },
  filterChipText: { fontFamily: FONTS.semiBold, fontSize: 13, color: C.sub },
  filterChipTextActive: { color: C.heading },
  progressCard: {
    alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.lg, paddingVertical: SPACING.xl, paddingHorizontal: SPACING.md,
  },
  progressTitle: { fontFamily: FONTS.bold, fontSize: 14, color: C.heading, marginTop: 6 },
  progressSub: { fontFamily: FONTS.regular, fontSize: 12, color: C.sub, textAlign: 'center' },

  prefsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  prefsEdit: { fontFamily: FONTS.semiBold, fontSize: 13, color: C.purple },
  prefRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  prefEmoji: { fontSize: 19 },
  prefLabel: { fontFamily: FONTS.medium, fontSize: 12, color: C.sub },
  prefValue: { fontFamily: FONTS.bold, fontSize: 12.5, color: C.heading, marginTop: 2 },

  logoutBtn: {
    height: 44, borderRadius: RADIUS.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  logoutBtnText: { fontFamily: FONTS.bold, fontSize: 13, color: C.error, letterSpacing: 0.3 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.xl, maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  modalTitle: { fontFamily: FONTS.extraBold, fontSize: 18, color: C.heading },
  modalPrefBlock: { marginBottom: SPACING.lg },
  modalPrefLabel: { fontFamily: FONTS.bold, fontSize: 14, color: C.heading, marginBottom: SPACING.sm },
  modalOptionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  modalOptionChip: {
    minHeight: 40, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full,
    borderWidth: 1.2, borderColor: C.border, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  modalOptionChipActive: { backgroundColor: C.purple, borderColor: C.purple },
  modalOptionText: { fontFamily: FONTS.semiBold, fontSize: 13, color: C.sub },
  modalOptionTextActive: { color: '#FFFFFF' },
  modalSaveBtn: {
    height: 50, borderRadius: RADIUS.full, backgroundColor: C.purple,
    alignItems: 'center', justifyContent: 'center', marginTop: SPACING.sm,
  },
  modalSaveBtnText: { fontFamily: FONTS.extraBold, fontSize: 15, color: C.lime },
});
