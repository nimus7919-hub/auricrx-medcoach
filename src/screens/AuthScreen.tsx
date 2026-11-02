// src/screens/AuthScreen.tsx
// Authentication screen with Firebase Auth integration

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useWallpaper } from '../contexts/WallpaperContext';
import { vip } from '../theme/vip';
import DynamicText from '../components/DynamicText';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
  onClose: () => void;
}

export default function AuthScreen({ onAuthSuccess, onClose }: AuthScreenProps) {
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'phone' | 'email'>('login');
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: vip.colors.navy,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 30,
    },
    closeButton: {
      padding: 10,
    },
    closeButtonText: {
      fontSize: 18,
      color: vip.colors.white,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: vip.colors.white,
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: vip.colors.muted,
      textAlign: 'center',
      marginBottom: 30,
    },
    formContainer: {
      backgroundColor: vip.colors.glass,
      borderRadius: vip.radius.card,
      padding: 20,
      borderWidth: 1,
      borderColor: vip.colors.line,
    },
    input: {
      backgroundColor: vip.colors.glass,
      borderWidth: 1,
      borderColor: vip.colors.line,
      borderRadius: vip.radius.button,
      padding: 15,
      fontSize: 16,
      color: vip.colors.white,
      marginBottom: 15,
    },
    button: {
      backgroundColor: vip.colors.gold,
      padding: 15,
      borderRadius: vip.radius.button,
      alignItems: 'center',
      marginBottom: 15,
    },
    buttonText: {
      color: vip.colors.onGold,
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: vip.colors.line,
    },
    secondaryButtonText: {
      color: vip.colors.white,
    },
    modeSelector: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    modeButton: {
      flex: 1,
      padding: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    modeButtonActive: {
      borderBottomColor: vip.colors.gold,
    },
    modeButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: vip.colors.muted,
    },
    modeButtonTextActive: {
      color: vip.colors.gold,
      fontWeight: '600',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },
    loadingText: {
      marginLeft: 10,
      color: vip.colors.white,
    },
  });

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (authMode === 'register' && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement Firebase Auth
      // For now, simulate success
      setTimeout(() => {
        setLoading(false);
        onAuthSuccess({
          uid: 'user_' + Date.now(),
          email: email,
          displayName: `${firstName} ${lastName}`.trim(),
        });
      }, 2000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Authentication failed');
    }
  };

  const handlePhoneAuth = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement Firebase Phone Auth
      // For now, simulate success
      setTimeout(() => {
        setLoading(false);
        onAuthSuccess({
          uid: 'user_' + Date.now(),
          phoneNumber: phoneNumber,
        });
      }, 2000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Phone authentication failed');
    }
  };

  const renderEmailForm = () => (
    <View style={dynamicStyles.formContainer}>
      {authMode === 'register' && (
        <>
          <TextInput
            style={dynamicStyles.input}
            placeholder="First Name"
            placeholderTextColor={vip.colors.white + '60'}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={dynamicStyles.input}
            placeholder="Last Name"
            placeholderTextColor={vip.colors.white + '60'}
            value={lastName}
            onChangeText={setLastName}
          />
        </>
      )}
      <TextInput
        style={dynamicStyles.input}
        placeholder="Email"
        placeholderTextColor={vip.colors.white + '60'}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={dynamicStyles.input}
        placeholder="Password"
        placeholderTextColor={vip.colors.white + '60'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {authMode === 'register' && (
        <TextInput
          style={dynamicStyles.input}
          placeholder="Confirm Password"
          placeholderTextColor={vip.colors.white + '60'}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      )}
      <TouchableOpacity
        style={dynamicStyles.button}
        onPress={handleEmailAuth}
        disabled={loading}
      >
        <Text style={dynamicStyles.buttonText}>
          {authMode === 'login' ? 'Sign In' : 'Create Account'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPhoneForm = () => (
    <View style={dynamicStyles.formContainer}>
      <TextInput
        style={dynamicStyles.input}
        placeholder="Phone Number (e.g., +1234567890)"
        placeholderTextColor={vip.colors.white + '60'}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />
      <TouchableOpacity
        style={dynamicStyles.button}
        onPress={handlePhoneAuth}
        disabled={loading}
      >
        <Text style={dynamicStyles.buttonText}>Send Verification Code</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={dynamicStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={dynamicStyles.scrollContent}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity style={dynamicStyles.closeButton} onPress={onClose}>
            <Text style={dynamicStyles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <DynamicText style={dynamicStyles.title}>
          {authMode === 'login' ? 'Welcome Back' : 
           authMode === 'register' ? 'Create Account' : 
           authMode === 'phone' ? 'Phone Verification' : 'Email Verification'}
        </DynamicText>

        <DynamicText style={dynamicStyles.subtitle}>
          {authMode === 'login' ? 'Sign in to your account' : 
           authMode === 'register' ? 'Create your AuricRX account' : 
           'Verify your phone number to continue'}
        </DynamicText>

        <View style={dynamicStyles.modeSelector}>
          <TouchableOpacity
            style={[dynamicStyles.modeButton, authMode === 'login' && dynamicStyles.modeButtonActive]}
            onPress={() => setAuthMode('login')}
          >
            <Text style={[dynamicStyles.modeButtonText, authMode === 'login' && dynamicStyles.modeButtonTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[dynamicStyles.modeButton, authMode === 'register' && dynamicStyles.modeButtonActive]}
            onPress={() => setAuthMode('register')}
          >
            <Text style={[dynamicStyles.modeButtonText, authMode === 'register' && dynamicStyles.modeButtonTextActive]}>
              Sign Up
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[dynamicStyles.modeButton, authMode === 'phone' && dynamicStyles.modeButtonActive]}
            onPress={() => setAuthMode('phone')}
          >
            <Text style={[dynamicStyles.modeButtonText, authMode === 'phone' && dynamicStyles.modeButtonTextActive]}>
              Phone
            </Text>
          </TouchableOpacity>
        </View>

        {authMode === 'phone' ? renderPhoneForm() : renderEmailForm()}

        {loading && (
          <View style={dynamicStyles.loadingContainer}>
            <ActivityIndicator color={vip.colors.gold} />
            <Text style={dynamicStyles.loadingText}>
              {authMode === 'phone' ? 'Sending verification code...' : 'Authenticating...'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[dynamicStyles.button, dynamicStyles.secondaryButton]}
          onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        >
          <Text style={[dynamicStyles.buttonText, dynamicStyles.secondaryButtonText]}>
            {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
