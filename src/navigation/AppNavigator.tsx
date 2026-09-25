import React, { useRef } from 'react';
import { NavigationContainer, DefaultTheme, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';
import { logScreenView } from '../services/firebaseNative';

import { RootStackParamList, TabParamList } from '../types';

import WelcomeScreen from '../screens/WelcomeScreen';
import AuthChoiceScreen from '../screens/AuthChoiceScreen';
import OTPVerifyScreen from '../screens/OTPVerifyScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import InterestPickerScreen from '../screens/InterestPickerScreen';
import HomeScreen from '../screens/HomeScreen';
import CommunityScreen from '../screens/CommunityScreen';
import CreateActivityScreen from '../screens/CreateActivityScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';
import ChatsScreen from '../screens/ChatsScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import YourActivityScreen from '../screens/YourActivityScreen';
import YourMatchesScreen from '../screens/YourMatchesScreen';
import YourClassesScreen from '../screens/YourClassesScreen';
import YourEventsScreen from '../screens/YourEventsScreen';
import YourFavouritesScreen from '../screens/YourFavouritesScreen';
import YourGroupsScreen from '../screens/YourGroupsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// 3-tab structure matching the Figma design (Home / Community / Profile) —
// Create, Chats, and Activities-detail flows are reached via the root stack instead of tabs.
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.textPrimary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.surface,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons: Record<string, { active: string; inactive: string }> = {
            Home:      { active: 'home',            inactive: 'home-outline' },
            Community: { active: 'people',          inactive: 'people-outline' },
            Profile:   { active: 'person-circle',   inactive: 'person-circle-outline' },
          };
          const icon = icons[route.name];
          const name = focused ? icon?.active : icon?.inactive;
          return <Ionicons name={name as any} size={26} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"      component={HomeScreen}      options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Community" component={CommunityScreen} options={{ tabBarLabel: 'Community' }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}   options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: 'transparent', card: 'transparent' },
};

export default function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = useRef<string | undefined>(undefined);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.white} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={navTheme}
      onReady={() => {
        routeNameRef.current = navigationRef.getCurrentRoute()?.name;
      }}
      onStateChange={() => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.getCurrentRoute()?.name;
        if (currentRouteName && previousRouteName !== currentRouteName) {
          logScreenView(currentRouteName);
        }
        routeNameRef.current = currentRouteName;
      }}
      ref={navigationRef}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: 'transparent' } }}>
        {!isAuthenticated ? (
          // Auth stack — shown when logged out
          <>
            <Stack.Screen name="Welcome"        component={WelcomeScreen} />
            <Stack.Screen name="AuthChoice"      component={AuthChoiceScreen} />
            <Stack.Screen name="OTPVerify"      component={OTPVerifyScreen} />
          </>
        ) : !user?.name || !user?.city ? (
          // Profile setup stack — logged in but profile incomplete
          <Stack.Screen name="ProfileSetup"   component={ProfileSetupScreen} />
        ) : !user?.interests || user.interests.length < 2 ? (
          // Interests stack — profile done but hasn't picked interests yet
          <Stack.Screen name="InterestPicker" component={InterestPickerScreen} />
        ) : (
          // Main app stack
          <>
            <Stack.Screen name="MainTabs"       component={MainTabs} />
            <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
            <Stack.Screen name="CreateActivity" component={CreateActivityScreen} />
            <Stack.Screen name="InterestPicker" component={InterestPickerScreen} />
            <Stack.Screen name="Chats"          component={ChatsScreen} />
            <Stack.Screen name="Chat"           component={ChatScreen} />
            <Stack.Screen name="EditProfile"    component={EditProfileScreen} />
            <Stack.Screen name="Settings"       component={SettingsScreen} />
            <Stack.Screen name="YourActivity"   component={YourActivityScreen} />
            <Stack.Screen name="YourMatches"    component={YourMatchesScreen} />
            <Stack.Screen name="YourClasses"    component={YourClassesScreen} />
            <Stack.Screen name="YourEvents"     component={YourEventsScreen} />
            <Stack.Screen name="YourFavourites" component={YourFavouritesScreen} />
            <Stack.Screen name="YourGroups"      component={YourGroupsScreen} />
            <Stack.Screen name="Subscription"   component={SubscriptionScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
