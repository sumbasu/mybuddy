import {
  collection, addDoc, getDocs, query, where, orderBy, limit as fbLimit, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export async function createPost(authorId: string, authorName: string, text: string): Promise<void> {
  await addDoc(collection(db, 'posts'), {
    authorId,
    authorName,
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
}

const toPost = (d: any): Post => {
  const data = d.data();
  const createdAt = data.createdAt instanceof Timestamp
    ? data.createdAt.toDate().toISOString()
    : (data.createdAt ?? new Date().toISOString());
  return {
    id: d.id,
    authorId: data.authorId,
    authorName: data.authorName,
    text: data.text,
    createdAt,
  };
};

export async function getFeedPosts(max = 30): Promise<Post[]> {
  const snap = await getDocs(
    query(collection(db, 'posts'), orderBy('createdAt', 'desc'), fbLimit(max))
  );
  return snap.docs.map(toPost);
}

export async function getMyPosts(authorId: string, max = 30): Promise<Post[]> {
  const snap = await getDocs(
    query(
      collection(db, 'posts'),
      where('authorId', '==', authorId),
      orderBy('createdAt', 'desc'),
      fbLimit(max),
    )
  );
  return snap.docs.map(toPost);
}
