import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Activity } from '../types';

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'activities'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Activity[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data() as Omit<Activity, 'id'>,
        }));
        setActivities(data);
        setLoading(false);
      },
      (err) => {
        console.error('Activities fetch error:', err.code);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { activities, loading };
}
