import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { INTERESTS } from '../constants/interests';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import { DEMO_ACTIVITIES, addActivity } from '../constants/demoData';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  route?: RouteProp<RootStackParamList, 'CreateActivity'>;
};

export default function CreateActivityScreen({ navigation, route }: Props) {
  const { user, isSubscribed } = useAuth();
  const editId = (route?.params as any)?.activityId as string | undefined;
  const existing = editId ? DEMO_ACTIVITIES[editId] : undefined;
  const isEditing = !!existing;

  const [interest, setInterest] = useState(existing?.interest ?? '');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (existing) {
      const [h, m] = existing.time.split(':').map(Number);
      const d = new Date(existing.date);
      d.setHours(h, m);
      return d;
    }
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [locationName, setLocationName] = useState(existing?.location.name ?? '');
  const [locationAddress, setLocationAddress] = useState(existing?.location.address ?? '');
  const [slots, setSlots] = useState(String(existing?.slots ?? '2'));
  const [skillLevel, setSkillLevel] = useState<string>(existing?.skillLevel ?? 'any');
  const [genderPref, setGenderPref] = useState<string>(existing?.genderPreference ?? 'any');
  const [loading, setLoading] = useState(false);

  if (!isSubscribed()) {
    return (
      <View style={styles.gateContainer}>
        <Text style={styles.gateEmoji}>🔒</Text>
        <Text style={styles.gateTitle}>Subscribe to Post Activities</Text>
        <Text style={styles.gateSub}>
          Your free trial has ended. Upgrade to create and join unlimited activities.
        </Text>
        <TouchableOpacity
          style={styles.gateBtn}
          onPress={() => navigation.navigate('Subscription')}
          activeOpacity={0.85}
        >
          <Text style={styles.gateBtnText}>View Plans</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const isValid = interest && title.trim() && locationName.trim();

  const handleCreate = async () => {
    if (!isValid) return;
    setLoading(true);

    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
    const timeStr = `${pad(selectedDate.getHours())}:${pad(selectedDate.getMinutes())}`;

    if (isEditing && editId && DEMO_ACTIVITIES[editId]) {
      const updated = {
        ...DEMO_ACTIVITIES[editId],
        interest,
        title: title.trim(),
        description: description.trim(),
        date: dateStr,
        time: timeStr,
        location: {
          ...DEMO_ACTIVITIES[editId].location,
          name: locationName.trim(),
          address: locationAddress.trim(),
        },
        slots: parseInt(slots, 10),
        skillLevel: skillLevel as any,
        genderPreference: genderPref as any,
      };

      // Update local cache for immediate UI
      DEMO_ACTIVITIES[editId] = updated;

      // Persist to Firestore
      await updateDoc(doc(db, 'activities', editId), updated);

    } else {
      const newId = doc(collection(db, 'activities')).id;
      const newActivity = {
        id: newId,
        creatorId: user?.uid || 'demo_user',
        creatorName: user?.name || 'You',
        title: title.trim(),
        interest,
        description: description.trim(),
        date: dateStr,
        time: timeStr,
        location: {
          name: locationName.trim(),
          address: locationAddress.trim(),
          city: user?.city || 'India',
          lat: 0,
          lng: 0,
        },
        slots: parseInt(slots, 10),
        joinedCount: 0,
        participants: [],
        pendingRequests: [],
        skillLevel: skillLevel as any,
        genderPreference: genderPref as any,
        status: 'open' as const,
        createdAt: new Date().toISOString(),
      };

      // Update local cache for immediate UI
      addActivity(newActivity);

      // Persist to Firestore
      await setDoc(doc(db, 'activities', newId), newActivity);
    }

    Alert.alert(
      isEditing ? 'Activity Updated! ✅' : 'Activity Created! 🎉',
      isEditing
        ? 'Your changes have been saved.'
        : 'Your activity is now live. People with matching interests will see it.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Activity' : 'New Activity'}</Text>
          <View style={{ width: 52 }} />
        </View>

        <Section title="What activity?">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.interestRow}>
            {INTERESTS.map((i) => (
              <TouchableOpacity
                key={i.id}
                style={[styles.interestChip, interest === i.id && styles.interestChipActive]}
                onPress={() => setInterest(i.id)}
              >
                <Text style={styles.interestEmoji}>{i.emoji}</Text>
                <Text style={[styles.interestLabel, interest === i.id && styles.interestLabelActive]}>
                  {i.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Section>

        <Section title="Activity Title *">
          <TextInput
            style={styles.input}
            placeholder="e.g. Sunday Morning Tennis at Koramangala"
            placeholderTextColor={COLORS.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </Section>

        <Section title="Description (optional)">
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell people what to expect, skill level, what to bring..."
            placeholderTextColor={COLORS.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </Section>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: SPACING.sm }}>
            <Section title="Date *">
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.pickerIcon}>📅</Text>
                <Text style={styles.pickerText}>{formatDate(selectedDate)}</Text>
              </TouchableOpacity>
            </Section>
          </View>
          <View style={{ flex: 1 }}>
            <Section title="Time *">
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
                <Text style={styles.pickerIcon}>⏰</Text>
                <Text style={styles.pickerText}>{formatTime(selectedDate)}</Text>
              </TouchableOpacity>
            </Section>
          </View>
        </View>

        {/* iOS date picker modal */}
        {showDatePicker && (
          <Modal transparent animationType="fade">
            <View style={styles.pickerModal}>
              <View style={styles.pickerSheet}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select Date</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.pickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="inline"
                  minimumDate={new Date()}
                  accentColor={COLORS.primary}
                  textColor="#000000"
                  themeVariant="light"
                  onChange={(_, picked) => {
                    if (!picked) return;
                    const merged = new Date(picked);
                    merged.setHours(selectedDate.getHours(), selectedDate.getMinutes());
                    setSelectedDate(merged);
                  }}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          </Modal>
        )}

        {/* iOS time picker modal */}
        {showTimePicker && (
          <Modal transparent animationType="slide">
            <View style={styles.pickerModal}>
              <View style={styles.pickerSheet}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select Time</Text>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.pickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  display="spinner"
                  textColor="#000000"
                  themeVariant="light"
                  accentColor={COLORS.primary}
                  onChange={(_, picked) => {
                    if (!picked) return;
                    const merged = new Date(selectedDate);
                    merged.setHours(picked.getHours(), picked.getMinutes());
                    setSelectedDate(merged);
                  }}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          </Modal>
        )}

        <Section title="Location Name *">
          <TextInput
            style={styles.input}
            placeholder="e.g. Koramangala Tennis Court"
            placeholderTextColor={COLORS.textMuted}
            value={locationName}
            onChangeText={setLocationName}
          />
        </Section>

        <Section title="Address">
          <TextInput
            style={styles.input}
            placeholder="Full address"
            placeholderTextColor={COLORS.textMuted}
            value={locationAddress}
            onChangeText={setLocationAddress}
          />
        </Section>

        <Section title="Available Spots">
          <View style={styles.slotsRow}>
            {['2', '3', '4', '5', '6', '8', '10'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.slotChip, slots === s && styles.slotChipActive]}
                onPress={() => setSlots(s)}
              >
                <Text style={[styles.slotText, slots === s && styles.slotTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <Section title="Skill Level">
          <View style={styles.optionRow}>
            {['any', 'beginner', 'intermediate', 'advanced'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.optionChip, skillLevel === s && styles.optionChipActive]}
                onPress={() => setSkillLevel(s)}
              >
                <Text style={[styles.optionText, skillLevel === s && styles.optionTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <Section title="Looking for">
          <View style={styles.optionRow}>
            {['any', 'male', 'female'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.optionChip, genderPref === g && styles.optionChipActive]}
                onPress={() => setGenderPref(g)}
              >
                <Text style={[styles.optionText, genderPref === g && styles.optionTextActive]}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <TouchableOpacity
          style={[styles.submitBtn, (!isValid || loading) && styles.submitBtnDisabled]}
          onPress={handleCreate}
          disabled={!isValid || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>{isEditing ? 'Save Changes ✅' : 'Post Activity'}</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <Text style={sectionStyles.label}>{title}</Text>
      {children}
    </View>
  );
}
const sectionStyles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs, textTransform: 'uppercase', letterSpacing: 0.6 },
});

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingBottom: SPACING.lg },
  cancel: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  interestRow: { gap: SPACING.sm, paddingBottom: SPACING.xs },
  interestChip: { alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.sm, width: 76, borderWidth: 1.5, borderColor: COLORS.border },
  interestChipActive: { borderColor: COLORS.primary, backgroundColor: '#FFF5F0' },
  interestEmoji: { fontSize: 24, marginBottom: 4 },
  interestLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  interestLabelActive: { color: COLORS.primary, fontWeight: '700' },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: 14, color: COLORS.textPrimary, backgroundColor: COLORS.surface },
  textArea: { minHeight: 80 },
  row: { flexDirection: 'row' },
  slotsRow: { flexDirection: 'row', gap: SPACING.sm },
  slotChip: { width: 40, height: 40, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
  slotChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  slotText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  slotTextActive: { color: COLORS.white },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  optionChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  optionChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  optionText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  optionTextActive: { color: COLORS.white, fontWeight: '700' },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
  },
  pickerIcon: { fontSize: 16 },
  pickerText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '500', flex: 1 },
  pickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingBottom: 40,
    paddingHorizontal: SPACING.sm,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  pickerDone: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  submitBtn: { backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.full, alignItems: 'center', marginTop: SPACING.md },
  submitBtnDisabled: { backgroundColor: COLORS.textMuted },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  gateContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  gateEmoji: { fontSize: 56, marginBottom: SPACING.lg },
  gateTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  gateSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
  gateBtn: { backgroundColor: COLORS.primary, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xxl, borderRadius: RADIUS.full },
  gateBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
