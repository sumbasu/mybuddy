import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/firebase';
import CityPicker from '../components/CityPicker';
import { SPACING } from '../constants/theme';

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

// Flat card-based page — matches the Pick Interests / Activity Detail redesign.
const C = {
  brand: '#695DA1',
  lime: '#C9E24B',
  bg: '#F7F7F9',
  surface: '#FFFFFF',
  border: '#E6E6EC',
  text: '#1B1F3B',
  textMuted: '#6E6E80',
  textSubtle: '#9A9AAB',
  tint: '#ECEBF4',
  danger: '#D64545',
  dangerBg: '#FDEDED',
  disabled: '#DCDCE4',
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
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [dob, setDob] = useState<Date | null>(seedDob(user));
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say' | ''>(user?.gender || '');
  const [city, setCity] = useState(user?.city || '');
  const [phone, setPhone] = useState(user?.phone || auth.currentUser?.phoneNumber || '');
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
    phone.trim() !== (user?.phone || '') ||
    buddyPref !== (user?.buddyGenderPreference || 'any');

  const ageValid = !dob || (ageFromDob(dob) >= MIN_AGE && ageFromDob(dob) <= MAX_AGE);
  const nameValid = !!name.trim();
  const phoneValid = !!phone.trim();
  const canSave = hasChanges && nameValid && ageValid && phoneValid && !loading;

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
        phone: phone.trim(),
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
    if (!canSave) return;
    Alert.alert('Save changes', 'Do you want to save your changes?', [
      { text: 'No', style: 'cancel', onPress: () => navigation.goBack() },
      { text: 'Yes', onPress: doSave },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={C.brand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit profile</Text>
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={confirmSave}
          disabled={!canSave}
          activeOpacity={0.85}
        >
          <Text style={[styles.saveText, !canSave && { color: C.textSubtle }]}>
            {loading ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.xs, paddingBottom: 40 + insets.bottom }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Account — email is the account's unique ID and can never be
              changed here; phone is required but editable. */}
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <FieldLabel icon="mail-outline" label="Email" />
            <View style={styles.readonly}>
              <Text style={[styles.inputText, !user?.email && { color: C.textSubtle }]}>
                {user?.email || 'Not set'}
              </Text>
              <Ionicons name="lock-closed-outline" size={18} color={C.textSubtle} />
            </View>
            <Text style={styles.helper}>Your email can't be changed.</Text>

            <View style={styles.divider} />

            <FieldLabel icon="call-outline" label="Phone number" required />
            <TextInput
              style={[styles.input, styles.inputText, !phoneValid && styles.inputError]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 98765 43210"
              placeholderTextColor={C.textSubtle}
              keyboardType="phone-pad"
            />
            {!phoneValid && <ErrorText>Enter your phone number</ErrorText>}
          </View>

          {/* Personal details */}
          <Text style={styles.sectionTitle}>Personal details</Text>
          <View style={styles.card}>
            <FieldLabel icon="person-outline" label="Full name" required />
            <TextInput
              style={[styles.input, styles.inputText, !nameValid && styles.inputError]}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={C.textSubtle}
              autoCapitalize="words"
            />
            {!nameValid && <ErrorText>Enter your name</ErrorText>}

            <View style={styles.divider} />

            <FieldLabel icon="calendar-outline" label="Date of birth" />
            <TouchableOpacity
              onPress={() => setShowDobPicker(true)}
              activeOpacity={0.7}
              style={[styles.input, styles.inputRow, dob && !ageValid && styles.inputError]}
            >
              <Text style={[styles.inputText, !dob && { color: C.textSubtle }]}>
                {dob ? formatDob(dob) : 'Select date'}
              </Text>
              <Ionicons name="chevron-down" size={22} color={C.textSubtle} />
            </TouchableOpacity>
            {dob && !ageValid && (
              <ErrorText>You need to be between {MIN_AGE} and {MAX_AGE} to use Sweatbud</ErrorText>
            )}

            <View style={styles.divider} />

            <FieldLabel icon="transgender-outline" label="Gender" />
            <View style={styles.genderGrid}>
              {GENDER_OPTIONS.map(({ value, label }) => {
                const on = gender === value;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => setGender(value)}
                    activeOpacity={0.85}
                    style={[styles.genderOpt, on && styles.genderOptOn]}
                  >
                    {on && <Ionicons name="checkmark" size={16} color={C.lime} />}
                    <Text style={[styles.genderText, on && { color: '#fff' }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.divider} />

            <FieldLabel icon="location-outline" label="Location" />
            <CityPicker
              label=""
              value={city}
              onChange={setCity}
              placeholder="Search your city"
              variant="light"
            />
          </View>

          {/* Buddy gender preference */}
          <Text style={styles.sectionTitle}>Buddy preference</Text>
          <View style={styles.card}>
            <FieldLabel icon="people-outline" label="Preferred buddy gender" />
            <Text style={styles.helper}>Who would you prefer to connect with for activities?</Text>
            <View style={styles.prefGrid}>
              {([
                { value: 'any',    label: 'Anyone',      icon: 'people-outline' },
                { value: 'same',   label: 'Same as me',  icon: 'person-outline' },
                { value: 'male',   label: 'Male',        icon: 'man-outline' },
                { value: 'female', label: 'Female',      icon: 'woman-outline' },
              ] as const).map((opt) => {
                const on = buddyPref === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.prefChip, on && styles.prefChipActive]}
                    onPress={() => setBuddyPref(opt.value)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={opt.icon} size={18} color={on ? '#fff' : C.textMuted} />
                    <Text style={[styles.prefChipText, on && styles.prefChipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Interests shortcut */}
          <Text style={styles.sectionTitle}>Interests</Text>
          <TouchableOpacity
            style={styles.interestsRow}
            onPress={() => navigation.navigate('InterestPicker')}
            activeOpacity={0.85}
          >
            <View style={styles.interestsLeft}>
              <View style={styles.interestsIcon}>
                <Ionicons name="heart-outline" size={18} color={C.brand} />
              </View>
              <View>
                <Text style={styles.interestsLabel}>My interests</Text>
                <Text style={styles.interestsSub}>
                  {user?.interests?.length ? `${user.interests.length} selected` : 'None selected yet'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.textSubtle} />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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
                accentColor={C.brand}
                textColor="#000000"
                themeVariant="light"
                onChange={(_, picked) => { if (picked) setDob(picked); }}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function FieldLabel({ icon, label, required }: { icon: any; label: string; required?: boolean }) {
  return (
    <View style={styles.labelRow}>
      <View style={styles.labelIcon}>
        <Ionicons name={icon} size={16} color={C.brand} />
      </View>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={{ color: C.danger }}> *</Text> : null}
      </Text>
    </View>
  );
}

const ErrorText = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.errorRow}>
    <Ionicons name="alert-circle-outline" size={15} color={C.danger} />
    <Text style={styles.errorText}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm + 4,
  },
  roundBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  headerTitle: { fontWeight: '800', fontSize: 18, color: C.text },
  saveBtn: {
    height: 40, paddingHorizontal: SPACING.lg, borderRadius: 20,
    backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: { backgroundColor: C.disabled },
  saveText: { fontWeight: '800', fontSize: 15, color: '#fff' },

  sectionTitle: { fontWeight: '800', fontSize: 20, color: C.text, marginTop: SPACING.lg, marginBottom: SPACING.md },
  card: {
    backgroundColor: C.surface, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, padding: SPACING.lg,
  },
  divider: { height: 1, backgroundColor: C.border, marginVertical: SPACING.lg - 2 },

  labelRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  labelIcon: {
    width: 28, height: 28, borderRadius: 9,
    backgroundColor: C.tint, alignItems: 'center', justifyContent: 'center',
  },
  label: { fontWeight: '700', fontSize: 14, color: C.text },

  input: {
    minHeight: 50, borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.surface, paddingHorizontal: SPACING.md,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputText: { fontSize: 16, color: C.text },
  inputError: { borderColor: C.danger, backgroundColor: C.dangerBg },

  readonly: {
    minHeight: 50, borderRadius: 14, backgroundColor: C.bg,
    paddingHorizontal: SPACING.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  helper: { fontSize: 13, color: C.textSubtle, marginTop: 6, marginBottom: SPACING.sm },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.xs },
  errorText: { fontSize: 13, color: C.danger, flex: 1 },

  genderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  genderOpt: {
    flexBasis: '47%', flexGrow: 1, height: 48, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  genderOptOn: { backgroundColor: C.brand, borderColor: C.brand },
  genderText: { fontWeight: '700', fontSize: 15, color: C.textMuted },

  pickerModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 24 },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  pickerTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  pickerDone: { fontSize: 15, fontWeight: '700', color: C.brand },

  prefGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  prefChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: 18, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
  },
  prefChipActive: { backgroundColor: C.brand, borderColor: C.brand },
  prefChipText: { fontSize: 13, color: C.textMuted, fontWeight: '500' },
  prefChipTextActive: { color: '#fff', fontWeight: '700' },

  interestsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surface, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  },
  interestsLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  interestsIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: C.tint, alignItems: 'center', justifyContent: 'center',
  },
  interestsLabel: { fontSize: 15, fontWeight: '600', color: C.text },
  interestsSub: { fontSize: 12, color: C.textSubtle, marginTop: 2 },
});
