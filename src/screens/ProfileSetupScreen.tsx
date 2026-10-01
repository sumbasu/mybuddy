import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import CityPicker from '../components/CityPicker';
import { FONTS, SPACING, RADIUS } from '../constants/theme';

// White sheet with a purple header — matches the rest of the app, not the
// old dark-gradient theme this screen used to carry.
const C = {
  page: '#FAFAFA',
  purple: '#3F2F86',
  heading: '#16213E',
  sub: '#767683',
  muted: '#9A9AA6',
  border: '#ECEBF2',
  error: '#EF233C',
};

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ProfileSetup'> };

export default function ProfileSetupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();
  // Pre-filled for Google/Apple sign-ins (which already have a displayName);
  // phone sign-ups start blank since Firebase phone auth has no name at all —
  // without asking for it here, those accounts would never get one.
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  const ageNum = parseInt(age);
  const ageValid = age !== '' && ageNum > 16 && ageNum < 75;
  const isValid = name.trim().length > 0 && ageValid && gender && city;

  const saveProfile = async () => {
    if (!isValid || !user) return;
    setLoading(true);
    try {
      await setUser({
        ...user,
        name: name.trim(),
        nameLower: name.trim().toLowerCase(),
        age: parseInt(age),
        gender: gender as 'male' | 'female' | 'other',
        city,
        state: '',
      });
      // AppNavigator watches `user` and swaps to the interests stack
      // (then the main stack) automatically once name/city are set.
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
      <View style={styles.container}>
        <View style={styles.header}>
          {navigation.canGoBack() && (
            <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}

          <View style={styles.progressRow}>
            <View style={[styles.progressSeg, styles.progressSegDone]} />
            <View style={[styles.progressSeg, styles.progressSegDone]} />
          </View>

          <Text style={styles.title}>About you</Text>
          <Text style={styles.subtitle}>STEP 2 OF 2</Text>
        </View>

        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  placeholderTextColor={C.muted}
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Age *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="25"
                  placeholderTextColor={C.muted}
                  keyboardType="numeric"
                  maxLength={3}
                  value={age}
                  onChangeText={setAge}
                />
                {age !== '' && !ageValid && (
                  <Text style={styles.ageHint}>Age must be between 17 and 74</Text>
                )}
              </View>

              <CityPicker
                label="Location *"
                value={city}
                onChange={setCity}
                placeholder="Search your location..."
                variant="light"
              />

              <View style={styles.field}>
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
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Fixed footer, inside the sheet — keeps the button's touch target
              from drifting when the city dropdown collapses and the scroll
              content resizes underneath it. */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={[styles.btn, (!isValid || loading) && styles.btnDisabled]}
              onPress={saveProfile}
              disabled={!isValid || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : !isValid ? (
                <Text style={styles.btnText}>Fill in all required fields</Text>
              ) : (
                <Text style={styles.btnText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.purple },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 56,
    paddingBottom: SPACING.lg,
    backgroundColor: C.purple,
  },
  sheet: {
    flex: 1, backgroundColor: C.page,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
  },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  back: { flexDirection: 'row', alignItems: 'center', minHeight: 44, marginBottom: SPACING.lg, alignSelf: 'flex-start' },
  backText: { fontFamily: FONTS.regular, fontSize: 16, color: '#FFFFFF', marginLeft: 2 },
  progressRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.lg },
  progressSeg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  progressSegDone: { backgroundColor: '#FFFFFF' },
  title: { fontSize: 28, fontFamily: FONTS.extraBold, color: '#FFFFFF', marginBottom: SPACING.sm },
  subtitle: { fontFamily: FONTS.bold, fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1.5 },
  form: { marginBottom: SPACING.xl },
  field: { marginBottom: SPACING.md },
  ageHint: { fontFamily: FONTS.regular, fontSize: 11, color: C.error, marginTop: SPACING.xs },
  label: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: C.sub,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: C.heading,
    backgroundColor: '#FFFFFF',
  },
  genderRow: { flexDirection: 'row', gap: SPACING.xs },
  genderBtn: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  genderBtnActive: { borderColor: C.purple, backgroundColor: C.purple },
  genderBtnText: { fontFamily: FONTS.medium, fontSize: 13, color: C.sub },
  genderBtnTextActive: { fontFamily: FONTS.bold, color: '#FFFFFF' },
  btn: {
    backgroundColor: C.purple,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: C.muted },
  btnText: { fontFamily: FONTS.bold, color: '#FFFFFF', fontSize: 16 },
});
