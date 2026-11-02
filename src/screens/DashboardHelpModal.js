import { useMemo } from "react";
import { View, TouchableOpacity, ScrollView, Modal, Image } from "react-native";
import { useWallpaper } from "./../contexts/WallpaperContext";
import DynamicText from "./../components/DynamicText";
import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createDashboardHelpModal(getScope) {
  return () => {
    const { showHelpModal, setShowHelpModal, lang, t, isReady, S } = getScope();

    const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
    
    // Create helpCards array inside render to ensure translations are available
    const helpCards = useMemo(() => [
      {
        title: S.healthJournal || t('dashboard.healthJournal') || 'Health Journal',
        icon: <Image source={require('../../assets/dashboard Emojies/Reminders.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />,
        description: t('help.cards.healthJournal') || 'Shows your next medication reminder. Tap to see all your upcoming reminders and manage your medication schedule.',
        iconSize: 32
      },
      {
        title: S.labsLocations || t('tiles.labsLocations') || 'Lab Locations',
        icon: <Image source={require('../../assets/dashboard Emojies/Lab Locations.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />,
        description: t('help.cards.labsLocations') || 'Find nearby medical labs and testing centers. Shows distance from your location and provides directions to help you get there.',
        iconSize: 32
      },
      {
        title: S.pharmacyLocations || t('tiles.pharmacyLocations') || 'Pharmacy Locations',
        icon: <Image source={require('../../assets/dashboard Emojies/Pharmacy locations.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />,
        description: t('help.cards.pharmacyLocations') || 'Find pharmacies near you with real-time distance calculations. Shows how far each pharmacy is and provides directions to help you get there.',
        iconSize: 32
      },
      {
        title: S.reminders || t('tiles.reminders') || 'Reminders',
        icon: <Image source={require('../../assets/dashboard Emojies/Reminders.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />,
        description: t('help.cards.reminders') || 'Set and manage medication reminders. Get notified when it\'s time to take your medications, refill prescriptions, or attend appointments.',
        iconSize: 32
      },
      {
        title: S.medications || t('tiles.medications') || 'Medications',
        icon: <Image source={require('../../assets/dashboard Emojies/Medications.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />,
        description: t('help.cards.medications') || 'Track all your medications, dosages, and schedules. Get refill reminders, check drug interactions, and manage your prescription history.',
        iconSize: 32
      },
      {
        title: S.herbs || t('tiles.herbs') || 'Herbs',
        icon: <Image source={require('../../assets/dashboard Emojies/Herbs.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />,
        description: t('help.cards.herbs') || 'Explore herbal remedies and natural supplements. Learn about benefits, dosages, and potential interactions with your medications.',
        iconSize: 32
      },
      {
        title: S.supplements || t('tiles.supplements') || 'Supplements',
        icon: <Image source={require('../../assets/dashboard Emojies/supplements.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />,
        description: t('help.cards.supplements') || 'Manage your vitamins and supplements. Track daily intake, set reminders, and ensure you\'re getting the right nutrients.',
        iconSize: 32
      },
      {
        title: S.smartAlerts || t('tiles.smartAlerts') || 'Smart Alerts',
        icon: <Image source={require('../../assets/dashboard Emojies/Smart Alerts.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />,
        description: t('help.cards.smartAlerts') || 'Intelligent notifications that adapt to your routine. Get location-based reminders, weather alerts, and personalized health tips.',
        iconSize: 40
      },
      {
        title: S.healthAnalytics || t('tiles.healthAnalytics') || 'Health Analytics',
        icon: <Image source={require('../../assets/dashboard Emojies/Health Analytics.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />,
        description: t('help.cards.healthAnalytics') || 'Track your health metrics over time. Monitor medication adherence, side effects, and health trends with detailed charts and insights.',
        iconSize: 40
      },
      {
        title: S.appointmentLog || t('tiles.appointmentLog') || 'Appointment Tracker',
        icon: <Image source={require('../../assets/dashboard Emojies/Appointment Tracker.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />,
        description: t('help.cards.appointmentLog') || 'Schedule and manage doctor appointments. Store doctor contacts, track visit history, and never miss an important healthcare appointment.',
        iconSize: 32
      },
      {
        title: S.aiHealth || t('tiles.aiHealth') || 'AI Health',
        icon: <Image source={require('../../assets/dashboard Emojies/AI Health.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />,
        description: t('help.cards.aiHealth') || 'Explore general symptom, health and medication information with AI assistants. They are not doctors and do not provide medical advice.',
        iconSize: 48
      },
      {
        title: S.documents || t('tiles.documents') || 'Medical Documents',
        icon: <Image source={require('../../assets/dashboard Emojies/Documents.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />,
        description: t('help.cards.documents') || 'Store and organize your medical documents. Keep insurance cards, lab results, prescriptions, and ID cards in one secure place for easy access during doctor visits.',
        iconSize: 48
      }
    ], [S, t, lang, isReady]);

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
                {t('help.intro') || 'Welcome to your health dashboard! Each card helps you manage different aspects of your health. Here\'s what each one does:'}
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
                  {t('help.tip') || '💡 Tip: Tap any card to explore its features. The floating AI button opens a general health-information assistant. It is not a doctor.'}
                </DynamicText>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };
}
