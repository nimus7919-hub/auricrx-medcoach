// src/screens/AdminProfileScreen.tsx
// Admin profile management screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useWallpaper } from '../contexts/WallpaperContext';
import DynamicText from '../components/DynamicText';
import authService from '../services/authService';
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface AdminProfileScreenProps {
  onClose: () => void;
  currentUser: any;
  theme?: any;
  S?: any;
  onNavigateToSettings?: () => void;
}

export default function AdminProfileScreen({ onClose, currentUser, theme, S, onNavigateToSettings }: AdminProfileScreenProps) {
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
  const { alert, showAlert, handlePress } = useCustomAlert();
  
  // Use S object for translations, fallback to key if not available
  const t = (key: string) => S?.[key] || key;
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phoneNumber: currentUser?.phoneNumber || '',
    isAdmin: false,
    adminLevel: 'user', // user, moderator, admin, super_admin
  });

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
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
      paddingTop: 20,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    circleContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#2c2c2c',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#444444',
    },
    circleEmoji: {
      fontSize: 20,
      color: '#D4AF37',
      fontWeight: 'bold',
    },
    title: {
      fontSize: 24,
      fontFamily: 'Inter_800ExtraBold',
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      textAlign: 'center',
      marginBottom: 30,
      opacity: 0.8,
    },
    formContainer: {
      backgroundColor: getCardBackgroundColor() + 'CC',
      borderRadius: 18,
      padding: 20,
      borderWidth: 2,
      borderColor: getCardBorderColor(),
      marginBottom: 20,
    },
    input: {
      backgroundColor: getCardBackgroundColor() + '80',
      borderWidth: 1,
      borderColor: getCardBorderColor(),
      borderRadius: 12,
      padding: 15,
      fontSize: 16,
      fontFamily: 'Inter_500Medium',
      color: getCardTextColor(),
      marginBottom: 15,
    },
    button: {
      backgroundColor: theme?.accent || '#D4AF37',
      padding: 15,
      borderRadius: 18,
      alignItems: 'center',
      marginBottom: 15,
      shadowColor: theme?.accent || '#D4AF37',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    buttonText: {
      color: theme?.bg === '#ffffff' || theme?.bg === '#fefefe' ? '#000000' : '#ffffff',
      fontSize: 16,
      fontFamily: 'Inter_700Bold',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: getCardBorderColor(),
      borderRadius: 25,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      color: getCardTextColor(),
      fontFamily: 'Inter_700Bold',
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter_700Bold',
      color: getCardTextColor(),
      marginBottom: 15,
    },
    dangerSectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter_700Bold',
      color: '#ef4444',
      marginBottom: 15,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },
    loadingText: {
      marginLeft: 10,
      color: getCardTextColor(),
      fontFamily: 'Inter_600SemiBold',
    },
  });

  const handleUpdateProfile = async () => {
    if (!profile.displayName.trim()) {
      showAlert({
        title: t('error'),
        message: t('displayNameRequired'),
        buttonText: t('ok'),
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement profile update with Firebase
      // For now, simulate success
      setTimeout(() => {
        setLoading(false);
        showAlert({
          title: t('success'),
          message: t('profileUpdatedSuccessfully'),
          buttonText: t('ok'),
        });
      }, 2000);
    } catch (error) {
      setLoading(false);
      showAlert({
        title: t('error'),
        message: t('failedToUpdateProfile'),
        buttonText: t('ok'),
      });
    }
  };

  const handleChangePassword = () => {
    showAlert({
      title: t('changePasswordTitle'),
      message: t('passwordResetMessage'),
      buttonText: t('sendResetEmail'),
      onPress: handlePasswordReset,
    });
  };

  const handlePasswordReset = async () => {
    if (!profile.email) {
      showAlert({
        title: t('error'),
        message: t('emailRequiredForReset'),
        buttonText: t('ok'),
      });
      return;
    }

    setLoading(true);
    try {
      const result = await authService.resetPassword(profile.email);
      if (result.success) {
        showAlert({
          title: t('success'),
          message: t('passwordResetEmailSent'),
          buttonText: t('ok'),
        });
      } else {
        showAlert({
          title: t('error'),
          message: result.error,
          buttonText: t('ok'),
        });
      }
    } catch (error) {
      showAlert({
        title: t('error'),
        message: t('failedToSendResetEmail'),
        buttonText: t('ok'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    showAlert({
      title: t('deleteAccountTitle'),
      message: t('deleteAccountMessage'),
      buttonText: t('deleteAccount'),
      onPress: confirmDeleteAccount,
    });
  };

  const confirmDeleteAccount = () => {
    showAlert({
      title: t('confirmDeletion'),
      message: t('confirmDeletionMessage'),
      buttonText: t('yesDeleteForever'),
      onPress: () => {
        // TODO: Implement account deletion
        showAlert({
          title: t('accountDeleted'),
          message: t('accountDeletedMessage'),
          buttonText: t('ok'),
        });
      },
    });
  };

  return (
    <View style={dynamicStyles.container}>
      <ScrollView contentContainerStyle={dynamicStyles.scrollContent}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity style={dynamicStyles.closeButton} onPress={onNavigateToSettings || onClose}>
            <View style={dynamicStyles.circleContainer}>
              <Text style={dynamicStyles.circleEmoji}>✕</Text>
            </View>
          </TouchableOpacity>
        </View>

        <DynamicText type="primary" style={dynamicStyles.title}>{t('adminProfileTitle')}</DynamicText>


        {/* Profile Form */}
        <View style={dynamicStyles.formContainer}>
          <TextInput
            style={dynamicStyles.input}
            placeholder={t('displayName')}
            placeholderTextColor={getCardTextColor() + '60'}
            value={profile.displayName}
            onChangeText={(text) => setProfile(prev => ({ ...prev, displayName: text }))}
          />
          
          <TextInput
            style={[dynamicStyles.input, { backgroundColor: getCardBackgroundColor() + '60' }]}
            placeholder={t('email')}
            placeholderTextColor={getCardTextColor() + '60'}
            value={profile.email}
            editable={false}
          />
          
          <TextInput
            style={[dynamicStyles.input, { backgroundColor: getCardBackgroundColor() + '60' }]}
            placeholder={t('phoneNumber')}
            placeholderTextColor={getCardTextColor() + '60'}
            value={currentUser?.phoneNumber || t('noPhoneNumber')}
            editable={false}
          />

          <TouchableOpacity
            style={dynamicStyles.secondaryButton}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            <DynamicText type="card" style={dynamicStyles.secondaryButtonText}>{t('updateProfile')}</DynamicText>
          </TouchableOpacity>
        </View>

        {/* Security Settings */}
        <View style={dynamicStyles.formContainer}>
          <DynamicText type="card" style={dynamicStyles.sectionTitle}>
            {t('securitySettings')}
          </DynamicText>
          
          <TouchableOpacity
            style={dynamicStyles.secondaryButton}
            onPress={handleChangePassword}
            disabled={loading}
          >
            <DynamicText type="card" style={dynamicStyles.secondaryButtonText}>
              {t('changePassword')}
            </DynamicText>
          </TouchableOpacity>
        </View>

        {/* Delete Account */}
        <View style={[dynamicStyles.formContainer, { borderColor: '#ef4444', padding: 15 }]}>
          <TouchableOpacity
            style={[dynamicStyles.button, { backgroundColor: '#ef4444', marginBottom: 0 }]}
            onPress={handleDeleteAccount}
            disabled={loading}
          >
            <DynamicText type="card" style={dynamicStyles.buttonText}>
              {t('deleteAccount')}
            </DynamicText>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={dynamicStyles.loadingContainer}>
            <ActivityIndicator color={theme?.accent || '#D4AF37'} />
            <DynamicText type="card" style={dynamicStyles.loadingText}>{t('processing')}</DynamicText>
          </View>
        )}
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={!!alert}
        title={alert?.title || ''}
        message={alert?.message || ''}
        buttonText={alert?.buttonText || 'OK'}
        onPress={handlePress}
      />
    </View>
  );
}
