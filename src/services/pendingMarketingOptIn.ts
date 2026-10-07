import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sweatbud:pendingMarketingOptIn';

// The opt-in checkbox is shown on AuthChoiceScreen, before any account
// exists — but the account itself (new Firestore user doc) is only created
// later in AuthContext, once Firebase auth actually resolves, which for
// phone sign-in happens on a different screen after the OTP step. This
// carries the checkbox value across that gap so it lands on the new
// profile at creation time.
export async function setPendingMarketingOptIn(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, value ? '1' : '0');
  } catch {
    // Non-critical — worst case the new profile just defaults to opted-out.
  }
}

// Reads and clears in one step so a later, unrelated sign-up never
// accidentally inherits a stale value from a previous attempt. Returns null
// when nothing is pending — distinct from false — so callers can tell "no
// sign-in attempt happened" (e.g. the app just resumed an existing session)
// from "the box was explicitly left unchecked", and leave the stored value
// alone in the former case instead of clobbering it.
export async function consumePendingMarketingOptIn(): Promise<boolean | null> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    await AsyncStorage.removeItem(KEY);
    return value === null ? null : value === '1';
  } catch {
    return null;
  }
}
