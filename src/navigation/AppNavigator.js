import ActivityHealthScreen from '../screens/ActivityHealthScreen';
import { getRegion } from '../services/region';
import USReferenceScreen from '../screens/USReferenceScreen';
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
// F2, F9-F11, F13, F15, F4-F8 screens
import PrivacyNoticeScreen from '../screens/PrivacyNoticeScreen';
import DocumentCloudBackupScreen from '../screens/DocumentCloudBackupScreen';
import PremiumUpgradeScreen from '../screens/PremiumUpgradeScreen';
import InviteFamilyMemberScreen from '../screens/InviteFamilyMemberScreen';
import AcceptInviteScreen from '../screens/AcceptInviteScreen';
import AddFamilyMemberScreen from '../screens/AddFamilyMemberScreen';
import SharePreviewScreen from '../screens/SharePreviewScreen';
// Home/Tools screens
import PreventionPlannerScreen from '../screens/PreventionPlannerScreen';
import LabDocumentOrganizerScreen from '../screens/LabDocumentOrganizerScreen';
import DailyHabitsScreen from '../screens/DailyHabitsScreen';
import FamilyCircleScreen from '../screens/FamilyCircleScreen';
import FamilyDocumentsScreen from '../screens/FamilyDocumentsScreen';

// Resolve render-local values when invoked, preserving the original closure and component lifetime.
export default function createAppNavigator(getScope) {
  return () => {
  const { openReminderOnEntry, setOpenReminderOnEntry, route, setRoute, user, lang, themeKey, fastingProfile, setFastingProfile, saveFastingProfileToDB, refillPharmacies, refillCoords, refillCurrency, refillFxMeta, isReady, S, reminders, setReminders, meds, setMeds, supplements, setSupplements, theme, userCountry, Dashboard, Pharmacies, Labs, Prescription, Settings, requestAutoDocumentScan } = getScope();
  return (route === 'dashboard' ? <Dashboard /> :
     route === 'reminders' ? <Reminders openAddOnEntry={openReminderOnEntry} onAddEntryConsumed={() => setOpenReminderOnEntry(false)} theme={theme} reminders={reminders} setReminders={setReminders} S={S} themeKey={themeKey} onNavigateToDashboard={() => setRoute('dashboard')} onNavigateToSettings={() => setRoute('settings')} meds={meds} setMeds={setMeds} onAddMedicationFromReminder={(medData) => setMeds(prev => [...prev, medData])} onAddSupplementFromReminder={(suppData) => setSupplements(prev => [...prev, suppData])} onAddAppointmentFromReminder={(apptData) => console.log('Add appointment:', apptData)} /> :
     route === 'pharmacies' ? (getRegion() === 'US' ? <USReferenceScreen initialMode="pharmacies" onClose={() => setRoute('dashboard')} /> : <Pharmacies />) :
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
    route === 'health-analytics' && getRegion() === 'US' ? <ActivityHealthScreen userId={user?.uid} onClose={() => setRoute('dashboard')} onConnect={() => setRoute('health-connect-consent')} onPrivacy={() => setRoute('health-connect-privacy')} /> :
    route === 'health-analytics' ? <HealthAnalyticsScreen key={user?.uid} userId={user?.uid} onConnectHealth={() => setRoute('health-connect-consent')} onHealthPrivacy={() => setRoute('health-connect-privacy')} onClose={() => setRoute('dashboard')} theme={theme} S={S} /> :
    route === 'appointments' ? <AppointmentManagementScreen onClose={() => setRoute('dashboard')} theme={theme} S={S} /> :
    route === 'ai-health' ? (getRegion() === 'US' ? <USReferenceScreen initialMode="drugs" onClose={() => setRoute('dashboard')} /> : isReady ? <AIHealthScreen userId={user?.uid} onConnectHealth={() => setRoute('health-connect-consent')} onHealthPrivacy={() => setRoute('health-connect-privacy')} onClose={() => setRoute('dashboard')} theme={theme} S={S} fastingProfile={fastingProfile} medications={meds} supplements={supplements} /> : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>{uiI18n.t("ui.loadingTranslations")}</Text></View>) :
        route === 'health-profile' ? <FastingProfileScreen onClose={() => setRoute('settings')} theme={theme} S={S} fastingProfile={fastingProfile} setFastingProfile={setFastingProfile} saveFastingProfileToDB={saveFastingProfileToDB} /> :
    route === 'wallpaper' ? <WallpaperSettingsScreen onClose={() => setRoute('dashboard')} onNavigateToSettings={() => setRoute('settings')} theme={theme} S={S} /> :
    route === 'admin-profile' ? <AdminProfileScreen onClose={() => setRoute('dashboard')} onNavigateToSettings={() => setRoute('settings')} currentUser={user} theme={theme} S={S} /> :
    route === 'privacy-notice' ? <PrivacyNoticeScreen onClose={() => setRoute('settings')} /> :
    route === 'cloud-backup' ? <DocumentCloudBackupScreen onClose={() => setRoute('settings')} /> :
    route === 'premium-upgrade' ? <PremiumUpgradeScreen onClose={() => setRoute('dashboard')} entitlement={{ hasPremiumAccess: false, isInTrial: false, trialDaysRemaining: 14, isPremium: false }} /> :
    route === 'invite-family-member' ? <InviteFamilyMemberScreen onClose={() => setRoute('dashboard')} memberId="temp-id" memberName="Family Member" /> :
    route === 'accept-invite' ? <AcceptInviteScreen onClose={() => setRoute('dashboard')} onAccepted={() => {}} /> :
    route === 'add-family-member' ? <AddFamilyMemberScreen onClose={() => setRoute('dashboard')} onAdded={() => {}} /> :
    route === 'share-preview' ? <SharePreviewScreen onClose={() => setRoute('dashboard')} /> :
    route === 'prevention-planner' ? <PreventionPlannerScreen onClose={() => setRoute('dashboard')} /> :
    route === 'lab-organizer' ? <LabDocumentOrganizerScreen onClose={() => setRoute('dashboard')} /> :
    route === 'daily-habits' ? <DailyHabitsScreen onClose={() => setRoute('dashboard')} /> :
    route === 'family-circle' ? <FamilyCircleScreen onClose={() => setRoute('dashboard')} /> :
    route === 'family-documents' ? <FamilyDocumentsScreen onClose={() => setRoute('dashboard')} /> :
     <Dashboard />);
};
}
