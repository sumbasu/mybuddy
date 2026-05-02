import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

export function useUnreadCount(uid: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      snapshot.docs.forEach((doc) => {
        const counts = doc.data().unreadCounts || {};
        total += counts[uid] || 0;
      });
      setUnreadCount(total);
    }, () => setUnreadCount(0));

    return unsubscribe;
  }, [uid]);

  return unreadCount;
}
