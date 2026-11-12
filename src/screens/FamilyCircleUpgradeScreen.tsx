import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import DynamicText from '../components/DynamicText';
import ModalScreenHeader from '../components/ModalScreenHeader';
import { FAB_SCROLL_PADDING } from '../layout/fabLayout';
import { useWallpaper } from '../contexts/WallpaperContext';
import { goldGradient } from '../theme/colors';
import { PremiumEntitlement } from '../services/premiumEntitlementService';

interface FamilyCircleUpgradeScreenProps {
  onClose: () => void;
  entitlement: PremiumEntitlement;
}

export default function FamilyCircleUpgradeScreen({ onClose, entitlement }: FamilyCircleUpgradeScreenProps) {
  const { t } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();

  const handleUpgrade = () => {
    // TODO: When implementing real payments, this should:
    // 1. Launch the in-app purchase flow
    // 2. Present subscription options (monthly/yearly)
    // 3. Process payment via Google Play Billing / App Store
    // 4. Validate receipt on backend
    // 5. Grant premium access via premiumEntitlementService.grantPremiumAccess()
    // For now, show a friendly message
    console.log('TODO: Launch in-app purchase flow for Family Circle premium feature');
  };

  return (
    <View style={styles.container}>
      <ModalScreenHeader
        title={t('familyCircleUpgrade.title')}
        onClose={onClose}
        backgroundColor={getCardBackgroundColor()}
        borderBottomColor={getCardBorderColor()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: FAB_SCROLL_PADDING }]}
      >
        <View style={styles.heroSection}>
          <DynamicText type="card" style={[styles.heroEmoji, { color: getCardTextColor() }]}>
            👨‍👩‍👧‍👦
          </DynamicText>
          <DynamicText type="card" style={[styles.heroTitle, { color: getCardTextColor() }]}>
            {t('familyCircleUpgrade.heroTitle')}
          </DynamicText>
          <DynamicText type="card" style={[styles.heroSubtitle, { color: getCardTextColor() }]}>
            {t('familyCircleUpgrade.heroSubtitle')}
          </DynamicText>
        </View>

        {entitlement.isInTrial && (
          <View style={[styles.trialCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={[styles.trialText, { color: getCardTextColor() }]}>
              ⏰ {t('familyCircleUpgrade.trialRemaining', { days: entitlement.trialDaysRemaining })}
            </DynamicText>
          </View>
        )}

        {!entitlement.isInTrial && entitlement.trialStartDate && (
          <View style={[styles.trialCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={[styles.trialText, { color: getCardTextColor() }]}>
              {t('familyCircleUpgrade.trialEnded')}
            </DynamicText>
          </View>
        )}

        <View style={[styles.featuresCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.featuresTitle, { color: getCardTextColor() }]}>
            {t('familyCircleUpgrade.featuresTitle')}
          </DynamicText>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <DynamicText type="card" style={[styles.featureEmoji, { color: getCardTextColor() }]}>
                👤
              </DynamicText>
              <DynamicText type="card" style={[styles.featureText, { color: getCardTextColor() }]}>
                {t('familyCircleUpgrade.feature1')}
              </DynamicText>
            </View>

            <View style={styles.featureItem}>
              <DynamicText type="card" style={[styles.featureEmoji, { color: getCardTextColor() }]}>
                📋
              </DynamicText>
              <DynamicText type="card" style={[styles.featureText, { color: getCardTextColor() }]}>
                {t('familyCircleUpgrade.feature2')}
              </DynamicText>
            </View>

            <View style={styles.featureItem}>
              <DynamicText type="card" style={[styles.featureEmoji, { color: getCardTextColor() }]}>
                🔔
              </DynamicText>
              <DynamicText type="card" style={[styles.featureText, { color: getCardTextColor() }]}>
                {t('familyCircleUpgrade.feature3')}
              </DynamicText>
            </View>

            <View style={styles.featureItem}>
              <DynamicText type="card" style={[styles.featureEmoji, { color: getCardTextColor() }]}>
                📤
              </DynamicText>
              <DynamicText type="card" style={[styles.featureText, { color: getCardTextColor() }]}>
                {t('familyCircleUpgrade.feature4')}
              </DynamicText>
            </View>
          </View>
        </View>

        <View style={[styles.dataCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.dataTitle, { color: getCardTextColor() }]}>
            💾 {t('familyCircleUpgrade.dataTitle')}
          </DynamicText>
          <DynamicText type="card" style={[styles.dataText, { color: getCardTextColor() }]}>
            {t('familyCircleUpgrade.dataText')}
          </DynamicText>
        </View>

        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={handleUpgrade}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={goldGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.upgradeButtonGradient}
          >
            <DynamicText type="button" style={styles.upgradeButtonText}>
              {t('familyCircleUpgrade.upgradeButton')}
            </DynamicText>
            <DynamicText type="button" style={styles.upgradeButtonSubtext}>
              {t('familyCircleUpgrade.upgradeSubtext')}
            </DynamicText>
          </LinearGradient>
        </TouchableOpacity>

        <DynamicText type="card" style={[styles.disclaimer, { color: getCardTextColor() }]}>
          {t('familyCircleUpgrade.disclaimer')}
        </DynamicText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  heroSection: { alignItems: 'center', marginBottom: 24, paddingVertical: 20 },
  heroEmoji: { fontSize: 72, marginBottom: 16 },
  heroTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  heroSubtitle: { fontSize: 16, opacity: 0.85, textAlign: 'center', lineHeight: 24 },
  trialCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 20, alignItems: 'center' },
  trialText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  featuresCard: { borderRadius: 12, borderWidth: 1, padding: 20, marginBottom: 20 },
  featuresTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  featuresList: { gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start' },
  featureEmoji: { fontSize: 24, marginRight: 12, marginTop: 2 },
  featureText: { flex: 1, fontSize: 15, lineHeight: 22 },
  dataCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 24 },
  dataTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  dataText: { fontSize: 14, opacity: 0.85, lineHeight: 20 },
  upgradeButton: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  upgradeButtonGradient: { paddingVertical: 20, paddingHorizontal: 24, alignItems: 'center' },
  upgradeButtonText: { fontSize: 18, fontWeight: 'bold', color: '#17130B', marginBottom: 4 },
  upgradeButtonSubtext: { fontSize: 13, color: '#17130B', opacity: 0.8 },
  disclaimer: { fontSize: 12, opacity: 0.7, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 },
});
