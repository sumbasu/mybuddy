import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { FONTS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import NoPostsIllustration from '../components/NoPostsIllustration';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

// White-background social feed — a deliberate departure from the app's
// purple gradient theme, matching the reference screen exactly.
const C = {
  headerBg: '#3F2F86',
  page: '#F4F3F9',
  card: '#FFFFFF',
  heading: '#16213E',
  sub: '#767683',
  muted: '#9A9AA6',
  border: '#ECEBF2',
  purple: '#3F2F86',
  purpleTint: 'rgba(63,47,134,0.1)',
  green: '#8BC34A',
};

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

interface SuggestedPerson { id: string; name: string; sport: string }
const SUGGESTED: SuggestedPerson[] = [
  { id: 'p1', name: 'Mike L.', sport: 'Paddle' },
  { id: 'p2', name: 'Amy T.', sport: 'Badminton' },
  { id: 'p3', name: 'Sara K.', sport: 'Tennis' },
  { id: 'p4', name: 'Jon D.', sport: 'Cricket' },
];

export default function CommunityScreen({ navigation }: Props) {
  const [tab, setTab] = useState<'feed' | 'groups'>('feed');
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [search, setSearch] = useState('');
  const [findFriendsDismissed, setFindFriendsDismissed] = useState(false);
  const [following, setFollowing] = useState<Record<string, boolean>>({});

  const toggleFollow = (id: string) =>
    setFollowing((prev) => ({ ...prev, [id]: !prev[id] }));

  const people = SUGGESTED.filter((p) =>
    p.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={C.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search players"
              placeholderTextColor={C.muted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.tabRow}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setTab('feed')} activeOpacity={0.8}>
            <Text style={[styles.tabText, tab === 'feed' && styles.tabTextActive]}>Feed</Text>
            {tab === 'feed' && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setTab('groups')} activeOpacity={0.8}>
            <Text style={[styles.tabText, tab === 'groups' && styles.tabTextActive]}>Groups</Text>
            {tab === 'groups' && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        </View>

        {tab === 'groups' ? (
          <View style={styles.groupsTab}>
            <View style={styles.groupsCard}>
              <View style={styles.groupsIconWrap}>
                <Ionicons name="people-outline" size={30} color={C.muted} />
              </View>
              <Text style={styles.groupsCardTitle}>You are not a member of any{'\n'}group yet</Text>
              <Text style={styles.groupsCardSub}>
                Do not hesitate to create your own group, invite{'\n'}your friends, play, and improve together!
              </Text>
            </View>

            <TouchableOpacity
              style={styles.newGroupBtn}
              onPress={() => Alert.alert('Coming soon', 'Creating a group will be available in a future update.')}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.newGroupBtnText}>New group</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
                onPress={() => setFilter('all')}
                activeOpacity={0.85}
              >
                <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, filter === 'mine' && styles.filterChipActive]}
                onPress={() => setFilter('mine')}
                activeOpacity={0.85}
              >
                <Text style={[styles.filterChipText, filter === 'mine' && styles.filterChipTextActive]}>Your posts</Text>
              </TouchableOpacity>
            </View>

            {filter === 'mine' ? (
              <View style={styles.emptyPosts}>
                <NoPostsIllustration size={190} />
                <Text style={styles.emptyPostsTitle}>No posts yet</Text>
                <Text style={styles.emptyPostsSub}>
                  Start sharing your experience with the largest community of racket players
                </Text>
                <TouchableOpacity
                  style={styles.createPostBtn}
                  onPress={() => Alert.alert('Coming soon', 'Creating posts will be available in a future update.')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.createPostBtnText}>Create post</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {!findFriendsDismissed && (
                  <View style={styles.findCard}>
                    <View style={styles.findAvatar}>
                      <Ionicons name="person" size={20} color={C.purple} />
                      <View style={styles.findDot} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.findTitle}>Find your friends</Text>
                      <Text style={styles.findSub}>Add contacts to see who's already in the app</Text>
                      <TouchableOpacity onPress={() => {}}>
                        <Text style={styles.findLink}>Add contacts</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.dismissBtn} onPress={() => setFindFriendsDismissed(true)}>
                      <Ionicons name="close" size={16} color={C.muted} />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.suggestedHeader}>
                  <Text style={styles.sectionTitle}>Suggested for you</Text>
                  <TouchableOpacity onPress={() => {}}>
                    <Text style={styles.seeAll}>See all</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestedRow}
                >
                  <View style={styles.addFriendsCard}>
                    <View style={styles.addFriendsCircle}>
                      <Ionicons name="add" size={22} color={C.muted} />
                    </View>
                    <Text style={styles.addFriendsText}>Add friends from your address book</Text>
                  </View>

                  {people.map((p) => {
                    const isFollowing = !!following[p.id];
                    return (
                      <View key={p.id} style={styles.personCard}>
                        <View style={styles.personAvatar}>
                          <Text style={styles.personAvatarText}>{initials(p.name)}</Text>
                        </View>
                        <Text style={styles.personName}>{p.name}</Text>
                        <Text style={styles.personSport}>{p.sport}</Text>
                        <TouchableOpacity
                          style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                          onPress={() => toggleFollow(p.id)}
                          activeOpacity={0.85}
                        >
                          <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                            {isFollowing ? 'Following' : 'Follow'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>

                {/* Feed */}
                <View style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <View style={styles.postAvatar}>
                      <Text style={styles.postAvatarText}>SB</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.postAuthor}>Sweatbud</Text>
                      <Text style={styles.postTime}>1 day ago</Text>
                    </View>
                    <Ionicons name="ellipsis-vertical" size={16} color={C.muted} />
                  </View>
                  <Text style={styles.postHeadline}>🌍 The London Sports Cup is here!</Text>
                  <Text style={styles.postBody}>
                    Represent your city in a 6-week digital league. Play when, where and with who
                    you want, earn points and climb the leaderboard!
                  </Text>
                </View>
              </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.page },
  header: { backgroundColor: C.headerBg, paddingTop: 56, paddingBottom: SPACING.md, paddingHorizontal: SPACING.md },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: '#FFFFFF', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, height: 44,
  },
  searchInput: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: C.heading },
  headerIconBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  dismissBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },

  sheet: { flex: 1, backgroundColor: C.page },
  tabRow: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md },
  tabText: { fontFamily: FONTS.semiBold, fontSize: 15, color: C.muted },
  tabTextActive: { color: C.heading, fontFamily: FONTS.bold },
  tabUnderline: { marginTop: SPACING.sm, height: 2, width: 36, backgroundColor: C.heading, borderRadius: 1 },

  groupsTab: { flex: 1, paddingTop: SPACING.lg },
  groupsCard: {
    marginHorizontal: SPACING.md,
    borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.lg,
    alignItems: 'center', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg,
  },
  groupsIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.page, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  groupsCardTitle: {
    fontFamily: FONTS.extraBold, fontSize: 16.5, color: C.heading,
    textAlign: 'center', marginBottom: SPACING.sm,
  },
  groupsCardSub: {
    fontFamily: FONTS.regular, fontSize: 13.5, color: C.sub,
    textAlign: 'center', lineHeight: 19,
  },
  newGroupBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.purple, borderRadius: RADIUS.full,
    marginHorizontal: SPACING.md, marginTop: 'auto', marginBottom: SPACING.lg,
    height: 54,
  },
  newGroupBtnText: { fontFamily: FONTS.extraBold, fontSize: 15.5, color: '#FFFFFF' },

  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.md, flexGrow: 1 },

  filterRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  filterChip: {
    height: 44, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.border,
  },
  filterChipActive: { backgroundColor: C.heading, borderColor: C.heading },
  filterChipText: { fontFamily: FONTS.semiBold, fontSize: 13, color: C.heading },
  filterChipTextActive: { color: '#FFFFFF' },

  findCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: C.card, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.lg, ...SHADOW.sm,
  },
  findAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: C.purpleTint,
    alignItems: 'center', justifyContent: 'center',
  },
  findDot: {
    position: 'absolute', top: 2, right: 2, width: 9, height: 9, borderRadius: 4.5,
    backgroundColor: C.green, borderWidth: 1.5, borderColor: '#FFFFFF',
  },
  findTitle: { fontFamily: FONTS.bold, fontSize: 15, color: C.heading, marginBottom: 2 },
  findSub: { fontFamily: FONTS.regular, fontSize: 12.5, color: C.sub, lineHeight: 17, marginBottom: 6 },
  findLink: { fontFamily: FONTS.bold, fontSize: 13, color: C.purple },

  emptyPosts: { alignItems: 'center', paddingTop: SPACING.xxl, paddingHorizontal: SPACING.md },
  emptyPostsTitle: { fontFamily: FONTS.bold, fontSize: 20, color: C.heading, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  emptyPostsSub: { fontFamily: FONTS.regular, fontSize: 14, color: C.sub, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.xl },
  createPostBtn: {
    backgroundColor: C.purple, borderRadius: RADIUS.full,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl,
  },
  createPostBtnText: { fontFamily: FONTS.bold, fontSize: 15, color: '#FFFFFF' },

  suggestedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 16, color: C.heading },
  seeAll: { fontFamily: FONTS.semiBold, fontSize: 13, color: C.purple },

  suggestedRow: { gap: SPACING.sm, paddingBottom: SPACING.lg, paddingRight: SPACING.md },
  addFriendsCard: {
    width: 128, backgroundColor: C.card, borderRadius: RADIUS.lg, padding: SPACING.md,
    alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, ...SHADOW.sm,
  },
  addFriendsCircle: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: C.border,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  addFriendsText: { fontFamily: FONTS.medium, fontSize: 11, color: C.sub, textAlign: 'center', lineHeight: 15 },

  personCard: {
    width: 128, backgroundColor: C.card, borderRadius: RADIUS.lg, padding: SPACING.md,
    alignItems: 'center', gap: 4, ...SHADOW.sm,
  },
  personAvatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: C.purple,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  personAvatarText: { fontFamily: FONTS.bold, fontSize: 18, color: '#FFFFFF' },
  personName: { fontFamily: FONTS.bold, fontSize: 13.5, color: C.heading },
  personSport: { fontFamily: FONTS.regular, fontSize: 11.5, color: C.sub, marginBottom: 6 },
  followBtn: {
    alignSelf: 'stretch', height: 44, borderRadius: RADIUS.full,
    backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center',
  },
  followBtnActive: { backgroundColor: '#FFFFFF', borderWidth: 1.2, borderColor: C.border },
  followBtnText: { fontFamily: FONTS.bold, fontSize: 12.5, color: '#FFFFFF' },
  followBtnTextActive: { color: C.heading },

  postCard: { backgroundColor: C.card, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOW.sm },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  postAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: C.purple,
    alignItems: 'center', justifyContent: 'center',
  },
  postAvatarText: { fontFamily: FONTS.bold, fontSize: 13, color: '#FFFFFF' },
  postAuthor: { fontFamily: FONTS.bold, fontSize: 14, color: C.heading },
  postTime: { fontFamily: FONTS.regular, fontSize: 11.5, color: C.muted },
  postHeadline: { fontFamily: FONTS.bold, fontSize: 14.5, color: C.heading, marginBottom: 6 },
  postBody: { fontFamily: FONTS.regular, fontSize: 13.5, color: C.sub, lineHeight: 19 },
});
