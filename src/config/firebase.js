// src/config/firebase.js
// Firebase configuration and initialization

import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
// Real Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyB0SzS0Q7FpKienp-7Y8SnLHRmvrNq4PXE",
  authDomain: "auricrx-medcoach.firebaseapp.com",
  projectId: "auricrx-medcoach",
  storageBucket: "auricrx-medcoach.firebasestorage.app",
  messagingSenderId: "1043512593259",
  appId: "1:1043512593259:web:30be3d99b6cead6e5eda2e",
  measurementId: "G-SW89Y658XF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;
