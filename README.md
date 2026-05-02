# MyBuddy

A mobile app to find activity partners near you — for sports, fitness, social meetups and entertainment. Not a dating app. A buddy-finding app.

Built with React Native (Expo), Firebase and Razorpay. Currently available for India only.

---

## Features

- **Phone OTP login** — India (+91) numbers, Firebase phone authentication
- **Interest-based matching** — Tennis, badminton, cricket, running, yoga, coffee, movies and more
- **Post activities** — Create an activity with date, time, location and available spots
- **Join requests** — Request to join, organiser accepts or rejects with in-app notification
- **Real-time chat** — Message the activity organiser and participants
- **Unread badge** — Bell icon and chat tab show live unread message count
- **Subscription plans** — 7-day free trial, then ₹99/month or ₹249/quarter via Razorpay
- **Invite code system** — Share your code, friends get 10% off, you earn a free month per 5 referrals
- **Profile photos** — Camera or photo library upload
- **Leave activity** — Participants can leave an activity they joined

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo SDK 54 |
| Language | TypeScript |
| Auth | Firebase Phone Authentication |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| Payments | Razorpay (India) |
| Navigation | React Navigation v6 |
| Icons | Expo Vector Icons (Ionicons) |
| Image picker | expo-image-picker |
| Date picker | @react-native-community/datetimepicker |

---

## Project Structure

```
src/
├── constants/
│   ├── demoData.ts        # Seed activities for development
│   ├── interests.ts       # All supported interest categories
│   └── theme.ts           # Colors, spacing, radius, shadows
├── context/
│   └── AuthContext.tsx    # Auth state, Firestore user profile, persistence
├── hooks/
│   ├── useActivities.ts   # Real-time Firestore activities listener
│   └── useUnreadCount.ts  # Real-time unread messages badge
├── navigation/
│   └── AppNavigator.tsx   # Stack + tab navigation, auth gating
├── screens/
│   ├── ActivityDetailScreen.tsx
│   ├── ActivitiesScreen.tsx
│   ├── ChatScreen.tsx
│   ├── ChatsScreen.tsx
│   ├── CreateActivityScreen.tsx
│   ├── HomeScreen.tsx
│   ├── InterestPickerScreen.tsx
│   ├── OnboardingScreen.tsx
│   ├── OTPVerifyScreen.tsx
│   ├── PhoneAuthScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── ProfileSetupScreen.tsx
│   ├── SplashScreen.tsx
│   └── SubscriptionScreen.tsx
├── services/
│   ├── firebase.ts        # Firebase app, auth, Firestore, storage
│   └── phoneAuth.ts       # OTP confirmation object store
└── types/
    ├── declarations.d.ts  # Third-party module declarations
    └── index.ts           # App-wide TypeScript types
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone, or iOS Simulator / Android Emulator

### 1. Clone and install

```bash
git clone https://github.com/sumbasu/mybuddy.git
cd mybuddy
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Firebase setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Phone Authentication** under Authentication → Sign-in method
3. Create a **Firestore** database (start in test mode, then apply the rules below)
4. Enable **Storage**

#### Firestore Security Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /activities/{activityId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.creatorId
        || (request.auth != null &&
            request.resource.data.diff(resource.data)
              .affectedKeys().hasOnly(['pendingRequests', 'pendingRequestNames']))
        || (request.auth != null &&
            resource.data.participants.hasAll([request.auth.uid]) &&
            request.resource.data.diff(resource.data)
              .affectedKeys().hasOnly(['participants', 'joinedCount']));
      allow delete: if request.auth.uid == resource.data.creatorId;
    }
    match /chats/{chatId} {
      allow read: if true;
      allow write: if request.auth != null;
      match /messages/{messageId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
    }
  }
}
```

### 4. Add test phone numbers (for development)

In Firebase Console → Authentication → Sign-in method → Phone → Phone numbers for testing:

```
+91 9999999999  →  123456
+91 8888888888  →  123456
```

### 5. Run the app

```bash
# iOS Simulator
npx expo start --clear
# Press 'i' after startup

# Physical device
npx expo start
# Scan the QR code with Expo Go
```

---

## Firestore Data Model

```
users/{uid}
  name, phone, city, interests[], photoURL,
  subscription{ plan, expiresAt },
  trialEndsAt, myInviteCode, referralCount,
  freeMonthsEarned, discountPct, createdAt

activities/{activityId}
  creatorId, creatorName, title, interest,
  description, date, time, location{},
  slots, joinedCount, participants[],
  pendingRequests[], pendingRequestNames{},
  skillLevel, genderPreference, status, createdAt

chats/{chatId}
  activityId, activityTitle, participants[],
  lastMessage, lastMessageAt, unreadCounts{}

  messages/{messageId}
    senderId, senderName, text, createdAt, read
```

---

## Subscription Plans

| Plan | Price | Duration |
|---|---|---|
| Free Trial | ₹0 | 7 days |
| Basic | ₹99 | 1 month |
| Quarterly | ₹249 | 3 months |

Payments processed via **Razorpay** (UPI, cards, wallets). Add your Razorpay key in `src/screens/SubscriptionScreen.tsx` when going live.

---

## Invite & Referral System

- Every user gets a unique invite code (e.g. `MB9876`)
- Friends who sign up using the code get **10% off** their first subscription
- The referrer earns **1 free month** for every 5 friends who join

---

## Supported Interests

**Sports** — Tennis, Badminton, Cricket, Football, Basketball, Swimming, Cycling, Squash, Table Tennis

**Fitness** — Running, Jogging, Gym, Yoga, Hiking, Morning Walk

**Social** — Coffee, Lunch, Networking, Board Games

**Entertainment** — Movies, Concerts, Trekking, Photography

---

## Environment Variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

---

## Known Limitations

- Firebase phone auth requires a **native build** (`expo run:ios`) for real SMS on physical devices. Use test phone numbers in Expo Go during development.
- Currently restricted to **India** (+91 numbers, Razorpay INR payments).
- Push notifications not yet implemented — unread count shown via in-app badge only.

---

## License

Private — all rights reserved.
