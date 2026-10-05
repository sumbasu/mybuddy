import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Group } from '../types';

export function useGroups(uid: string | undefined) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setGroups([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'groups'), where('members', 'array-contains', uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Group[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data() as Omit<Group, 'id'>,
        }));
        setGroups(data);
        setLoading(false);
      },
      (err) => {
        console.error('Groups fetch error:', err.code);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [uid]);

  return { groups, loading };
}
