import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
import DocumentCloudBackupService from '../services/documentCloudBackupService';
import PremiumEntitlementService from '../services/premiumEntitlementService';
import { auth } from '../config/firebase';
import * as LocalAuthentication from 'expo-local-authentication';
import { MaterialIcons } from '@expo/vector-icons';

export default function DocumentCloudBackupScreen({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getAccentColor, getCardTextColor } = useWallpaper();
  
  const [cloudBackupEnabled, setCloudBackupEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasPremium, setHasPremium] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [showEnableFlow, setShowEnableFlow] = useState(false);
  
  const cloudService = DocumentCloudBackupService.getInstance();
  const premiumService = PremiumEntitlementService.getInstance();

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const enabled = await cloudService.isCloudBackupEnabled();
    const premium = await premiumService.isPremiumUser();
    setCloudBackupEnabled(enabled);
    setHasPremium(premium);
    setLoading(false);
  };

  const handleEnableBackup = async () => {
    if (!consentChecked) {
      Alert.alert(t('common.error'), t('cloudBackup.consentCheckbox'));
      return;
    }

    try {
      // F2: Require re-authentication before enabling
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      let authMethod = 'checkbox_reauth';
      
      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: t('cloudBackup.reauthRequired'),
          fallbackLabel: t('common.cancel'),
        });
        
        if (!result.success) {
          Alert.alert(t('common.error'), t('cloudBackup.reauthFailed'));
          return;
        }
        authMethod = 'biometric';
      } else {
        // Fallback: require user to confirm with alert
        const confirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            t('cloudBackup.reauthRequired'),
            t('cloudBackup.optInTitle'),
            [
              { text: t('common.cancel'), onPress: () => resolve(false), style: 'cancel' },
              { text: t('common.confirm'), onPress: () => resolve(true) },
            ]
          );
        });
        
        if (!confirmed) return;
      }

      // F2: Enable with logged consent
      const userId = auth.currentUser?.uid || 'unknown';
      await cloudService.enableCloudBackup(userId, '1.0', authMethod);
      
      setCloudBackupEnabled(true);
      setShowEnableFlow(false);
      setConsentChecked(false);
      
      Alert.alert(t('cloudBackup.consentGranted'), t('cloudBackup.consentMessage'));
    } catch (error) {
      console.error('Error enabling cloud backup:', error);
      Alert.alert(t('common.error'), t('cloudBackup.reauthFailed'));
    }
  };

  const handleDisableBackup = async () => {
    Alert.alert(
      t('cloudBackup.disableTitle'),
      t('cloudBackup.disableMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('cloudBackup.turnOff'),
          style: 'destructive',
          onPress: async () => {
            await cloudService.disableCloudBackup();
            setCloudBackupEnabled(false);
          },
        },
      ]
    );
  };

  const handleDeleteCloudDocuments = async () => {
    Alert.alert(
      t('cloudBackup.deleteCloudTitle'),
      t('cloudBackup.deleteCloudMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const success = await cloudService.deleteAllCloudDocuments();
            if (success) {
              Alert.alert(t('common.success'), t('cloudBackup.deleteCloudSuccess'));
            } else {
              Alert.alert(t('common.info'), t('cloudBackup.deleteCloudNotImplemented'));
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: getCardBackgroundColor(), borderBottomColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.title}>{t('cloudBackup.title')}</DynamicText>
          <TouchableOpacity onPress={onClose}>
            <DynamicText type="card" style={styles.closeButton}>{t('common.close')}</DynamicText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: getCardBackgroundColor(), borderBottomColor: getCardBorderColor() }]}>
        <DynamicText type="card" style={styles.title}>{t('cloudBackup.title')}</DynamicText>
        <TouchableOpacity onPress={onClose}>
          <DynamicText type="card" style={styles.closeButton}>{t('common.close')}</DynamicText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {!hasPremium && (
          <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={[styles.premiumBadge, { color: getAccentColor() }]}>
              ✨ {t('cloudBackup.premiumFeature')}
            </DynamicText>
            <DynamicText type="card" style={[styles.premiumText, { color: getCardTextColor() }]}>
              {t('cloudBackup.premiumRequired')}
            </DynamicText>
          </View>
        )}

        {!cloudBackupEnabled && !showEnableFlow && (
          <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={styles.sectionTitle}>{t('cloudBackup.optInTitle')}</DynamicText>
            <DynamicText type="card" style={styles.description}>{t('cloudBackup.optInDescription')}</DynamicText>
            
            <TouchableOpacity
              style={[styles.enableButton, { backgroundColor: getAccentColor() }]}
              onPress={() => hasPremium && setShowEnableFlow(true)}
              disabled={!hasPremium}
            >
              <DynamicText type="button" style={styles.buttonText}>{t('cloudBackup.enableButton')}</DynamicText>
            </TouchableOpacity>
          </View>
        )}

        {!cloudBackupEnabled && showEnableFlow && (
          <>
            <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
              <DynamicText type="card" style={styles.subsectionTitle}>{t('cloudBackup.whatStored')}</DynamicText>
              <DynamicText type="card" style={styles.description}>{t('cloudBackup.whatStoredText')}</DynamicText>
              
              <DynamicText type="card" style={styles.subsectionTitle}>{t('cloudBackup.howProtect')}</DynamicText>
              <DynamicText type="card" style={styles.description}>{t('cloudBackup.howProtectText')}</DynamicText>
              
              <DynamicText type="card" style={styles.subsectionTitle}>{t('cloudBackup.yourChoice')}</DynamicText>
              <DynamicText type="card" style={styles.description}>{t('cloudBackup.yourChoiceText')}</DynamicText>
              
              <DynamicText type="card" style={styles.subsectionTitle}>{t('cloudBackup.yourRights')}</DynamicText>
              <DynamicText type="card" style={styles.description}>{t('cloudBackup.yourRightsText')}</DynamicText>
            </View>

            <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setConsentChecked(!consentChecked)}
              >
                <MaterialIcons
                  name={consentChecked ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={consentChecked ? getAccentColor() : getCardTextColor()}
                />
                <DynamicText type="card" style={styles.checkboxLabel}>{t('cloudBackup.consentCheckbox')}</DynamicText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.enableButton, { backgroundColor: consentChecked ? getAccentColor() : '#666', marginTop: 16 }]}
                onPress={handleEnableBackup}
                disabled={!consentChecked}
              >
                <DynamicText type="button" style={styles.buttonText}>{t('cloudBackup.enableButton')}</DynamicText>
              </TouchableOpacity>
              
              <DynamicText type="card" style={styles.helperText}>{t('cloudBackup.enableButtonHelper')}</DynamicText>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowEnableFlow(false);
                  setConsentChecked(false);
                }}
              >
                <DynamicText type="card" style={styles.cancelButtonText}>{t('cloudBackup.notNow')}</DynamicText>
              </TouchableOpacity>
            </View>

            <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
              <DynamicText type="card" style={styles.riskNote}>{t('cloudBackup.lawfulRiskNote')}</DynamicText>
            </View>
          </>
        )}

        {cloudBackupEnabled && (
          <>
            <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
              <DynamicText type="card" style={styles.statusText}>
                ☁️ {t('cloudBackup.consentGranted')}
              </DynamicText>
              <DynamicText type="card" style={styles.description}>{t('cloudBackup.consentMessage')}</DynamicText>
              
              <TouchableOpacity
                style={[styles.disableButton, { backgroundColor: '#C85A5A', marginTop: 16 }]}
                onPress={handleDisableBackup}
              >
                <DynamicText type="button" style={styles.buttonText}>{t('cloudBackup.turnOff')}</DynamicText>
              </TouchableOpacity>
            </View>

            <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
              <DynamicText type="card" style={styles.sectionTitle}>{t('cloudBackup.deleteCloudButton')}</DynamicText>
              <DynamicText type="card" style={styles.description}>{t('cloudBackup.deleteCloudDescription')}</DynamicText>
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: '#C85A5A', marginTop: 12 }]}
                onPress={handleDeleteCloudDocuments}
              >
                <DynamicText type="button" style={styles.buttonText}>{t('cloudBackup.deleteCloudButton')}</DynamicText>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.disclaimer}>{t('cloudBackup.disclaimer')}</DynamicText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  closeButton: { fontSize: 16, color: '#DBB65C' },
  content: { flex: 1, padding: 16 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  premiumBadge: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  premiumText: { fontSize: 14, opacity: 0.85, lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  subsectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  description: { fontSize: 14, opacity: 0.85, lineHeight: 20, marginBottom: 12 },
  statusText: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 12 },
  checkboxLabel: { flex: 1, fontSize: 14, lineHeight: 20, marginLeft: 12 },
  enableButton: { borderRadius: 8, padding: 14, alignItems: 'center' },
  disableButton: { borderRadius: 8, padding: 14, alignItems: 'center' },
  deleteButton: { borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  helperText: { fontSize: 12, opacity: 0.7, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
  cancelButton: { alignItems: 'center', marginTop: 16 },
  cancelButtonText: { fontSize: 14, opacity: 0.8 },
  riskNote: { fontSize: 13, opacity: 0.8, lineHeight: 19, fontStyle: 'italic' },
  disclaimer: { fontSize: 12, opacity: 0.7, lineHeight: 18, fontStyle: 'italic' },
});
