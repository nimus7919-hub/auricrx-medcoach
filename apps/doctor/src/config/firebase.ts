import { initializeApp, getApps } from 'firebase/app';
// Firebase typings omit getReactNativePersistence (it lives on the RN Auth entry).
// @ts-expect-error RN helper is exported at runtime from firebase/auth
import { initializeAuth, getAuth, getReactNativePersistence, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Same Firebase project as the patient app (auricrx-medcoach).
 * Uses the named Firestore database `auricrxmedcoach` (there is no (default) DB).
 * Native config files: ./google-services.json and ./GoogleService-Info.plist
 * (Android app 1:1043512593259:android:cde5adeddd3a20645eda2e,
 *  iOS app 1:1043512593259:ios:f114ca954345cc4e5eda2e).
 */
const firebaseConfig = {
  apiKey: "AIzaSyAjNipp2vjNDuYt1A6CjXr_0YSf-rN8lnc",
  authDomain: "auricrx-medcoach.firebaseapp.com",
  projectId: "auricrx-medcoach",
  storageBucket: "auricrx-medcoach.firebasestorage.app",
  messagingSenderId: "1043512593259",
  appId: "1:1043512593259:web:05b28cb46c3286dc5eda2e",
  measurementId: "G-R4HRCBGXQ3",
};

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

function createAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Already initialized (Fast Refresh) or a duplicate init. Do not call
    // initializeAuth() without persistence — that crashes Hermes on SDK 53.
    return getAuth(app);
  }
}

export const auth: Auth = createAuth();
export const db = getFirestore(app, 'auricrxmedcoach');
export { app };
