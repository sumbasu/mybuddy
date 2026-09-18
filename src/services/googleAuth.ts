import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebase';

// Lets the browser sheet close itself once Google redirects back — must run
// once at module scope, before any component calls the hook below.
WebBrowser.maybeCompleteAuthSession();

// Browser-based OAuth (no native Google Sign-In module) — avoids clashing
// with expo-firebase-recaptcha's old Firebase pod requirement. Trade-off is
// a browser sheet instead of the native account picker.
export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type !== 'success') {
      if (response?.type === 'error' || response?.type === 'cancel') setLoading(false);
      return;
    }
    const idToken = response.authentication?.idToken ?? (response.params as any)?.id_token;
    if (!idToken) {
      setLoading(false);
      return;
    }
    const credential = GoogleAuthProvider.credential(idToken);
    signInWithCredential(auth, credential).finally(() => setLoading(false));
  }, [response]);

  const signIn = async () => {
    setLoading(true);
    const result = await promptAsync();
    if (result.type !== 'success') setLoading(false);
  };

  return { signIn, loading, ready: !!request };
}
