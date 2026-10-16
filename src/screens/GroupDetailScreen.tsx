import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
  ActivityIndicator, Modal, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { RootStackParamList, Group } from '../types';
import { useAuth } from '../context/AuthContext';
import { searchUsers } from '../services/follows';
import {
  renameGroup, updateGroupDescription, addMemberToGroup, removeMemberFromGroup,
} from '../services/groups';
import { FONTS, SPACING } from '../constants/theme';
import { TYPE_SCALE } from '../constants/typography';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GroupDetail'>;
  route: RouteProp<RootStackParamList, 'GroupDetail'>;
};

// Flat card-based page — matches the Activity Detail / Pick Interests redesign.
const C = {
  brand: '#695DA1',
  purple: '#3D3081',
  lime: '#C9E24B',
  bg: '#F7F7F9',
  surface: '#FFFFFF',
  border: '#E6E6EC',
  text: '#3D3081',
  heading: '#16213E',
  textMuted: '#6E6E80',
  textSubtle: '#9A9AAB',
  tint: '#ECEBF4',
  success: '#1F9D6B',
  error: '#EF233C',
  errorBg: '#FDEDEF',
  disabled: '#DCDCE4',
};

const initials = (name?: string) =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

export default function GroupDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { groupId } = route.params;
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const [addVisible, setAddVisible] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ uid: string; name: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUid, setAddingUid] = useState<string | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'groups', groupId), (snap) => {
      setGroup(snap.exists() ? ({ id: snap.id, ...snap.data() } as Group) : null);
      setLoading(false);
    });
    return unsubscribe;
  }, [groupId]);

  useEffect(() => {
    if (!user || !addVisible) return;
    const term = memberSearch.trim();
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!term) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const results = await searchUsers(term, user.uid);
        setSearchResults(
          results
            .filter((r) => !group?.members.includes(r.uid))
            .map((r) => ({ uid: r.uid, name: r.name }))
        );
      } catch (err) {
        console.error('Member search failed:', err);
      }
      setSearching(false);
    }, 350);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  }, [memberSearch, addVisible, user?.uid, group?.members]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.brand} size="large" />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={C.textSubtle} />
        <Text style={styles.notFoundText}>Group not found</Text>
      </View>
    );
  }

  const isCreator = user?.uid === group.createdBy;
  const memberUids = group.members || [];

  const openEdit = () => {
    setEditName(group.name);
    setEditDescription(group.description || '');
    setEditVisible(true);
  };

  const saveEdit = async () => {
    if (!editName.trim() || saving) return;
    setSaving(true);
    try {
      if (editName.trim() !== group.name) await renameGroup(group.id, editName);
      if (editDescription.trim() !== (group.description || '')) {
        await updateGroupDescription(group.id, editDescription);
      }
      setEditVisible(false);
    } catch {
      Alert.alert('Error', 'Could not save changes. Please try again.');
    }
    setSaving(false);
  };

  const addMember = async (member: { uid: string; name: string }) => {
    setAddingUid(member.uid);
    try {
      await addMemberToGroup(group.id, member);
      setSearchResults((prev) => prev.filter((p) => p.uid !== member.uid));
    } catch {
      Alert.alert('Error', `Could not add ${member.name}. Please try again.`);
    }
    setAddingUid(null);
  };

  const confirmRemoveMember = (uid: string, name: string) => {
    Alert.alert('Remove member', `Remove ${name} from "${group.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMemberFromGroup(group.id, uid);
          } catch {
            Alert.alert('Error', 'Could not remove member. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.roundBtn} onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={C.brand} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.roundBtn}
            onPress={() => navigation.navigate('Chat', {
              chatId: `group_${group.id}`,
              activityTitle: group.name,
              participantName: group.name,
            })}
            hitSlop={12}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={C.brand} />
          </TouchableOpacity>
        </View>

        <View style={styles.groupTile}>
          <Ionicons name="people" size={26} color={C.lime} />
        </View>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{group.name}</Text>
          <TouchableOpacity onPress={openEdit} hitSlop={10}>
            <Ionicons name="create-outline" size={20} color={C.brand} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          {memberUids.length} member{memberUids.length === 1 ? '' : 's'}
        </Text>
        {group.description ? (
          <Text style={styles.description}>{group.description}</Text>
        ) : (
          <TouchableOpacity onPress={openEdit}>
            <Text style={styles.addDescription}>+ Add a description</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sheet}>
        <ScrollView
          contentContainerStyle={{ paddingTop: SPACING.lg, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setAddVisible(true)} activeOpacity={0.8}>
              <Ionicons name="person-add-outline" size={15} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            {memberUids.map((uid, i) => {
              const name = group.memberNames?.[uid] || `User ${uid.slice(-6)}`;
              const creator = uid === group.createdBy;
              return (
                <View key={uid}>
                  {i > 0 && <View style={styles.divider} />}
                  <View style={styles.memberRow}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>{initials(name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName} numberOfLines={1}>{name}</Text>
                      {creator && <Text style={styles.creatorBadge}>Creator</Text>}
                    </View>
                    {!creator && (
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => confirmRemoveMember(uid, name)}
                        hitSlop={8}
                      >
                        <Ionicons name="close" size={16} color={C.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Edit group modal */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditVisible(false)} hitSlop={8}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit group</Text>
              <TouchableOpacity onPress={saveEdit} disabled={!editName.trim() || saving} hitSlop={8}>
                {saving ? (
                  <ActivityIndicator size="small" color={C.brand} />
                ) : (
                  <Text style={[styles.modalSave, !editName.trim() && styles.modalSaveDisabled]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.modalLabel}>Group name</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                maxLength={60}
                autoFocus
              />
              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="What's this group about?"
                placeholderTextColor={C.textSubtle}
                multiline
                maxLength={200}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add member modal */}
      <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setAddVisible(false)} hitSlop={8}>
                <Text style={styles.modalCancel}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add member</Text>
              <View style={{ width: 44 }} />
            </View>
            <View style={styles.modalContent}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color={C.textSubtle} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search players by name"
                  placeholderTextColor={C.textSubtle}
                  value={memberSearch}
                  onChangeText={setMemberSearch}
                  autoFocus
                />
                {searching && <ActivityIndicator size="small" color={C.textSubtle} />}
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 320 }}>
                {searchResults.map((person) => (
                  <TouchableOpacity
                    key={person.uid}
                    style={styles.resultRow}
                    onPress={() => addMember(person)}
                    disabled={addingUid === person.uid}
                    activeOpacity={0.7}
                  >
                    <View style={styles.resultAvatar}>
                      <Text style={styles.resultAvatarText}>{initials(person.name)}</Text>
                    </View>
                    <Text style={styles.resultName} numberOfLines={1}>{person.name}</Text>
                    {addingUid === person.uid ? (
                      <ActivityIndicator size="small" color={C.brand} />
                    ) : (
                      <Ionicons name="add-circle-outline" size={22} color={C.brand} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, backgroundColor: C.bg },
  notFoundText: { fontFamily: FONTS.semiBold, fontSize: 16, color: C.textSubtle },

  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg },
  roundBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  groupTile: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: C.purple,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm + 2,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  title: { flexShrink: 1, fontFamily: FONTS.extraBold, fontSize: 26, color: C.heading, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: C.textMuted, marginTop: SPACING.xs },
  description: { fontSize: 14, color: C.textMuted, marginTop: SPACING.sm, lineHeight: 20 },
  addDescription: { fontSize: 14, color: C.brand, marginTop: SPACING.sm, fontFamily: FONTS.semiBold },

  sheet: { flex: 1, backgroundColor: C.bg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm + 2 },
  sectionTitle: { ...TYPE_SCALE.sectionHeading, color: C.heading },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.brand, borderRadius: 18,
    paddingHorizontal: SPACING.md, height: 34,
  },
  addBtnText: { fontFamily: FONTS.bold, fontSize: 13, color: '#fff' },

  card: {
    backgroundColor: C.surface, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: SPACING.md,
  },
  divider: { height: 1, backgroundColor: C.border, marginLeft: 54 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center',
  },
  memberAvatarText: { fontFamily: FONTS.bold, fontSize: 14, color: '#fff' },
  memberName: { fontFamily: FONTS.semiBold, fontSize: 15, color: C.heading },
  creatorBadge: { fontFamily: FONTS.medium, fontSize: 12, color: C.textMuted, marginTop: 1 },
  removeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.errorBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(239,35,60,0.3)',
  },

  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modalCancel: { fontSize: 15, color: C.textMuted, fontFamily: FONTS.medium },
  modalTitle: { fontSize: 15.5, fontWeight: '800', color: C.heading },
  modalSave: { fontSize: 15, fontWeight: '700', color: C.brand },
  modalSaveDisabled: { color: C.textSubtle },
  modalContent: { padding: SPACING.lg },
  modalLabel: {
    fontFamily: FONTS.bold, fontSize: 12, color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.xs, marginTop: SPACING.md,
  },
  modalInput: {
    minHeight: 48, borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.bg, paddingHorizontal: SPACING.md, fontSize: 15, color: C.heading,
  },
  modalTextArea: { minHeight: 70, textAlignVertical: 'top', paddingTop: SPACING.sm },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: C.bg, borderRadius: 999,
    paddingHorizontal: SPACING.md, height: 44, marginBottom: SPACING.md,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.heading },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm },
  resultAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center',
  },
  resultAvatarText: { fontFamily: FONTS.bold, fontSize: 13, color: '#fff' },
  resultName: { flex: 1, fontFamily: FONTS.medium, fontSize: 14, color: C.heading },
});
