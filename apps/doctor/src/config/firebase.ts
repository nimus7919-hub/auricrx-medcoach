import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Same Firebase project as the patient app.
 * Setup: register a separate iOS/Android/Web app for com.auricrx.doctors
 * in Firebase Console; until then this shares the existing web config.
 */
const firebaseConfig = {
  apiKey: 'AIzaSyB0SzS0Q7FpKienp-7Y8SnLHRmvrNq4PXE',
  authDomain: 'auricrx-medcoach.firebaseapp.com',
  projectId: 'auricrx-medcoach',
  storageBucket: 'auricrx-medcoach.firebasestorage.app',
  messagingSenderId: '1043512593259',
  appId: '1:1043512593259:web:30be3d99b6cead6e5eda2e',
  measurementId: 'G-SW89Y658XF',
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
export const db = getFirestore(app);
export { app };
