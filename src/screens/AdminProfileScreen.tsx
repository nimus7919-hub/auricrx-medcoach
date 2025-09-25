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
} from 'react-native';
import { useWallpaper } from '../contexts/WallpaperContext';
import DynamicText from '../components/DynamicText';
import authService from '../services/authService';

interface AdminProfileScreenProps {
  onClose: () => void;
  currentUser: any;
}

export default function AdminProfileScreen({ onClose, currentUser }: AdminProfileScreenProps) {
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
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
      backgroundColor: getCardBackgroundColor(),
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
      color: getCardTextColor(),
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: getCardTextColor(),
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: getCardTextColor() + '80',
      textAlign: 'center',
      marginBottom: 30,
    },
    formContainer: {
      backgroundColor: getCardBackgroundColor(),
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: getCardBorderColor(),
      marginBottom: 20,
    },
    input: {
      backgroundColor: getCardBackgroundColor(),
      borderWidth: 1,
      borderColor: getCardBorderColor(),
      borderRadius: 8,
      padding: 15,
      fontSize: 16,
      color: getCardTextColor(),
      marginBottom: 15,
    },
    button: {
      backgroundColor: '#3b82f6',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 15,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    secondaryButtonText: {
      color: getCardTextColor(),
    },
    adminBadge: {
      backgroundColor: '#10b981',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'flex-start',
      marginBottom: 20,
    },
    adminBadgeText: {
      color: '#ffffff',
      fontSize: 12,
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
      color: getCardTextColor(),
    },
  });

  const handleUpdateProfile = async () => {
    if (!profile.displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement profile update with Firebase
      // For now, simulate success
      setTimeout(() => {
        setLoading(false);
        Alert.alert('Success', 'Profile updated successfully!');
      }, 2000);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password reset email will be sent to your email address.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Reset Email', onPress: handlePasswordReset }
      ]
    );
  };

  const handlePasswordReset = async () => {
    if (!profile.email) {
      Alert.alert('Error', 'Email address is required for password reset');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.resetPassword(profile.email);
      if (result.success) {
        Alert.alert('Success', 'Password reset email sent!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: confirmDeleteAccount }
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Confirm Deletion',
      'Are you absolutely sure? This will delete your account and all associated data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Delete Forever', style: 'destructive', onPress: () => {
          // TODO: Implement account deletion
          Alert.alert('Account Deleted', 'Your account has been deleted.');
        }}
      ]
    );
  };

  return (
    <View style={dynamicStyles.container}>
      <ScrollView contentContainerStyle={dynamicStyles.scrollContent}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity style={dynamicStyles.closeButton} onPress={onClose}>
            <Text style={dynamicStyles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <DynamicText style={dynamicStyles.title}>Admin Profile</DynamicText>
        <DynamicText style={dynamicStyles.subtitle}>
          Manage your account settings and permissions
        </DynamicText>

        {/* Admin Badge */}
        <View style={dynamicStyles.adminBadge}>
          <Text style={dynamicStyles.adminBadgeText}>
            🔐 {profile.adminLevel.toUpperCase()} ACCESS
          </Text>
        </View>

        {/* Profile Form */}
        <View style={dynamicStyles.formContainer}>
          <TextInput
            style={dynamicStyles.input}
            placeholder="Display Name"
            placeholderTextColor={getCardTextColor() + '60'}
            value={profile.displayName}
            onChangeText={(text) => setProfile(prev => ({ ...prev, displayName: text }))}
          />
          
          <TextInput
            style={[dynamicStyles.input, { backgroundColor: getCardBackgroundColor() + '60' }]}
            placeholder="Email"
            placeholderTextColor={getCardTextColor() + '60'}
            value={profile.email}
            editable={false}
          />
          
          <TextInput
            style={[dynamicStyles.input, { backgroundColor: getCardBackgroundColor() + '60' }]}
            placeholder="Phone Number"
            placeholderTextColor={getCardTextColor() + '60'}
            value={profile.phoneNumber}
            editable={false}
          />

          <TouchableOpacity
            style={dynamicStyles.button}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            <Text style={dynamicStyles.buttonText}>Update Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Security Settings */}
        <View style={dynamicStyles.formContainer}>
          <DynamicText style={{ fontSize: 18, fontWeight: '600', color: getCardTextColor(), marginBottom: 15 }}>
            Security Settings
          </DynamicText>
          
          <TouchableOpacity
            style={[dynamicStyles.button, dynamicStyles.secondaryButton]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            <Text style={[dynamicStyles.buttonText, dynamicStyles.secondaryButtonText]}>
              🔒 Change Password
            </Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={[dynamicStyles.formContainer, { borderColor: '#ef4444' }]}>
          <DynamicText style={{ fontSize: 18, fontWeight: '600', color: '#ef4444', marginBottom: 15 }}>
            Danger Zone
          </DynamicText>
          
          <TouchableOpacity
            style={[dynamicStyles.button, { backgroundColor: '#ef4444' }]}
            onPress={handleDeleteAccount}
            disabled={loading}
          >
            <Text style={dynamicStyles.buttonText}>
              🗑️ Delete Account
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={dynamicStyles.loadingContainer}>
            <ActivityIndicator color="#3b82f6" />
            <Text style={dynamicStyles.loadingText}>Processing...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
