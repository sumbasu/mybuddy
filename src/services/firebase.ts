import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
// firebase/auth's package.json has no "react-native" export condition, so
// Metro resolves it to the browser build — which has no persistent storage
// option for RN. @firebase/auth (the underlying engine) does declare one.
// @ts-ignore — tsc resolves this package without the "react-native" export
// condition Metro uses at runtime, so it can't see this type; the function
// is genuinely there in the RN build.
import { getReactNativePersistence } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};


const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Persists the Firebase Auth session across app restarts — without this,
// auth.currentUser is null on every cold start (even though AuthContext's
// AsyncStorage-cached profile makes the UI look logged in), which silently
// breaks any Firestore write gated on request.auth != null.
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  console.log('[firebase] initializeAuth with RN persistence succeeded');
} catch (err) {
  console.log('[firebase] initializeAuth threw, falling back to getAuth:', err);
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
