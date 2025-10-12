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
  signInWithCustomToken,
  RecaptchaVerifier,
  GoogleAuthProvider,
} from 'firebase/auth';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

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
  async signUpWithEmail(email, password, firstName, lastName) {
    try {
      console.log('signUpWithEmail called with:', { email, password: '***', firstName, lastName });
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      console.log('User created successfully:', user.uid);

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
        message: 'Account created successfully! Please check your email (including spam folder) for a verification link.',
      };
    } catch (error) {
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

  // Google Sign-In (Web-based for Expo Go compatibility)
  async signInWithGoogle() {
    try {
      console.log('Starting web-based Google Sign-In...');
      
      // Google OAuth configuration
      const redirectUri = makeRedirectUri({
        scheme: 'auricrx-medcoach',
        path: 'auth',
      });
      
      const authUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=1043512593259-YOUR_WEB_CLIENT_ID.apps.googleusercontent.com&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=openid%20email%20profile&` +
        `access_type=offline`;
      
      console.log('Opening Google OAuth URL:', authUrl);
      
      // Open the OAuth URL in a web browser
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
      if (result.type === 'success' && result.url) {
        // Parse the authorization code from the URL
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        
        if (code) {
          // Exchange the authorization code for tokens
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: '1043512593259-YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
              client_secret: 'YOUR_CLIENT_SECRET',
              code: code,
              grant_type: 'authorization_code',
              redirect_uri: redirectUri,
            }),
          });
          
          const tokens = await tokenResponse.json();
          
          if (tokens.access_token) {
            // Get user info from Google
            const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`);
            const userInfo = await userInfoResponse.json();
            
            // Create a custom token for Firebase
            const customTokenResponse = await fetch('https://auricrx-medcoach.onrender.com/api/auth/google', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                idToken: tokens.id_token,
                accessToken: tokens.access_token,
                userInfo: userInfo,
              }),
            });
            
            const customTokenData = await customTokenResponse.json();
            
            if (customTokenData.customToken) {
              // Sign in to Firebase with the custom token
              const userCredential = await signInWithCustomToken(this.auth, customTokenData.customToken);
              const user = userCredential.user;
              
              console.log('Google Sign-In successful:', user.uid);
              
              // Store authentication state
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
            }
          }
        }
      }
      
      return {
        success: false,
        error: 'Google Sign-In was cancelled or failed',
      };
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      return {
        success: false,
        error: 'Google Sign-In failed. Please try again.',
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
        const result = await this.signUpWithEmail(email, password, userData.firstName || 'User', userData.lastName || 'Name');
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
          
          return {
            ...result,
            needsEmailVerification: true,
            message: 'Account created successfully! Please check your email to verify your account before signing in.'
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
      
      const response = await fetch('https://auricrx-medcoach.onrender.com/api/users', {
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
      const response = await fetch(`https://auricrx-medcoach.onrender.com/api/users/${uid}`);
      
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
      const authState = {
        ...userData,
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
      await AsyncStorage.removeItem('AURIC_AUTH_STATE');
      console.log('✅ Auth state cleared');
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
