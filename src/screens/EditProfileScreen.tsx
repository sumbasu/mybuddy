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
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'EditProfile'> };


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

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
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
      Alert.alert('Saved!', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Could not save profile. Please try again.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.saveBtn, (!hasChanges || loading) && styles.saveBtnDisabled]}
            onPress={save}
            disabled={!hasChanges || loading}
          >
            {loading
              ? <ActivityIndicator size="small" color={COLORS.white} />
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
                <Ionicons name="person-outline" size={16} color={COLORS.primary} />
                <Text style={styles.label}>Full Name</Text>
              </View>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldWrap}>
              <View style={styles.fieldHeader}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                <Text style={styles.label}>Age</Text>
              </View>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="Your age"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldWrap}>
              <View style={styles.fieldHeader}>
                <Ionicons name="transgender-outline" size={16} color={COLORS.primary} />
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

          </View>

          <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md }}>
            <CityPicker label="City" value={city} onChange={setCity} placeholder="Search your city..." />
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
              <Ionicons name="heart-outline" size={18} color={COLORS.primary} />
              <View>
                <Text style={styles.interestsLabel}>My Interests</Text>
                <Text style={styles.interestsSub}>
                  {user?.interests?.length
                    ? `${user.interests.length} selected`
                    : 'None selected yet'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
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
        <Ionicons name={icon} size={16} color={editable ? COLORS.primary : COLORS.textMuted} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.readValue, !editable && styles.readValueMuted]}>{value}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.background, paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  saveBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md,
    paddingVertical: 6, borderRadius: RADIUS.full,
  },
  saveBtnDisabled: { backgroundColor: COLORS.textMuted },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  section: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACING.sm },

  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, ...SHADOW.sm },
  divider: { height: 1, backgroundColor: COLORS.border },

  fieldWrap: { paddingVertical: SPACING.md },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    fontSize: 15, color: COLORS.textPrimary,
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  readValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  readValueMuted: { color: COLORS.textSecondary },
  hint: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },

  genderRow: { flexDirection: 'row', gap: SPACING.sm },
  genderChip: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', backgroundColor: COLORS.surface,
  },
  genderChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  genderChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  genderChipTextActive: { color: COLORS.primary, fontWeight: '700' },

  dropdown: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    marginTop: SPACING.xs, ...SHADOW.sm,
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  dropdownText: { fontSize: 14, color: COLORS.textPrimary },

  interestsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, ...SHADOW.sm,
  },
  interestsLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  interestsLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  interestsSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
