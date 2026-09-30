import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { INTERESTS } from '../constants/interests';
import InterestIcon from '../components/InterestIcon';
import { FONTS, SPACING, RADIUS, SHADOW } from '../constants/theme';

// White page with purple accents — matches the rest of the app, not the old
// dark-gradient theme this screen used to carry.
const C = {
  page: '#FFFFFF',
  purple: '#3F2F86',
  heading: '#16213E',
  sub: '#767683',
  muted: '#9A9AA6',
  border: '#ECEBF2',
};
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
        <TouchableOpacity style={styles.gateClose} onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="close" size={18} color={C.heading} />
        </TouchableOpacity>
        <Ionicons name="lock-closed" size={48} color={C.purple} style={styles.gateIcon} />
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
          <TouchableOpacity style={styles.headerCancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Activity' : 'New Activity'}</Text>
          <View style={{ width: 52 }} />
        </View>

        <Section title="Activity Type">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.interestRow}>
            {INTERESTS.map((i) => (
              <TouchableOpacity
                key={i.id}
                style={[styles.interestChip, interest === i.id && styles.interestChipActive]}
                onPress={() => setInterest(i.id)}
              >
                <InterestIcon id={i.id} size={22} color={interest === i.id ? '#FFFFFF' : C.sub} style={styles.interestIcon} />
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
            placeholderTextColor={C.muted}
            value={title}
            onChangeText={setTitle}
          />
        </Section>

        <Section title="Description (optional)">
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell people what to expect, skill level, what to bring..."
            placeholderTextColor={C.muted}
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
                <Ionicons name="calendar-outline" size={16} color={C.sub} />
                <Text style={styles.pickerText}>{formatDate(selectedDate)}</Text>
              </TouchableOpacity>
            </Section>
          </View>
          <View style={{ flex: 1 }}>
            <Section title="Time *">
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
                <Ionicons name="time-outline" size={16} color={C.sub} />
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
                  accentColor={C.purple}
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
                  accentColor={C.purple}
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
            placeholderTextColor={C.muted}
            value={locationName}
            onChangeText={setLocationName}
          />
        </Section>

        <Section title="Address">
          <TextInput
            style={styles.input}
            placeholder="Full address"
            placeholderTextColor={C.muted}
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

        <Section title="Level">
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
            <ActivityIndicator color={'#FFFFFF'} />
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
  label: { fontFamily: FONTS.semiBold, fontSize: 12, color: C.sub, marginBottom: SPACING.xs, textTransform: 'uppercase', letterSpacing: 0.6 },
});

const styles = StyleSheet.create({
  container: { backgroundColor: C.page, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingBottom: SPACING.lg },
  headerCancelBtn: { minHeight: 44, justifyContent: 'center' },
  cancel: { fontFamily: FONTS.semiBold, color: C.purple, fontSize: 15 },
  headerTitle: { fontFamily: FONTS.extraBold, fontSize: 17, color: C.heading },
  interestRow: { gap: SPACING.sm, paddingBottom: SPACING.xs },
  interestChip: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: RADIUS.md, padding: SPACING.sm, width: 76, borderWidth: 1.5, borderColor: C.border },
  interestChipActive: { borderColor: C.purple, backgroundColor: C.purple },
  interestIcon: { marginBottom: 4 },
  interestLabel: { fontFamily: FONTS.regular, fontSize: 11, color: C.sub, textAlign: 'center' },
  interestLabelActive: { fontFamily: FONTS.bold, color: '#FFFFFF' },
  input: { borderWidth: 1.5, borderColor: C.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontFamily: FONTS.regular, fontSize: 14, color: C.heading, backgroundColor: '#FFFFFF' },
  textArea: { minHeight: 80 },
  row: { flexDirection: 'row' },
  slotsRow: { flexDirection: 'row', gap: SPACING.sm },
  slotChip: { width: 44, height: 44, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  slotChipActive: { borderColor: C.purple, backgroundColor: C.purple },
  slotText: { fontFamily: FONTS.semiBold, fontSize: 14, color: C.sub },
  slotTextActive: { color: '#FFFFFF' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  optionChip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: SPACING.md, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: C.border, backgroundColor: '#FFFFFF' },
  optionChipActive: { borderColor: C.purple, backgroundColor: C.purple },
  optionText: { fontFamily: FONTS.medium, fontSize: 13, color: C.sub },
  optionTextActive: { fontFamily: FONTS.bold, color: '#FFFFFF' },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#FFFFFF',
    gap: SPACING.sm,
  },
  pickerIcon: { fontSize: 16 },
  pickerText: { fontFamily: FONTS.medium, fontSize: 13, color: C.heading, flex: 1 },
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
    borderBottomColor: C.border,
  },
  pickerTitle: { fontFamily: FONTS.bold, fontSize: 16, color: C.heading },
  pickerDone: { fontFamily: FONTS.bold, fontSize: 16, color: C.purple },
  submitBtn: { backgroundColor: C.purple, paddingVertical: SPACING.md, borderRadius: RADIUS.full, alignItems: 'center', marginTop: SPACING.md },
  submitBtnDisabled: { backgroundColor: C.muted },
  submitBtnText: { fontFamily: FONTS.bold, color: '#FFFFFF', fontSize: 16 },
  gateContainer: { flex: 1, backgroundColor: C.page, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  gateClose: { position: 'absolute', top: 56, right: SPACING.lg, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: C.border },
  gateIcon: { marginBottom: SPACING.lg },
  gateTitle: { fontFamily: FONTS.extraBold, fontSize: 22, color: C.heading, textAlign: 'center', marginBottom: SPACING.sm },
  gateSub: { fontFamily: FONTS.regular, fontSize: 14, color: C.sub, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
  gateBtn: { backgroundColor: C.purple, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xxl, borderRadius: RADIUS.full },
  gateBtnText: { fontFamily: FONTS.bold, color: '#FFFFFF', fontSize: 16 },
});
