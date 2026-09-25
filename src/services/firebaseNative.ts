// Native Firebase SDKs — Analytics, Crashlytics, Messaging (FCM). Separate
// from services/firebase.ts, which is the JS SDK used for Auth/Firestore/
// Storage; these three have no working equivalent in the JS SDK on React
// Native (Crashlytics doesn't exist there at all, and JS-SDK Analytics
// depends on browser-only APIs), so they go through @react-native-firebase
// instead, sharing the same underlying native app config
// (GoogleService-Info.plist / google-services.json).
import {
  getAnalytics,
  logEvent as fbLogEvent,
  logScreenView as fbLogScreenView,
  setUserId as fbSetAnalyticsUserId,
} from '@react-native-firebase/analytics';
import {
  getCrashlytics,
  log as fbCrashlyticsLog,
  recordError as fbRecordError,
  setUserId as fbSetCrashlyticsUserId,
} from '@react-native-firebase/crashlytics';
import {
  getMessaging,
  requestPermission,
  registerDeviceForRemoteMessages,
  getToken,
  onMessage,
  AuthorizationStatus,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

const analytics = getAnalytics();
const crashlyticsInstance = getCrashlytics();
const messaging = getMessaging();

export function logScreenView(screenName: string) {
  fbLogScreenView(analytics, { screen_name: screenName, screen_class: screenName });
}

export function logEvent(name: string, params?: Record<string, any>) {
  fbLogEvent(analytics, name as any, params);
}

export function setAnalyticsUserId(uid: string | null) {
  fbSetAnalyticsUserId(analytics, uid).catch(() => {});
}

export function recordError(error: Error, context?: string) {
  if (context) fbCrashlyticsLog(crashlyticsInstance, context);
  fbRecordError(crashlyticsInstance, error);
}

export function setCrashlyticsUserId(uid: string | null) {
  fbSetCrashlyticsUserId(crashlyticsInstance, uid ?? '').catch(() => {});
}

// Requests notification permission (iOS requires this explicitly; Android
// 13+ too) and returns the device's FCM token, or null if permission was
// denied. Caller decides what to do with the token (e.g. save it on the
// user's Firestore doc so a backend can target pushes).
export async function requestPushPermissionAndToken(): Promise<string | null> {
  try {
    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;
    if (!enabled) return null;

    if (Platform.OS === 'ios') {
      // iOS needs an APNs token registered before FCM can hand back a token.
      await registerDeviceForRemoteMessages(messaging);
    }
    return await getToken(messaging);
  } catch (err) {
    recordError(err as Error, 'requestPushPermissionAndToken failed');
    return null;
  }
}

// Foreground messages don't show a system notification by default — the
// caller supplies its own display logic (e.g. expo-notifications, or an
// in-app banner).
export function onForegroundMessage(handler: (title: string, body: string) => void) {
  return onMessage(messaging, async (remoteMessage: RemoteMessage) => {
    const { title, body } = remoteMessage.notification ?? {};
    if (title && body) handler(title, body);
  });
}
