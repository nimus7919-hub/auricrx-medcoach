import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import DynamicText from '../components/DynamicText';
import ModalScreenHeader from '../components/ModalScreenHeader';
import { FAB_SCROLL_PADDING } from '../layout/fabLayout';
import { useWallpaper } from '../contexts/WallpaperContext';

export default function PrivacyNoticeScreen({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();

  const handleOpenFullPolicy = () => {
    // TODO: Replace with actual privacy policy URL
    const policyUrl = 'https://auricrx.com/privacy'; // Placeholder
    Linking.openURL(policyUrl).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <View style={styles.container}>
      <ModalScreenHeader
        title={t('privacyNotice.title')}
        onClose={onClose}
        backgroundColor={getCardBackgroundColor()}
        borderBottomColor={getCardBorderColor()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: FAB_SCROLL_PADDING }]}
      >
        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.sectionTitle, { color: getCardTextColor() }]}>
            {t('privacyNotice.controller')}
          </DynamicText>
          <DynamicText type="card" style={[styles.bodyText, { color: getCardTextColor() }]}>
            {t('privacyNotice.controllerPlaceholder')}
          </DynamicText>
        </View>

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.sectionTitle, { color: getCardTextColor() }]}>
            {t('privacyNotice.dataCollected')}
          </DynamicText>
          <DynamicText type="card" style={[styles.bodyText, { color: getCardTextColor() }]}>
            {t('privacyNotice.dataCollectedText')}
          </DynamicText>
        </View>

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.sectionTitle, { color: getCardTextColor() }]}>
            {t('privacyNotice.howWeUse')}
          </DynamicText>
          <DynamicText type="card" style={[styles.bodyText, { color: getCardTextColor() }]}>
            {t('privacyNotice.howWeUseText')}
          </DynamicText>
        </View>

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.sectionTitle, { color: getCardTextColor() }]}>
            {t('privacyNotice.sharing')}
          </DynamicText>
          <DynamicText type="card" style={[styles.bodyText, { color: getCardTextColor() }]}>
            {t('privacyNotice.sharingText')}
          </DynamicText>
        </View>

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.sectionTitle, { color: getCardTextColor() }]}>
            {t('privacyNotice.yourRights')}
          </DynamicText>
          <DynamicText type="card" style={[styles.bodyText, { color: getCardTextColor() }]}>
            {t('privacyNotice.yourRightsText')}
          </DynamicText>
        </View>

        <View style={[styles.card, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.sectionTitle, { color: getCardTextColor() }]}>
            {t('privacyNotice.contact')}
          </DynamicText>
          <DynamicText type="card" style={[styles.bodyText, { color: getCardTextColor() }]}>
            {t('privacyNotice.contactText')}
          </DynamicText>
        </View>

        <TouchableOpacity style={styles.linkButton} onPress={handleOpenFullPolicy}>
          <DynamicText type="card" style={[styles.linkButtonText, { color: getCardTextColor() }]}>
            {t('privacyNotice.viewFullPolicy')}
          </DynamicText>
        </TouchableOpacity>

        <DynamicText type="card" style={[styles.disclaimer, { color: getCardTextColor() }]}>
          {t('privacyNotice.lastUpdated')}
        </DynamicText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  bodyText: { fontSize: 14, opacity: 0.85, lineHeight: 21 },
  linkButton: { alignItems: 'center', paddingVertical: 16, marginBottom: 16 },
  linkButtonText: { fontSize: 16, textDecorationLine: 'underline', opacity: 0.85 },
  disclaimer: { fontSize: 12, opacity: 0.7, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 },
});
