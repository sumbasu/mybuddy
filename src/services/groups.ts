import {
  collection, doc, setDoc, serverTimestamp,
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
  creatorUid: string,
  memberUids: string[]
): Promise<string> {
  const groupRef = doc(collection(db, 'groups'));
  const members = Array.from(new Set([creatorUid, ...memberUids]));

  await setDoc(groupRef, {
    name: name.trim(),
    description: description.trim(),
    createdBy: creatorUid,
    members,
    createdAt: new Date().toISOString(),
  });

  // Seed the chat doc up front with the full member list — ChatScreen only
  // creates a chats/{id} doc itself when one doesn't already exist yet, so
  // without this it would only ever see the opening member as a participant.
  const chatId = `group_${groupRef.id}`;
  await setDoc(doc(db, 'chats', chatId), {
    activityTitle: name.trim(),
    participants: members,
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    unreadCounts: Object.fromEntries(members.map((uid) => [uid, 0])),
  });

  return groupRef.id;
}
