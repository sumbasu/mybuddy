import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import CityPicker from '../components/CityPicker';
import { COLORS, SPACING, RADIUS, SHADOW, FONTS } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'EditProfile'> };

// White page with a purple header and purple cards — matches Settings/Profile.
const C = {
  page: '#FFFFFF',
  purple: '#3F2F86',
  label: 'rgba(63,47,134,0.45)',
  heading: '#16213E',
  lime: '#C8DB2E',
};


export default function EditProfileScreen({ navigation }: Props) {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>(user?.gender || '');
  const [city, setCity] = useState(user?.city || '');
  const [loading, setLoading] = useState(false);

  const hasChanges =
    name.trim() !== (user?.name || '') ||
    age !== (user?.age ? String(user.age) : '') ||
    gender !== (user?.gender || '') ||
    city !== (user?.city || '');

  const ageNum = parseInt(age);
  const ageValid = age.trim() === '' || (ageNum > 16 && ageNum < 75);

  const doSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setUser({
        ...user,
        name: name.trim(),
        age: age ? parseInt(age) : user.age,
        gender: gender || user.gender,
        city: city || user.city,
      });
    } catch {
      Alert.alert('Error', 'Could not save profile. Please try again.');
      setLoading(false);
      return;
    }
    setLoading(false);
    navigation.goBack();
  };

  const confirmSave = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (!ageValid) {
      Alert.alert('Invalid age', 'Age must be between 17 and 74.');
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

        {/* Read-only: email */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <Field
              icon="mail-outline"
              label="Email"
              value={user?.email || '—'}
              editable={false}
              hint="Email cannot be changed"
            />
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
                <Text style={styles.label}>Age</Text>
              </View>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="Your age"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="numeric"
                maxLength={3}
              />
              {age.trim() !== '' && !ageValid && (
                <Text style={styles.ageHint}>Age must be between 17 and 74</Text>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldWrap}>
              <View style={styles.fieldHeader}>
                <Ionicons name="transgender-outline" size={16} color="#FFFFFF" />
                <Text style={styles.label}>Gender</Text>
              </View>
              <View style={styles.genderRow}>
                {(['male', 'female', 'other'] as const).map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, gender === g && styles.genderChipActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderChipText, gender === g && styles.genderChipTextActive]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
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

  genderRow: { flexDirection: 'row', gap: SPACING.sm },
  genderChip: {
    flex: 1, minHeight: 44, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent',
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
