import { authenticatedFetch } from './authenticatedFetch';
import { API_BASE } from '../config/api';
import { consentRequest, requireAccountConsent } from './consentService';
// src/services/authService.js
// Authentication service with Firebase Auth integration

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { googleAuthConfig, getGoogleClientIdForPlatform } from '../config/googleOAuth';
import { startTrial } from './trialService';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

class AuthService {
  constructor() {
    this.auth = auth;
    // this.configureGoogleSignIn();
  }

  // Configure Google Sign-In
  configureGoogleSignIn() {
    // GoogleSignin.configure({
    //   webClientId: '1043512593259-YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // From Firebase Console
    //   offlineAccess: true,
    //   hostedDomain: '',
    //   forceCodeForRefreshToken: true,
    // });
  }

  // Email/Password Authentication
  async signUpWithEmail(email, password, firstName, lastName, consents) {
    if (!consents?.terms || !consents?.privacy) return { success: false, error: 'Terms and privacy acknowledgment are required.' };
    try {
      console.log('signUpWithEmail called with:', { email, password: '***', firstName, lastName });
      this.authInProgress = true;
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      console.log('User created successfully:', user.uid);
      await consentRequest('POST', consents, 'email');
      this.authInProgress = false;

      // Update user profile
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`.trim(),
      });
      console.log('Profile updated successfully');

      // Send email verification
      try {
        await sendEmailVerification(user);
        console.log('✅ Email verification sent successfully to:', user.email);
      } catch (emailError) {
        console.error('❌ Failed to send email verification:', emailError);
        // Don't fail the sign-up if email verification fails
        console.log('⚠️ Continuing with sign-up despite email verification failure');
      }

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        },
        firebaseUser: user, // Return Firebase user object for trial start
        message: 'Account created successfully! Please check your email (including spam folder) for a verification link.',
      };
    } catch (error) {
      this.authInProgress = false;
      console.error('signUpWithEmail error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
      };
    }
  }

  async signInWithEmail(email, password, staySignedIn = false) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        // Sign out the user since email is not verified
        await signOut(this.auth);
        return {
          success: false,
          error: 'Please verify your email address before signing in. Check your inbox (including spam folder) for a verification email.',
          needsEmailVerification: true,
        };
      }

      // Store authentication state if stay signed in is enabled
      if (staySignedIn) {
        await this.storeAuthState({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        });
      }

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

  // Phone Authentication (placeholder - requires native build)
  async sendPhoneVerification(phoneNumber) {
    console.warn('⚠️ Phone verification requires native build with @react-native-firebase');
    return {
      success: false,
      error: 'Phone verification requires native build',
      message: 'Phone verification will be available after building with EAS'
    };
  }

  async verifyPhoneCode(confirmation, verificationCode) {
    console.warn('⚠️ Phone verification requires native build with @react-native-firebase');
    return {
      success: false,
      error: 'Phone verification requires native build',
    };
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

  // Google Sign-In (Expo + native support)
  async signInWithGoogle() {
    try {
      if (Constants.appOwnership === 'expo') {
        return { success: false, error: 'Google Sign-In requires a development build. Open this app in your installed dev build.' };
      }
      const clientId = Platform.OS === 'android'
        ? googleAuthConfig.androidClientId
        : getGoogleClientIdForPlatform(Platform.OS);

      if (!clientId) {
        console.warn('⚠️ Google Sign-In attempted without client ID configuration');
        return {
          success: false,
          error: 'Google Sign-In is not configured yet. Please add your Google OAuth client IDs.',
        };
      }

      const redirectUri = AuthSession.makeRedirectUri({
        scheme: googleAuthConfig.redirectScheme,
        path: googleAuthConfig.redirectPath,
        native: Platform.OS === 'android' ? 'com.auricrx.medcoach:/oauthredirect' : undefined,
      });

      const authRequest = new AuthSession.AuthRequest({
        clientId,
        responseType: AuthSession.ResponseType.Code,
        scopes: ['openid', 'profile', 'email'],
        usePKCE: true,
        redirectUri,
      });

      const result = await authRequest.promptAsync(GOOGLE_DISCOVERY);

      if (result.type === 'dismiss' || result.type === 'cancel') {
        return {
          success: false,
          error: 'Google Sign-In was cancelled.',
        };
      }

      if (result.type !== 'success' || !result.params?.code) {
        const errorDescription =
          result.params?.error_description ||
          result.error?.message ||
          'Google Sign-In failed. Please try again.';
        console.warn('⚠️ Google Sign-In did not complete successfully:', result);
        return {
          success: false,
          error: errorDescription,
        };
      }

      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId,
          code: result.params.code,
          redirectUri,
          extraParams: {
            code_verifier: authRequest.codeVerifier ?? '',
          },
        },
        GOOGLE_DISCOVERY,
      );

      const idToken = tokenResponse.idToken ?? tokenResponse.id_token;
      const accessToken = tokenResponse.accessToken ?? tokenResponse.access_token;

      if (!idToken) {
        console.error('❌ Google Sign-In response did not include an ID token');
        return {
          success: false,
          error: 'Google Sign-In did not return a valid ID token. Please try again.',
        };
      }

      return await this.signInWithGoogleTokens(idToken, accessToken);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      return {
        success: false,
        error: 'Google Sign-In failed. Please try again.',
      };
    }
  }

  async signInWithGoogleTokens(idToken, accessToken) {
    try {
      if (!idToken) {
        throw new Error('Missing Google ID token');
      }

      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      this.authInProgress = true;
      const userCredential = await signInWithCredential(this.auth, credential);
      const user = userCredential.user;
      await requireAccountConsent('google');
      this.authInProgress = false;

      await this.storeAuthState({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
      });

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
      this.authInProgress = false;
      console.error('Google Sign-In (Firebase credential) error:', error);
      let errorMessage = 'Google Sign-In failed. Please try again.';
      if (error?.code === 'auth/account-exists-with-different-credential') {
        errorMessage =
          'An account already exists with the same email address but a different sign-in method. Please sign in using your original provider.';
      } else if (error?.code === 'auth/invalid-credential') {
        errorMessage = 'The Google credential is invalid or has expired. Please try again.';
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Sign Out
  async signOut() {
    try {
      // Clear stored authentication state
      await this.clearAuthState();
      
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

  async deleteAccount() {
    const token = await this.auth.currentUser?.getIdToken();
    if (!token) throw new Error('Please sign in again. / Inicia sesi\u00f3n de nuevo.');
    const response = await authenticatedFetch(API_BASE + '/api/account', { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
    if (!response.ok) throw new Error('Deletion did not complete. Please retry. / No se complet\u00f3 la eliminaci\u00f3n. Intenta de nuevo.');
    const result = await this.signOut();
    if (!result.success) throw new Error(result.error);
    return { success: true };
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

  // Handle both sign-in and sign-up
  async handleAuth(authData) {
    try {
      const { email, password, isSignUp, staySignedIn = false, ...userData } = authData;
      
      console.log('handleAuth called with:', { email, isSignUp, staySignedIn, userData });
      
      if (isSignUp) {
        // Create account with Firebase
        console.log('Creating account...');
        const result = await this.signUpWithEmail(email, password, userData.firstName || 'User', userData.lastName || 'Name', userData.consents);
        console.log('Sign up result:', result);
        
        if (result.success) {
          console.log('Account created successfully, storing user data...');
          // Store additional user data
          const storeResult = await this.storeUserData(result.user.uid, {
            ...userData,
            email,
            createdAt: new Date().toISOString(),
          });
          console.log('User data stored:', storeResult);
          
          // Start 14-day trial automatically for new users
          // Use Firebase user from sign-up result (before any sign-out can happen)
          const firebaseUser = result.firebaseUser;
          if (firebaseUser) {
            try {
              console.log('🚀 Starting 14-day trial for new user...');
              const trialResult = await startTrial(userData.phoneNumber || '', firebaseUser);
              console.log('✅ Trial started:', trialResult);
            } catch (trialError) {
              // Don't fail sign-up if trial start fails, just log it
              console.error('⚠️ Trial start failed (non-critical):', trialError);
            }
          } else {
            console.warn('⚠️ No Firebase user available for trial start');
          }
          
          return {
            ...result,
            needsEmailVerification: true,
            message: 'Account created successfully! Your 14-day free trial has started. Please check your email to verify your account.'
          };
        } else {
          console.error('Sign up failed:', result.error);
          return result;
        }
      } else {
        return await this.signInWithEmail(email, password, staySignedIn);
      }
    } catch (error) {
      console.error('Auth error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return {
        success: false,
        error: this.getErrorMessage(error.code) || error.message || 'An error occurred. Please try again',
      };
    }
  }

  // Store user data in Neon database
  async storeUserData(uid, userData) {
    try {
      console.log('Storing user data for uid:', uid);
      console.log('User data:', userData);
      
      const response = await authenticatedFetch('https://auricrx-medcoach.onrender.com/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: uid,
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          phone: userData.phoneNumber,
          username: userData.username,
          country: userData.country,
          unique_id: userData.uniqueId,
          created_at: userData.createdAt,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('User data stored successfully in Neon:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error storing user data in Neon:', error);
      console.error('Error details:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get user data from Neon database
  async getUserData(uid) {
    try {
      const response = await authenticatedFetch(`https://auricrx-medcoach.onrender.com/api/users/${uid}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'User data not found' };
        }
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('Error getting user data from Neon:', error);
      return { success: false, error: error.message };
    }
  }

  // Send phone verification (disabled for now - requires native implementation)
  async sendPhoneVerification(phoneNumber) {
    try {
      // Phone verification requires native Firebase implementation
      // For now, return a placeholder response
      console.log('Phone verification requested for:', phoneNumber);
      
      return {
        success: false,
        error: 'Phone verification requires native implementation. Please verify your phone number later in settings.',
        message: 'Account created successfully! Phone verification will be available soon.'
      };
    } catch (error) {
      console.error('Phone verification error:', error);
      return {
        success: false,
        error: 'Phone verification failed',
        message: 'Account created successfully! Phone verification failed.'
      };
    }
  }

  // Persistent Authentication Methods
  async storeAuthState(userData) {
    try {
      // Get current auth token
      const currentUser = auth.currentUser;
      let idToken = null;
      if (currentUser) {
        try {
          idToken = await currentUser.getIdToken();
        } catch (tokenError) {
          console.warn('⚠️ Could not get ID token:', tokenError);
        }
      }
      
      const authState = {
        ...userData,
        idToken, // Store ID token for server authentication
        timestamp: Date.now(),
        staySignedIn: true,
      };
      await AsyncStorage.setItem('AURIC_AUTH_STATE', JSON.stringify(authState));
      console.log('✅ Auth state stored for persistent login');
    } catch (error) {
      console.error('❌ Failed to store auth state:', error);
    }
  }

  async getStoredAuthState() {
    try {
      const storedAuth = await AsyncStorage.getItem('AURIC_AUTH_STATE');
      if (storedAuth) {
        const authState = JSON.parse(storedAuth);
        // Check if the stored auth is not too old (30 days)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        if (authState.timestamp > thirtyDaysAgo) {
          console.log('✅ Valid stored auth state found');
          return authState;
        } else {
          console.log('⚠️ Stored auth state expired, clearing...');
          await this.clearAuthState();
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get stored auth state:', error);
      return null;
    }
  }

  async clearAuthState() {
    try {
      // Clear authentication state
      await AsyncStorage.removeItem('AURIC_AUTH_STATE');
      
      // Clear all user-specific data
      await Promise.all([
        AsyncStorage.removeItem('AURIC_REMINDERS'),
        AsyncStorage.removeItem('AURIC_RX_PHOTOS'),
        AsyncStorage.removeItem('AURIC_VOICE_NOTES'),
        AsyncStorage.removeItem('AURIC_MEDS'),
        AsyncStorage.removeItem('AURIC_SELECTED_AI_DOCTOR'),
        AsyncStorage.removeItem('health_metrics'),
        AsyncStorage.removeItem('medication_adherence'),
        AsyncStorage.removeItem('side_effects'),
        AsyncStorage.removeItem('drug_interactions'),
        AsyncStorage.removeItem('drug_interaction_checks'),
        AsyncStorage.removeItem('symptom_analyses'),
        AsyncStorage.removeItem('stored_symptom_analyses'),
        AsyncStorage.removeItem('medication_recommendations'),
        AsyncStorage.removeItem('health_insights'),
        AsyncStorage.removeItem('appointments'),
        AsyncStorage.removeItem('doctor_contacts'),
        AsyncStorage.removeItem('appointment_reminders'),
        AsyncStorage.removeItem('smart_notifications'),
        AsyncStorage.removeItem('location_reminders'),
        AsyncStorage.removeItem('weather_alerts'),
        AsyncStorage.removeItem('usage_patterns'),
      ]);
      
      // Clear file system documents
      try {
        const medicalDocsFile = `${FileSystem.documentDirectory}medical_documents.json`;
        const medicalDocsInfo = await FileSystem.getInfoAsync(medicalDocsFile);
        if (medicalDocsInfo.exists) {
          await FileSystem.deleteAsync(medicalDocsFile, { idempotent: true });
        }
      } catch (fileError) {
        console.warn('⚠️ Could not delete medical documents file:', fileError);
      }
      
      console.log('✅ Auth state and user data cleared');
    } catch (error) {
      console.error('❌ Failed to clear auth state:', error);
    }
  }

  async restoreAuthState() {
    try {
      const storedAuth = await this.getStoredAuthState();
      if (storedAuth && storedAuth.staySignedIn) {
        // Check if Firebase still has the user authenticated
        const currentUser = this.auth.currentUser;
        if (currentUser && currentUser.uid === storedAuth.uid) {
          console.log('✅ User already authenticated, restoring state');
          return {
            success: true,
            user: {
              uid: storedAuth.uid,
              email: storedAuth.email,
              displayName: storedAuth.displayName,
              emailVerified: storedAuth.emailVerified,
            },
          };
        }
      }
      return { success: false };
    } catch (error) {
      console.error('❌ Failed to restore auth state:', error);
      return { success: false };
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
