import Modal from './BackModal';
import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import PremiumButton from './PremiumButton';
// src/components/StripeCheckoutModal.js
// Stripe checkout modal matching app theme

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useWallpaper } from '../contexts/WallpaperContext';
import DynamicText from './DynamicText';
import { auth } from '../config/firebase';
import { useTranslation } from 'react-i18next';
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

export default function StripeCheckoutModal({ visible, onClose, theme, onSuccess, country = 'US' }) {
  useUILanguage();
  const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
  const { t, i18n } = useTranslation();
  const es = i18n.language.startsWith('es');
  const [billingInterval, setBillingInterval] = useState('month');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const openCheckoutInBrowser = useCallback(async () => {
    if (Platform.OS !== 'web') return;
    try {
      console.log('🔍 Opening checkout in browser for country:', country);
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      if (!token) {
        throw new Error(uiI18n.t("ui.notAuthenticated"));
      }

      console.log('🔍 Fetching checkout URL from:', `${API_BASE_URL}/api/stripe/create-checkout`);
      const response = await fetch(`${API_BASE_URL}/api/stripe/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ country, platform: Platform.OS, billingInterval }),
      });

      const data = await response.json();
      console.log('🔍 Checkout response:', data);
      
      if (data.ok && data.url) {
        console.log('✅ Opening checkout in browser...');
        // Open in Expo WebBrowser instead of WebView
        const result = await WebBrowser.openBrowserAsync(data.url);
        console.log('✅ Browser closed:', result);
        
        // Check if user completed the checkout
        if (result.type === 'dismiss') {
          console.log('ℹ️ User dismissed checkout');
        } else if (result.type === 'cancel') {
          console.log('❌ User cancelled checkout');
        }
        
        // Close modal
        onClose();
        
        // Refresh subscription status
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(data.message || uiI18n.t("ui.failedToCreateCheckoutSession"));
      }
    } catch (err) {
      console.error('❌ Checkout creation failed:', err);
      setError(err.message);
      Alert.alert(uiI18n.t("adminProfile.error"), uiI18n.t("ui.failedToStartCheckoutValue", { value1: err.message }));
    } finally {
      setLoading(false);
    }
  }, [country, billingInterval, onClose, onSuccess]);




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
              {uiI18n.t("localized.StripeCheckoutModal.text131")}
            </DynamicText>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <DynamicText type="primary" style={styles.closeText}>✕</DynamicText>
            </TouchableOpacity>
          </View>

          <View accessibilityRole="radiogroup" style={{ padding: 20 }}>
            {['month', 'year'].map(interval => (
              <TouchableOpacity
                key={interval}
                accessibilityRole="radio"
                accessibilityState={{ checked: billingInterval === interval }}
                onPress={() => setBillingInterval(interval)}
                disabled={loading}
                style={{ padding: 12, borderWidth: 2, borderRadius: 8, marginBottom: 8, borderColor: billingInterval === interval ? (theme?.accent || '#d4af37') : getCardBorderColor() }}
              >
                <DynamicText type="primary">{t(`subscriptionPlans.${interval}`)}</DynamicText>
              </TouchableOpacity>
            ))}
            <DynamicText type="secondary">{t('subscriptionPlans.disclosure')}</DynamicText>
          </View>
          {Platform.OS !== 'web' ? <DynamicText type="secondary" style={{ padding: 20 }}>{uiI18n.t("localized.StripeCheckoutModal.text156")}</DynamicText> : <TouchableOpacity onPress={openCheckoutInBrowser} disabled={loading}><DynamicText type="primary" style={{ padding: 20 }}>{uiI18n.t("localized.StripeCheckoutModal.text156")}</DynamicText></TouchableOpacity>}
          {/* Content */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme?.accent || '#d4af37'} />
              <DynamicText type="secondary" style={styles.loadingText}>{uiI18n.t("ui.loadingCheckout")}</DynamicText>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <DynamicText type="primary" style={styles.errorText}>
                {error}
              </DynamicText>
              <PremiumButton
                onPress={openCheckoutInBrowser}
                style={[styles.retryButton, { backgroundColor: theme?.accent || '#d4af37' }]}
              >
                <DynamicText type="primary" style={styles.retryText}>{uiI18n.t("common.sanpablo.retry")}</DynamicText>
              </PremiumButton>
            </View>
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
    color: '#17130B',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
});

