import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User } from '../types';

const USER_CACHE_KEY = 'mybuddy_user_profile';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => Promise<void>;
  logout: () => Promise<void>;
  isTrialActive: () => boolean;
  isSubscribed: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Active Firebase session — fetch fresh profile from Firestore
        await loadFromFirestore(firebaseUser.uid, firebaseUser.email || '');
      } else {
        // No active session — restore from local AsyncStorage cache (cold start)
        await loadFromCache();
      }
    });
    return unsubscribe;
  }, []);

  // Called when Firebase session is active — reads/writes Firestore
  const loadFromFirestore = async (uid: string, email: string) => {
    try {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const u = snap.data() as User;
        // Sync referral count
        if (u.myInviteCode) {
          const count = await AsyncStorage.getItem(`referral_${u.myInviteCode}`);
          if (count !== null) {
            u.referralCount = parseInt(count);
            u.freeMonthsEarned = Math.floor(parseInt(count) / 5);
          }
        }
        await saveToCache(u);
        setUserState(u);
      } else {
        // New user — create Firestore doc
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);
        const newUser: User = {
          uid,
          email,
          name: '',
          city: '',
          state: '',
          interests: [],
          subscription: { plan: 'free_trial' },
          trialEndsAt: trialEnd.toISOString(),
          createdAt: new Date().toISOString(),
          myInviteCode: 'MB' + uid.slice(-4).toUpperCase(),
          referralCount: 0,
          freeMonthsEarned: 0,
          discountPct: 0,
        };
        await setDoc(ref, newUser);
        await saveToCache(newUser);
        setUserState(newUser);
      }
    } catch (err) {
      console.error('Firestore load error:', err);
      // Firestore failed — fall back to cache so user isn't logged out
      await loadFromCache();
      return;
    }
    setIsLoading(false);
  };

  // Called on cold start — reads only from AsyncStorage, no Firestore
  const loadFromCache = async () => {
    try {
      const cached = await AsyncStorage.getItem(USER_CACHE_KEY);
      if (cached) {
        setUserState(JSON.parse(cached));
      } else {
        setUserState(null);
      }
    } catch {
      setUserState(null);
    }
    setIsLoading(false);
  };

  const saveToCache = async (u: User) => {
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
  };

  const setUser = async (u: User | null) => {
    setUserState(u);
    if (!u) return;
    // Always update local cache immediately
    await saveToCache(u);
    // Only write to Firestore when Firebase session is active
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', u.uid), { ...u }, { merge: true });
      } catch (err) {
        console.error('Firestore write error:', err);
      }
    }
  };

  const logout = async () => {
    try { await signOut(auth); } catch { }
    await AsyncStorage.removeItem(USER_CACHE_KEY);
    await AsyncStorage.removeItem('mybuddy_uid');
    setUserState(null);
  };

  const isTrialActive = () => {
    if (!user) return false;
    if (user.subscription.plan === 'free_trial' && user.trialEndsAt) {
      return new Date(user.trialEndsAt) > new Date();
    }
    return false;
  };

  const isSubscribed = () => {
    if (!user) return false;
    const { plan, expiresAt } = user.subscription;
    if (plan === 'basic' || plan === 'premium') {
      if (expiresAt) return new Date(expiresAt) > new Date();
      return true;
    }
    return isTrialActive();
  };

  return (
    <AuthContext.Provider value={{
      user, isLoading, isAuthenticated: !!user,
      setUser, logout, isTrialActive, isSubscribed,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
