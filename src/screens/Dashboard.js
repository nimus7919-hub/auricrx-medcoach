import { View, ScrollView, Image } from "react-native";
import { useWallpaper } from "./../contexts/WallpaperContext";
import DynamicText from "./../components/DynamicText";

import { styles } from "./appStyles";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createDashboard(getScope) {
  return () => {
    const { setRoute, S, Card, TopBar, nextReminder } = getScope();

    const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
    return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
          <TopBar />

          {/* Health widget */}
          <View style={[styles.widget, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), marginTop: 16 }]}>
            <DynamicText type="primary" style={[styles.widgetTitle, { fontFamily: 'Inter_800ExtraBold' }]}>
              {S.healthJournal}
            </DynamicText>
            <View style={[styles.widgetInner, { backgroundColor: getCardBorderColor() }]}>
              <DynamicText type="card" style={[styles.widgetSub, { fontFamily: 'Inter_600SemiBold' }]}>
                {S.nextReminder}
              </DynamicText>
              <DynamicText type="card" style={[styles.widgetBig, { fontFamily: 'Inter_900Black' }]}>
                {nextReminder?.name || '—'}
              </DynamicText>
              <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold' }}>
                {nextReminder?.time || '--:--'}
              </DynamicText>
            </View>
          </View>

          {/* Card grid */}
        <View style={styles.grid}>
            <Card title={S.labsLocations} icon={<Image source={require('../../assets/dashboard Emojies/Lab Locations.png')} style={styles.cardIcon} resizeMode="contain" />} onPress={() => setRoute('labs')} />
          <Card title={S.pharmacyLocations} icon={<Image source={require('../../assets/dashboard Emojies/Pharmacy locations.png')} style={styles.cardIcon} resizeMode="contain" />} onPress={() => setRoute('pharmacies')} />
            <Card title={S.reminders} icon={<Image source={require('../../assets/dashboard Emojies/Reminders.png')} style={styles.cardIcon} resizeMode="contain" />} onPress={() => setRoute('reminders')} />
          <Card title={S.medications} icon={<Image source={require('../../assets/dashboard Emojies/Medications.png')} style={styles.cardIcon} resizeMode="contain" />} onPress={() => setRoute('medications')} />
            <Card title={S.herbs} icon={<Image source={require('../../assets/dashboard Emojies/Herbs.png')} style={styles.cardIcon} resizeMode="contain" />} onPress={() => setRoute('herbs')} />
            <Card title={S.supplements} icon={<Image source={require('../../assets/dashboard Emojies/supplements.png')} style={styles.cardIcon} resizeMode="contain" />} onPress={() => setRoute('supplements')} />
            <Card 
              title={S.smartAlerts} 
              icon={<Image source={require('../../assets/dashboard Emojies/Smart Alerts.png')} style={styles.cardIconLarge} resizeMode="contain" />} 
              onPress={() => setRoute('smart-notifications')}
              subtitle="Intelligent reminders & notifications"
            />
            <Card 
              title={S.healthAnalytics} 
              icon={<Image source={require('../../assets/dashboard Emojies/Health Analytics.png')} style={styles.cardIconLarge} resizeMode="contain" />} 
              onPress={() => setRoute('health-analytics')}
              subtitle="Track metrics, adherence & insights"
            />
            <Card 
              title={S.appointmentLog} 
              icon={<Image source={require('../../assets/dashboard Emojies/Appointment Tracker.png')} style={styles.cardIcon} resizeMode="contain" />} 
              onPress={() => setRoute('appointments')}
              subtitle={S.appointmentSubtitle}
            />
            <Card 
              title={S.aiHealth} 
              icon={<Image source={require('../../assets/dashboard Emojies/AI Health.png')} style={styles.cardIconExtraLarge} resizeMode="contain" />} 
              onPress={() => setRoute('ai-health')}
              subtitle="Intelligent health insights & analysis"
            />
            <Card 
              title={S.documents} 
              icon={<Image source={require('../../assets/dashboard Emojies/Documents.png')} style={styles.cardIconExtraLarge} resizeMode="contain" />} 
              onPress={() => setRoute('documents')}
              subtitle="Medical documents for doctor visits"
            />
            {/* Medication Promotions - Hidden for now */}
            {/* <Card 
              title="Medication Promotions" 
              icon={
                <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 32 }}>🏷️</Text>
                </View>
              } 
              onPress={() => {
                Alert.alert(
                  '🏷️ Medication Promotions',
                  'This feature is currently in development. You will be able to see special offers and discounts on medications from nearby pharmacies.',
                  [{ text: 'OK' }]
                );
              }}
              subtitle={
                <View style={{ marginTop: 8, paddingHorizontal: 8 }}>
                  <DynamicText 
                    type="card" 
                    style={{ 
                      fontSize: 16, 
                      fontFamily: 'Inter_900Black', 
                      textAlign: 'center',
                      letterSpacing: 1,
                      opacity: 0.8
                    }}
                  >
                    IN DEVELOPMENT
                  </DynamicText>
                </View>
              }
            /> */}
        </View>
      </ScrollView>
      </>
  );
};
}
