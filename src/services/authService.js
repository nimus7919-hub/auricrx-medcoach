// src/services/authService.js
// Authentication service with Firebase Auth integration

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier,
  GoogleAuthProvider,
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../config/firebase';

class AuthService {
  constructor() {
    this.auth = auth;
  }

  // Email/Password Authentication
  async signUpWithEmail(email, password, firstName, lastName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`.trim(),
      });

      // Send email verification
      await sendEmailVerification(user);

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code),
      };
    }
  }

  async signInWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code),
      };
    }
  }

  // Phone Authentication
  async sendPhoneVerification(phoneNumber, recaptchaVerifier) {
    try {
      const phoneAuthProvider = new PhoneAuthProvider(this.auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneNumber, recaptchaVerifier);
      
      return {
        success: true,
        verificationId,
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code),
      };
    }
  }

  async verifyPhoneCode(verificationId, verificationCode) {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      const userCredential = await signInWithCredential(this.auth, credential);
      const user = userCredential.user;

      return {
        success: true,
        user: {
          uid: user.uid,
          phoneNumber: user.phoneNumber,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code),
      };
    }
  }

  // Password Reset
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return {
        success: true,
        message: 'Password reset email sent',
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code),
      };
    }
  }

  // Google Sign-In
  async signInWithGoogle() {
    try {
      // Configure Google Sign-In
      await GoogleSignin.configure({
        webClientId: '700493546289-firca0mdn848fe2h11fb7ngbr6mt5ctd.apps.googleusercontent.com',
        offlineAccess: true,
        hostedDomain: '',
        forceCodeForRefreshToken: true,
        accountName: '',
        iosClientId: '', // Add iOS client ID if needed
      });

      // Check if device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Get user info from Google
      const { idToken } = await GoogleSignin.signIn();

      // Create Google credential
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign in with Firebase
      const userCredential = await signInWithCredential(this.auth, googleCredential);
      const user = userCredential.user;

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
      };
    } catch (error) {
      console.log('Google Sign-In Error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code) || error.message || 'Google Sign-In failed',
      };
    }
  }

  // Sign Out
  async signOut() {
    try {
      // Sign out from Google
      await GoogleSignin.signOut();
      
      // Sign out from Firebase
      await signOut(this.auth);
      
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code),
      };
    }
  }

  // Get Current User
  getCurrentUser() {
    return this.auth.currentUser;
  }

  // Listen to Auth State Changes
  onAuthStateChanged(callback) {
    return this.auth.onAuthStateChanged(callback);
  }

  // Error Message Helper
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/invalid-phone-number': 'Invalid phone number format',
      'auth/invalid-verification-code': 'Invalid verification code',
      'auth/code-expired': 'Verification code has expired',
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again';
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
