import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ProfileSetup'> };

const CITIES = [
  'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai',
  'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
  'Bhopal', 'Visakhapatnam', 'Vadodara', 'Patna', 'Ludhiana',
];

export default function ProfileSetupScreen({ navigation }: Props) {
  const { user, setUser } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [city, setCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredCities = CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const isValid = name.trim().length >= 2 && age && parseInt(age) >= 16 && gender && city;

  const saveProfile = async () => {
    if (!isValid || !user) return;
    setLoading(true);
    try {
      await setUser({
        ...user,
        name: name.trim(),
        age: parseInt(age),
        gender: gender as 'male' | 'female' | 'other',
        city,
        state: '',
      });
      navigation.replace('InterestPicker');
    } catch (err) {
      Alert.alert('Error', 'Could not save profile. Please try again.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Set Up Your Profile</Text>
        <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: SPACING.sm }]}>
              <Text style={styles.label}>Age *</Text>
              <TextInput
                style={styles.input}
                placeholder="25"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                maxLength={3}
                value={age}
                onChangeText={setAge}
              />
            </View>

            <View style={[styles.field, { flex: 2 }]}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.genderRow}>
                {(['male', 'female', 'other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              placeholder="Search your city..."
              placeholderTextColor={COLORS.textMuted}
              value={city || citySearch}
              onChangeText={(t) => {
                setCitySearch(t);
                setCity('');
                setShowCityDropdown(true);
              }}
              onFocus={() => setShowCityDropdown(true)}
            />
            {showCityDropdown && citySearch.length > 0 && (
              <View style={styles.dropdown}>
                {filteredCities.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCity(c);
                      setCitySearch(c);
                      setShowCityDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>📍 {c}</Text>
                  </TouchableOpacity>
                ))}
                {filteredCities.length === 0 && (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCity(citySearch);
                      setShowCityDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>📍 {citySearch} (add)</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, (!isValid || loading) && styles.btnDisabled]}
          onPress={saveProfile}
          disabled={!isValid || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.btnText}>Continue →</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: SPACING.xxl,
  },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOW.sm,
  },
  field: { marginBottom: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  genderRow: { flexDirection: 'row', gap: SPACING.xs },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  genderBtnActive: { borderColor: COLORS.primary, backgroundColor: '#FFF5F0' },
  genderBtnText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  genderBtnTextActive: { color: COLORS.primary, fontWeight: '700' },
  dropdown: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 200,
    zIndex: 999,
    ...SHADOW.md,
  },
  dropdownItem: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  dropdownText: { fontSize: 14, color: COLORS.textPrimary },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: COLORS.textMuted },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
