import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { COLORS } from '../constants/theme';

// Empty placeholder — the Create tab intercepts the press and navigates to the stack screen
function CreatePlaceholder() { return <View />; }

import { RootStackParamList, TabParamList } from '../types';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PhoneAuthScreen from '../screens/PhoneAuthScreen';
import OTPVerifyScreen from '../screens/OTPVerifyScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import InterestPickerScreen from '../screens/InterestPickerScreen';
import HomeScreen from '../screens/HomeScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import CreateActivityScreen from '../screens/CreateActivityScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';
import ChatsScreen from '../screens/ChatsScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const { user } = useAuth();
  const unreadCount = useUnreadCount(user?.uid);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
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
            Home:       { active: 'home',            inactive: 'home-outline' },
            Activities: { active: 'calendar',        inactive: 'calendar-outline' },
            Create:     { active: 'add-circle',      inactive: 'add-circle-outline' },
            Chats:      { active: 'chatbubbles',     inactive: 'chatbubbles-outline' },
            Profile:    { active: 'person-circle',   inactive: 'person-circle-outline' },
          };
          const icon = icons[route.name];
          const name = focused ? icon?.active : icon?.inactive;

          if (route.name === 'Create') {
            return (
              <View style={styles.createBtn}>
                <Ionicons name="add" size={28} color="#fff" />
              </View>
            );
          }

          return (
            <Ionicons
              name={name as any}
              size={26}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home"       component={HomeScreen}           options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Activities" component={ActivitiesScreen}     options={{ tabBarLabel: 'Activities' }} />
      <Tab.Screen
        name="Create"
        component={CreatePlaceholder}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate('CreateActivity');
          },
        })}
        options={{ tabBarLabel: '' }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatsScreen}
        options={{
          tabBarLabel: 'Chats',
          tabBarBadge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.error, fontSize: 10 },
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  createBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});

export default function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator color={COLORS.white} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isAuthenticated ? (
          // Auth stack — shown when logged out
          <>
            <Stack.Screen name="Onboarding"   component={OnboardingScreen} />
            <Stack.Screen name="PhoneAuth"    component={PhoneAuthScreen} />
            <Stack.Screen name="OTPVerify"    component={OTPVerifyScreen} />
          </>
        ) : !user?.name ? (
          // Profile setup stack — logged in but profile incomplete
          <>
            <Stack.Screen name="ProfileSetup"   component={ProfileSetupScreen} />
            <Stack.Screen name="InterestPicker" component={InterestPickerScreen} />
          </>
        ) : (
          // Main app stack
          <>
            <Stack.Screen name="MainTabs"       component={MainTabs} />
            <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
            <Stack.Screen name="CreateActivity" component={CreateActivityScreen} />
            <Stack.Screen name="InterestPicker" component={InterestPickerScreen} />
            <Stack.Screen name="Chat"           component={ChatScreen} />
            <Stack.Screen name="EditProfile"    component={EditProfileScreen} />
            <Stack.Screen name="Subscription"   component={SubscriptionScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
