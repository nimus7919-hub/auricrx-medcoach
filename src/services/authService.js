import uiI18n from "../i18n";
import { authenticatedFetch } from './authenticatedFetch';
import { API_BASE } from '../config/api';
import { consentRequest, requireAccountConsent, clearConsentCache } from './consentService';
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

if (Platform.OS === 'web') WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

class AuthService {
  constructor() {
    this.auth = auth;
    this.googleSignInConfigured = false;
  }

  // Configure Google Sign-In
  configureGoogleSignIn() {
    // Load only on native so web and Expo Go do not initialize the native module.
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    if (!this.googleSignInConfigured) {
      GoogleSignin.configure({
        webClientId: googleAuthConfig.webClientId,
        iosClientId: googleAuthConfig.iosClientId,
        offlineAccess: false,
      });
      this.googleSignInConfigured = true;
    }
    return GoogleSignin;
  }

  // Email/Password Authentication
  async signUpWithEmail(email, password, firstName, lastName, consents) {
    if (!consents?.terms || !consents?.privacy) return { success: false, error: uiI18n.t("ui.termsAndPrivacyAcknowledgmentAreRequired") };
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
        message: uiI18n.t("ui.accountCreatedSuccessfullyPleaseCheckYourEmailIncludingSpamFolderForAVerificationLink"),
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
          error: uiI18n.t("ui.pleaseVerifyYourEmailAddressBeforeSigningInCheckYourInboxIncludingSpamFolderForAVerificati"),
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
      error: uiI18n.t("ui.phoneVerificationRequiresNativeBuild"),
      message: uiI18n.t("ui.phoneVerificationWillBeAvailableAfterBuildingWithEas")
    };
  }

  async verifyPhoneCode(confirmation, verificationCode) {
    console.warn('⚠️ Phone verification requires native build with @react-native-firebase');
    return {
      success: false,
      error: uiI18n.t("ui.phoneVerificationRequiresNativeBuild"),
    };
  }

  // Password Reset
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return {
        success: true,
        message: uiI18n.t("adminProfile.passwordResetEmailSent"),
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
      if (Platform.OS !== 'web' && Constants.appOwnership === 'expo') {
        return { success: false, error: uiI18n.t("ui.googleSignInRequiresADevelopmentBuildOpenThisAppInYourInstalledDevBuild") };
      }
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        if (!googleAuthConfig.webClientId) {
          return { success: false, error: uiI18n.t("ui.googleSignInIsNotConfiguredPleaseAddYourGoogleWebClientId") };
        }
        const GoogleSignin = this.configureGoogleSignIn();
        if (Platform.OS === 'android') {
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        }
        // Clear the cached Google account so the account picker shows every time
        try { await GoogleSignin.signOut(); } catch (e) {}
        const response = await GoogleSignin.signIn();
        if (response.type === 'cancelled') {
          return { success: false, error: uiI18n.t("ui.googleSignInWasCancelled") };
        }
        const idToken = response.data?.idToken;
        if (!idToken) {
          return { success: false, error: uiI18n.t("ui.googleSignInDidNotReturnAValidIdTokenPleaseTryAgain") };
        }
        return await this.signInWithGoogleTokens(idToken);
      }

      const clientId = getGoogleClientIdForPlatform('web');

      if (!clientId) {
        console.warn('⚠️ Google Sign-In attempted without client ID configuration');
        return {
          success: false,
          error: uiI18n.t("ui.googleSignInIsNotConfiguredYetPleaseAddYourGoogleOauthClientIds"),
        };
      }

      const redirectUri = AuthSession.makeRedirectUri({
        scheme: googleAuthConfig.redirectScheme,
        path: googleAuthConfig.redirectPath,
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
          error: uiI18n.t("ui.googleSignInWasCancelled"),
        };
      }

      if (result.type !== 'success' || !result.params?.code) {
        const errorDescription =
          result.params?.error_description ||
          result.error?.message ||
          uiI18n.t("googleAuth.error");
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
          error: uiI18n.t("ui.googleSignInDidNotReturnAValidIdTokenPleaseTryAgain"),
        };
      }

      return await this.signInWithGoogleTokens(idToken, accessToken);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      return {
        success: false,
        error: uiI18n.t("googleAuth.error"),
      };
    }
  }

  async signInWithGoogleTokens(idToken, accessToken) {
    try {
      if (!idToken) {
        throw new Error(uiI18n.t("ui.missingGoogleIdToken"));
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
      let errorMessage = uiI18n.t("googleAuth.error");
      if (error?.code === 'auth/account-exists-with-different-credential') {
        errorMessage =
          uiI18n.t("ui.anAccountAlreadyExistsWithTheSameEmailAddressButADifferentSignInMethodPleaseSignInUsingYou");
      } else if (error?.code === 'auth/invalid-credential') {
        errorMessage = uiI18n.t("ui.theGoogleCredentialIsInvalidOrHasExpiredPleaseTryAgain");
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
      await clearConsentCache(this.auth.currentUser?.uid);
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
    if (!token) throw new Error(uiI18n.t("ui.pleaseSignInAgainIniciaSesionDeNuevo"));
    const response = await authenticatedFetch(API_BASE + '/api/account', { method: uiI18n.t("ai.delete"), headers: { Authorization: 'Bearer ' + token } });
    if (!response.ok) throw new Error(uiI18n.t("ui.deletionDidNotCompletePleaseRetryNoSeCompletoLaEliminacionIntentaDeNuevo"));
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
      'auth/email-already-in-use': uiI18n.t("ui.thisEmailIsAlreadyRegistered"),
      'auth/invalid-email': uiI18n.t("ui.invalidEmailAddress"),
      'auth/weak-password': uiI18n.t("ui.passwordShouldBeAtLeast6Characters"),
      'auth/user-not-found': uiI18n.t("ui.noAccountFoundWithThisEmail"),
      'auth/wrong-password': uiI18n.t("ui.incorrectPassword"),
      'auth/too-many-requests': uiI18n.t("ui.tooManyAttemptsPleaseTryAgainLater"),
      'auth/network-request-failed': uiI18n.t("ui.networkErrorPleaseCheckYourConnection"),
      'auth/invalid-phone-number': uiI18n.t("ui.invalidPhoneNumberFormat"),
      'auth/invalid-verification-code': uiI18n.t("ui.invalidVerificationCode"),
      'auth/code-expired': uiI18n.t("ui.verificationCodeHasExpired"),
    };

    return errorMessages[errorCode] || uiI18n.t("ui.anErrorOccurredPleaseTryAgain");
  }

  // Handle both sign-in and sign-up
  async handleAuth(authData) {
    try {
      const { email, password, isSignUp, staySignedIn = false, ...userData } = authData;
      
      console.log('handleAuth called with:', { email, isSignUp, staySignedIn, userData });
      
      if (isSignUp) {
        // Create account with Firebase
        console.log('Creating account...');
        const result = await this.signUpWithEmail(email, password, userData.firstName || uiI18n.t("ui.user"), userData.lastName || uiI18n.t("medications.sort.name"), userData.consents);
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
            message: uiI18n.t("ui.accountCreatedSuccessfullyYour14DayFreeTrialHasStartedPleaseCheckYourEmailToVerifyYourAcco")
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
        error: this.getErrorMessage(error.code) || uiI18n.t("errors.generic"),
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
        throw new Error(uiI18n.t("errors.serverUnavailable"));
      }
      
      const result = await response.json();
      console.log('User data stored successfully in Neon:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error storing user data in Neon:', error);
      console.error('Error details:', error.message);
      return { success: false, error: uiI18n.t("errors.generic") };
    }
  }

  // Get user data from Neon database
  async getUserData(uid) {
    try {
      const response = await authenticatedFetch(`https://auricrx-medcoach.onrender.com/api/users/${uid}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: uiI18n.t("ui.userDataNotFound") };
        }
        console.error('getUserData HTTP error:', response.status);
        throw new Error(uiI18n.t("errors.serverUnavailable"));
      }
      
      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('Error getting user data from Neon:', error);
      return { success: false, error: uiI18n.t("errors.generic") };
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
        error: uiI18n.t("ui.phoneVerificationRequiresNativeImplementationPleaseVerifyYourPhoneNumberLaterInSettings"),
        message: uiI18n.t("ui.accountCreatedSuccessfullyPhoneVerificationWillBeAvailableSoon")
      };
    } catch (error) {
      console.error('Phone verification error:', error);
      return {
        success: false,
        error: uiI18n.t("ui.phoneVerificationFailed"),
        message: uiI18n.t("ui.accountCreatedSuccessfullyPhoneVerificationFailed")
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
        AsyncStorage.removeItem('AURIC_REMINDER_TOMBSTONES'),
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
          // Warm a fresh ID token so authenticated calls never use a stale snapshot.
          try {
            await currentUser.getIdToken(/* forceRefresh */ true);
          } catch (tokenError) {
            console.warn('⚠️ Could not refresh ID token during restore:', tokenError);
          }
          return {
            success: true,
            user: {
              uid: currentUser.uid,
              email: currentUser.email || storedAuth.email,
              displayName: currentUser.displayName || storedAuth.displayName,
              emailVerified: currentUser.emailVerified,
              // Live Firebase user so callers can refresh tokens (never rely on AsyncStorage idToken).
              firebaseUser: currentUser,
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
