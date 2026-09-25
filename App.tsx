import 'react-native-gesture-handler';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import GradientBackground from './src/components/GradientBackground';
import { recordError } from './src/services/firebaseNative';

// Routes uncaught JS exceptions to Crashlytics in addition to the default
// red-box/console behavior, so crashes are visible in the Firebase console.
const defaultErrorHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  recordError(error, isFatal ? 'Unhandled fatal error' : 'Unhandled error');
  defaultErrorHandler(error, isFatal);
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    BarlowCondensed_700Bold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <GradientBackground />
        <SafeAreaProvider>
          <AuthProvider>
            {fontsLoaded ? (
              <AppNavigator />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#FFFFFF" size="large" />
              </View>
            )}
          </AuthProvider>
        </SafeAreaProvider>
      </View>
    </GestureHandlerRootView>
  );
}
