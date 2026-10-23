import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebase';
import { setPendingLinkCredential } from './pendingLinkCredential';

// Lets the browser sheet close itself once Google redirects back — must run
// once at module scope, before any component calls the hook below.
WebBrowser.maybeCompleteAuthSession();

// Browser-based OAuth (no native Google Sign-In module) — avoids clashing
// with expo-firebase-recaptcha's old Firebase pod requirement. Trade-off is
// a browser sheet instead of the native account picker.
export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);
  // Set when sign-in collides with an existing verified-email account under
  // a different provider — the caller (AuthChoiceScreen) is responsible for
  // telling the user to re-authenticate with that original method so
  // linkWithCredential can apply the stored pending credential afterward.
  const [linkRequiredEmail, setLinkRequiredEmail] = useState<string | null>(null);

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
    signInWithCredential(auth, credential)
      .catch((err: any) => {
        if (err?.code === 'auth/account-exists-with-different-credential') {
          const pending = GoogleAuthProvider.credentialFromError(err);
          if (pending) setPendingLinkCredential(pending);
          setLinkRequiredEmail(err.customData?.email ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, [response]);

  const signIn = async () => {
    setLoading(true);
    setLinkRequiredEmail(null);
    const result = await promptAsync();
    if (result.type !== 'success') setLoading(false);
  };

  return { signIn, loading, ready: !!request, linkRequiredEmail };
}
