// src/components/StripeCheckoutModal.js
// Stripe checkout modal matching app theme

import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useWallpaper } from '../contexts/WallpaperContext';
import DynamicText from './DynamicText';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://auricrx-medcoach.onrender.com';

async function getAuthToken() {
  try {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
  } catch (error) {
    console.warn('⚠️ Could not get auth token:', error);
  }
  
  const authState = await AsyncStorage.getItem('AURIC_AUTH_STATE');
  if (authState) {
    const parsed = JSON.parse(authState);
    return parsed.idToken;
  }
  return null;
}

export default function StripeCheckoutModal({ visible, onClose, theme, onSuccess }) {
  const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
  const [loading, setLoading] = useState(true);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible && !checkoutUrl) {
      createCheckoutSession();
    }
  }, [visible]);

  const createCheckoutSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/stripe/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.ok && data.url) {
        setCheckoutUrl(data.url);
      } else {
        throw new Error(data.message || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('❌ Checkout creation failed:', err);
      setError(err.message);
      Alert.alert('Error', `Failed to start checkout: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationStateChange = (navState) => {
    const { url } = navState;
    
    console.log('🔍 Stripe checkout navigation:', url);
    
    // Check if user completed checkout (success page)
    if (url.includes('/success') || (url.includes('checkout.stripe.com') && url.includes('success'))) {
      console.log('✅ Checkout successful, closing modal');
      // Close modal and refresh subscription status
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    }
    
    // Check if user cancelled
    if (url.includes('/cancel')) {
      console.log('❌ Checkout cancelled');
      onClose();
    }
  };

  const handleOpenInBrowser = () => {
    if (checkoutUrl) {
      Linking.openURL(checkoutUrl);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContainer,
          {
            backgroundColor: getCardBackgroundColor(),
            borderColor: getCardBorderColor(),
          }
        ]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: getCardBorderColor() }]}>
            <DynamicText type="primary" style={styles.title}>
              Upgrade to Pro
            </DynamicText>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <DynamicText type="primary" style={styles.closeText}>✕</DynamicText>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme?.accent || '#d4af37'} />
              <DynamicText type="secondary" style={styles.loadingText}>
                Loading checkout...
              </DynamicText>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <DynamicText type="primary" style={styles.errorText}>
                {error}
              </DynamicText>
              <TouchableOpacity
                onPress={createCheckoutSession}
                style={[styles.retryButton, { backgroundColor: theme?.accent || '#d4af37' }]}
              >
                <DynamicText type="primary" style={styles.retryText}>Retry</DynamicText>
              </TouchableOpacity>
              {checkoutUrl && (
                <TouchableOpacity
                  onPress={handleOpenInBrowser}
                  style={[styles.browserButton, { borderColor: getCardBorderColor() }]}
                >
                  <DynamicText type="primary" style={styles.browserText}>
                    Open in Browser
                  </DynamicText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {checkoutUrl && !error && (
            <WebView
              source={{ uri: checkoutUrl }}
              style={styles.webview}
              onNavigationStateChange={handleNavigationStateChange}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error: ', nativeEvent);
                setError('Failed to load checkout page');
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView HTTP error: ', nativeEvent);
                if (nativeEvent.statusCode >= 400) {
                  setError('Checkout page error');
                }
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 24,
    fontFamily: 'Inter_400Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  browserButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 2,
  },
  browserText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  webview: {
    flex: 1,
  },
});

