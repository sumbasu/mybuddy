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

## API & Service Integrations

### 1. Firebase Authentication — Phone OTP

**SDK:** `firebase/auth` (Web SDK v12)  
**Used in:** `PhoneAuthScreen`, `OTPVerifyScreen`, `AuthContext`

| Operation | Method | Description |
|---|---|---|
| Send OTP | `signInWithPhoneNumber(auth, phone, recaptchaVerifier)` | Sends SMS via Firebase, returns `ConfirmationResult` |
| Verify OTP | `confirmation.confirm(code)` | Validates code, returns `UserCredential` |
| Sign out | `signOut(auth)` | Invalidates Firebase session |
| Session listener | `onAuthStateChanged(auth, callback)` | Fires on login / logout / app restart |

**Notes:**
- reCAPTCHA is handled by `expo-firebase-recaptcha` (shows modal on physical device)
- `inMemoryPersistence` used — cross-session restore is done via AsyncStorage + Firestore
- Test phone numbers bypass SMS and reCAPTCHA entirely

---

### 2. Cloud Firestore — Database

**SDK:** `firebase/firestore` (Web SDK v12)  
**Used in:** `AuthContext`, `useActivities`, `useUnreadCount`, `ChatScreen`, `ActivityDetailScreen`, `CreateActivityScreen`

#### Collections & Key Operations

**`users/{uid}`**

| Operation | Method | Trigger |
|---|---|---|
| Create user profile | `setDoc(ref, data)` | First OTP login |
| Read user profile | `getDoc(ref)` | On auth state change |
| Update profile | `setDoc(ref, data, { merge: true })` | Profile setup, interests, subscription |

**`activities/{activityId}`**

| Operation | Method | Trigger |
|---|---|---|
| Create activity | `setDoc(ref, data)` | User posts an activity |
| Read all activities | `onSnapshot(query)` | Home & Activities screens (real-time) |
| Read one activity | `onSnapshot(ref)` | Activity Detail screen (real-time) |
| Update activity | `updateDoc(ref, data)` | Edit activity, join/leave, accept/reject |
| Add join request | `arrayUnion(uid)` on `pendingRequests` | User taps Request to Join |
| Accept request | `arrayUnion(uid)` on `participants` + `increment(1)` on `joinedCount` | Organiser taps Accept |
| Reject / Leave | `arrayRemove(uid)` + `increment(-1)` | Organiser rejects or user leaves |

**`chats/{chatId}`**

| Operation | Method | Trigger |
|---|---|---|
| Create / update chat | `setDoc(ref, data, { merge: true })` | Open chat, send join request |
| Increment unread | `updateDoc` with `increment(1)` on `unreadCounts.{uid}` | New message sent |
| Reset unread | `updateDoc` with `{ unreadCounts.uid: 0 }` | User opens the chat |
| List user's chats | `onSnapshot(where('participants', 'array-contains', uid))` | Chats screen |

**`chats/{chatId}/messages/{messageId}`**

| Operation | Method | Trigger |
|---|---|---|
| Send message | `addDoc(messagesRef, data)` | User sends a message |
| Listen to messages | `onSnapshot(orderBy('createdAt', 'asc'))` | Chat screen (real-time) |

**Firestore FieldValues used:** `serverTimestamp()`, `arrayUnion()`, `arrayRemove()`, `increment()`

---

### 3. Firebase Storage

**SDK:** `firebase/storage`  
**Used in:** `ProfileScreen` (profile photo upload)  
**Path pattern:** `profiles/{uid}/avatar.jpg`

| Operation | Notes |
|---|---|
| Upload photo | Selected via `expo-image-picker`, uploaded as blob |
| Download URL | Stored in `users/{uid}.photoURL` in Firestore |

---

### 4. Razorpay — Payments

**SDK:** `react-native-razorpay`  
**Used in:** `SubscriptionScreen`  
**Environment:** Native builds only (`expo run:ios`). Falls back to simulated payment in Expo Go.

| Parameter | Value |
|---|---|
| Currency | INR |
| Monthly amount | `monthlyPrice × 100` paise (e.g. ₹99 → 9900) |
| Quarterly amount | `quarterlyPrice × 100` paise (e.g. ₹249 → 24900) |
| Key | `EXPO_PUBLIC_RAZORPAY_KEY` (public key only — never the secret) |
| Prefill | User's phone number |

**Payment flow:**
1. `RazorpayCheckout.open(options)` → Razorpay native sheet
2. On success → `data.razorpay_payment_id` stored in Firestore under `subscription.razorpaySubscriptionId`
3. Subscription `plan` set to `basic`, `expiresAt` set to +1 or +3 months
4. On cancel/failure → `err.code === 'PAYMENT_CANCELLED'` is swallowed silently

**Note:** For production, order creation using the Razorpay secret should happen on a backend server, not the client app. The secret key must never be in the mobile app.

---

### 5. expo-image-picker — Profile Photos

**SDK:** `expo-image-picker`  
**Used in:** `ProfileScreen`

| Operation | API |
|---|---|
| Request permission | `requestMediaLibraryPermissionsAsync()` / `requestCameraPermissionsAsync()` |
| Open camera | `launchCameraAsync({ allowsEditing: true, aspect: [1,1], quality: 0.7 })` |
| Open library | `launchImageLibraryAsync({ mediaTypes: Images, allowsEditing: true })` |

Result URI is saved to `user.photoURL` via `AuthContext.setUser()`.

---

### 6. expo-firebase-recaptcha — OTP reCAPTCHA

**SDK:** `expo-firebase-recaptcha`  
**Used in:** `PhoneAuthScreen`

Provides `<FirebaseRecaptchaVerifierModal>` which handles the reCAPTCHA challenge required by Firebase phone auth. Mounted invisibly; triggered automatically when `signInWithPhoneNumber` is called.

---

### 7. @react-native-community/datetimepicker — Activity Date & Time

**SDK:** `@react-native-community/datetimepicker`  
**Used in:** `CreateActivityScreen`

| Mode | Display | Usage |
|---|---|---|
| `date` | `inline` | Full calendar grid with `themeVariant="light"` to force visible text on physical devices |
| `time` | `spinner` | Scroll wheel time picker |

Both use `accentColor={COLORS.primary}` and `textColor="#000000"` for consistent styling.

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

| Variable | Description | Required |
|---|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase web API key | Yes |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `EXPO_PUBLIC_RAZORPAY_KEY` | Razorpay public key (test: `rzp_test_...`, live: `rzp_live_...`) | For payments |

> **Never put `RAZORPAY_SECRET` in the app.** The secret is for backend order verification only.

---

## Known Limitations

- Firebase phone auth requires a **native build** (`expo run:ios`) for real SMS on physical devices. Use test phone numbers in Expo Go during development.
- Currently restricted to **India** (+91 numbers, Razorpay INR payments).
- Push notifications not yet implemented — unread count shown via in-app badge only.

---

## License

Private — all rights reserved.
