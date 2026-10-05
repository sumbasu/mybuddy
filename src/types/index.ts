import type { NavigatorScreenParams } from '@react-navigation/native';

export interface User {
  uid: string;
  email?: string;
  phone?: string;
  name: string;
  nameLower?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  dob?: string; // ISO date string — replaces free-text age entry in Edit Profile
  city: string;
  state: string;
  interests: string[];
  bio?: string;
  photoURL?: string;
  rating?: number;
  reviewCount?: number;
  subscription: SubscriptionStatus;
  trialEndsAt?: string;
  createdAt: string;
  myInviteCode?: string;
  appliedInviteCode?: string;
  discountPct?: number;
  referralCount?: number;
  freeMonthsEarned?: number;
  followersCount?: number;
  followingCount?: number;
  bestHand?: string;
  courtPosition?: string;
  matchType?: string;
  preferredTime?: string;
  buddyGenderPreference?: 'any' | 'same' | 'male' | 'female';
  fcmToken?: string;
  // How this account first signed in — captured once at account creation,
  // not re-derived later, so it reflects the original sign-up method even
  // if the user later links another provider to the same Firebase account.
  signInProvider?: 'phone' | 'google' | 'apple' | 'email' | 'unknown';
}

export interface SubscriptionStatus {
  plan: 'free_trial' | 'basic' | 'premium' | 'expired';
  expiresAt?: string;
  razorpaySubscriptionId?: string;
}

export interface Activity {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorPhotoURL?: string;
  title: string;
  interest: string;
  description?: string;
  date: string;        // ISO string
  time: string;        // "HH:MM"
  location: {
    name: string;
    address: string;
    city: string;
    lat: number;
    lng: number;
  };
  slots: number;
  joinedCount: number;
  participants: string[];  // uids
  pendingRequests: string[];
  pendingRequestNames?: Record<string, string>;
  genderPreference?: 'any' | 'male' | 'female';
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'any';
  status: 'open' | 'full' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  members: string[]; // uids, always includes createdBy
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface Chat {
  id: string;
  activityId?: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export type RootStackParamList = {
  Welcome: undefined;
  AuthChoice: undefined;
  OTPVerify: { phone: string };
  ProfileSetup: undefined;
  InterestPicker: undefined;
  EditProfile: undefined;
  Settings: undefined;
  YourActivity: undefined;
  YourMatches: undefined;
  YourClasses: undefined;
  YourEvents: undefined;
  YourFavourites: undefined;
  LocationSetup: undefined;
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  AllGames: undefined;
  FindGame: undefined;
  ActivityDetail: { activityId: string };
  CreateActivity: { activityId?: string } | undefined;
  UserProfile: { userId: string };
  Chats: undefined;
  Chat: { chatId: string; activityTitle?: string; participantName?: string; recipientId?: string };
  Subscription: undefined;
};

export type TabParamList = {
  Home: undefined;
  Community: { tab?: 'feed' | 'groups' } | undefined;
  Profile: undefined;
};
