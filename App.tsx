import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GRADIENT } from './src/constants/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient colors={[GRADIENT.top, GRADIENT.bottom]} style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </SafeAreaProvider>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}
