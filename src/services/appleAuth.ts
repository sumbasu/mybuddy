import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { OAuthProvider, signInWithCredential, updateProfile } from 'firebase/auth';
import { auth } from './firebase';

export async function isAppleSignInAvailable(): Promise<boolean> {
  return AppleAuthentication.isAvailableAsync();
}

// Random string Firebase can match against the hash embedded in Apple's
// identity token, to prove this credential was requested by this sign-in
// attempt and not replayed from an intercepted token.
function randomNonce(length = 32): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  const bytes = Crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

// Returns null if the user cancelled, throws on a real failure.
export async function signInWithApple() {
  const rawNonce = randomNonce();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  let credential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (err: any) {
    if (err?.code === 'ERR_REQUEST_CANCELED') return null;
    throw err;
  }

  if (!credential.identityToken) throw new Error('Apple did not return an identity token.');

  const provider = new OAuthProvider('apple.com');
  const firebaseCredential = provider.credential({
    idToken: credential.identityToken,
    rawNonce,
  });

  const result = await signInWithCredential(auth, firebaseCredential);

  // Apple only sends the name on the very first sign-in ever, and Firebase
  // doesn't populate it on the user profile automatically — set it here so
  // AuthContext's existing firebaseUser.displayName handling picks it up.
  const fullName = credential.fullName;
  const displayName = [fullName?.givenName, fullName?.familyName].filter(Boolean).join(' ');
  if (displayName && !result.user.displayName) {
    await updateProfile(result.user, { displayName });
  }

  return result;
}
