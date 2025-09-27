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
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../config/firebase';

class AuthService {
  constructor() {
    this.auth = auth;
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

  async signInWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        // Sign out the user since email is not verified
        await signOut(this.auth);
        return {
          success: false,
          error: 'Please verify your email address before signing in. Check your inbox for a verification email.',
          needsEmailVerification: true,
        };
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
      // For now, simulate Google Sign-In success
      // In a production app, you would implement web-based Google OAuth
      // or use a development build with native modules
      
      return {
        success: false,
        error: 'Google Sign-In requires a development build. Please use email/password for now.',
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
      const { email, password, isSignUp, ...userData } = authData;
      
      console.log('handleAuth called with:', { email, isSignUp, userData });
      
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
        return await this.signInWithEmail(email, password);
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
}

// Export singleton instance
const authService = new AuthService();
export default authService;
