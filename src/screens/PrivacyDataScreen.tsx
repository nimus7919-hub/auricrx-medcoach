import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import DynamicText from '../components/DynamicText';
import ModalScreenHeader from '../components/ModalScreenHeader';
import { FAB_SCROLL_PADDING } from '../layout/fabLayout';
import { useWallpaper } from '../contexts/WallpaperContext';
import PrivacyExportService from '../services/privacyExportService';

export default function PrivacyDataScreen({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getAccentColor } = useWallpaper();
  
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const privacyService = PrivacyExportService.getInstance();

  const handleExportData = async (format: 'json' | 'pdf') => {
    Alert.alert(
      t('privacy.exportData'),
      t('privacy.exportDataMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('privacy.export'),
          onPress: async () => {
            setExporting(true);
            try {
              const result = await privacyService.exportData({
                format,
                includeReminders: true,
                includeMedications: true,
                includeDocuments: true,
                includeHabits: true,
                includeFamilyCircle: true,
                includeLabValues: true,
              });
              
              if (result) {
                Alert.alert(t('privacy.success'), t('privacy.exportSuccess'));
              } else {
                Alert.alert(t('common.error'), t('privacy.exportFailed'));
              }
            } catch (error) {
              Alert.alert(t('common.error'), t('privacy.exportFailed'));
            } finally {
              setExporting(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteData = async () => {
    Alert.alert(
      t('privacy.deleteAllData'),
      t('privacy.deleteAllDataWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('privacy.deleteConfirm'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('privacy.areYouSure'),
              t('privacy.deleteAllDataFinal'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('privacy.deleteConfirm'),
                  style: 'destructive',
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      const success = await privacyService.deleteAllData();
                      if (success) {
                        Alert.alert(t('privacy.success'), t('privacy.deleteSuccess'));
                        onClose();
                      } else {
                        Alert.alert(t('common.error'), t('privacy.deleteFailed'));
                      }
                    } catch (error) {
                      Alert.alert(t('common.error'), t('privacy.deleteFailed'));
                    } finally {
                      setDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ModalScreenHeader
        title={t('privacy.title')}
        onClose={onClose}
        backgroundColor={getCardBackgroundColor()}
        borderBottomColor={getCardBorderColor()}
      />

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: FAB_SCROLL_PADDING }}>
        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.promiseTitle}>🔒 {t('privacy.promiseTitle')}</DynamicText>
          <DynamicText type="card" style={styles.promiseText}>{t('privacy.promiseText')}</DynamicText>
          
          <View style={styles.promiseList}>
            <DynamicText type="card" style={styles.promiseItem}>✓ {t('privacy.promise1')}</DynamicText>
            <DynamicText type="card" style={styles.promiseItem}>✓ {t('privacy.promise2')}</DynamicText>
            <DynamicText type="card" style={styles.promiseItem}>✓ {t('privacy.promise3')}</DynamicText>
            <DynamicText type="card" style={styles.promiseItem}>✓ {t('privacy.promise4')}</DynamicText>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.sectionTitle}>{t('privacy.exportYourData')}</DynamicText>
          <DynamicText type="card" style={styles.sectionDescription}>{t('privacy.exportDescription')}</DynamicText>
          
          {exporting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={getAccentColor()} />
              <DynamicText type="card" style={styles.loadingText}>{t('privacy.exporting')}</DynamicText>
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.halfButton, { backgroundColor: getAccentColor() }]}
                onPress={() => handleExportData('json')}
              >
                <DynamicText type="button" style={styles.buttonText}>{t('privacy.exportJSON')}</DynamicText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.halfButton, { backgroundColor: getCardBorderColor() }]}
                onPress={() => handleExportData('pdf')}
              >
                <DynamicText type="button" style={styles.buttonText}>{t('privacy.exportText')}</DynamicText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.sectionTitle}>{t('privacy.deleteAllData')}</DynamicText>
          <DynamicText type="card" style={styles.sectionDescription}>{t('privacy.deleteDescription')}</DynamicText>
          
          {deleting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ff6b6b" />
              <DynamicText type="card" style={styles.loadingText}>{t('privacy.deleting')}</DynamicText>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#ff6b6b' }]}
              onPress={handleDeleteData}
            >
              <DynamicText type="button" style={styles.buttonText}>{t('privacy.deleteButton')}</DynamicText>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={styles.disclaimer}>{t('privacy.disclaimer')}</DynamicText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  promiseTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  promiseText: { fontSize: 14, opacity: 0.9, marginBottom: 16, lineHeight: 20 },
  promiseList: { gap: 8 },
  promiseItem: { fontSize: 14, opacity: 0.9, lineHeight: 22 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  sectionDescription: { fontSize: 14, opacity: 0.8, marginBottom: 16, lineHeight: 20 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  halfButton: { flex: 1, borderRadius: 8, padding: 14, alignItems: 'center' },
  button: { borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
  loadingContainer: { alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 14, opacity: 0.8 },
  disclaimer: { fontSize: 12, opacity: 0.7, fontStyle: 'italic', lineHeight: 18 },
});
