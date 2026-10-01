import { Platform } from 'react-native';
import * as TrackingTransparency from 'expo-tracking-transparency';

// Apple requires this prompt ("Ask App Not to Track" / "Allow") before an app
// can access the IDFA — which @react-native-firebase/analytics uses on iOS
// (it logs "Using FirebaseAnalytics/IdentitySupport with Ad Ids" at init).
// No-op on Android; expo-tracking-transparency resolves immediately there
// since ATT is an iOS 14+ concept.
export async function requestTrackingPermission(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
    if (status === 'undetermined') {
      await TrackingTransparency.requestTrackingPermissionsAsync();
    }
  } catch {
    // Best-effort — Analytics just won't include the IDFA if this fails.
  }
}
