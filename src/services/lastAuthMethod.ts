import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthMethod = 'phone' | 'google' | 'apple';

const KEY = 'sweatbud:lastAuthMethod';

// Lightweight nudge so a returning user doesn't accidentally pick a
// different sign-in method than the one their existing profile is under —
// each method creates a separate Firebase Auth account, so picking wrong
// looks like a fresh/empty profile. This is per-device, not a real account
// link; it just highlights the method used last time on this device.
export async function saveLastAuthMethod(method: AuthMethod): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, method);
  } catch {
    // Non-critical — worst case the nudge just doesn't show next time.
  }
}

export async function getLastAuthMethod(): Promise<AuthMethod | null> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value === 'phone' || value === 'google' || value === 'apple' ? value : null;
  } catch {
    return null;
  }
}
