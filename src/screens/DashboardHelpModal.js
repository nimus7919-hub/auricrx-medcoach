import Modal from '../components/BackModal';
import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import { useMemo } from "react";
import { View, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useWallpaper } from "./../contexts/WallpaperContext";
import DynamicText from "./../components/DynamicText";
import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createDashboardHelpModal(getScope) {
  return () => {
  useUILanguage();
    const { showHelpModal, setShowHelpModal, lang, t, isReady, S } = getScope();

    const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
    
    // Create helpCards array inside render to ensure translations are available
    const helpCards = useMemo(() => [
      {
        title: S.healthJournal || t('dashboard.healthJournal'),
        icon: <Image source={require('../../assets/dashboard Emojies/Reminders.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />,
        description: t('help.cards.healthJournal') || uiI18n.t("help.cards.healthJournal"),
        iconSize: 32
      },
      {
        title: S.labsLocations || t('tiles.labsLocations'),
        icon: <Image source={require('../../assets/dashboard Emojies/Lab Locations.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />,
        description: t('help.cards.labsLocations') || uiI18n.t("help.cards.labsLocations"),
        iconSize: 32
      },
      {
        title: S.pharmacyLocations || t('tiles.pharmacyLocations') || uiI18n.t("tiles.pharmacyLocations"),
        icon: <Image source={require('../../assets/dashboard Emojies/Pharmacy locations.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />,
        description: t('help.cards.pharmacyLocations') || uiI18n.t("help.cards.pharmacyLocations"),
        iconSize: 32
      },
      {
        title: S.reminders || t('tiles.reminders') || uiI18n.t("tiles.reminders"),
        icon: <Image source={require('../../assets/dashboard Emojies/Reminders.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />,
        description: t('help.cards.reminders') || uiI18n.t("help.cards.reminders"),
        iconSize: 32
      },
      {
        title: S.medications || t('tiles.medications') || uiI18n.t("tiles.medications"),
        icon: <Image source={require('../../assets/dashboard Emojies/Medications.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />,
        description: t('help.cards.medications') || uiI18n.t("help.cards.medications"),
        iconSize: 32
      },
      {
        title: S.herbs || t('tiles.herbs') || uiI18n.t("tiles.herbs"),
        icon: <Image source={require('../../assets/dashboard Emojies/Herbs.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />,
        description: t('help.cards.herbs') || uiI18n.t("help.cards.herbs"),
        iconSize: 32
      },
      {
        title: S.supplements || t('tiles.supplements') || uiI18n.t("tiles.supplements"),
        icon: <Image source={require('../../assets/dashboard Emojies/supplements.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />,
        description: t('help.cards.supplements') || uiI18n.t("help.cards.supplements"),
        iconSize: 32
      },
      {
        title: S.smartAlerts || t('tiles.smartAlerts') || uiI18n.t("localized.appConstants.STRINGS.smartAlerts"),
        icon: <Image source={require('../../assets/dashboard Emojies/Smart Alerts.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />,
        description: t('help.cards.smartAlerts') || uiI18n.t("help.cards.smartAlerts"),
        iconSize: 40
      },
      {
        title: S.healthAnalytics || t('tiles.healthAnalytics') || uiI18n.t("tiles.healthAnalytics"),
        icon: <Image source={require('../../assets/dashboard Emojies/Health Analytics.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />,
        description: t('help.cards.healthAnalytics') || uiI18n.t("help.cards.healthAnalytics"),
        iconSize: 40
      },
      {
        title: S.appointmentLog || t('tiles.appointmentLog') || uiI18n.t("localized.appConstants.STRINGS.appointmentLog"),
        icon: <Image source={require('../../assets/dashboard Emojies/Appointment Tracker.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />,
        description: t('help.cards.appointmentLog') || uiI18n.t("help.cards.appointmentLog"),
        iconSize: 32
      },
      {
        title: S.aiHealth || t('tiles.aiHealth') || uiI18n.t("tiles.aiHealth"),
        icon: <Image source={require('../../assets/dashboard Emojies/AI Health.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />,
        description: t('help.cards.aiHealth') || uiI18n.t("help.cards.aiHealth"),
        iconSize: 48
      },
      {
        title: S.documents || t('tiles.documents') || uiI18n.t("medicalDocuments.title"),
        icon: <Image source={require('../../assets/dashboard Emojies/Documents.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />,
        description: t('help.cards.documents') || uiI18n.t("help.cards.documents"),
        iconSize: 48
      }
    ], [S, t, lang, isReady, uiI18n.resolvedLanguage]);

    return (
      <Modal
        visible={showHelpModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.helpModalContainer, { backgroundColor: getCardBackgroundColor() + 'F5', borderColor: getCardBorderColor() }]}>
            <View style={[styles.helpModalHeader, { borderBottomColor: getCardBorderColor() }]}>
              <DynamicText type="primary" style={[styles.helpModalTitle, { fontFamily: 'Inter_800ExtraBold' }]}>
                {t('help.title')}
              </DynamicText>
              <TouchableOpacity onPress={() => setShowHelpModal(false)} style={styles.helpModalClose}>
                <DynamicText type="card" style={{ fontSize: 24, fontWeight: 'bold' }}>✕</DynamicText>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.helpModalContent}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <DynamicText type="card" style={[styles.helpModalIntro, { fontFamily: 'Inter_400Regular', marginBottom: 20 }]}>
                {t('help.intro') || uiI18n.t("help.intro")}
              </DynamicText>
              
              {helpCards.map((card, index) => (
                <View 
                  key={index} 
                  style={[styles.helpCardItem, { backgroundColor: getCardBackgroundColor() + '80', borderColor: getCardBorderColor(), marginBottom: 16 }]}
                >
                  <View style={styles.helpCardHeader}>
                    <View style={[styles.helpCardIconContainer, { width: card.iconSize || 32, height: card.iconSize || 32 }]}>
                      {card.icon}
                    </View>
                    <DynamicText type="card" style={[styles.helpCardTitle, { fontFamily: 'Inter_700Bold' }]}>
                      {card.title}
                    </DynamicText>
                  </View>
                  <DynamicText type="card" style={[styles.helpCardDescription, { fontFamily: 'Inter_400Regular' }]}>
                    {card.description}
                  </DynamicText>
                </View>
              ))}
              
              <View style={[styles.helpCardItem, { backgroundColor: getCardBackgroundColor() + '80', borderColor: getCardBorderColor(), marginTop: 8 }]}>
                <DynamicText type="card" style={[styles.helpCardDescription, { fontFamily: 'Inter_400Regular', fontStyle: 'italic' }]}>
                  {t('help.tip') || uiI18n.t("help.tip")}
                </DynamicText>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };
}
