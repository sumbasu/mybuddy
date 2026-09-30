import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import CityPicker from '../components/CityPicker';
import { COLORS, SPACING, RADIUS, SHADOW, FONTS } from '../constants/theme';

const MIN_AGE = 17;
const MAX_AGE = 74;
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function ageFromDob(dob: Date): number {
  return Math.floor((Date.now() - dob.getTime()) / MS_PER_YEAR);
}

function formatDob(dob: Date): string {
  return dob.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'EditProfile'> };

// White page with a purple header and purple cards — matches Settings/Profile.
const C = {
  page: '#FAFAFA',
  purple: '#3F2F86',
  label: 'rgba(63,47,134,0.45)',
  heading: '#16213E',
  lime: '#C8DB2E',
};


// Seeds a starting point for the DOB picker from the legacy integer `age`
// field (still the source of truth everywhere else in the app) when no
// precise `dob` has been saved yet — an approximation, not a stored fact.
function seedDob(user: { dob?: string; age?: number } | null): Date | null {
  if (user?.dob) return new Date(user.dob);
  if (user?.age) return new Date(new Date().getFullYear() - user.age, 0, 1);
  return null;
}

export default function EditProfileScreen({ navigation }: Props) {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [dob, setDob] = useState<Date | null>(seedDob(user));
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say' | ''>(user?.gender || '');
  const [city, setCity] = useState(user?.city || '');
  const [email, setEmail] = useState(user?.email || '');
  const [buddyPref, setBuddyPref] = useState<'any' | 'same' | 'male' | 'female'>(
    user?.buddyGenderPreference || 'any'
  );
  const [loading, setLoading] = useState(false);

  const initialDob = seedDob(user);
  const hasChanges =
    name.trim() !== (user?.name || '') ||
    dob?.getTime() !== initialDob?.getTime() ||
    gender !== (user?.gender || '') ||
    city !== (user?.city || '') ||
    email.trim() !== (user?.email || '') ||
    buddyPref !== (user?.buddyGenderPreference || 'any');

  const ageValid = !dob || (ageFromDob(dob) >= MIN_AGE && ageFromDob(dob) <= MAX_AGE);

  const doSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setUser({
        ...user,
        name: name.trim(),
        nameLower: name.trim().toLowerCase(),
        age: dob ? ageFromDob(dob) : user.age,
        dob: dob ? dob.toISOString() : user.dob,
        gender: gender || user.gender,
        city: city || user.city,
        email: email.trim() || user.email,
        buddyGenderPreference: buddyPref,
      });
    } catch {
      Alert.alert('Error', 'Could not save profile. Please try again.');
      setLoading(false);
      return;
    }
    setLoading(false);
    Alert.alert('Profile updated', 'Your changes have been saved.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const confirmSave = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (!ageValid) {
      Alert.alert('Invalid date of birth', `Age must be between ${MIN_AGE} and ${MAX_AGE}.`);
      return;
    }
    Alert.alert('Save changes', 'Do you want to save your changes?', [
      { text: 'No', style: 'cancel', onPress: () => navigation.goBack() },
      { text: 'Yes', onPress: doSave },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.saveBtn, (!hasChanges || loading) && styles.saveBtnDisabled]}
            onPress={confirmSave}
            disabled={!hasChanges || loading}
          >
            {loading
              ? <ActivityIndicator size="small" color={C.lime} />
              : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        {/* Email — editable only when the profile doesn't already have one;
            an existing email is tied to how the user signed in (Google/Apple)
            and can't be changed here. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            {user?.email ? (
              <Field
                icon="mail-outline"
                label="Email"
                value={user.email}
                editable={false}
                hint="Email cannot be changed"
              />
            ) : (
              <View style={styles.fieldWrap}>
                <View style={styles.fieldHeader}>
                  <Ionicons name="mail-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.label}>Email</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Add an email address"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            )}
          </View>
        </View>

        {/* Editable fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <View style={styles.card}>

            <View style={styles.fieldWrap}>
              <View style={styles.fieldHeader}>
                <Ionicons name="person-outline" size={16} color="#FFFFFF" />
                <Text style={styles.label}>Full Name</Text>
              </View>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor="rgba(255,255,255,0.5)"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldWrap}>
              <View style={styles.fieldHeader}>
                <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                <Text style={styles.label}>Date of birth</Text>
              </View>
              <TouchableOpacity style={styles.dobInput} onPress={() => setShowDobPicker(true)} activeOpacity={0.7}>
                <Text style={dob ? styles.dobValue : styles.dobPlaceholder}>
                  {dob ? formatDob(dob) : 'Select your date of birth'}
                </Text>
              </TouchableOpacity>
              {dob && !ageValid && (
                <Text style={styles.ageHint}>Age must be between {MIN_AGE} and {MAX_AGE}</Text>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldWrap}>
              <View style={styles.fieldHeader}>
                <Ionicons name="transgender-outline" size={16} color="#FFFFFF" />
                <Text style={styles.label}>Gender</Text>
              </View>
              <View style={styles.genderGrid}>
                {GENDER_OPTIONS.map(({ value, label }) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.genderChip, gender === value && styles.genderChipActive]}
                    onPress={() => setGender(value)}
                  >
                    <Text style={[styles.genderChipText, gender === value && styles.genderChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldWrap}>
              <CityPicker
                label="Location"
                value={city}
                onChange={setCity}
                placeholder="Search your location..."
              />
            </View>

          </View>
        </View>

        {showDobPicker && (
          <Modal transparent animationType="slide">
            <View style={styles.pickerModal}>
              <View style={styles.pickerSheet}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Date of birth</Text>
                  <TouchableOpacity onPress={() => setShowDobPicker(false)}>
                    <Text style={styles.pickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={dob || new Date(new Date().getFullYear() - 25, 0, 1)}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date(new Date().getFullYear() - MIN_AGE, 11, 31)}
                  minimumDate={new Date(new Date().getFullYear() - MAX_AGE, 0, 1)}
                  accentColor={COLORS.primary}
                  textColor="#000000"
                  themeVariant="light"
                  onChange={(_, picked) => { if (picked) setDob(picked); }}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          </Modal>
        )}

        {/* Buddy gender preference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buddy Preference</Text>
          <View style={styles.card}>
            <View style={styles.fieldWrap}>
              <View style={styles.fieldHeader}>
                <Ionicons name="people-outline" size={16} color={COLORS.primary} />
                <Text style={styles.label}>Preferred Buddy Gender</Text>
              </View>
              <Text style={styles.prefHint}>
                Who would you prefer to connect with for activities?
              </Text>
              <View style={styles.prefGrid}>
                {([
                  { value: 'any',    label: 'Anyone',      icon: 'people-outline' },
                  { value: 'same',   label: 'Same as me',  icon: 'person-outline' },
                  { value: 'male',   label: 'Male',        icon: 'man-outline' },
                  { value: 'female', label: 'Female',      icon: 'woman-outline' },
                ] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.prefChip, buddyPref === opt.value && styles.prefChipActive]}
                    onPress={() => setBuddyPref(opt.value)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={18}
                      color={buddyPref === opt.value ? COLORS.white : COLORS.textSecondary}
                    />
                    <Text style={[styles.prefChipText, buddyPref === opt.value && styles.prefChipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Interests shortcut */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <TouchableOpacity
            style={styles.interestsRow}
            onPress={() => navigation.navigate('InterestPicker')}
            activeOpacity={0.85}
          >
            <View style={styles.interestsLeft}>
              <Ionicons name="heart-outline" size={18} color="#FFFFFF" />
              <View>
                <Text style={styles.interestsLabel}>My Interests</Text>
                <Text style={styles.interestsSub}>
                  {user?.interests?.length
                    ? `${user.interests.length} selected`
                    : 'None selected yet'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ icon, label, value, editable = true, hint }: {
  icon: any; label: string; value: string; editable?: boolean; hint?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.fieldHeader}>
        <Ionicons name={icon} size={16} color={editable ? '#FFFFFF' : 'rgba(255,255,255,0.5)'} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.readValue, !editable && styles.readValueMuted]}>{value}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: C.page, paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: C.purple,
  },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  saveBtn: {
    backgroundColor: C.heading, paddingHorizontal: SPACING.md,
    minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.full,
  },
  saveBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.25)' },
  saveBtnText: { color: C.lime, fontWeight: '700', fontSize: 14 },

  section: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.label, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACING.sm },

  card: { backgroundColor: C.purple, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },

  fieldWrap: { paddingVertical: SPACING.md },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    fontSize: 15, color: '#FFFFFF',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  readValue: { fontSize: 15, color: '#FFFFFF', fontWeight: '500' },
  readValueMuted: { color: 'rgba(255,255,255,0.6)' },
  hint: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  ageHint: { fontSize: 11, color: '#FF8A80', marginTop: 4 },
  dobInput: {
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
    paddingVertical: 12,
  },
  dobValue: { fontSize: 15, color: '#FFFFFF' },
  dobPlaceholder: { fontSize: 15, color: 'rgba(255,255,255,0.5)' },
  pickerModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, paddingBottom: 24 },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  pickerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  pickerDone: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  prefHint: { fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.sm },
  prefGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  prefChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  prefChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  prefChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  prefChipTextActive: { color: COLORS.white, fontWeight: '700' },

  genderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  genderChip: {
    width: '47%', minHeight: 44, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent',
    paddingHorizontal: SPACING.xs,
  },
  genderChipActive: { borderColor: C.lime, backgroundColor: 'rgba(200,219,46,0.18)' },
  genderChipText: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  genderChipTextActive: { color: C.lime, fontWeight: '700' },

  dropdown: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    marginTop: SPACING.xs, ...SHADOW.sm,
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  dropdownText: { fontSize: 14, color: COLORS.textPrimary },

  interestsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.purple, borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  interestsLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  interestsLabel: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  interestsSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
});
