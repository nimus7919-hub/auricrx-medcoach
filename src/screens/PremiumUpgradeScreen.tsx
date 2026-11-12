import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import DynamicText from '../components/DynamicText';
import ModalScreenHeader from '../components/ModalScreenHeader';
import { FAB_SCROLL_PADDING } from '../layout/fabLayout';
import { useWallpaper } from '../contexts/WallpaperContext';
import { goldGradient, darkColors } from '../theme/colors';
import PremiumEntitlementService, { PremiumEntitlement } from '../services/premiumEntitlementService';

interface PremiumUpgradeScreenProps {
  onClose: () => void;
  entitlement: PremiumEntitlement;
  feature?: 'familyCircle' | 'pharmacy' | 'lab' | 'general';
}

export default function PremiumUpgradeScreen({ onClose, entitlement, feature = 'general' }: PremiumUpgradeScreenProps) {
  const { t } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();

  const handleStartTrial = async () => {
    try {
      const result = await PremiumEntitlementService.getInstance().startPremiumTrial();
      if (!result.success) {
        console.error('Failed to start premium trial:', result.error);
        Alert.alert(t('errors.title'), t('errors.generic'));
        return;
      }
      onClose();
    } catch (error) {
      console.error('Failed to start premium trial:', error);
      Alert.alert(t('common.error'), t('ui.anErrorOccurredPleaseTryAgain'));
    }
  };

  const getStore = () => {
    // TODO: Detect platform
    return 'Google Play'; // or 'App Store'
  };

  const getCancelPath = () => {
    return 'Google Play > Subscriptions'; // or 'App Store > Subscriptions'
  };

  const getTrialEndDate = () => {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);
    return trialEnd.toLocaleDateString();
  };

  const getFeatureKey = () => {
    switch (feature) {
      case 'familyCircle': return 'familyCircle';
      case 'pharmacy': return 'pharmacy';
      case 'lab': return 'lab';
      default: return 'general';
    }
  };

  const featureKey = getFeatureKey();

  return (
    <View style={styles.container}>
      <ModalScreenHeader
        title={t('premiumUpgrade.title')}
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
            ✨
          </DynamicText>
          <DynamicText type="card" style={[styles.heroTitle, { color: getCardTextColor() }]}>
            {t('subscription.proTitle')}
          </DynamicText>
          <DynamicText type="card" style={[styles.heroSubtitle, { color: getCardTextColor() }]}>
            {t('subscription.includes')}
          </DynamicText>
        </View>

        {entitlement.isInTrial && (
          <View style={[styles.trialCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={[styles.trialText, { color: getCardTextColor() }]}>
              ⏰ {t('premiumUpgrade.trialRemaining', { days: entitlement.trialDaysRemaining })}
            </DynamicText>
          </View>
        )}

        {!entitlement.isInTrial && entitlement.trialStartDate && (
          <View style={[styles.trialCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={[styles.trialText, { color: getCardTextColor() }]}>
              {t('premiumUpgrade.trialEnded')}
            </DynamicText>
          </View>
        )}

        <View style={[styles.pricingCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.pricingTitle, { color: getCardTextColor() }]}>
            {t('subscription.trialPrice', { price: 'MXN $79' })}
          </DynamicText>
          <DynamicText type="card" style={[styles.pricingText, { color: getCardTextColor() }]}>
            {t('subscription.autoCharge', { date: getTrialEndDate(), store: getStore() })}
          </DynamicText>
          <DynamicText type="card" style={[styles.pricingText, { color: getCardTextColor() }]}>
            {t('subscription.reminderNotice')}
          </DynamicText>
          <DynamicText type="card" style={[styles.pricingText, { color: getCardTextColor() }]}>
            {t('subscription.cancelAnytime', { cancelPath: getCancelPath() })}
          </DynamicText>
        </View>

        <View style={[styles.freeCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.freeTitle, { color: getCardTextColor() }]}>
            💚 {t('subscription.continueFree')}
          </DynamicText>
          <DynamicText type="card" style={[styles.freeText, { color: getCardTextColor() }]}>
            {t('subscription.freeForever')}
          </DynamicText>
        </View>

        <TouchableOpacity
          style={styles.startTrialButton}
          onPress={handleStartTrial}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={goldGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.startTrialButtonGradient}
          >
            <DynamicText type="button" style={styles.startTrialButtonText}>
              {t('subscription.startTrial')}
            </DynamicText>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueFreeButton}
          onPress={onClose}
        >
          <DynamicText type="card" style={[styles.continueFreeButtonText, { color: getCardTextColor() }]}>
            {t('subscription.continueFree')}
          </DynamicText>
        </TouchableOpacity>

        <View style={[styles.noteCard, { backgroundColor: getCardBackgroundColor(), borderColor: getCardBorderColor() }]}>
          <DynamicText type="card" style={[styles.noteText, { color: getCardTextColor() }]}>
            ℹ️ {t('subscription.storeBillingNote', { store: getStore() })}
          </DynamicText>
        </View>

        <View style={styles.linksRow}>
          <TouchableOpacity>
            <DynamicText type="card" style={[styles.linkText, { color: getCardTextColor() }]}>
              {t('subscription.terms')}
            </DynamicText>
          </TouchableOpacity>
          <DynamicText type="card" style={[styles.linkSeparator, { color: getCardTextColor() }]}>
            •
          </DynamicText>
          <TouchableOpacity>
            <DynamicText type="card" style={[styles.linkText, { color: getCardTextColor() }]}>
              {t('subscription.privacyNotice')}
            </DynamicText>
          </TouchableOpacity>
          <DynamicText type="card" style={[styles.linkSeparator, { color: getCardTextColor() }]}>
            •
          </DynamicText>
          <TouchableOpacity>
            <DynamicText type="card" style={[styles.linkText, { color: getCardTextColor() }]}>
              {t('subscription.restorePurchases')}
            </DynamicText>
          </TouchableOpacity>
        </View>
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
  heroTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  heroSubtitle: { fontSize: 15, opacity: 0.85, textAlign: 'center', lineHeight: 22 },
  trialCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 20, alignItems: 'center' },
  trialText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  pricingCard: { borderRadius: 12, borderWidth: 1, padding: 20, marginBottom: 20 },
  pricingTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  pricingText: { fontSize: 14, opacity: 0.85, lineHeight: 21, marginBottom: 12 },
  freeCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 24 },
  freeTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  freeText: { fontSize: 14, opacity: 0.85, lineHeight: 21 },
  startTrialButton: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  startTrialButtonGradient: { paddingVertical: 18, paddingHorizontal: 24, alignItems: 'center' },
  startTrialButtonText: { fontSize: 18, fontWeight: 'bold', color: darkColors.onAccent },
  continueFreeButton: { alignItems: 'center', paddingVertical: 12, marginBottom: 16 },
  continueFreeButtonText: { fontSize: 16, opacity: 0.8 },
  noteCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
  noteText: { fontSize: 13, opacity: 0.75, lineHeight: 19, textAlign: 'center' },
  linksRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  linkText: { fontSize: 13, opacity: 0.7 },
  linkSeparator: { fontSize: 13, opacity: 0.5, marginHorizontal: 4 },
});
