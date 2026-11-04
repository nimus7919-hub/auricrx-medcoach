import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import { View, Text } from "react-native";
import HerbsScreen from "./../screens/HerbsScreen";
import MedicalDocumentsScreen from "./../screens/MedicalDocumentsScreen";
import SmartNotificationsScreen from "./../screens/SmartNotificationsScreen";
import HealthAnalyticsScreen from "./../screens/HealthAnalyticsScreen";
import AppointmentManagementScreen from "./../screens/AppointmentManagementScreen";
import AIHealthScreen from "./../screens/AIHealthScreen";
import FastingProfileScreen from "./../screens/FastingProfileScreen";
import Medications from "./../../components/Medications";
import Supplements from "./../../components/Supplements";
import Reminders from "./../../components/Reminders";
import AdminProfileScreen from "./../screens/AdminProfileScreen";
import WallpaperSettingsScreen from "./../screens/WallpaperSettingsScreen";
import { HealthConnectConsentScreen, HealthConnectPrivacyScreen } from '../screens/ActivityHealthScreen';

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createAppNavigator(getScope) {
  return () => {
  const { openReminderOnEntry, setOpenReminderOnEntry, route, setRoute, user, lang, themeKey, fastingProfile, setFastingProfile, saveFastingProfileToDB, refillPharmacies, refillCoords, refillCurrency, refillFxMeta, isReady, S, reminders, setReminders, meds, setMeds, supplements, setSupplements, theme, userCountry, Dashboard, Pharmacies, Labs, Prescription, Settings, requestAutoDocumentScan } = getScope();
  return (route === 'dashboard' ? <Dashboard /> :
     route === 'reminders' ? <Reminders openAddOnEntry={openReminderOnEntry} onAddEntryConsumed={() => setOpenReminderOnEntry(false)} theme={theme} reminders={reminders} setReminders={setReminders} S={S} themeKey={themeKey} onNavigateToDashboard={() => setRoute('dashboard')} onNavigateToSettings={() => setRoute('settings')} meds={meds} setMeds={setMeds} onAddMedicationFromReminder={(medData) => setMeds(prev => [...prev, medData])} onAddSupplementFromReminder={(suppData) => setSupplements(prev => [...prev, suppData])} onAddAppointmentFromReminder={(apptData) => console.log('Add appointment:', apptData)} /> :
     route === 'pharmacies' ? <Pharmacies /> :
     route === 'labs' ? <Labs /> :
     route === 'prescription' ? <Prescription /> :
     route === 'settings' ? <Settings /> :
     route === 'health-connect-consent' ? <HealthConnectConsentScreen key={user?.uid} userId={user?.uid} onClose={() => setRoute('health-analytics')} onConnected={() => setRoute('health-analytics')} /> :
     route === 'health-connect-privacy' ? <HealthConnectPrivacyScreen key={user?.uid} userId={user?.uid} onClose={() => setRoute('health-analytics')} onConnect={() => setRoute('health-connect-consent')} /> :
     route === 'medications' ? <Medications theme={theme} meds={meds} setMeds={setMeds} S={S} themeKey={themeKey} lang={lang} userCountry={userCountry} user={user} onNavigateToDashboard={() => setRoute('dashboard')} preloadedPharmacies={refillPharmacies} preloadedCoords={refillCoords} preloadedCurrency={refillCurrency} preloadedFxMeta={refillFxMeta} reminders={reminders} setReminders={setReminders} /> :
     route === 'herbs' ? <HerbsScreen onClose={() => setRoute('dashboard')} theme={theme} S={S} currentLang={lang} medications={meds} /> :
     route === 'supplements' ? <Supplements supplements={supplements} setSupplements={setSupplements} S={S} theme={theme} lang={lang} userCountry={userCountry} user={user} onNavigateToDashboard={() => setRoute('dashboard')} preloadedPharmacies={refillPharmacies} preloadedCoords={refillCoords} preloadedCurrency={refillCurrency} preloadedFxMeta={refillFxMeta} reminders={reminders} setReminders={setReminders} /> :
     route === 'documents' ? <MedicalDocumentsScreen requestAutoDocumentScan={requestAutoDocumentScan} onClose={() => setRoute('dashboard')} theme={theme} S={S} /> :
    route === 'smart-notifications' ? <SmartNotificationsScreen meds={meds} setMeds={setMeds} reminders={reminders} setReminders={setReminders} onClose={() => setRoute('dashboard')} theme={theme} S={S} /> :
    route === 'health-analytics' ? <HealthAnalyticsScreen key={user?.uid} userId={user?.uid} onConnectHealth={() => setRoute('health-connect-consent')} onHealthPrivacy={() => setRoute('health-connect-privacy')} onClose={() => setRoute('dashboard')} theme={theme} S={S} /> :
    route === 'appointments' ? <AppointmentManagementScreen onClose={() => setRoute('dashboard')} theme={theme} S={S} /> :
    route === 'ai-health' ? (isReady ? <AIHealthScreen userId={user?.uid} onConnectHealth={() => setRoute('health-connect-consent')} onHealthPrivacy={() => setRoute('health-connect-privacy')} onClose={() => setRoute('dashboard')} theme={theme} S={S} fastingProfile={fastingProfile} medications={meds} supplements={supplements} /> : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{uiI18n.t("ui.loadingTranslations")}</Text></View>) :
        route === 'health-profile' ? <FastingProfileScreen onClose={() => setRoute('settings')} theme={theme} S={S} fastingProfile={fastingProfile} setFastingProfile={setFastingProfile} saveFastingProfileToDB={saveFastingProfileToDB} /> :
    route === 'wallpaper' ? <WallpaperSettingsScreen onClose={() => setRoute('dashboard')} onNavigateToSettings={() => setRoute('settings')} theme={theme} S={S} /> :
    route === 'admin-profile' ? <AdminProfileScreen onClose={() => setRoute('dashboard')} onNavigateToSettings={() => setRoute('settings')} currentUser={user} theme={theme} S={S} /> :
     <Dashboard />);
};
}
