import { getRegion } from '../services/region';
import ReminderPermissionBanner from '../components/ReminderPermissionBanner';
import DashboardFeatureIcon from '../components/DashboardFeatureIcon';
import { Text } from 'react-native';
import { HEALTH_CONNECT_ENABLED } from '../services/healthConnectService';
import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import { View, ScrollView, Image, TouchableOpacity } from "react-native";
import { useWallpaper } from "./../contexts/WallpaperContext";
import DynamicText from "./../components/DynamicText";

import { styles } from "./appStyles";
import { FAB_SCROLL_PADDING } from "../layout/fabLayout";

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createDashboard(getScope) {
  return () => {
  useUILanguage();
    const { setRoute, openAddReminder, S, Card, TopBar, nextReminder, user, userData } = getScope();

    const name = (userData?.firstName || userData?.displayName || user?.displayName || user?.email?.split('@')[0] || '').trim();
    const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
    return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: FAB_SCROLL_PADDING }}
      >
          <TopBar />

          {/* Health widget */}
          <View style={[styles.widget, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), marginTop: 16 }]}>
            {!!name && <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: '#D8C99E', fontSize: 13, marginBottom: 8 }}>{uiI18n.t('ui.homeGreeting', { name })}</Text>}
            <DynamicText type="primary" style={[styles.widgetTitle, { fontFamily: 'Inter_800ExtraBold' }]}>
              {S.healthJournal}
            </DynamicText>
            <View style={[styles.widgetInner, { backgroundColor: getCardBorderColor() }]}>
              <DynamicText type="card" style={[styles.widgetSub, { fontFamily: 'Inter_600SemiBold' }]}>
                {S.nextReminder}
              </DynamicText>
              {nextReminder ? <>
                <DynamicText type="card" style={[styles.widgetBig, { fontFamily: 'Inter_900Black' }]}>{nextReminder.name}</DynamicText>
                <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold' }}>{nextReminder.time}</DynamicText>
              </> : <>
                <DynamicText type="card" style={{ fontSize: 15, marginTop: 10 }}>{uiI18n.t('dashboard.noUpcomingReminders')}</DynamicText>
                <TouchableOpacity accessibilityRole="button" onPress={openAddReminder} style={{ alignSelf: 'flex-start', paddingVertical: 12, paddingRight: 16 }}>
                  <Text style={{ color: '#D4AF37', fontSize: 14, fontFamily: 'Inter_600SemiBold' }}>{uiI18n.t('dashboard.addReminderAction')}</Text>
                </TouchableOpacity>
              </>}
              <ReminderPermissionBanner />
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
              icon={<DashboardFeatureIcon name="smartAlerts" />} 
              onPress={() => setRoute('smart-notifications')}
              subtitle={uiI18n.t("ui.intelligentRemindersNotifications")}
            />
            <Card 
              title={S.healthAnalytics} 
              icon={<DashboardFeatureIcon name="healthAnalytics" />} 
              onPress={() => setRoute('health-analytics')}
              subtitle={uiI18n.t("ui.trackMetricsAdherenceInsights")}
            />
            <Card 
              title={S.appointmentLog} 
              icon={<DashboardFeatureIcon name="appointments" />} 
              onPress={() => setRoute('appointments')}
              subtitle={S.appointmentSubtitle}
            />
            <Card 
              title={getRegion() === 'US' ? uiI18n.t('tiles.medicineLookup') : S.aiHealth} 
              icon={<DashboardFeatureIcon name="aiHealth" />} 
              onPress={() => setRoute('ai-health')}
              subtitle={getRegion() === 'US' ? uiI18n.t('ui.medicineLookupSubtitle') : uiI18n.t("ui.intelligentHealthInsightsAnalysis")}
            />
            <Card 
              title={S.documents} 
              icon={<DashboardFeatureIcon name="documents" />} 
              onPress={() => setRoute('documents')}
              subtitle={uiI18n.t("ui.medicalDocumentsForDoctorVisits")}
            />
            <Card 
              title={uiI18n.t('tiles.familyCircle')} 
              icon={<DashboardFeatureIcon name="familyCircle" />} 
              onPress={() => setRoute('family-circle')}
              subtitle={uiI18n.t('ui.familyCircleSubtitle')}
            />
            <Card 
              title={uiI18n.t('tiles.preventionPlanner')} 
              icon={<DashboardFeatureIcon name="preventionPlanner" />} 
              onPress={() => setRoute('prevention-planner')}
              subtitle={uiI18n.t('ui.preventionPlannerSubtitle')}
            />
            <Card 
              title={uiI18n.t('tiles.labOrganizer')} 
              icon={<DashboardFeatureIcon name="labOrganizer" />} 
              onPress={() => setRoute('lab-organizer')}
              subtitle={uiI18n.t('ui.labOrganizerSubtitle')}
            />
            <Card 
              title={uiI18n.t('tiles.dailyHabits')} 
              icon={<DashboardFeatureIcon name="dailyHabits" />} 
              onPress={() => setRoute('daily-habits')}
              subtitle={uiI18n.t('ui.dailyHabitsSubtitle')}
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
