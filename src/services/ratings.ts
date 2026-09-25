import {
  collection, addDoc, serverTimestamp, query,
  where, getDocs, doc, updateDoc, increment,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Rating {
  id?: string;
  activityId: string;
  activityTitle: string;
  raterId: string;
  ratedUserId: string;
  score: number;
  createdAt?: any;
}

// Submit a rating; also updates the user's running average
export async function submitRating(rating: Rating): Promise<void> {
  // Prevent duplicate — one rating per rater per activity
  const existing = await getDocs(
    query(
      collection(db, 'ratings'),
      where('activityId', '==', rating.activityId),
      where('raterId', '==', rating.raterId),
    )
  );
  if (!existing.empty) throw new Error('ALREADY_RATED');

  // Write the rating
  await addDoc(collection(db, 'ratings'), {
    ...rating,
    createdAt: serverTimestamp(),
  });

  // Update the rated user's average (Firestore doesn't support computed fields,
  // so we fetch all their ratings and recompute)
  const allRatings = await getDocs(
    query(collection(db, 'ratings'), where('ratedUserId', '==', rating.ratedUserId))
  );
  const scores = allRatings.docs.map(d => d.data().score as number);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  await updateDoc(doc(db, 'users', rating.ratedUserId), {
    rating: Math.round(avg * 10) / 10,   // 1 decimal
    reviewCount: scores.length,
  });
}

// Check if a user has already rated an organiser for a given activity
export async function hasAlreadyRated(activityId: string, raterId: string): Promise<boolean> {
  const snap = await getDocs(
    query(
      collection(db, 'ratings'),
      where('activityId', '==', activityId),
      where('raterId', '==', raterId),
    )
  );
  return !snap.empty;
}
