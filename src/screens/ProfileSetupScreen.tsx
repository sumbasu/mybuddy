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
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ProfileSetup'> };

export default function ProfileSetupScreen({ navigation }: Props) {
  const { user, setUser } = useAuth();
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = age && parseInt(age) >= 16 && gender && city;

  const saveProfile = async () => {
    if (!isValid || !user) return;
    setLoading(true);
    try {
      await setUser({
        ...user,
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
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}

        <View style={styles.progressRow}>
          <View style={[styles.progressSeg, styles.progressSegDone]} />
          <View style={[styles.progressSeg, styles.progressSegDone]} />
        </View>

        <Text style={styles.title}>About you</Text>
        <Text style={styles.subtitle}>STEP 2 OF 2</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Age</Text>
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

          <CityPicker
            label="Location"
            value={city}
            onChange={setCity}
            placeholder="London, UK"
          />

          <View style={styles.field}>
            <Text style={styles.label}>Sex</Text>
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

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[styles.btn, (!isValid || loading) && styles.btnDisabled]}
          onPress={saveProfile}
          disabled={!isValid || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.ctaText} />
          ) : (
            <Text style={styles.btnText}>Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: 56,
    paddingBottom: SPACING.xl,
  },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg, alignSelf: 'flex-start' },
  backText: { fontSize: 16, color: COLORS.textPrimary, marginLeft: 2 },
  progressRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.lg },
  progressSeg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: COLORS.border },
  progressSegDone: { backgroundColor: COLORS.ctaBg },
  title: { fontSize: 34, fontFamily: FONTS.serif, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  subtitle: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginBottom: SPACING.xl, textTransform: 'uppercase', letterSpacing: 1.5 },
  form: { marginBottom: SPACING.xl },
  field: { marginBottom: SPACING.md },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surfaceSecondary,
  },
  genderRow: { flexDirection: 'row', gap: SPACING.xs },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  genderBtnActive: { borderColor: COLORS.ctaBg, backgroundColor: COLORS.ctaBg },
  genderBtnText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  genderBtnTextActive: { color: COLORS.ctaText, fontWeight: '700' },
  btn: {
    backgroundColor: COLORS.ctaBg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: COLORS.ctaText, fontSize: 16, fontWeight: '700' },
});
