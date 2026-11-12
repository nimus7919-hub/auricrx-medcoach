import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, type Auth } from 'firebase/auth';
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
    // Prefer RN persistence when the modular helper is available at runtime.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const authMod = require('firebase/auth') as typeof import('firebase/auth') & {
      getReactNativePersistence?: (storage: typeof AsyncStorage) => unknown;
    };
    if (typeof authMod.getReactNativePersistence === 'function') {
      return initializeAuth(app, {
        persistence: authMod.getReactNativePersistence(AsyncStorage) as never,
      });
    }
  } catch {
    // fall through
  }
  try {
    return initializeAuth(app);
  } catch {
    return getAuth(app);
  }
}

export const auth: Auth = createAuth();
export const db = getFirestore(app, 'auricrxmedcoach');
export { app };
