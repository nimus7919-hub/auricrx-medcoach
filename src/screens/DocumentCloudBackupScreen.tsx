import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
import DocumentCloudBackupService from '../services/documentCloudBackupService';
import PremiumEntitlementService from '../services/premiumEntitlementService';

export default function DocumentCloudBackupScreen({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getAccentColor, getCardTextColor } = useWallpaper();
  
  const [cloudBackupEnabled, setCloudBackupEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasPremium, setHasPremium] = useState(false);
  
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

  const handleToggleBackup = async (value: boolean) => {
    if (value) {
      // Enabling cloud backup - show consent
      Alert.alert(
        t('cloudBackup.consentTitle'),
        t('cloudBackup.consentMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('cloudBackup.enableBackup'),
            onPress: async () => {
              await cloudService.enableCloudBackup();
              setCloudBackupEnabled(true);
              Alert.alert(t('cloudBackup.enabled'), t('cloudBackup.enabledMessage'));
            },
          },
        ]
      );
    } else {
      // Disabling cloud backup
      Alert.alert(
        t('cloudBackup.disableTitle'),
        t('cloudBackup.disableMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('cloudBackup.keepDisabled'),
            onPress: async () => {
              await cloudService.disableCloudBackup();
              setCloudBackupEnabled(false);
            },
          },
        ]
      );
    }
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

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.sectionTitle}>{t('cloudBackup.whatIsIt')}</DynamicText>
          <DynamicText type="card" style={styles.description}>{t('cloudBackup.description')}</DynamicText>
        </View>

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <DynamicText type="card" style={styles.toggleTitle}>{t('cloudBackup.enableTitle')}</DynamicText>
              <DynamicText type="card" style={styles.toggleDescription}>{t('cloudBackup.enableDescription')}</DynamicText>
            </View>
            <Switch
              value={cloudBackupEnabled}
              onValueChange={handleToggleBackup}
              disabled={!hasPremium}
              trackColor={{ false: '#767577', true: getAccentColor() }}
              thumbColor="#f4f3f4"
            />
          </View>
        </View>

        {cloudBackupEnabled && (
          <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={styles.sectionTitle}>{t('cloudBackup.status')}</DynamicText>
            <DynamicText type="card" style={styles.statusText}>
              ☁️ {t('cloudBackup.backupActive')}
            </DynamicText>
            <DynamicText type="card" style={styles.infoText}>{t('cloudBackup.syncInfo')}</DynamicText>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.sectionTitle}>{t('cloudBackup.howItWorks')}</DynamicText>
          <View style={styles.featuresList}>
            <DynamicText type="card" style={styles.featureItem}>• {t('cloudBackup.feature1')}</DynamicText>
            <DynamicText type="card" style={styles.featureItem}>• {t('cloudBackup.feature2')}</DynamicText>
            <DynamicText type="card" style={styles.featureItem}>• {t('cloudBackup.feature3')}</DynamicText>
            <DynamicText type="card" style={styles.featureItem}>• {t('cloudBackup.feature4')}</DynamicText>
          </View>
        </View>

        {cloudBackupEnabled && (
          <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={styles.sectionTitle}>{t('cloudBackup.deleteCloud')}</DynamicText>
            <DynamicText type="card" style={styles.deleteDescription}>{t('cloudBackup.deleteCloudDescription')}</DynamicText>
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: '#ff6b6b' }]}
              onPress={handleDeleteCloudDocuments}
            >
              <DynamicText type="button" style={styles.deleteButtonText}>{t('cloudBackup.deleteCloudButton')}</DynamicText>
            </TouchableOpacity>
          </View>
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
  description: { fontSize: 14, opacity: 0.85, lineHeight: 20 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleText: { flex: 1, marginRight: 16 },
  toggleTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  toggleDescription: { fontSize: 13, opacity: 0.8, lineHeight: 18 },
  statusText: { fontSize: 15, marginBottom: 8 },
  infoText: { fontSize: 13, opacity: 0.7, lineHeight: 18, fontStyle: 'italic' },
  featuresList: { gap: 8 },
  featureItem: { fontSize: 14, opacity: 0.85, lineHeight: 20 },
  deleteDescription: { fontSize: 14, opacity: 0.85, lineHeight: 20, marginBottom: 16 },
  deleteButton: { borderRadius: 8, padding: 14, alignItems: 'center' },
  deleteButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  disclaimer: { fontSize: 12, opacity: 0.7, lineHeight: 18, fontStyle: 'italic' },
});
