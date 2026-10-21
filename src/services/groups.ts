import {
  collection, doc, setDoc, updateDoc, deleteDoc,
  arrayUnion, arrayRemove, deleteField, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// Creates a group and seeds its chat doc in one go — a group IS a chat with
// a name and a fixed member list, reusing the existing chats/{id}/messages
// infrastructure (ChatScreen) instead of building a parallel messaging
// system. Prefixed "group_" so the id can't collide with an activity or
// direct-message chat id.
export async function createGroup(
  name: string,
  description: string,
  creator: { uid: string; name: string },
  members: { uid: string; name: string }[]
): Promise<string> {
  const groupRef = doc(collection(db, 'groups'));
  const allMembers = [creator, ...members.filter((m) => m.uid !== creator.uid)];
  const memberUids = allMembers.map((m) => m.uid);
  const memberNames = Object.fromEntries(allMembers.map((m) => [m.uid, m.name]));

  await setDoc(groupRef, {
    name: name.trim(),
    description: description.trim(),
    createdBy: creator.uid,
    members: memberUids,
    memberNames,
    createdAt: new Date().toISOString(),
  });

  // Seed the chat doc up front with the full member list — ChatScreen only
  // creates a chats/{id} doc itself when one doesn't already exist yet, so
  // without this it would only ever see the opening member as a participant.
  const chatId = `group_${groupRef.id}`;
  await setDoc(doc(db, 'chats', chatId), {
    activityTitle: name.trim(),
    participants: memberUids,
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    unreadCounts: Object.fromEntries(memberUids.map((uid) => [uid, 0])),
  });

  return groupRef.id;
}

export async function renameGroup(groupId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  await updateDoc(doc(db, 'groups', groupId), { name: trimmed });
  // Keep the chat's header title in sync — ChatScreen displays activityTitle,
  // not the group doc's name, for its header.
  await updateDoc(doc(db, 'chats', `group_${groupId}`), { activityTitle: trimmed });
}

export async function updateGroupDescription(groupId: string, description: string): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), { description: description.trim() });
}

export async function addMemberToGroup(
  groupId: string,
  member: { uid: string; name: string }
): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), {
    members: arrayUnion(member.uid),
    [`memberNames.${member.uid}`]: member.name,
  });
  await updateDoc(doc(db, 'chats', `group_${groupId}`), {
    participants: arrayUnion(member.uid),
    [`unreadCounts.${member.uid}`]: 0,
  });
}

export async function removeMemberFromGroup(groupId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), {
    members: arrayRemove(uid),
    [`memberNames.${uid}`]: deleteField(),
  });
  await updateDoc(doc(db, 'chats', `group_${groupId}`), {
    participants: arrayRemove(uid),
    [`unreadCounts.${uid}`]: deleteField(),
  });
}

export async function deleteGroup(groupId: string): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId));
  await deleteDoc(doc(db, 'chats', `group_${groupId}`));
}
