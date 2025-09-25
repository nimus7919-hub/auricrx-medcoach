# Google Sign-In Setup Guide

## 🔧 Step 1: Get Google Web Client ID

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `auricrx-medcoach`
3. **Go to Project Settings** (gear icon)
4. **Go to "General" tab**
5. **Scroll down to "Your apps" section**
6. **Find your Web app** (the one with app ID: `1:1043512593259:web:30be3d99b6cead6e5eda2e`)
7. **Click on the Web app**
8. **Copy the "Web client ID"** (it should look like: `1043512593259-abcdefghijklmnop.apps.googleusercontent.com`)

## 🔧 Step 2: Update authService.js

Replace the placeholder in `src/services/authService.js`:

```javascript
// Replace this line:
webClientId: '1043512593259-abcdefghijklmnop.apps.googleusercontent.com', // TODO: Get from Firebase Console

// With your actual Web Client ID:
webClientId: 'YOUR_ACTUAL_WEB_CLIENT_ID_HERE',
```

## 🔧 Step 3: Enable Google Sign-In in Firebase

1. **Go to Firebase Console** → **Authentication** → **Sign-in method**
2. **Click on "Google"**
3. **Enable Google Sign-In**
4. **Add your project's support email**
5. **Save**

## 🔧 Step 4: Configure Android (if needed)

The `google-services.json` file you already have should work, but make sure:
1. **Google Sign-In is enabled** in Firebase Console
2. **SHA-1 fingerprint** is added to your Firebase project (for release builds)

## 🔧 Step 5: Test Google Sign-In

1. **Run your app**: `npx expo start`
2. **Click "Continue with Google"** button
3. **Select your Google account**
4. **Grant permissions**
5. **You should be signed in!**

## 🎯 What This Enables:

- **One-tap Google Sign-In** for users
- **Automatic account creation** if user doesn't exist
- **Profile information** (name, email, photo) from Google
- **Secure authentication** with Google's OAuth

## 🚨 Important Notes:

- **Web Client ID** is different from Android/iOS Client IDs
- **Must be from the same Firebase project**
- **Google Sign-In must be enabled** in Firebase Console
- **Users can sign in with any Google account**

## ✅ After Setup:

Your Google Sign-In button will be fully functional and users can:
- Sign in with their Google accounts
- Automatically get their profile information
- Access the app dashboard after authentication

---

**Ready to get your Google Web Client ID and make the button active?** 🚀
