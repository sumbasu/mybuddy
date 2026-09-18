import {
  collection, doc, getDoc, getDocs, query, where, limit as fbLimit,
  orderBy, startAt, endAt, writeBatch, increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

const followId = (followerId: string, followingId: string) => `${followerId}_${followingId}`;

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'follows', followId(followerId, followingId)));
  return snap.exists();
}

// Follow-relationship ids for everyone the given user already follows.
export async function getFollowingIds(followerId: string): Promise<Set<string>> {
  const snap = await getDocs(
    query(collection(db, 'follows'), where('followerId', '==', followerId))
  );
  return new Set(snap.docs.map((d) => d.data().followingId as string));
}

export async function followUser(followerId: string, followingId: string): Promise<void> {
  if (followerId === followingId) return;
  const batch = writeBatch(db);
  batch.set(doc(db, 'follows', followId(followerId, followingId)), {
    followerId, followingId, createdAt: new Date().toISOString(),
  });
  batch.update(doc(db, 'users', followerId), { followingCount: increment(1) });
  batch.update(doc(db, 'users', followingId), { followersCount: increment(1) });
  await batch.commit();
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'follows', followId(followerId, followingId)));
  batch.update(doc(db, 'users', followerId), { followingCount: increment(-1) });
  batch.update(doc(db, 'users', followingId), { followersCount: increment(-1) });
  await batch.commit();
}

// Prefix search on the lowercase name field.
export async function searchUsers(searchText: string, excludeUid: string, max = 20): Promise<User[]> {
  const term = searchText.trim().toLowerCase();
  if (!term) return [];
  const snap = await getDocs(
    query(
      collection(db, 'users'),
      orderBy('nameLower'),
      startAt(term),
      endAt(term + ''),
      fbLimit(max + 1),
    )
  );
  return snap.docs
    .map((d) => d.data() as User)
    .filter((u) => u.uid !== excludeUid)
    .slice(0, max);
}

// Simple "suggested for you" — most recently joined users, excluding self
// and anyone already followed. No real ranking algorithm yet.
export async function getSuggestedUsers(currentUid: string, max = 10): Promise<User[]> {
  const [usersSnap, followingIds] = await Promise.all([
    getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), fbLimit(max + 20))),
    getFollowingIds(currentUid),
  ]);
  return usersSnap.docs
    .map((d) => d.data() as User)
    .filter((u) => u.uid !== currentUid && u.name && !followingIds.has(u.uid))
    .slice(0, max);
}
