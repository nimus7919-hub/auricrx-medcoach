import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
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
  useUILanguage();
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
      Alert.alert(uiI18n.t("adminProfile.error"), uiI18n.t("ui.pleaseFillInAllFields"));
      return;
    }

    if (authMode === 'register' && password !== confirmPassword) {
      Alert.alert(uiI18n.t("adminProfile.error"), uiI18n.t("ui.passwordsDoNotMatch"));
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
      Alert.alert(uiI18n.t("adminProfile.error"), uiI18n.t("ui.authenticationFailed"));
    }
  };

  const handlePhoneAuth = async () => {
    if (!phoneNumber) {
      Alert.alert(uiI18n.t("adminProfile.error"), uiI18n.t("ui.pleaseEnterYourPhoneNumber"));
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
      Alert.alert(uiI18n.t("adminProfile.error"), uiI18n.t("ui.phoneAuthenticationFailed"));
    }
  };

  const renderEmailForm = () => (
    <View style={dynamicStyles.formContainer}>
      {authMode === 'register' && (
        <>
          <TextInput
            style={dynamicStyles.input}
            placeholder={uiI18n.t("ui.firstName")}
            placeholderTextColor={vip.colors.white + '60'}
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={dynamicStyles.input}
            placeholder={uiI18n.t("ui.lastName")}
            placeholderTextColor={vip.colors.white + '60'}
            value={lastName}
            onChangeText={setLastName}
          />
        </>
      )}
      <TextInput
        style={dynamicStyles.input}
        placeholder={uiI18n.t("adminProfile.email")}
        placeholderTextColor={vip.colors.white + '60'}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={dynamicStyles.input}
        placeholder={uiI18n.t("ui.password")}
        placeholderTextColor={vip.colors.white + '60'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {authMode === 'register' && (
        <TextInput
          style={dynamicStyles.input}
          placeholder={uiI18n.t("ui.confirmPassword")}
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
          {authMode === 'login' ? uiI18n.t("ui.signIn") : uiI18n.t("ui.createAccount")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPhoneForm = () => (
    <View style={dynamicStyles.formContainer}>
      <TextInput
        style={dynamicStyles.input}
        placeholder={uiI18n.t("ui.phoneNumberEG1234567890")}
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
        <Text style={dynamicStyles.buttonText}>{uiI18n.t("ui.sendVerificationCode")}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={dynamicStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={dynamicStyles.scrollContent}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity style={dynamicStyles.closeButton} onPress={onClose}>
            <Text style={dynamicStyles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <DynamicText style={dynamicStyles.title}>
          {authMode === 'login' ? uiI18n.t("ui.welcomeBack") : 
           authMode === 'register' ? uiI18n.t("ui.createAccount") : 
           authMode === uiI18n.t("ui.phone") ? uiI18n.t("ui.phoneVerification") : uiI18n.t("ui.emailVerification")}
        </DynamicText>

        <DynamicText style={dynamicStyles.subtitle}>
          {authMode === 'login' ? uiI18n.t("ui.signInToYourAccount") : 
           authMode === 'register' ? uiI18n.t("ui.createYourAuricrxAccount") : 
           uiI18n.t("ui.verifyYourPhoneNumberToContinue")}
        </DynamicText>

        <View style={dynamicStyles.modeSelector}>
          <TouchableOpacity
            style={[dynamicStyles.modeButton, authMode === 'login' && dynamicStyles.modeButtonActive]}
            onPress={() => setAuthMode('login')}
          >
            <Text style={[dynamicStyles.modeButtonText, authMode === 'login' && dynamicStyles.modeButtonTextActive]}>{uiI18n.t("ui.signIn")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[dynamicStyles.modeButton, authMode === 'register' && dynamicStyles.modeButtonActive]}
            onPress={() => setAuthMode('register')}
          >
            <Text style={[dynamicStyles.modeButtonText, authMode === 'register' && dynamicStyles.modeButtonTextActive]}>{uiI18n.t("ui.signUp")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[dynamicStyles.modeButton, authMode === 'phone' && dynamicStyles.modeButtonActive]}
            onPress={() => setAuthMode('phone')}
          >
            <Text style={[dynamicStyles.modeButtonText, authMode === 'phone' && dynamicStyles.modeButtonTextActive]}>{uiI18n.t("ui.phone_77064d")}</Text>
          </TouchableOpacity>
        </View>

        {authMode === uiI18n.t("ui.phone") ? renderPhoneForm() : renderEmailForm()}

        {loading && (
          <View style={dynamicStyles.loadingContainer}>
            <ActivityIndicator color={vip.colors.gold} />
            <Text style={dynamicStyles.loadingText}>
              {authMode === uiI18n.t("ui.phone") ? uiI18n.t("ui.sendingVerificationCode") : uiI18n.t("ui.authenticating")}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[dynamicStyles.button, dynamicStyles.secondaryButton]}
          onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        >
          <Text style={[dynamicStyles.buttonText, dynamicStyles.secondaryButtonText]}>
            {authMode === 'login' ? uiI18n.t("ui.donTHaveAnAccountSignUp_e7eacd") : uiI18n.t("ui.alreadyHaveAnAccountSignIn_6603c2")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
