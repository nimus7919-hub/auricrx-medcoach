import { creategetInitialAIMessage, createaddCatExpressions, creategetDoctorGreeting } from "../utils/appHelpers";
import PremiumTabBar from "./../components/PremiumTabBar";
import PremiumButton from "./../components/PremiumButton";
import { darkColors } from "./../theme/colors";
import LoginIntro from "./../components/LoginIntro";
import { authenticatedFetch } from "./../services/authenticatedFetch";
import { requestSearchLocationPermission } from "./../lib/locationPermission";
import ConsentHost from "./../components/ConsentHost";
import { API_BASE } from "./../config/api";
import { useMedicalStream } from "./../hooks/useMedicalStream";
import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput, Linking, Platform, Keyboard, StatusBar, ActivityIndicator } from "react-native";
import TypingEffect from "./../components/TypingEffect";
import * as ImagePicker from "expo-image-picker";
import { herbs } from "./../data/herbs";

import * as Notifications from "expo-notifications";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import authService from "./../services/authService";
import { getSubscriptionStatus } from "./../services/trialService";
import cloudSyncService from "./../services/cloudSyncService";
import StripeCheckoutModal from "./../components/StripeCheckoutModal";
import * as Location from "expo-location";
import { Audio } from "expo-audio";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { askMedicalAI } from "./../api/api.medical-ai";

import SignInScreen from "./../screens/SignInScreen";

import LoadingScreen from "./../components/LoadingScreen";

import CustomAlert from "./../components/CustomAlert";
import { useCustomAlert } from "./../hooks/useCustomAlert";
import { useTranslation } from "./../hooks/useTranslation";

import "./../i18n";
import CrashLogger from "./../utils/crashLogger";
import SubscriptionExpiredModal from "./../components/SubscriptionExpiredModal";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black
} from "@expo-google-fonts/inter";
import { USING_EXPO_GO } from "../utils/appStartup";
import { BACKEND_URL, API_BASE_URL, PALETTES, STORAGE } from "../utils/appConstants";
import { styles } from "../screens/appStyles";
import createCard from "../screens/Card";
import createAnimatedFloatingButton from "../screens/AnimatedFloatingButton";
import createAnimatedButton from "../screens/AnimatedButton";
import createTrialWidget from "../screens/TrialWidget";
import createTopBar from "../screens/TopBar";
import createMembershipModals from "../screens/MembershipModals";
import createDashboardHelpModal from "../screens/DashboardHelpModal";
import createDashboard from "../screens/Dashboard";
import createPharmacies from "../screens/Pharmacies";
import createLabs from "../screens/Labs";
import createPrescription from "../screens/Prescription";
import createAppointments from "../screens/Appointments";
import createCollapsibleSection from "../screens/CollapsibleSection";
import createHeader from "../screens/Header";
import createSettings from "../screens/Settings";
import createSection from "../screens/Section";
import createRowSwitch from "../screens/RowSwitch";
import createSwitchRow from "../screens/SwitchRow";
import createAppNavigator from "../navigation/AppNavigator";

import AppProviders from "./AppProviders";

export default function App() {
  // TEMP FLAG - set to false when done testing env
  const debugEnv = true;
  
  // Test log for component rendering
  console.log('📱 App component rendered');

  // Custom alert hook
  const { alert, showAlert, handlePress } = useCustomAlert();

  // Load fonts first (simple gate)
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  // Put hooks/state INSIDE the component, before returns
  const [route, setRoute] = useState('dashboard');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showCancelMembershipModal, setShowCancelMembershipModal] = useState(false);
  const [showMembershipResultModal, setShowMembershipResultModal] = useState(false);
  const [membershipResult, setMembershipResult] = useState({ type: 'success', title: '', message: '' });
  const [showResubscribeButton, setShowResubscribeButton] = useState(false);
  
  // Authentication state
  const [user, setUser] = useState(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [healthConsentReady, setHealthConsentReady] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showAuth, setShowAuth] = useState(true); // Start with auth screen
  const [isRestoringAuth, setIsRestoringAuth] = useState(true); // Track auth restoration
  const [isLoading, setIsLoading] = useState(true); // Show loading screen initially
  const [resetAuthToSignIn, setResetAuthToSignIn] = useState(0); // Counter to trigger reset

  // Authentication handlers
  const handleAuthSuccess = async (authData) => {
    console.log('✅ Auth success:', authData);
    try {
      console.log('🔄 Processing auth data...');
      // Google has already authenticated with Firebase; reuse the common success flow.
      const firebaseGoogleUser = authData.provider === 'google' ? authService.getCurrentUser() : null;
      if (authData.provider === 'google' && (!firebaseGoogleUser || firebaseGoogleUser.uid !== authData.user?.uid)) {
        throw new Error('Google authentication session is unavailable. Please try again.');
      }
      const result = authData.provider === 'google'
        ? { success: true, user: authData.user }
        : await authService.handleAuth(authData);
      if (authData.provider === 'google') {
        const profile = await authService.getUserData(result.user.uid);
        if (!profile.success && profile.error === 'User data not found') {
          const [firstName, ...lastName] = (result.user.displayName || '').split(' ');
          await authService.storeUserData(result.user.uid, {
            firstName, lastName: lastName.join(' '), email: result.user.email,
            createdAt: new Date().toISOString(),
          });
        }
      }
      
      if (result.success) {
        // Check if email verification is needed
        if (result.needsEmailVerification) {
          showAlert({
            title: 'Email Verification Required',
            message: 'Please check your email (including spam folder) and click the verification link. Then return here to sign in.',
            buttonText: 'Back to Sign In',
            onPress: () => {
              // Trigger reset to show sign-in form
              console.log('User needs to verify email before accessing dashboard');
              setResetAuthToSignIn(prev => prev + 1);
            }
          });
          return; // Don't proceed to dashboard
        }
        
        // Get Firebase user object for token refresh
        const firebaseUser = authService.getCurrentUser();
        setUser({
          ...result.user,
          firebaseUser: firebaseUser, // Store Firebase user object for token refresh
        });
        
        // Check subscription status after sign-in
        try {
          const status = await getSubscriptionStatus(firebaseUser);
          if (status.ok) {
            setSubscriptionStatus(status);
            
            // Only block access if subscription is EXPIRED (0 days left)
            // Cancelled subscriptions should still allow access until period ends
            const daysLeft = status.daysLeft || 0;
            const isExpired = status.status === 'expired';
            
            if (isExpired) {
              // Subscription expired - keep auth screen open so user can resubscribe
              console.log('⚠️ Subscription expired - keeping auth screen open for resubscribe');
              setShowResubscribeButton(true); // Show resubscribe button on sign-in screen
            } else {
              // Subscription is active (even if cancelled, they still have days left)
              // Allow access until period ends
              setShowAuth(false);
              setRoute('dashboard');
              setShowResubscribeButton(false);
            }
          } else {
            // If status check fails, proceed normally
            setShowAuth(false);
            setRoute('dashboard');
          }
        } catch (error) {
          console.error('❌ Error checking subscription status:', error);
          // If status check fails, proceed normally
          setShowAuth(false);
          setRoute('dashboard');
        }
        
        // If it's a sign-up, store the user data
        if (authData.isSignUp) {
          setUserData(authData);
        } else {
          // If it's a sign-in, try to get user data
          const userDataResult = await authService.getUserData(result.user.uid);
          if (userDataResult.success) {
            setUserData(userDataResult.data);
          }
        }
        
        showAlert({
          title: 'Success',
          message: result.message || (authData.isSignUp ? 'Account created successfully!' : 'Signed in successfully!'),
          buttonText: 'Continue',
        });
      } else {
        showAlert({
          title: 'Error',
          message: result.error,
          buttonText: 'OK',
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      showAlert({
        title: 'Error',
        message: 'Authentication failed. Please try again.',
        buttonText: 'OK',
      });
    }
  };

  const handleAuthClose = () => {
    setShowAuth(false);
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setUserData(null);
      setShowAuth(true);
      setShowSubscriptionExpiredModal(false);
      console.log('👋 User signed out');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleCancelMembership = () => {
    setShowCancelMembershipModal(true);
  };

  const confirmCancelMembership = async () => {
    setShowCancelMembershipModal(false);
    try {
      // Get auth token
      const token = user?.firebaseUser ? await user.firebaseUser.getIdToken() : null;
      if (!token) {
        setMembershipResult({
          type: 'error',
          title: S.error || 'Error',
          message: S.error || 'Not authenticated. Please sign in again.'
        });
        setShowMembershipResultModal(true);
        return;
      }

      // Call cancel subscription API
      const response = await authenticatedFetch(`${API_BASE}/api/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?.uid,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Non-JSON response from cancel endpoint:', text.substring(0, 200));
        throw new Error('Server returned an invalid response. Please try again later.');
      }

      const result = await response.json();

      if (response.ok && result.ok) {
        setMembershipResult({
          type: 'success',
          title: S.success || 'Success',
          message: S.membershipCancelled || 'Your membership has been cancelled successfully.'
        });
        setShowMembershipResultModal(true);
        // Refresh subscription status
        if (user?.firebaseUser) {
          const status = await getSubscriptionStatus(user.firebaseUser);
          setSubscriptionStatus(status);
        }
      } else {
        setMembershipResult({
          type: 'error',
          title: S.error || 'Error',
          message: result.message || result.error || S.cancelMembershipFailed || 'Failed to cancel membership. Please try again or contact support.'
        });
        setShowMembershipResultModal(true);
      }
    } catch (error) {
      console.error('Cancel membership error:', error);
      let errorMessage = S.cancelMembershipFailed || 'Failed to cancel membership. Please try again or contact support.';
      
      // Provide more specific error messages
      if (error.message && error.message.includes('JSON Parse error')) {
        errorMessage = 'Server error: Invalid response from server. Please try again later or contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMembershipResult({
        type: 'error',
        title: S.error || 'Error',
        message: errorMessage
      });
      setShowMembershipResultModal(true);
    }
  };

  const handleRestartMembership = async () => {
    try {
      // Get auth token
      const token = user?.firebaseUser ? await user.firebaseUser.getIdToken() : null;
      if (!token) {
        setMembershipResult({
          type: 'error',
          title: S.error || 'Error',
          message: S.error || 'Not authenticated. Please sign in again.'
        });
        setShowMembershipResultModal(true);
        return;
      }

      // Call resubscribe API
      const response = await authenticatedFetch(`${API_BASE}/api/subscription/resubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?.uid,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Non-JSON response from resubscribe endpoint:', text.substring(0, 200));
        throw new Error('Server returned an invalid response. Please try again later.');
      }

      const result = await response.json();

      if (response.ok && result.ok) {
        setMembershipResult({
          type: 'success',
          title: S.success || 'Success',
          message: S.membershipRestarted || 'Your membership has been restarted successfully.'
        });
        setShowMembershipResultModal(true);
        // Refresh subscription status
        if (user?.firebaseUser) {
          const status = await getSubscriptionStatus(user.firebaseUser);
          setSubscriptionStatus(status);
        }
      } else {
        setMembershipResult({
          type: 'error',
          title: S.error || 'Error',
          message: result.message || result.error || S.restartMembershipFailed || 'Failed to restart membership. Please try again or contact support.'
        });
        setShowMembershipResultModal(true);
      }
    } catch (error) {
      console.error('Restart membership error:', error);
      let errorMessage = S.restartMembershipFailed || 'Failed to restart membership. Please try again or contact support.';
      
      if (error.message && error.message.includes('JSON Parse error')) {
        errorMessage = 'Server error: Invalid response from server. Please try again later or contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMembershipResult({
        type: 'error',
        title: S.error || 'Error',
        message: errorMessage
      });
      setShowMembershipResultModal(true);
    }
  };

  const handleSubscriptionExpiredSubscribe = () => {
    setShowSubscriptionExpiredModal(false);
    setShowCheckout(true);
  };

  const handleSubscriptionExpiredDismiss = async () => {
    setShowSubscriptionExpiredModal(false);
    // Log out user after dismissing modal
    setTimeout(async () => {
      await handleSignOut();
    }, 500);
  };
  
  // 'reminders' | 'pharmacies' | 'labs' | 'prescription' | 'appointments' | 'settings'

  // language & theme
  const [lang, setLang] = useState('en');
  const [themeKey, setThemeKey] = useState('black');
  const [fontColor, setFontColor] = useState('default');
  const [night, setNight] = useState(false);
  const [moodShift, setMoodShift] = useState(true);
  
  // notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  
  // AI doctor selection
  const [selectedAIDoctor, setSelectedAIDoctor] = useState('alfred');
  
  // privacy settings
  const [dataCollection, setDataCollection] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  
  // subscription & trial state
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [showSubscriptionExpiredModal, setShowSubscriptionExpiredModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
  // fasting profile settings
  const [fastingProfile, setFastingProfile] = useState({
    // Basic Info
    weight: '', // User's weight
    height: '', // User's height
    weightUnit: 'kg', // 'kg' or 'lbs'
    heightUnit: 'cm', // 'cm' or 'ft'
    
    // Health Conditions
    diabetes: false,
    hypoglycemia: false,
    heartConditions: false,
    kidneyDisease: false,
    liverDisease: false,
    eatingDisorders: false,
    pregnancy: false,
    breastfeeding: false,
    gastrointestinalIssues: false,
    otherHealthConditions: [], // Array of custom health conditions
    customHealthCondition: '', // Current input for new health condition
    
    // Nutritional Status & Body Composition
    bodyFatLevel: '', // 'low', 'normal', 'high'
    muscleMass: '', // 'low', 'normal', 'high'
    micronutrientLevels: '', // 'low', 'normal', 'high'
    hydrationLevel: '', // 'poor', 'fair', 'good', 'excellent'
    
    // Mental Health & Cognitive Demands
    highStressEnvironment: false,
    intensiveMentalTasks: false,
    anxiety: false,
    depression: false,
    
    // Lifestyle & Activity Level
    activityLevel: '', // 'sedentary', 'light', 'moderate', 'high', 'athlete'
    physicalLabor: false,
    longShifts: false,
    sleepQuality: '', // 'poor', 'fair', 'good', 'excellent'
    
    // Fasting Protocol Preferences
    preferredFastingType: '', // 'timeRestricted', 'alternateDay', 'extended', 'custom'
    maxFastingHours: 16,
    fastingFrequency: '', // 'daily', 'weekly', 'monthly'
    
    // Goals
    primaryGoal: '', // 'weightLoss', 'metabolicHealth', 'generalHealth', 'spiritual', 'medical'
    
    // Medical Supervision
    medicalSupervision: false,
    selfMonitoring: false,
    wearableDevices: false
  });
  
  // Pharmacy and Labs data (loaded automatically)
  const [pharmacies, setPharmacies] = useState([]);
  const [pharmaciesLoading, setPharmaciesLoading] = useState(false);
  const [pharmaciesError, setPharmaciesError] = useState(null);
  const [labs, setLabs] = useState([]);
  const [labsLoading, setLabsLoading] = useState(false);
  const [labsError, setLabsError] = useState(null);

  // Load fasting profile from database
  const loadFastingProfileFromDB = async (userId) => {
    try {
      console.log('📖 Loading fasting profile from database for user:', userId);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/fasting-profile?userId=${userId}`);
      const data = await response.json();
      
      if (data.ok && data.found && data.profile) {
        console.log('✅ Loaded fasting profile from database');
        setFastingProfile(data.profile);
      } else {
        console.log('ℹ️ No fasting profile found in database, using defaults');
      }
    } catch (error) {
      console.error('❌ Error loading fasting profile from database:', error);
    }
  };

  // Save fasting profile to database
  const saveFastingProfileToDB = async (profileData) => {
    try {
      if (!user?.uid) {
        console.log('⚠️ No user ID available for saving fasting profile');
        return;
      }

      console.log('💾 Saving fasting profile to database for user:', user.uid);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/fasting-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          profileData: profileData
        })
      });
      
      const data = await response.json();
      if (data.ok) {
        console.log('✅ Fasting profile saved to database successfully');
      } else {
        console.error('❌ Failed to save fasting profile to database:', data.message);
      }
    } catch (error) {
      console.error('❌ Error saving fasting profile to database:', error);
    }
  };

  // Load fasting profile when user is authenticated
  useEffect(() => {
    if (user?.uid) {
      loadFastingProfileFromDB(user.uid);
    }
  }, [user?.uid]);
  
  // Refill modal data (loaded automatically)
  const [refillPharmacies, setRefillPharmacies] = useState([]);
  const [refillLoading, setRefillLoading] = useState(false);
  const [refillError, setRefillError] = useState(null);
  const [refillCoords, setRefillCoords] = useState(null);
  const [refillCurrency, setRefillCurrency] = useState('USD');
  const [refillFxMeta, setRefillFxMeta] = useState(null);
  
  // Use i18n translation hook
  const { t, changeLanguage, currentLanguage, isReady } = useTranslation();
  
  // Combined language change handler
  const handleLanguageChange = async (language) => {
    setLang(language);
    await changeLanguage(language);
  };
  
  // Debug translation system
  console.log('🌐 Translation Debug:');
  console.log('isReady:', isReady);
  console.log('currentLanguage:', currentLanguage);

  // Create S object inside component to fix circular dependency
  const S = useMemo(() => {
    if (!isReady) {
      console.log('⚠️ Translations not ready yet, returning empty object');
      return {};
    }
    console.log('✅ Creating S object with translations');
    const sObject = {
    // Tiles
    reminders: t('tiles.reminders'),
    pharmacyLocations: t('tiles.pharmacyLocations'),
    medications: t('tiles.medications'),
    labsLocations: t('tiles.labsLocations'),
    prescription: t('tiles.prescription'),
    appointmentLog: t('tiles.appointmentLog'),
    documents: t('tiles.documents'),
    herbs: t('tiles.herbs'),
    supplements: t('tiles.supplements'),
    smartAlerts: t('tiles.smartAlerts'),
    healthAnalytics: t('tiles.healthAnalytics'),
    aiHealth: t('tiles.aiHealth'),
    
    // Dashboard
    dashboard: t('dashboard.title'),
    healthJournal: t('dashboard.healthJournal'),
    nextReminder: t('dashboard.nextReminder'),
    appointmentSubtitle: t('dashboard.appointmentSubtitle'),
    
    // AI
    askAI: t('ai.askAI'),
    tapToTalk: t('ai.tapToTalk'),
    aiPlaceholder: t('ai.placeholder'),
    aiShort: t('ai.short'),
    voiceNote: t('ai.voiceNote'),
    
    // Settings
    settings: t('settings.title'),
    profile: t('settings.profile'),
    language: t('settings.language'),
    colorSettings: t('settings.colorSettings'),
    dayNight: t('settings.dayNight'),
    moodShift: t('settings.moodShift'),
    nightMode: t('settings.nightMode'),
    autoCalm: t('settings.autoCalm'),
    help: t('settings.help'),
    notifications: t('settings.notifications'),
    security: t('settings.security'),
    privacy: t('settings.privacy'),
    wallpaper: t('settings.wallpaper'),
    pushNotifications: t('settings.pushNotifications'),
    emailNotifications: t('settings.emailNotifications'),
    smsNotifications: t('settings.smsNotifications'),
    changePassword: t('settings.changePassword'),
    dataCollection: t('settings.dataCollection'),
    analytics: t('settings.analytics'),
    changeWallpaper: t('settings.changeWallpaper'),
    
    // Common
    ok: t('common.ok'),
    cancel: t('common.cancel'),
    save: t('common.save'),
    delete: t('common.delete'),
    edit: t('common.edit'),
    add: t('common.add'),
    close: t('common.close'),
    back: t('common.back'),
    next: t('common.next'),
    previous: t('common.previous'),
    done: t('common.done'),
    loading: t('common.loading'),
    error: t('common.error'),
    success: t('common.success'),
    warning: t('common.warning'),
    info: t('common.info'),
    yes: t('common.yes'),
    no: t('common.no'),
    confirm: t('common.confirm'),
    search: t('common.search'),
    filter: t('common.filter'),
    sort: t('common.sort'),
    refresh: t('common.refresh'),
    retry: t('common.retry'),
    continue: t('common.continue'),
    skip: t('common.skip'),
    finish: t('common.finish'),
    start: t('common.start'),
    stop: t('common.stop'),
    pause: t('common.pause'),
    resume: t('common.resume'),
    reset: t('common.reset'),
    clear: t('common.clear'),
    select: t('common.select'),
    deselect: t('common.deselect'),
    all: t('common.all'),
    none: t('common.none'),
    other: t('common.other'),
    custom: t('common.custom'),
    default: t('common.default'),
    advanced: t('common.advanced'),
    basic: t('common.basic'),
    simple: t('common.simple'),
    complex: t('common.complex'),
    easy: t('common.easy'),
    hard: t('common.hard'),
    low: t('common.low'),
    medium: t('common.medium'),
    high: t('common.high'),
    small: t('common.small'),
    large: t('common.large'),
    short: t('common.short'),
    long: t('common.long'),
    fast: t('common.fast'),
    slow: t('common.slow'),
    new: t('common.new'),
    old: t('common.old'),
    recent: t('common.recent'),
    popular: t('common.popular'),
    recommended: t('common.recommended'),
    featured: t('common.featured'),
    trending: t('common.trending'),
    latest: t('common.latest'),
    updated: t('common.updated'),
    created: t('common.created'),
    modified: t('common.modified'),
    active: t('common.active'),
    inactive: t('common.inactive'),
    enabled: t('common.enabled'),
    disabled: t('common.disabled'),
    visible: t('common.visible'),
    hidden: t('common.hidden'),
    public: t('common.public'),
    private: t('common.private'),
    shared: t('common.shared'),
    personal: t('common.personal'),
    professional: t('common.professional'),
    business: t('common.business'),
    home: t('common.home'),
    work: t('common.work'),
    school: t('common.school'),
    travel: t('common.travel'),
    vacation: t('common.vacation'),
    holiday: t('common.holiday'),
    weekend: t('common.weekend'),
    weekday: t('common.weekday'),
    morning: t('common.morning'),
    afternoon: t('common.afternoon'),
    evening: t('common.evening'),
    night: t('common.night'),
    today: t('common.today'),
    yesterday: t('common.yesterday'),
    tomorrow: t('common.tomorrow'),
    thisWeek: t('common.thisWeek'),
    lastWeek: t('common.lastWeek'),
    nextWeek: t('common.nextWeek'),
    thisMonth: t('common.thisMonth'),
    lastMonth: t('common.lastMonth'),
    nextMonth: t('common.nextMonth'),
    thisYear: t('common.thisYear'),
    lastYear: t('common.lastYear'),
    nextYear: t('common.nextYear'),
    january: t('common.january'),
    february: t('common.february'),
    march: t('common.march'),
    april: t('common.april'),
    may: t('common.may'),
    june: t('common.june'),
    july: t('common.july'),
    august: t('common.august'),
    september: t('common.september'),
    october: t('common.october'),
    november: t('common.november'),
    december: t('common.december'),
    monday: t('reminders.monday'),
    tuesday: t('reminders.tuesday'),
    wednesday: t('reminders.wednesday'),
    thursday: t('reminders.thursday'),
    friday: t('reminders.friday'),
    saturday: t('reminders.saturday'),
    sunday: t('reminders.sunday'),
    mondayShort: t('reminders.mondayShort'),
    tuesdayShort: t('reminders.tuesdayShort'),
    wednesdayShort: t('reminders.wednesdayShort'),
    thursdayShort: t('reminders.thursdayShort'),
    fridayShort: t('reminders.fridayShort'),
    saturdayShort: t('reminders.saturdayShort'),
    sundayShort: t('reminders.sundayShort'),
    selectDays: t('reminders.selectDays'),
    selected: t('reminders.selected'),
    
    // Fasting Profile
    yourFastingProfile: t('yourFastingProfile'),
    needsReview: t('needsReview'),
    compatible: t('compatible'),
    notAnalyzed: t('notAnalyzed'),
    recommendedFastingWindow: t('recommendedFastingWindow'),
    importantConsiderations: t('importantConsiderations'),
    reAnalyzeFasting: t('reAnalyzeFasting'),
    analyzeFastingCompatibility: t('analyzeFastingCompatibility'),
    completeYourFastingProfile: t('completeYourFastingProfile'),
    exportHealthReport: t('exportHealthReport'),
    fastingAnalysis: t('fastingAnalysis'),
    status: t('status'),
    analysis: t('analysis'),
    
    // Health Profile
    healthProfile: t('healthProfile.title'),
    healthProfileSettings: t('healthProfile.settings'),
    basicInfo: t('healthProfile.basicInfo'),
    
    // AI Doctor Selection
    myDoctorAI: t('ai.myDoctorAI'),
    selectAI: t('ai.selectAI'),
    drAlfred: t('ai.drAlfred'),
    drAlfredIntro: t('ai.drAlfredIntro'),
    drMimi: t('ai.drMimi'),
    drMimiIntro: t('ai.drMimiIntro'),
    pawlmer: t('ai.pawlmer'),
    pawlmerIntro: t('ai.pawlmerIntro'),
    aiThinking: t('ai.aiThinking'),
    errorPreparingData: t('ai.errorPreparingData'),
    networkError: t('ai.networkError'),
    helpUsGetPrice: t('ai.helpUsGetPrice'),
    contributionDescription: t('ai.contributionDescription'),
    contributionError: t('ai.contributionError'),
    contributionErrorText: t('ai.contributionErrorText'),
    contributionSuccess: t('ai.contributionSuccess'),
    contributionSuccessText: t('ai.contributionSuccessText'),
    submitContribution: t('ai.submitContribution'),
    supplementName: t('ai.supplementName'),
    supplementNamePlaceholder: t('ai.supplementNamePlaceholder'),
    brandPlaceholder: t('ai.brandPlaceholder'),
    dosagePlaceholder: t('ai.dosagePlaceholder'),
    pricePlaceholder: t('ai.pricePlaceholder'),
    quantityPlaceholder: t('ai.quantityPlaceholder'),
    storeNamePlaceholder: t('ai.storeNamePlaceholder'),
    storeAddressPlaceholder: t('ai.storeAddressPlaceholder'),
    weight: t('healthProfile.weight'),
    height: t('healthProfile.height'),
    weightUnit: t('healthProfile.weightUnit'),
    heightUnit: t('healthProfile.heightUnit'),
    
    // AI Health
    aiHealthAssistant: t('aiHealthAssistant'),
    intelligentHealthcareFeatures: t('intelligentHealthcareFeatures'),
    aiHealthFeatures: t('aiHealthFeatures'),
    healthInsights: t('ai.healthInsights'),
    symptomAnalyses: t('ai.symptomAnalyses'),
    drugChecks: t('ai.drugChecks'),
    analyzeSymptoms: t('ai.analyzeSymptoms'),
    checkInteractions: t('ai.checkInteractions'),
    recentAnalyses: t('ai.recentAnalyses'),
    noHealthInsights: t('ai.noHealthInsights'),
    noSymptomAnalyses: t('ai.noSymptomAnalyses'),
    fastingAnalytics: t('fastingAnalytics'),
    fastingDescription: t('fastingDescription'),
    actionItems: t('actionItems'),
    aiGeneratedInsights: t('ai.aiGeneratedInsights'),
    recentSymptomAnalyses: t('ai.recentSymptomAnalyses'),
    
    // Settings (continued)
    chooseWallpaperDescription: t('settings.chooseWallpaperDescription'),
    emailUs: t('settings.emailUs'),
    emailAddress: t('settings.emailAddress'),
    signOut: t('settings.signOut'),
    subscription: t('settings.subscription'),
    currentPlan: t('settings.currentPlan'),
    proPlan: t('settings.proPlan'),
    trial: t('settings.trial'),
    daysRemaining: t('settings.daysRemaining'),
    status: t('settings.status'),
    cancelMembership: t('settings.cancelMembership'),
    restartMembership: t('settings.restartMembership'),
    cancelMembershipConfirm: t('settings.cancelMembershipConfirm', { date: (subscriptionStatus?.currentPeriodEnd || subscriptionStatus?.current_period_end) ? new Date(subscriptionStatus.currentPeriodEnd || subscriptionStatus.current_period_end).toLocaleDateString() : (lang === 'es' ? 'fin del período pagado' : 'end of the paid period') }),
    restartMembershipConfirm: t('settings.restartMembershipConfirm'),
    confirmCancel: t('settings.confirmCancel'),
    confirmRestart: t('settings.confirmRestart'),
    membershipCancelled: t('settings.membershipCancelled'),
    membershipRestarted: t('settings.membershipRestarted'),
    cancelMembershipFailed: t('settings.cancelMembershipFailed'),
    restartMembershipFailed: t('settings.restartMembershipFailed'),
    daysUntilCancellation: t('settings.daysUntilCancellation'),
    
    // Wallpaper
    wallpaperTitle: t('wallpaper.title'),
    currentWallpaper: t('wallpaper.currentWallpaper'),
    default: t('wallpaper.default'),
    changeWallpaper: t('wallpaper.changeWallpaper'),
    chooseWallpaper: t('wallpaper.chooseWallpaper'),
    loadingWallpapers: t('wallpaper.loadingWallpapers'),
    solidColors: t('wallpaper.solidColors'),
    wallpaperImages: t('wallpaper.wallpaperImages'),
    wallpaperChangedSuccessfully: t('wallpaper.wallpaperChangedSuccessfully'),
    failedToSaveWallpaper: t('wallpaper.failedToSaveWallpaper'),
    wallpaperSuccess: t('wallpaper.success'),
    wallpaperError: t('wallpaper.error'),
    aboutWallpapers: t('wallpaper.aboutWallpapers'),
    aboutWallpapersDescription: t('wallpaper.aboutWallpapersDescription'),
    uniqueWallpaperDesigns: t('wallpaper.uniqueWallpaperDesigns'),
    solidColorOptions: t('wallpaper.solidColorOptions'),
    instantPreviewAndApplication: t('wallpaper.instantPreviewAndApplication'),
    settingsSavedAutomatically: t('wallpaper.settingsSavedAutomatically'),
    white: t('wallpaper.white'),
    black: t('wallpaper.black'),
    blackGoldDr: t('wallpaper.blackGoldDr'),
    blackGold: t('wallpaper.blackGold'),
    blackSilver: t('wallpaper.blackSilver'),
    boldCream: t('wallpaper.boldCream'),
    creamWallpaper: t('wallpaper.creamWallpaper'),
    darkCream: t('wallpaper.darkCream'),
    darkGreenGold: t('wallpaper.darkGreenGold'),
    whiteGoldDr: t('wallpaper.whiteGoldDr'),
    
    // Admin Profile
    adminProfileTitle: t('adminProfile.title'),
    displayName: t('adminProfile.displayName'),
    email: t('adminProfile.email'),
    phoneNumber: t('adminProfile.phoneNumber'),
    noPhoneNumber: t('adminProfile.noPhoneNumber'),
    updateProfile: t('adminProfile.updateProfile'),
    securitySettings: t('adminProfile.securitySettings'),
    changePassword: t('adminProfile.changePassword'),
    deleteAccount: t('adminProfile.deleteAccount'),
    processing: t('adminProfile.processing'),
    error: t('adminProfile.error'),
    success: t('adminProfile.success'),
    ok: t('adminProfile.ok'),
    displayNameRequired: t('adminProfile.displayNameRequired'),
    profileUpdatedSuccessfully: t('adminProfile.profileUpdatedSuccessfully'),
    failedToUpdateProfile: t('adminProfile.failedToUpdateProfile'),
    changePasswordTitle: t('adminProfile.changePasswordTitle'),
    passwordResetMessage: t('adminProfile.passwordResetMessage'),
    sendResetEmail: t('adminProfile.sendResetEmail'),
    emailRequiredForReset: t('adminProfile.emailRequiredForReset'),
    passwordResetEmailSent: t('adminProfile.passwordResetEmailSent'),
    failedToSendResetEmail: t('adminProfile.failedToSendResetEmail'),
    deleteAccountTitle: t('adminProfile.deleteAccountTitle'),
    deleteAccountMessage: t('adminProfile.deleteAccountMessage'),
    confirmDeletion: t('adminProfile.confirmDeletion'),
    confirmDeletionMessage: t('adminProfile.confirmDeletionMessage'),
    yesDeleteForever: t('adminProfile.yesDeleteForever'),
    accountDeleted: t('adminProfile.accountDeleted'),
    accountDeletedMessage: t('adminProfile.accountDeletedMessage'),
    
    // Colors
    gold: t('settings.colors.gold'),
    blue: t('settings.colors.blue'),
    teal: t('settings.colors.teal'),
    
    // Languages
    english: t('settings.languages.en'),
    spanish: t('settings.languages.es'),
    chinese: t('settings.languages.zh'),
    portuguese: t('settings.languages.pt'),
    french: t('settings.languages.fr'),
    german: t('settings.languages.de'),
    
    // Common (continued)
    loadingPharmacies: t('common.loadingPharmacies'),
    loadingLabs: t('common.loadingLabs'),
    brand: t('common.brand'),
    send: t('common.send'),
    stop: t('common.stop'),
    noData: t('common.noData'),
    noResponse: t('common.noResponse'),
    appDescription: t('common.appDescription'),
    noTime: t('common.noTime'),
    sortBy: t('common.sortBy'),
    ascending: t('common.ascending'),
    descending: t('common.descending'),
    showAll: t('common.showAll'),
    fx: t('common.fx'),
    directions: t('common.directions'),
    never: t('common.never'),
    refillComplete: t('common.refillComplete'),
    saved: t('ai.saved'),
    searchingPharmacies: t('medications.searchingPharmacies'),
    pleaseWait: t('common.pleaseWait'),
    singleComponent: t('medications.singleComponent'),
    
    // Common UI Elements
    call: t('common.call'),
    km: t('common.km'),
    mi: t('common.mi'),
    tablets: t('common.tablets'),
    mg: t('common.mg'),
    mxn: t('common.mxn'),
    usd: t('common.usd'),
    exchangeRate: t('common.exchangeRate'),
    
    // Smart Notifications
    smartNotifications: t('tiles.smartAlerts'),
    smartNotificationsDesc: t('settings.smartNotificationsDesc'),
    smartNotificationsActive: t('settings.smartNotificationsActive'),
    smartServiceNotAvailable: t('settings.smartServiceNotAvailable'),
    smartFeatures: t('settings.smartFeatures'),
    smartFeaturesDesc: t('settings.smartFeaturesDesc'),
    smartRefillPredictions: t('settings.smartRefillPredictions'),
    smartRefillPredictionsDesc: t('settings.smartRefillPredictionsDesc'),
    intelligentTiming: t('settings.intelligentTiming'),
    intelligentTimingDesc: t('settings.intelligentTimingDesc'),
    contextAwareReminders: t('settings.contextAwareReminders'),
    contextAwareRemindersDesc: t('settings.contextAwareRemindersDesc'),
    locationBasedReminders: t('settings.locationBasedReminders'),
    locationBasedRemindersDesc: t('settings.locationBasedRemindersDesc'),
    weatherBasedAlerts: t('settings.weatherBasedAlerts'),
    weatherBasedAlertsDesc: t('settings.weatherBasedAlertsDesc'),
    noLocationReminders: t('settings.noLocationReminders'),
    noWeatherAlerts: t('settings.noWeatherAlerts'),
    addLocationReminder: t('settings.addLocationReminder'),
    addWeatherAlert: t('settings.addWeatherAlert'),
    active: t('settings.active'),
    disabled: t('settings.disabled'),
    initializing: t('settings.initializing'),
    threshold: t('settings.threshold'),
    pollenAlert: t('settings.pollenAlert'),
    temperatureAlert: t('settings.temperatureAlert'),
    humidityAlert: t('settings.humidityAlert'),
    airQualityAlert: t('settings.airQualityAlert'),
    pollenMessage: t('settings.pollenMessage'),
    temperatureMessage: t('settings.temperatureMessage'),
    humidityMessage: t('settings.humidityMessage'),
    airQualityMessage: t('settings.airQualityMessage'),
    locationReminderAdded: t('settings.locationReminderAdded'),
    failedToAddLocationReminder: t('settings.failedToAddLocationReminder'),
    weatherAlertAdded: t('settings.weatherAlertAdded'),
    failedToAddWeatherAlert: t('settings.failedToAddWeatherAlert'),
    deleteReminder: t('common.deleteReminder'),
    deleteReminderConfirm: t('common.deleteReminderConfirm'),
    deleteAlert: t('common.deleteAlert'),
    deleteAlertConfirm: t('common.deleteAlertConfirm'),
    failedToDeleteReminder: t('common.failedToDeleteReminder'),
    failedToDeleteAlert: t('common.failedToDeleteAlert'),
    fillBothFields: t('common.fillBothFields'),
    reminderAdded: t('common.reminderAdded'),
    failedToAddReminder: t('common.failedToAddReminder'),
    addLocationReminderTitle: t('common.addLocationReminderTitle'),
    locationNamePlaceholder: t('common.locationNamePlaceholder'),
    reminderMessagePlaceholder: t('common.reminderMessagePlaceholder'),
    addWeatherAlertTitle: t('common.addWeatherAlertTitle'),
    chooseWeatherCondition: t('common.chooseWeatherCondition'),
    highPollen: t('common.highPollen'),
    extremeTemperature: t('common.extremeTemperature'),
    highHumidity: t('common.highHumidity'),
    poorAirQuality: t('common.poorAirQuality'),
    
    // Medications
    addMedication: t('medications.addMedication'),
    editMedication: t('medications.editMedication'),
    editMed: t('medications.edit'),
    deleteMed: t('medications.delete'),
    saveBtn: t('medications.save'),
    noMedications: t('medications.noMedications'),
    dosesLeft: t('medications.dosesLeft'),
    status: t('medications.status'),
    times: t('medications.times'),
    refill: t('medications.refill'),
    taking: t('medications.statuses.taking'),
    onHold: t('medications.statuses.onhold'),
    stopped: t('medications.statuses.stopped'),
    addTime: t('medications.addTime'),
    lastRefill: t('medications.lastRefill'),
    lowest: t('medications.lowest'),
    reserve: t('medications.reserve'),
    medicationName: t('medications.medicationName'),
    strengthExample: t('medications.strengthExample'),
    strengthPlaceholder: t('medications.strengthPlaceholder'),
    components: t('medications.components'),
    notesOptional: t('medications.notesOptional'),
    selectTimes: t('medications.selectTimes'),
    startDate: t('medications.startDate'),
    endDateOptional: t('medications.endDateOptional'),
    
    // Supplements
    addSupplement: t('supplements.addSupplement'),
    editSupplement: t('supplements.editSupplement'),
    edit: t('supplements.edit'),
    save: t('supplements.save'),
    cancel: t('common.cancel'),
    noSupplements: t('supplements.noSupplements'),
    pause: t('supplements.pause'),
    supplementName: t('supplements.supplementName'),
    supplementBrand: t('supplements.supplementBrand'),
    dosage: t('supplements.dosage'),
    resume: t('supplements.resume'),
    servingsLeft: t('supplements.servingsLeft'),
    priceVaries: t('supplements.priceVaries'),
    distanceUnknown: t('supplements.distanceUnknown'),
    pickupAvailable: t('supplements.pickupAvailable'),
    deliveryAvailable: t('supplements.deliveryAvailable'),
    foundStores: t('supplements.foundStores'),
    updateStatus: t('supplements.updateStatus'),
    left: t('supplements.left'),
    took: t('supplements.took'),
    searchHerbs: t('herbs.search'),
    searchSupplements: t('supplements.searchSupplements'),
    priceNotAvailable: t('supplements.priceNotAvailable'),

    // Reminders
    addReminder: t('reminders.addReminder'),
    pickTime: t('reminders.pickTime'),
    namePlaceholder: t('reminders.namePlaceholder'),
    editReminder: t('reminders.editReminder'),
    updateReminder: t('reminders.updateReminder'),
    reminderType: t('reminders.type'),
    frequency: t('reminders.frequency'),
    medication: t('reminders.medication'),
    appointment: t('reminders.appointment'),
    exercise: t('reminders.exercise'),
    other: t('reminders.other'),
    daily: t('reminders.daily'),
    weekly: t('reminders.weekly'),
    monthly: t('reminders.monthly'),
    custom: t('reminders.custom'),
    medicationDetails: t('reminders.medicationDetails'),
    medicationNamePlaceholder: t('reminders.medicationNamePlaceholder'),
    appointmentDetails: t('reminders.appointmentDetails'),
    addressPlaceholder: t('reminders.addressPlaceholder'),
    startDateOptional: t('reminders.startDateOptional'),
    endDateOptional: t('reminders.endDateOptional'),
    notesOptional: t('reminders.notesOptional'),
    selectTime: t('reminders.selectTime'),
    total: t('reminders.total'),
    selectUnit: t('reminders.selectUnit'),
    selectQuantityUnit: t('reminders.selectQuantityUnit'),
    
    // Units translations
    units: {
      mg: t('reminders.units.mg'),
      g: t('reminders.units.g'),
      ml: t('reminders.units.ml'),
      tablets: t('reminders.units.tablets'),
      capsules: t('reminders.units.capsules'),
      units: t('reminders.units.units'),
      pills: t('reminders.units.pills')
    },
    
    // Pharmacies
    pharmacyTitle: t('pharmacies.title'),
    pharmacyDescription: t('pharmacies.description'),
    openMaps: t('pharmacies.openMaps'),
    searchQuery: t('pharmacies.searchQuery'),
    foundPharmacies: t('pharmacies.foundPharmacies'),
    findNearbyPharmacies: t('pharmacies.findNearbyPharmacies'),
    
    // Labs
    labsTitle: t('labs.title'),
    findLabs: t('labs.findLabs'),
    labsSearchQuery: t('labs.searchQuery'),
    foundLabs: t('labs.foundLabs'),
    findNearbyLabs: t('labs.findNearbyLabs'),
    
    // Lab Test Types
    bloodWork: t('labs.testTypes.bloodWork'),
    pathology: t('labs.testTypes.pathology'),
    infectiousDisease: t('labs.testTypes.infectiousDisease'),
    imaging: t('labs.testTypes.imaging'),
    cardiac: t('labs.testTypes.cardiac'),
    allergy: t('labs.testTypes.allergy'),
    specialty: t('labs.testTypes.specialty'),
    
    // Lab Buttons
    callLab: t('labs.buttons.call'),
    testsLab: t('labs.buttons.tests'),
    moreLab: t('labs.buttons.more'),
    
    // Dashboard Cards
    smartAlerts: t('tiles.smartAlerts'),
    healthAnalytics: t('tiles.healthAnalytics'),
    aiHealth: t('tiles.aiHealth'),
    
    // Fasting Profile
    yourFastingProfile: t('ai.yourFastingProfile'),
    needsReview: t('ai.needsReview'),
    compatible: t('ai.compatible'),
    notAnalyzed: t('ai.notAnalyzed'),
    recommendedFastingWindow: t('ai.recommendedFastingWindow'),
    importantConsiderations: t('ai.importantConsiderations'),
    reAnalyzeFasting: t('ai.reAnalyzeFasting'),
    analyzeFastingCompatibility: t('ai.analyzeFastingCompatibility'),
    completeYourFastingProfile: t('ai.completeYourFastingProfile'),
    exportHealthReport: t('ai.exportHealthReport'),
    fastingAnalysis: t('ai.fastingAnalysis'),
    analysis: t('ai.analysis'),
    shouldBeTakenWithFood: t('ai.shouldBeTakenWithFood'),
    
    // Health Conditions
    diabetes: t('healthProfile.diabetes'),
    hypoglycemia: t('healthProfile.hypoglycemia'),
    heartConditions: t('healthProfile.heartConditions'),
    kidneyDisease: t('healthProfile.kidneyDisease'),
    liverDisease: t('healthProfile.liverDisease'),
    eatingDisorders: t('healthProfile.eatingDisorders'),
    pregnancy: t('healthProfile.pregnancy'),
    breastfeeding: t('healthProfile.breastfeeding'),
    gastrointestinalIssues: t('healthProfile.gastrointestinalIssues'),
    
    // Nutritional Status
    bodyFatLevel: t('healthProfile.bodyFatLevel'),
    muscleMass: t('healthProfile.muscleMass'),
    micronutrientLevels: t('healthProfile.micronutrientLevels'),
    hydrationLevel: t('healthProfile.hydrationLevel'),
    
    // Mental Health
    highStressEnvironment: t('healthProfile.highStressEnvironment'),
    intensiveMentalTasks: t('healthProfile.intensiveMentalTasks'),
    anxiety: t('healthProfile.anxiety'),
    depression: t('healthProfile.depression'),
    
    // Lifestyle
    activityLevel: t('healthProfile.activityLevel'),
    physicalLabor: t('healthProfile.physicalLabor'),
    longShifts: t('healthProfile.longShifts'),
    sleepQuality: t('healthProfile.sleepQuality'),
    
    // Fasting Preferences
    preferredFastingType: t('healthProfile.preferredFastingType'),
    maxFastingHours: t('healthProfile.maxFastingHours'),
    fastingFrequency: t('healthProfile.fastingFrequency'),
    
    // Goals
    primaryGoal: t('healthProfile.primaryGoal'),
    
    // Health Monitoring
    healthMonitoring: t('healthProfile.healthMonitoring'),
    selfMonitoring: t('healthProfile.selfMonitoring'),
    wearableDevices: t('healthProfile.wearableDevices'),
    
    // Options
    low: t('healthProfile.low'),
    normal: t('healthProfile.normal'),
    high: t('healthProfile.high'),
    poor: t('healthProfile.poor'),
    fair: t('healthProfile.fair'),
    good: t('healthProfile.good'),
    excellent: t('healthProfile.excellent'),
    sedentary: t('healthProfile.sedentary'),
    light: t('healthProfile.light'),
    moderate: t('healthProfile.moderate'),
    athlete: t('healthProfile.athlete'),
    timeRestricted: t('healthProfile.timeRestricted'),
    alternateDay: t('healthProfile.alternateDay'),
    extended: t('healthProfile.extended'),
    custom: t('healthProfile.custom'),
    daily: t('healthProfile.daily'),
    weekly: t('healthProfile.weekly'),
    monthly: t('healthProfile.monthly'),
    weightLoss: t('healthProfile.weightLoss'),
    metabolicHealth: t('healthProfile.metabolicHealth'),
    generalHealth: t('healthProfile.generalHealth'),
    spiritual: t('healthProfile.spiritual'),
    medical: t('healthProfile.medical'),
    
    // Additional translations
    profileSaved: t('healthProfile.profileSaved'),
    healthProfileSavedMessage: t('healthProfile.healthProfileSavedMessage'),
    saveProfile: t('healthProfile.saveProfile'),
    kg: t('healthProfile.kg'),
    lbs: t('healthProfile.lbs'),
    cm: t('healthProfile.cm'),
    ft: t('healthProfile.ft'),
    healthConditions: t('healthProfile.healthConditions'),
    otherHealthConditions: t('healthProfile.otherHealthConditions'),
    addHealthCondition: t('healthProfile.addHealthCondition'),
    enterHealthCondition: t('healthProfile.enterHealthCondition'),
    removeHealthCondition: t('healthProfile.removeHealthCondition'),
    nutritionalStatus: t('healthProfile.nutritionalStatus'),
    mentalHealth: t('healthProfile.mentalHealth'),
    lifestyleActivity: t('healthProfile.lifestyleActivity'),
    fastingPreferences: t('healthProfile.fastingPreferences'),
    fastingGoals: t('healthProfile.fastingGoals'),
    medicalSupervision: t('healthProfile.medicalSupervision'),
    
    // AI Health Alert Messages
    pleaseEnterSymptoms: t('ai.pleaseEnterSymptoms'),
    pleaseEnterMedications: t('ai.pleaseEnterMedications'),
    symptomAnalysisComplete: t('ai.symptomAnalysisComplete'),
    noInteractionsFound: t('ai.noInteractionsFound'),
    noKnownInteractions: t('ai.noKnownInteractions'),
    foundInteractions: t('ai.foundInteractions'),
    severity: t('ai.severity'),
    urgency: t('ai.urgency'),
    recommendations: t('ai.recommendations'),
    followUpActions: t('ai.followUpActions'),
    store: t('ai.store'),
    delete: t('ai.delete'),
    viralInfection: t('ai.viralInfection'),
    commonCold: t('ai.commonCold'),
    gastroenteritis: t('ai.gastroenteritis'),
    foodIntolerance: t('ai.foodIntolerance'),
    tensionHeadache: t('ai.tensionHeadache'),
    tensionHeadacheWithDizziness: t('ai.tensionHeadacheWithDizziness'),
    sinusCongestion: t('ai.sinusCongestion'),
    allergies: t('ai.allergies'),
    soreThroat: t('ai.soreThroat'),
    cough: t('ai.cough'),
    backStrain: t('ai.backStrain'),
    arthritis: t('ai.arthritis'),
    menstrualCramps: t('ai.menstrualCramps'),
    constipation: t('ai.constipation'),
    diarrhea: t('ai.diarrhea'),
    reflux: t('ai.reflux'),
    sprainBruise: t('ai.sprainBruise'),
    skinIrritation: t('ai.skinIrritation'),
    viralSyndrome: t('ai.viralSyndrome'),
    stomachUpset: t('ai.stomachUpset'),
    low: t('ai.low'),
    medium: t('ai.medium'),
    high: t('ai.high'),
    emergency: t('ai.emergency'),
    mild: t('ai.mild'),
    moderate: t('ai.moderate'),
    severe: t('ai.severe'),
    contactDoctorImmediately: t('ai.contactDoctorImmediately'),
    exportSymptomReport: t('ai.exportSymptomReport'),
    importantNotice: t('ai.importantNotice'),
    viewAllSymptoms: t('ai.viewAllSymptoms'),
    symptomHistory: t('ai.symptomHistory'),
    totalSymptoms: t('ai.totalSymptoms'),
    emptyAllSymptoms: t('ai.emptyAllSymptoms'),
    exportPDF: t('documents.exportPDF'),
    symptomTrackerReport: t('ai.symptomTrackerReport'),
    auricrxMedCoach: t('ai.auricrxMedCoach'),
    symptomTrackerDisclaimer: t('ai.symptomTrackerDisclaimer'),
    storedSymptoms: t('ai.storedSymptoms'),
    exportFailed: t('ai.exportFailed'),
    symptomReportFailed: t('ai.symptomReportFailed'),
    noSymptomsToExport: t('ai.noSymptomsToExport'),
    noSymptomsMessage: t('ai.noSymptomsMessage'),
    confirmEmptySymptoms: t('ai.confirmEmptySymptoms'),
    confirmEmptySymptomsMessage: t('ai.confirmEmptySymptomsMessage'),
    activeSymptomReport: t('ai.activeSymptomReport'),
    activeSymptoms: t('ai.activeSymptoms'),
    noActiveSymptoms: t('ai.noActiveSymptoms'),
    noActiveSymptomsMessage: t('ai.noActiveSymptomsMessage'),
    generatedOn: t('ai.generatedOn'),
    close: t('ai.close'),
    drugInteractionCheck: t('ai.drugInteractionCheck'),
    medicalDisclaimer: t('ai.medicalDisclaimer'),
    interactionDisclaimerText: t('ai.interactionDisclaimerText'),
    yourMedications: t('ai.yourMedications'),
    yourSupplements: t('ai.yourSupplements'),
    noMedicationsToCheck: t('ai.noMedicationsToCheck'),
    needTwoItems: t('ai.needTwoItems'),
    analyze: t('ai.analyze'),
    analyzing: t('ai.analyzing'),
    checkingInteractions: t('ai.checkingInteractions'),
    interactionResults: t('ai.interactionResults'),
    generalSummary: t('ai.generalSummary'),
    failedToCheckInteractions: t('ai.failedToCheckInteractions'),
    foundInteractions: t('ai.foundInteractions'),
    noInteractionsFound: t('ai.noInteractionsFound'),
    noInteractionsMessage: t('ai.noInteractionsMessage'),
    clinicalEffects: t('ai.clinicalEffects'),
    management: t('ai.management'),
    summary: t('ai.summary'),
    generalSymptoms: t('ai.generalSymptoms'),
    multipleSymptomsDescription: t('ai.multipleSymptomsDescription'),
    monitorSymptomsClosely: t('ai.monitorSymptomsClosely'),
    considerConsultingProvider: t('ai.considerConsultingProvider'),
    maintainHydrationRest: t('ai.maintainHydrationRest'),
    getAdequateRest: t('ai.getAdequateRest'),
    stayHydrated: t('ai.stayHydrated'),
    monitorSymptoms: t('ai.monitorSymptoms'),
    scheduleAppointmentIfPersist: t('ai.scheduleAppointmentIfPersist'),
    keepSymptomDiary: t('ai.keepSymptomDiary'),
    potentialMildInteraction: t('ai.potentialMildInteraction'),
    mildSideEffectsPossible: t('ai.mildSideEffectsPossible'),
    monitorUnusualSymptoms: t('ai.monitorUnusualSymptoms'),
    drugInteractionDatabase: t('ai.drugInteractionDatabase'),
    severity: t('ai.severity'),
    urgency: t('ai.urgency'),
    recommendations: t('ai.recommendations'),
    fastingCompatible: t('ai.fastingCompatible'),
    fastingWarning: t('ai.fastingWarning'),
    diabetesRequiresSupervision: t('ai.diabetesRequiresSupervision'),
    pregnancyRequiresSupervision: t('ai.pregnancyRequiresSupervision'),
    eatingDisordersRequireSupervision: t('ai.eatingDisordersRequireSupervision'),
    heartKidneyLiverRequireSupervision: t('ai.heartKidneyLiverRequireSupervision'),
    gastrointestinalIssuesWorsened: t('ai.gastrointestinalIssuesWorsened'),
    lowBodyFatRisky: t('ai.lowBodyFatRisky'),
    poorHydrationIncreasesRisks: t('ai.poorHydrationIncreasesRisks'),
    anxietyDepressionAffected: t('ai.anxietyDepressionAffected'),
    highActivityRequiresNutrition: t('ai.highActivityRequiresNutrition'),
    poorSleepAffected: t('ai.poorSleepAffected'),
    notSpecified: t('ai.notSpecified'),
    noneReported: t('ai.noneReported'),
    yes: t('ai.yes'),
    no: t('ai.no'),
    basicInformation: t('ai.basicInformation'),
    nutritionalStatusBodyComposition: t('ai.nutritionalStatusBodyComposition'),
    mentalHealthCognitiveDemands: t('ai.mentalHealthCognitiveDemands'),
    lifestyleActivityLevel: t('ai.lifestyleActivityLevel'),
    fastingProtocolPreferences: t('ai.fastingProtocolPreferences'),
    goals: t('ai.goals'),
    medicalSupervisionMonitoring: t('ai.medicalSupervisionMonitoring'),
    exportSuccessful: t('ai.exportSuccessful'),
    healthReportGenerated: t('ai.healthReportGenerated'),
    setupRequired: t('ai.setupRequired'),
    pleaseGoToSettings: t('ai.pleaseGoToSettings'),
    info: t('ai.info'),
    warning: t('ai.warning'),
    critical: t('ai.critical'),
    unknown: t('ai.unknown'),
    
    // Appointments
    appointmentManagement: t('appointments.appointmentManagement'),
    appointmentManagementDesc: t('appointments.appointmentManagementDesc'),
    appointmentOverview: t('appointments.appointmentOverview'),
    scheduleAppointment: t('appointments.scheduleAppointment'),
    appointmentType: t('appointments.appointmentType'),
    selectAppointmentType: t('appointments.selectAppointmentType'),
    title: t('appointments.title'),
    titlePlaceholder: t('appointments.titlePlaceholder'),
    location: t('appointments.location'),
    locationPlaceholder: t('appointments.locationPlaceholder'),
    date: t('appointments.date'),
    time: t('appointments.time'),
    notesOptional: t('appointments.notesOptional'),
    notesPlaceholder: t('appointments.notesPlaceholder'),
    schedule: t('appointments.schedule'),
    addDoctor: t('appointments.addDoctor'),
    addDoctorContact: t('appointments.addDoctorContact'),
    doctorName: t('appointments.doctorName'),
    doctorNamePlaceholder: t('appointments.doctorNamePlaceholder'),
    selectCountry: t('appointments.selectCountry'),
    doctorEmailAddress: t('appointments.emailAddress'),
    doctorEmailPlaceholder: t('appointments.doctorEmailPlaceholder'),
    phoneNumber: t('appointments.phoneNumber'),
    address: t('appointments.address'),
    dialingMethod: t('appointments.dialingMethod'),
    selectDialingMethod: t('appointments.selectDialingMethod'),
    howToContactDoctor: t('appointments.howToContactDoctor'),
    pastAppts: t('appointments.pastAppts'),
    pastAppointments: t('appointments.pastAppointments'),
    searchPastAppointments: t('appointments.searchPastAppointments'),
    noAppointmentsFound: t('appointments.noAppointmentsFound'),
    noPastAppointments: t('appointments.noPastAppointments'),
    attended: t('appointments.attended'),
    missed: t('appointments.missed'),
    doctorVisit: t('appointments.doctorVisit'),
    labTest: t('appointments.labTest'),
    pharmacy: t('appointments.pharmacy'),
    specialist: t('appointments.specialist'),
    emergency: t('appointments.emergency'),
    followUp: t('appointments.followUp'),
    checkup: t('appointments.checkup'),
    other: t('appointments.other'),
    scheduled: t('appointments.scheduled'),
    confirmed: t('appointments.confirmed'),
    completed: t('appointments.completed'),
    cancelled: t('appointments.cancelled'),
    rescheduled: t('appointments.rescheduled'),
    unknown: t('appointments.unknown'),
    totalAppointments: t('appointments.totalAppointments'),
    upcoming: t('appointments.upcoming'),
    doctors: t('appointments.doctors'),
    upcomingAppointments: t('appointments.upcomingAppointments'),
    upcomingAppointmentsDesc: t('appointments.upcomingAppointmentsDesc'),
    noUpcomingAppointments: t('appointments.noUpcomingAppointments'),
    doctorContacts: t('appointments.doctorContacts'),
    doctorContactsDesc: t('appointments.doctorContactsDesc'),
    noDoctorContactsYet: t('appointments.noDoctorContactsYet'),
    phoneOnly: t('appointments.phoneOnly'),
    whatsappOnly: t('appointments.whatsappOnly'),
    bothPhoneWhatsapp: t('appointments.bothPhoneWhatsapp'),
    whatsapp: t('appointments.whatsapp'),
    primary: t('appointments.primary'),
    fillAllFields: t('appointments.fillAllFields'),
    appointmentServiceNotAvailable: t('appointments.appointmentServiceNotAvailable'),
    appointmentScheduled: t('appointments.appointmentScheduled'),
    failedToSchedule: t('appointments.failedToSchedule'),
    doctorContactAdded: t('appointments.doctorContactAdded'),
    failedToAddDoctor: t('appointments.failedToAddDoctor'),
    doctorContactUpdated: t('appointments.doctorContactUpdated'),
    failedToUpdateDoctor: t('appointments.failedToUpdateDoctor'),
    deleteDoctorContact: t('appointments.deleteDoctorContact'),
    deleteDoctorConfirm: t('appointments.deleteDoctorConfirm'),
    doctorContactDeleted: t('appointments.doctorContactDeleted'),
    failedToDeleteDoctor: t('appointments.failedToDeleteDoctor'),
    appointmentCompleted: t('appointments.appointmentCompleted'),
    failedToUpdate: t('appointments.failedToUpdate'),
    
    // Medical Documents
    medicalDocuments: t('medicalDocuments.medicalDocuments'),
    organizeDocuments: t('medicalDocuments.organizeDocuments'),
    addDocument: t('medicalDocuments.addDocument'),
    noDocumentsUploaded: t('medicalDocuments.noDocumentsUploaded'),
    multiSelectDoc: t('medicalDocuments.multiSelectDoc'),
    takePhoto: t('medicalDocuments.takePhoto'),
    uploadFromGallery: t('medicalDocuments.uploadFromGallery'),
    selectAll: t('medicalDocuments.selectAll'),
    clear: t('medicalDocuments.clear'),
    share: t('medicalDocuments.share'),
    uploadDocument: t('medicalDocuments.uploadDocument'),
    uploading: t('medicalDocuments.uploading'),
    noDocumentsYet: t('medicalDocuments.noDocumentsYet'),
    uploadFirstDocument: t('medicalDocuments.uploadFirstDocument'),
    photoID: t('medicalDocuments.photoID'),
    driversLicensePassport: t('medicalDocuments.driversLicensePassport'),
    frontSide: t('medicalDocuments.frontSide'),
    backSide: t('medicalDocuments.backSide'),
    birthCertificate: t('medicalDocuments.birthCertificate'),
    officialBirthCertificate: t('medicalDocuments.officialBirthCertificate'),
    insuranceCard: t('medicalDocuments.insuranceCard'),
    healthInsuranceInfo: t('medicalDocuments.healthInsuranceInfo'),
    frontOfCard: t('medicalDocuments.frontOfCard'),
    backOfCard: t('medicalDocuments.backOfCard'),
    labResults: t('medicalDocuments.labResults'),
    bloodTestsLabWork: t('medicalDocuments.bloodTestsLabWork'),
    prescriptions: t('medicalDocuments.prescriptions'),
    currentAndPastPrescriptions: t('medicalDocuments.currentAndPastPrescriptions'),
    medicalRecords: t('medicalDocuments.medicalRecords'),
    medicalHistoryReports: t('medicalDocuments.medicalHistoryReports'),
    otherDocuments: t('medicalDocuments.otherDocuments'),
    anyOtherMedicalDocuments: t('medicalDocuments.anyOtherMedicalDocuments'),
    uploadPDF: t('medicalDocuments.uploadPDF'),
    uploadImage: t('medicalDocuments.uploadImage'),
    scanDocument: t('medicalDocuments.scanDocument'),
    viewDocument: t('medicalDocuments.viewDocument'),
    shareDocument: t('medicalDocuments.shareDocument'),
    deleteDocument: t('medicalDocuments.deleteDocument'),
    editDocument: t('medicalDocuments.editDocument'),
    documentName: t('medicalDocuments.documentName'),
    enterDocumentName: t('medicalDocuments.enterDocumentName'),
    documentCategory: t('medicalDocuments.documentCategory'),
    selectCategory: t('medicalDocuments.selectCategory'),
    documentType: t('medicalDocuments.documentType'),
    front: t('medicalDocuments.front'),
    back: t('medicalDocuments.back'),
    single: t('medicalDocuments.single'),
    pdfDocument: t('medicalDocuments.pdfDocument'),
    imageDocument: t('medicalDocuments.imageDocument'),
    uploadSuccess: t('medicalDocuments.uploadSuccess'),
    uploadFailed: t('medicalDocuments.uploadFailed'),
    deleteConfirm: t('medicalDocuments.deleteConfirm'),
    deleteSuccess: t('medicalDocuments.deleteSuccess'),
    deleteFailed: t('medicalDocuments.deleteFailed'),
    shareSuccess: t('medicalDocuments.shareSuccess'),
    shareFailed: t('medicalDocuments.shareFailed'),
    shareToDoctor: t('medicalDocuments.shareToDoctor'),
    shareToEmail: t('medicalDocuments.shareToEmail'),
    shareToWhatsApp: t('medicalDocuments.shareToWhatsApp'),
    useWhatsApp: t('medicalDocuments.useWhatsApp'),
    useEmail: t('medicalDocuments.useEmail'),
    addEmail: t('medicalDocuments.addEmail'),
    goToAppointmentTracker: t('medicalDocuments.goToAppointmentTracker'),
    sharingNotAvailable: t('medicalDocuments.sharingNotAvailable'),
    documentNotFound: t('medicalDocuments.documentNotFound'),
    pdfCorrupted: t('medicalDocuments.pdfCorrupted'),
    pdfNotCreated: t('medicalDocuments.pdfNotCreated'),
    failedToProcessImages: t('medicalDocuments.failedToProcessImages'),
    secureSharingFailed: t('medicalDocuments.secureSharingFailed'),
    shareWasDismissed: t('medicalDocuments.shareWasDismissed'),
    sharingNotAvailablePlatform: t('medicalDocuments.sharingNotAvailablePlatform'),
    auricrxMedicalID: t('medicalDocuments.auricrxMedicalID'),
    idFront: t('medicalDocuments.idFront'),
    idBack: t('medicalDocuments.idBack'),
    pleaseUseUploadPDF: t('medicalDocuments.pleaseUseUploadPDF'),
    failedToSavePDF: t('medicalDocuments.failedToSavePDF'),
    failedToUploadPDF: t('medicalDocuments.failedToUploadPDF'),
    failedToShareDocument: t('medicalDocuments.failedToShareDocument'),
    failedToShareToEmail: t('medicalDocuments.failedToShareToEmail'),
    failedToShareToWhatsApp: t('medicalDocuments.failedToWhatsApp'),
    failedToShareRegularDocumentEmail: t('medicalDocuments.failedToShareRegularDocumentEmail'),
    failedToShareRegularDocumentWhatsApp: t('medicalDocuments.failedToShareRegularDocumentWhatsApp'),
    permissionRequired: t('medicalDocuments.permissionRequired'),
    grantCameraRollAccess: t('medicalDocuments.grantCameraRollAccess'),
    grantCameraAccess: t('medicalDocuments.grantCameraAccess'),
    documentUploadedSuccessfully: t('medicalDocuments.documentUploadedSuccessfully'),
    photoTakenSuccessfully: t('medicalDocuments.photoTakenSuccessfully'),
    failedToUploadDocument: t('medicalDocuments.failedToUploadDocument'),
    failedToTakePhoto: t('medicalDocuments.failedToTakePhoto'),
    areYouSureDeleteDocument: t('medicalDocuments.areYouSureDeleteDocument'),
    document: t('medicalDocuments.document'),
    
    // Health Analytics
    healthAnalytics: t('healthAnalytics.healthAnalytics'),
    healthOverview: t('healthAnalytics.healthOverview'),
    recentHealthMetrics: t('healthAnalytics.recentHealthMetrics'),
    trackHealthMetrics: t('healthAnalytics.trackHealthMetrics'),
    trackVitalSigns: t('healthAnalytics.trackVitalSigns'),
    noHealthMetrics: t('healthAnalytics.noHealthMetrics'),
    addHealthMetric: t('healthAnalytics.addHealthMetric'),
    medicationAdherence: t('healthAnalytics.medicationAdherence'),
    trackMedicationSchedule: t('healthAnalytics.trackMedicationSchedule'),
    noAdherenceData: t('healthAnalytics.noAdherenceData'),
    sideEffectsMonitoring: t('healthAnalytics.sideEffectsMonitoring'),
    trackSideEffects: t('healthAnalytics.trackSideEffects'),
    noSideEffectsRecorded: t('healthAnalytics.noSideEffectsRecorded'),
    recordSideEffect: t('healthAnalytics.recordSideEffect'),
    generateHealthReport: t('healthAnalytics.generateHealthReport'),
    metricsRecorded: t('healthAnalytics.metricsRecorded'),
    adherenceRate: t('healthAnalytics.adherenceRate'),
    sideEffects: t('healthAnalytics.sideEffects'),
    medications: t('healthAnalytics.medications'),
    bloodPressure: t('healthAnalytics.bloodPressure'),
    systolic: t('healthAnalytics.systolic'),
    diastolic: t('healthAnalytics.diastolic'),
    enterSystolic: t('healthAnalytics.enterSystolic'),
    enterDiastolic: t('healthAnalytics.enterDiastolic'),
    weight: t('healthAnalytics.weight'),
    bloodSugar: t('healthAnalytics.bloodSugar'),
    heartRate: t('healthAnalytics.heartRate'),
    temperature: t('healthAnalytics.temperature'),
    oxygenSaturation: t('healthAnalytics.oxygenSaturation'),
    painLevel: t('healthAnalytics.painLevel'),
    mood: t('healthAnalytics.mood'),
    energyLevel: t('healthAnalytics.energyLevel'),
    sleepHours: t('healthAnalytics.sleepHours'),
    steps: t('healthAnalytics.steps'),
    pleaseEnterValue: t('healthAnalytics.pleaseEnterValue'),
    pleaseEnterValidNumber: t('healthAnalytics.pleaseEnterValidNumber'),
    healthMetricAdded: t('healthAnalytics.healthMetricAdded'),
    failedToAddHealthMetric: t('healthAnalytics.failedToAddHealthMetric'),
    pleaseEnterSymptom: t('healthAnalytics.pleaseEnterSymptom'),
    sideEffectRecorded: t('healthAnalytics.sideEffectRecorded'),
    failedToRecordSideEffect: t('healthAnalytics.failedToRecordSideEffect'),
    yourHealthMetricsNormal: t('healthAnalytics.yourHealthMetricsNormal'),
    considerMaintainingSchedule: t('healthAnalytics.considerMaintainingSchedule'),
    monitorNewSideEffects: t('healthAnalytics.monitorNewSideEffects'),
    healthReportGenerated: t('healthAnalytics.healthReportGenerated'),
    summary: t('healthAnalytics.summary'),
    keyInsights: t('healthAnalytics.keyInsights'),
    ok: t('healthAnalytics.ok'),
    failedToGenerateHealthReport: t('healthAnalytics.failedToGenerateHealthReport'),
    mild: t('healthAnalytics.mild'),
    moderate: t('healthAnalytics.moderate'),
    moderateSevere: t('healthAnalytics.moderateSevere'),
    severe: t('healthAnalytics.severe'),
    verySevere: t('healthAnalytics.verySevere'),
    unknown: t('healthAnalytics.unknown'),
    metricType: t('healthAnalytics.metricType'),
    selectMetricType: t('healthAnalytics.selectMetricType'),
    selectUnit: t('healthAnalytics.selectUnit'),
    value: t('healthAnalytics.value'),
    enterValue: t('healthAnalytics.enterValue'),
    notesOptional: t('healthAnalytics.notesOptional'),
    addAnyNotes: t('healthAnalytics.addAnyNotes'),
    addMetric: t('healthAnalytics.addMetric'),
    symptom: t('healthAnalytics.symptom'),
    symptomPlaceholder: t('healthAnalytics.symptomPlaceholder'),
    severity: t('healthAnalytics.severity'),
    taken: t('healthAnalytics.taken'),
    missed: t('healthAnalytics.missed'),
    dayStreak: t('healthAnalytics.dayStreak'),
    started: t('healthAnalytics.started'),
    viewAllMetrics: t('healthAnalytics.viewAllMetrics'),
    metricsHistory: t('healthAnalytics.metricsHistory'),
    totalMetrics: t('healthAnalytics.totalMetrics'),
    };
    return sObject;
  }, [t, isReady]);

  // meds/reminders (light placeholder list)
  const [reminders, setReminders] = useState([]);
  const [meds, setMeds] = useState([
    {
      id: '1',
      name: 'Metformina',
      strength: '500mg',
      strengthValue: '500',
      strengthUnit: 'Mg',
      status: 'taking',
      times: ['08:00', '20:00'],
      startDate: '2024-01-15',
      endDate: '',
      notes: '',
      dosesLeft: '0',
      quantity: '0 tablet',
      quantityValue: '0',
      quantityUnit: 'Tablet',
      remainingQuantity: '0',
      lastRefill: null,
      isSingleComponent: true
    },
    {
      id: '2',
      name: 'Aspirina',
      strength: '100Mg',
      strengthValue: '100',
      strengthUnit: 'Mg',
      status: 'taking',
      times: ['17:30'],
      startDate: '2024-01-01',
      endDate: '',
      notes: '',
      dosesLeft: '30',
      quantity: '30 tablet',
      quantityValue: '30',
      quantityUnit: 'Tablet',
      remainingQuantity: '30',
      lastRefill: null,
      isSingleComponent: true
    }
  ]); // lifted medications state
  const [supplements, setSupplements] = useState([
    {
      id: '1',
      name: 'Vitamin D3',
      brand: 'Nature Made',
      dosage: '1000 IU',
      status: 'taking',
      times: ['08:00'],
      startDate: '2024-01-15',
      endDate: '',
      notes: '',
      dosesLeft: '0',
      quantity: '0',
      quantityUnit: 'Tablet',
      remainingQuantity: '0',
      refillSoon: false,
      lastRefill: null
    },
    {
      id: '2',
      name: 'Omega-3',
      brand: 'Nordic Naturals',
      dosage: '1000mg',
      status: 'taking',
      times: ['12:00'],
      startDate: '2024-01-10',
      endDate: '',
      notes: '',
      dosesLeft: '0',
      quantity: '0',
      quantityUnit: 'Tablet',
      remainingQuantity: '0',
      refillSoon: false,
      lastRefill: null
    }
  ]);
  // prescriptions gallery
  const [rxPhotos, setRxPhotos] = useState([]);
  // voice notes
  const [voiceNotes, setVoiceNotes] = useState([]);
  // --- Medical AI local state ---
const [aiMessage, setAiMessage] = useState("");
const [aiReply, setAiReply] = useState("");
const [loadingAI, setLoadingAI] = useState(false);

// --- Medical AI local state ---
const [medInput, setMedInput] = useState('');
const [medAnswer, setMedAnswer] = useState('');
const [medLoading, setMedLoading] = useState(false);

async function handleAskMedical() {
  const q = medInput.trim();
  if (!q) return;
  try {
    setMedLoading(true);
    const answer = await askMedicalAI(q);   // calls ./src/api/API.Medical-AI
    setMedAnswer(answer || 'I could not find an answer.');
  } catch (e) {
    Alert.alert('AI error', 'Could not get an answer right now.');
  } finally {
    setMedLoading(false);
  }
}

  // --- Floating AI modal state ---
const [aiOpen, setAiOpen] = useState(false)
const [keyboardHeight, setKeyboardHeight] = useState(0)

// Keyboard event listeners
useEffect(() => {
  const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
    setKeyboardHeight(e.endCoordinates.height);
  });
  const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
    setKeyboardHeight(0);
  });

  return () => {
    keyboardDidShowListener?.remove();
    keyboardDidHideListener?.remove();
  };
}, []);

// Auto-load pharmacy and labs data when app starts
useEffect(() => {
  const loadLocationData = async () => {
    try {
      // Request location permission
      const { status } = await requestSearchLocationPermission();
      if (status !== 'granted') {
        console.log('📍 Location permission denied - skipping auto-load');
        return;
      }

      // Get current position with error handling for Google Play Services issues
      let coords;
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000, // 10 second timeout
          maximumAge: 300000 // 5 minutes
        });
        coords = position.coords;
        console.log('📍 Auto-loading data for coordinates:', coords.latitude, coords.longitude);
      } catch (locationError) {
        // Handle Google Play Services disconnection or other location errors
        const errorMessage = locationError?.message || locationError?.toString() || '';
        if (errorMessage.includes('Google Play services') || errorMessage.includes('service disconnection')) {
          console.warn('⚠️ Google Play Services unavailable - skipping auto-load location data');
          return;
        }
        // For other errors, log but don't crash
        console.warn('⚠️ Location request failed - skipping auto-load:', errorMessage);
        return;
      }

      // Load pharmacies
      setPharmaciesLoading(true);
      try {
        const { findNearbyPharmacies } = await import('../../services/pharmacySearch');
        const nearbyPharmacies = await findNearbyPharmacies(coords.latitude, coords.longitude, lang, { noCache: true });
        setPharmacies(nearbyPharmacies);
        console.log('🏪 Auto-loaded pharmacies:', nearbyPharmacies.length);
        
        // Debug: Log first pharmacy data to see what we're getting
        if (nearbyPharmacies.length > 0) {
          console.log('🔍 FIRST PHARMACY DEBUG:', {
            name: nearbyPharmacies[0].name,
            phone: nearbyPharmacies[0].phone,
            website: nearbyPharmacies[0].website,
            rating: nearbyPharmacies[0].rating,
            address: nearbyPharmacies[0].address,
            fullObject: nearbyPharmacies[0]
          });
        }
      } catch (error) {
        console.error('❌ Error loading pharmacies:', error);
        setPharmaciesError('Failed to load pharmacies');
      } finally {
        setPharmaciesLoading(false);
      }

      // Load labs
      setLabsLoading(true);
      try {
        const { findNearbyLabs } = await import('../../services/labSearch');
        const nearbyLabs = await findNearbyLabs(coords.latitude, coords.longitude, lang, { noCache: true });
        setLabs(nearbyLabs);
        console.log('🧪 Auto-loaded labs:', nearbyLabs.length);
        
        // Debug: Log first lab data to see what we're getting
        if (nearbyLabs.length > 0) {
          console.log('🔍 FIRST LAB DEBUG:', {
            name: nearbyLabs[0].name,
            phone: nearbyLabs[0].phone,
            website: nearbyLabs[0].website,
            rating: nearbyLabs[0].rating,
            address: nearbyLabs[0].address,
            fullObject: nearbyLabs[0]
          });
        }
      } catch (error) {
        console.error('❌ Error loading labs:', error);
        setLabsError('Failed to load labs');
      } finally {
        setLabsLoading(false);
      }

      // Load refill modal data (pharmacies + currency detection)
      setRefillLoading(true);
      try {
        // Store coordinates for refill modal
        setRefillCoords({ latitude: coords.latitude, longitude: coords.longitude });
        
        // Determine currency from country (same logic as refill modal)
        let determinedCurrency = 'USD';
        try {
          const geo = await Location.reverseGeocodeAsync({ latitude: coords.latitude, longitude: coords.longitude });
          const cc = geo?.[0]?.isoCountryCode?.toUpperCase();
          if (cc) {
            const C = {
              // North America
              US:'USD', PR:'USD', CA:'CAD', MX:'MXN',
              // Latin America
              BR:'BRL', AR:'ARS', CL:'CLP', CO:'COP', PE:'PEN', VE:'VES', EC:'USD', UY:'UYU', PY:'PYG', BO:'BOB', CR:'CRC', GT:'GTQ', HN:'HNL', NI:'NIO', SV:'USD', DO:'DOP', PA:'PAB',
              // Europe (Euro + others)
              ES:'EUR', PT:'EUR', FR:'EUR', DE:'EUR', IT:'EUR', NL:'EUR', BE:'EUR', IE:'EUR', LU:'EUR', AT:'EUR', FI:'EUR', GR:'EUR', SK:'EUR', SI:'EUR', LV:'EUR', LT:'EUR', EE:'EUR', MT:'EUR', CY:'EUR',
              PL:'PLN', CZ:'CZK', HU:'HUF', RO:'RON', BG:'BGN', HR:'EUR', SE:'SEK', NO:'NOK', DK:'DKK', CH:'CHF', GB:'GBP', IS:'ISK', TR:'TRY',
              // Middle East / Africa
              AE:'AED', SA:'SAR', QA:'QAR', KW:'KWD', BH:'BHD', OM:'OMR', IL:'ILS', EG:'EGP', MA:'MAD', NG:'NGN', KE:'KES', ZA:'ZAR', GH:'GHS',
              // Asia / Pacific
              CN:'CNY', JP:'JPY', KR:'KRW', IN:'INR', HK:'HKD', TW:'TWD', SG:'SGD', MY:'MYR', TH:'THB', ID:'IDR', PH:'PHP', VN:'VND', AU:'AUD', NZ:'NZD', FJ:'FJD'
            };
            if (C[cc]) determinedCurrency = C[cc];
          }
        } catch {}
        
        // If geocode failed, use language fallback
        if (determinedCurrency === 'USD') {
          determinedCurrency = (lang === 'es' ? 'EUR' : lang === 'zh' ? 'CNY' : 'USD');
        }
        
        setRefillCurrency(determinedCurrency);
        console.log('💰 Auto-detected currency:', determinedCurrency);
        
        // Load pharmacies for refill modal (same as regular pharmacies but stored separately)
        const { findNearbyPharmacies } = await import('../../services/pharmacySearch');
        const refillPharmaciesData = await findNearbyPharmacies(coords.latitude, coords.longitude, lang, { noCache: true });
        setRefillPharmacies(refillPharmaciesData);
        console.log('💊 Auto-loaded refill pharmacies:', refillPharmaciesData.length);
        
      } catch (error) {
        console.error('❌ Error loading refill data:', error);
        setRefillError('Failed to load refill data');
      } finally {
        setRefillLoading(false);
      }

    } catch (error) {
      console.error('❌ Error in auto-load location data:', error);
    }
  };

  // Only load if user is authenticated and not on auth screen
  if (!showAuth && user) {
    // Location is requested only by an explicit foreground search.
  }
}, [showAuth, user, lang]); // Dependencies: reload when auth state or language changes

useEffect(() => {
  if (aiOpen) {
    // Reset keyboard height when modal opens
    setKeyboardHeight(0);
    setTimeout(() => aiInputRef.current?.focus(), 100);
  }
}, [aiOpen]);
const [aiInput, setAiInput] = useState('');
// Function to get the initial AI message based on selected doctor
const getInitialAIMessage = creategetInitialAIMessage(() => ({ S }));

// Function to add cat-like expressions to Pawlmer's responses
const addCatExpressions = createaddCatExpressions(() => ({  }));

const [aiMessages, setAiMessages] = useState([
  { role: 'system', text: getInitialAIMessage(selectedAIDoctor) },
]);
const [aiSending, setAiSending] = useState(false);

// auto-scroll to bottom on new message
const aiScrollRef = useRef(null);
useEffect(() => {
  requestAnimationFrame(() => aiScrollRef.current?.scrollToEnd({ animated: true }));
}, [aiMessages]);

// Update AI messages when selected doctor or language changes
useEffect(() => {
  const newIntro = getInitialAIMessage(selectedAIDoctor);
  setAiMessages([{ role: 'system', text: newIntro }]);
}, [selectedAIDoctor, lang, S]);

const aiInputRef = useRef(null);

  // streaming hook (use a local inline implementation)
  const { text: streamText, loading: streamLoading, ask: streamAsk, cancel: streamCancel } = useMedicalStream(`${API_BASE}/ask-stream`, { stream: false, temperature: 0.7, max_tokens: 500 });

  // sync streaming text into aiMessages so UI shows live tokens
  useEffect(() => {
    if (!streamText) return;
    setAiMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant') {
        return [...prev.slice(0, -1), { role: 'assistant', text: addCatExpressions(streamText, selectedAIDoctor, lang) }];
      }
      return [...prev, { role: 'assistant', text: addCatExpressions(streamText, selectedAIDoctor, lang) }];
    });
  }, [streamText, selectedAIDoctor, lang]);

// send to backend and update UI
async function sendAi(reminders, rxPhotos, meds, supplements, herbs, theme, fastingProfile, pharmacies, labs, userCountry) {
  console.log('=== sendAi function called ===');
  const q = aiInput.trim();
  console.log('Input text:', q);
  console.log('aiSending:', aiSending);
  
  if (!q || aiSending) {
    console.log('Early return - no text or already sending');
    return;
  }

  console.log('Proceeding with AI request...');
  // show the user's message immediately
  setAiMessages(m => [...m, { role: 'user', text: q }]);
  setAiInput('');
  setAiSending(true);

  console.log('Building user data for tool calling...');
  console.log('reminders:', reminders?.length || 0);
  console.log('rxPhotos:', rxPhotos?.length || 0);
  console.log('meds:', meds?.length || 0);
  console.log('supplements:', supplements?.length || 0);
  console.log('herbs:', herbs?.length || 0);
  console.log('theme:', theme?.id || 'none');
  console.log('fastingProfile:', fastingProfile ? 'available' : 'none');
  console.log('pharmacies:', pharmacies?.length || 0);
  console.log('labs:', labs?.length || 0);
  console.log('userCountry:', userCountry || 'none');

  // Prepare user data for tool calling
  let userData;
  try {
    console.log('Preparing medications...');
    const medsData = meds.map(med => ({
      name: med.name,
      strength: med.strength || 'N/A',
      status: med.status,
      times: med.times || [],
      notes: med.notes || ''
    }));
    console.log('Medications prepared:', medsData.length);

    console.log('Preparing supplements...');
    const supplementsData = supplements.map(supp => ({
      name: supp.name,
      dosage: supp.dosage || 'N/A',
      status: supp.status,
      times: supp.times || [],
      notes: supp.notes || ''
    }));
    console.log('Supplements prepared:', supplementsData.length);

    console.log('Preparing reminders...');
    const remindersData = reminders.map(rem => ({
      time: rem.time || '',
      name: rem.name || '',
      text: rem.text || ''
    }));
    console.log('Reminders prepared:', remindersData.length);

    console.log('Preparing herbs...');
    const herbsData = (herbs || []).slice(0, 5).map(herb => ({
      name: herb.name,
      category: herb.category
    }));
    console.log('Herbs prepared:', herbsData.length);

    console.log('Preparing health profile...');
    const healthProfileData = fastingProfile ? {
      basicInfo: {
        age: fastingProfile.age || null,
        gender: fastingProfile.gender || null,
        weight: fastingProfile.weight || null,
        height: fastingProfile.height || null,
        weightUnit: fastingProfile.weightUnit || null,
        heightUnit: fastingProfile.heightUnit || null
      },
      healthConditions: fastingProfile.healthConditions || [],
      nutritionalStatus: {
        bodyFatLevel: fastingProfile.bodyFatLevel || null,
        muscleMass: fastingProfile.muscleMass || null,
        micronutrientLevels: fastingProfile.micronutrientLevels || null,
        hydrationLevel: fastingProfile.hydrationLevel || null
      },
      mentalHealth: {
        highStressEnvironment: fastingProfile.highStressEnvironment || null,
        intensiveMentalTasks: fastingProfile.intensiveMentalTasks || null,
        anxiety: fastingProfile.anxiety || null,
        depression: fastingProfile.depression || null
      },
      lifestyle: {
        activityLevel: fastingProfile.activityLevel || null,
        physicalLabor: fastingProfile.physicalLabor || null,
        longShifts: fastingProfile.longShifts || null,
        sleepQuality: fastingProfile.sleepQuality || null
      },
      fastingPreferences: {
        preferredFastingType: fastingProfile.preferredFastingType || null,
        maxFastingHours: fastingProfile.maxFastingHours || null,
        fastingFrequency: fastingProfile.fastingFrequency || null
      },
      goals: {
        primaryGoal: fastingProfile.primaryGoal || null,
        weightLossGoal: fastingProfile.weightLossGoal || null,
        metabolicHealthGoal: fastingProfile.metabolicHealthGoal || null
      },
      medicalSupervision: {
        selfMonitoring: fastingProfile.selfMonitoring || null,
        wearableDevices: fastingProfile.wearableDevices || null
      }
    } : null;
    console.log('Health profile prepared:', healthProfileData ? 'available' : 'none');

    console.log('Preparing pharmacy and lab data...');
    const pharmacyData = (pharmacies || []).slice(0, 10).map(pharmacy => ({
      name: pharmacy.name,
      address: pharmacy.address,
      distance: pharmacy.distanceMiles || pharmacy.distanceKm,
      phone: pharmacy.phone,
      rating: pharmacy.rating
    }));
    console.log('Pharmacies prepared:', pharmacyData.length);

    const labData = (labs || []).slice(0, 10).map(lab => ({
      name: lab.name,
      address: lab.address,
      distance: lab.distanceMiles || lab.distanceKm,
      phone: lab.phone,
      rating: lab.rating,
      testTypes: lab.testTypes || []
    }));
    console.log('Labs prepared:', labData.length);

    userData = {
      meds: medsData,
      supplements: supplementsData,
      reminders: remindersData,
      herbs: herbsData,
      healthProfile: healthProfileData,
      pharmacies: pharmacyData,
      labs: labData,
      userCountry: userCountry,
      language: lang
    };

    console.log('User data prepared for tool calling:', userData);
  } catch (error) {
    console.log('Error preparing user data:', error);
    setAiMessages(m => [...m, { role: 'assistant', text: S.errorPreparingData || 'Error preparing your health data. Please try again.' }]);
    setAiSending(false);
    return;
  }

  // Skip API test and go directly to tool calling
  console.log('Using tool calling approach...');
  console.log('Question:', q);
  console.log('API Base URL:', `${API_BASE}`);
  
  // Add immediate response
  setAiMessages(m => [...m, { role: 'assistant', text: S.aiThinking || 'AI is thinking...' }]);
  
  try {
    console.log('Sending question with user data for tool calling...');
    console.log('Request payload:', {
      message: q,
      userData: userData
    });
    
    const response = await authenticatedFetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: q,
        userData: userData
      })
    });
    
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    
    const data = await response.json();
    console.log('Backend response:', data);
    const reply = data.reply || 'No response received';
    console.log('Got response with tool calling:', reply);
    
      setAiMessages(m => [...m, { role: 'assistant', text: addCatExpressions(reply, selectedAIDoctor, lang) }]);
    } catch (err) {
    console.log('API Error:', err);
    // Provide a helpful response even if AI is down
    let fallbackResponse = `API Error: ${err.message}. `;
    if (q.toLowerCase().includes('aspirin')) {
      fallbackResponse += 'However, I can tell you that aspirin is a common over-the-counter medication used to reduce pain, fever, and inflammation. It\'s also used in low doses to help prevent heart attacks and strokes. Please consult with a healthcare provider for medical advice.';
    } else if (q.toLowerCase().includes('aspirina')) {
      fallbackResponse += 'Aspirina es un medicamento común de venta libre usado para reducir el dolor, la fiebre y la inflamación. También se usa en dosis bajas para ayudar a prevenir ataques cardíacos y accidentes cerebrovasculares. Consulte con un proveedor de atención médica para obtener asesoramiento médico.';
    } else {
      fallbackResponse += 'Please try again in a moment or consult with a healthcare provider for immediate medical questions.';
    }
    setAiMessages(m => [...m, { role: 'assistant', text: addCatExpressions(fallbackResponse, selectedAIDoctor, lang) }]);
  } finally {
    setAiSending(false);
  }
}
  // ---------- persistence ----------
 useEffect(() => {
  if (USING_EXPO_GO) {
    console.log("Skipping expo-notifications setup in Expo Go (SDK 53).");
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  (async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Notifications disabled', 'Enable notifications for reminder alerts.');
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  })();
}, []);

    useEffect(() => {
    (async () => {
      try {
        const [L, T, N, M, R, P, V, MD, SD] = await Promise.all([
          AsyncStorage.getItem(STORAGE.lang),
          AsyncStorage.getItem(STORAGE.theme),
          AsyncStorage.getItem(STORAGE.night),
          AsyncStorage.getItem(STORAGE.mood),
          AsyncStorage.getItem(STORAGE.reminders),
          AsyncStorage.getItem(STORAGE.rxPhotos),
          AsyncStorage.getItem(STORAGE.voiceNotes),
          AsyncStorage.getItem(STORAGE.meds),
          AsyncStorage.getItem(STORAGE.selectedAIDoctor),
        ]);

        if (L) {
          console.log('🔍 App - Loading language from storage:', L);
          setLang(L);
          // i18n will be initialized by LANGUAGE_DETECTOR, but we need to sync if different
          // Only call if i18n is ready and the language differs from what i18n detected
          if (isReady && currentLanguage !== L) {
            console.log(`🔄 App - Syncing language: i18n has '${currentLanguage}', storage has '${L}', updating i18n...`);
            changeLanguage(L);
          } else if (isReady) {
            console.log(`✅ App - Language already synced: i18n has '${currentLanguage}', matches storage`);
          } else {
            console.log('⏳ App - i18n not ready yet, will sync when ready');
          }
        }
        if (T) setThemeKey(T);
        if (N) setNight(N === '1');
        if (M) setMoodShift(M === '1');

        if (R) { try { setReminders(JSON.parse(R)); } catch {} }
        if (P) { try { setRxPhotos(JSON.parse(P)); } catch {} }
  if (V) { try { setVoiceNotes(JSON.parse(V)); } catch {} }
        if (MD) { 
          try { 
            const parsedMeds = JSON.parse(MD);
            // Only set meds if they exist, otherwise keep defaults
            if (parsedMeds && parsedMeds.length > 0) {
              setMeds(parsedMeds);
            }
          } catch {} 
        }
        if (SD) { try { setSelectedAIDoctor(SD); } catch {} }
      } catch {
        // ignore corrupt storage on boot
      }
    })();
  }, []);

  // Sync lang state with i18n when it becomes ready
  useEffect(() => {
    if (isReady && currentLanguage && currentLanguage !== lang) {
      console.log(`🔄 App - Syncing lang state with i18n: '${lang}' -> '${currentLanguage}'`);
      setLang(currentLanguage);
    }
  }, [isReady, currentLanguage, lang]);

  // persist basics
  useEffect(() => { AsyncStorage.setItem(STORAGE.lang, lang); }, [lang]);
  useEffect(() => { AsyncStorage.setItem(STORAGE.theme, themeKey); }, [themeKey]);
  useEffect(() => { AsyncStorage.setItem(STORAGE.night, night ? '1' : '0'); }, [night]);
  useEffect(() => { AsyncStorage.setItem(STORAGE.mood, moodShift ? '1' : '0'); }, [moodShift]);
  useEffect(() => { AsyncStorage.setItem(STORAGE.reminders, JSON.stringify(reminders)); }, [reminders]);
  useEffect(() => { AsyncStorage.setItem(STORAGE.rxPhotos, JSON.stringify(rxPhotos)); }, [rxPhotos]);
  useEffect(() => { AsyncStorage.setItem(STORAGE.voiceNotes, JSON.stringify(voiceNotes)); }, [voiceNotes]);
  useEffect(() => { AsyncStorage.setItem(STORAGE.meds, JSON.stringify(meds)); }, [meds]);
  useEffect(() => { AsyncStorage.setItem(STORAGE.selectedAIDoctor, selectedAIDoctor); }, [selectedAIDoctor]);

  // Authentication state listener and restoration
  useEffect(() => {
    console.log('🔧 Setting up auth state listener...');
    let isRestoring = true; // Flag to prevent race conditions
    
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      console.log('🔥 Firebase auth state changed:', firebaseUser ? firebaseUser.uid : 'null');
      
      try {
        // Don't process auth state changes while we're still restoring
        if (isRestoring || authService.authInProgress) {
          console.log('⏳ Skipping auth state change during restoration');
          return;
        }
        
        if (firebaseUser) {
          // User is signed in
          
          // IMPORTANT: Check email verification before allowing access
          if (!firebaseUser.emailVerified && !isRestoring) {
            // New sign-up without verified email - force sign out
            console.log('⚠️ User signed in without verified email, signing out...');
            await authService.signOut();
            showAlert({
              title: 'Email Verification Required',
              message: 'Please check your email (including spam folder) and click the verification link. Then return here to sign in.',
              buttonText: 'OK',
            });
            return;
          }
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            emailVerified: firebaseUser.emailVerified,
            firebaseUser: firebaseUser, // Store Firebase user object for token refresh
          });
          setShowAuth(false);
          setRoute('dashboard'); // Navigate to dashboard after successful authentication
          setIsRestoringAuth(false);
          
          // Try to get user data
          try {
            console.log('📥 Fetching user data for:', firebaseUser.uid);
            const userDataResult = await authService.getUserData(firebaseUser.uid);
            if (userDataResult.success) {
              console.log('✅ User data loaded successfully');
              setUserData(userDataResult.data);
            } else {
              console.warn('⚠️ User data fetch returned unsuccessful:', userDataResult);
            }
          } catch (error) {
            console.error('❌ Failed to get user data:', error);
            CrashLogger.logError(error, {
              context: 'get_user_data',
              userId: firebaseUser.uid,
            }).catch(e => console.error('Failed to log error:', e));
          }
        } else {
          // User is signed out
          setUser(null);
          setUserData(null);
          setShowAuth(true);
          setIsRestoringAuth(false);
        }
      } catch (error) {
        console.error('❌ Error in auth state change handler:', error);
        CrashLogger.logError(error, {
          context: 'auth_state_change',
          hasUser: !!firebaseUser,
        }).catch(e => console.error('Failed to log error:', e));
      }
    });

    // Try to restore authentication state on app start
    const restoreAuth = async () => {
      try {
        console.log('🔄 Starting auth restoration...');
        const restoreResult = await authService.restoreAuthState();
        
        if (restoreResult.success) {
          console.log('✅ Auth state restored successfully - user will stay signed in');
          setUser(restoreResult.user);
          setShowAuth(false);
          setRoute('dashboard'); // Navigate to dashboard after auth restoration
          
          // Try to get user data
          try {
            const userDataResult = await authService.getUserData(restoreResult.user.uid);
            if (userDataResult.success) {
              setUserData(userDataResult.data);
            }
          } catch (error) {
            console.error('Failed to get user data after restore:', error);
          }
          
          // If user is authenticated, hide loading screen immediately
          setIsLoading(false);
        } else {
          console.log('ℹ️ No valid auth state to restore - showing sign-in screen');
          setShowAuth(true);
          // Show loading screen for a bit longer if no auth
          setTimeout(() => {
            setIsLoading(false);
          }, 1500);
        }
      } catch (error) {
        console.error('❌ Failed to restore auth state:', error);
        CrashLogger.logError(error, {
          context: 'auth_restoration',
          errorMessage: error?.message || String(error),
          timestamp: new Date().toISOString(),
        }).catch(e => console.error('Failed to log auth error:', e));
        setShowAuth(true);
        // Show loading screen for a bit longer on error
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      } finally {
        setIsRestoringAuth(false);
        isRestoring = false; // Allow auth state changes to be processed
        console.log('✅ Auth restoration complete');
      }
    };

    restoreAuth();

    return () => unsubscribe();
  }, []);

  // migrate from reminders if meds empty
  useEffect(() => {
    if (meds.length === 0 && reminders.length) {
      const converted = reminders.map(r => ({
        id: r.id,
        name: r.name,
        times: r.time ? [r.time] : (Array.isArray(r.times) ? r.times : []),
        status: 'taking',
        startDate: null,
        endDate: null,
        notes: '',
      }));
      setMeds(converted);
    }
  }, [reminders, meds.length]);

  // keep meds in sync when new reminders added
  useEffect(() => {
    if (!reminders.length) return;
    setMeds(prev => {
      const existing = new Set(prev.map(m => m.id));
      const additions = reminders.filter(r => !existing.has(r.id)).map(r => ({
        id: r.id,
        name: r.name,
        times: r.time ? [r.time] : (Array.isArray(r.times) ? r.times : []),
        status: 'taking',
        startDate: null,
        endDate: null,
        notes: '',
      }));
      return additions.length ? [...prev, ...additions] : prev;
    });
  }, [reminders]);

  // Load subscription status and cloud sync when user is authenticated
  useEffect(() => {
    if (user && !showAuth) {
      (async () => {
        try {
          console.log('📊 Loading subscription status...');
          const status = await getSubscriptionStatus(user.firebaseUser || null);
          if (status.ok) {
            console.log('✅ Subscription status loaded:', status);
            setSubscriptionStatus(status);
            
            // Check if subscription has expired (0 days left)
            const daysLeft = status.daysLeft || 0;
            const isExpired = status.status === 'expired';
            
            if (isExpired && status.plan !== 'pro') {
              console.log('⚠️ Subscription expired - showing modal');
              setShowSubscriptionExpiredModal(true);
              // Note: User will be logged out when they dismiss the modal
            }
          } else {
            console.log('⚠️ Failed to load subscription status:', status);
          }
        } catch (error) {
          console.error('❌ Error loading subscription status:', error);
        }

        // Cloud sync - pull all active data from cloud
        try {
          console.log('☁️ Pulling cloud data...');
          const cloudResult = await cloudSyncService.pullAll();
          
          if (cloudResult.success && cloudResult.data) {
            const cloudData = cloudResult.data;
            console.log('📦 Cloud data received:', Object.keys(cloudData));
            
            // Merge medications - cloudData.medications is the payload array directly
            if (cloudData.medications && Array.isArray(cloudData.medications)) {
              const cloudMeds = cloudData.medications;
              console.log('💊 Merging medications from cloud:', cloudMeds.length, 'items');
              setMeds(prev => {
                const merged = [...prev];
                cloudMeds.forEach(cloudMed => {
                  const existingIndex = merged.findIndex(m => m.id === cloudMed.id);
                  if (existingIndex >= 0) {
                    merged[existingIndex] = cloudMed;
                  } else {
                    merged.push(cloudMed);
                  }
                });
                return merged;
              });
            }
            
            // Also directly fetch medications from database as backup
            try {
              console.log('💊 Directly fetching medications from database...');
              const medsResponse = await authenticatedFetch(`${API_BASE}/api/medications?userId=${user.uid}`);
              if (medsResponse.ok) {
                const medsResult = await medsResponse.json();
                if (medsResult.ok && medsResult.medications && Array.isArray(medsResult.medications)) {
                  console.log('💊 Loaded', medsResult.medications.length, 'medications from database');
                  
                  // Convert database format to app format
                  const dbMeds = medsResult.medications.map(dbMed => ({
                    id: dbMed.id || `${Date.now()}-${Math.random()}`,
                    name: dbMed.medication_name || '',
                    strength: dbMed.strength_value && dbMed.strength_unit 
                      ? `${dbMed.strength_value}${dbMed.strength_unit}` 
                      : '',
                    strengthValue: dbMed.strength_value || '',
                    strengthUnit: dbMed.strength_unit || '',
                    status: dbMed.status || 'taking',
                    times: Array.isArray(dbMed.times) ? dbMed.times : (dbMed.times ? [dbMed.times] : []),
                    startDate: dbMed.start_date || null,
                    endDate: dbMed.end_date || null,
                    notes: dbMed.notes || '',
                    dosesLeft: dbMed.doses_left || '0',
                    quantity: dbMed.quantity_value && dbMed.quantity_unit 
                      ? `${dbMed.quantity_value} ${dbMed.quantity_unit}` 
                      : '',
                    quantityValue: dbMed.quantity_value || '0',
                    quantityUnit: dbMed.quantity_unit || 'Tablet',
                    remainingQuantity: dbMed.doses_left || '0',
                    lastRefill: dbMed.last_refill || null,
                    isSingleComponent: true, // Default for database meds
                    dbId: dbMed.id, // Store database ID for future updates
                  }));
                  
                  // Replace local meds with database meds (database is source of truth)
                  // Always use database meds, even if empty (to clear defaults)
                  console.log('💊 Replacing local medications with database medications');
                  setMeds(dbMeds);
                  // Also save to AsyncStorage for offline access
                  await AsyncStorage.setItem(STORAGE.meds, JSON.stringify(dbMeds));
                }
              } else {
                console.warn('⚠️ Failed to fetch medications from database:', medsResponse.status);
              }
            } catch (medsError) {
              console.error('❌ Error fetching medications from database:', medsError);
            }
            
            // Merge reminders - cloudData.reminders is the payload array directly
            if (cloudData.reminders && Array.isArray(cloudData.reminders)) {
              const cloudReminders = cloudData.reminders;
              console.log('⏰ Merging reminders from cloud:', cloudReminders.length, 'items');
              setReminders(prev => {
                const merged = [...prev];
                cloudReminders.forEach(cloudRem => {
                  const existingIndex = merged.findIndex(r => r.id === cloudRem.id);
                  if (existingIndex >= 0) {
                    merged[existingIndex] = cloudRem;
                  } else {
                    merged.push(cloudRem);
                  }
                });
                return merged;
              });
            }
            
            // Merge appointments
            if (cloudData.appointments && Array.isArray(cloudData.appointments)) {
              console.log('📅 Found appointments in cloud:', cloudData.appointments.length, 'items');
              await AsyncStorage.setItem('AURIC_CLOUD_APPOINTMENTS', JSON.stringify(cloudData.appointments));
            }
            
            // Merge doctors
            if (cloudData.doctors && Array.isArray(cloudData.doctors)) {
              console.log('👨‍⚕️ Found doctors in cloud:', cloudData.doctors.length, 'items');
              await AsyncStorage.setItem('AURIC_CLOUD_DOCTORS', JSON.stringify(cloudData.doctors));
            }
            
            // Merge AI doctor preference
            if (cloudData.ai_doctor && cloudData.ai_doctor.doctor) {
              const cloudAIDoctor = cloudData.ai_doctor.doctor;
              console.log('🤖 Found AI doctor preference in cloud:', cloudAIDoctor);
              setSelectedAIDoctor(cloudAIDoctor);
            }
            
            console.log('✅ Cloud sync complete');
          } else {
            console.log('ℹ️ No cloud data found or sync failed');
          }
        } catch (error) {
          console.error('❌ Cloud sync error:', error);
        }
      })();
    }
  }, [user, showAuth]);

  const theme = useMemo(() => ({ ...(PALETTES[themeKey] || PALETTES.black), ...(night ? darkColors : {}) }), [themeKey, night]);
  const [introComplete, setIntroComplete] = useState(false);

  // --------- Helpers ----------
  const Card = createCard(() => ({  }));

  const AnimatedFloatingButton = createAnimatedFloatingButton(() => ({ lang, selectedAIDoctor, S, setAiOpen, getInitialAIMessage, setAiMessages }));

  const AnimatedButton = createAnimatedButton(() => ({  }));

  // Trial countdown widget
  const TrialWidget = createTrialWidget(() => ({ subscriptionStatus, setShowCheckout }));

  const TopBar = createTopBar(() => ({ setRoute, setShowHelpModal, theme, AnimatedButton, TrialWidget }));

  // --------- Dashboard ----------
  const nextReminder = reminders.slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''))[0];

//------------AI-----------
const [medicalInput, setMedicalInput] = useState("");
const [medicalResponse, setMedicalResponse] = useState("");

const handleAskMedicalAI = async () => {
  const answer = await askMedicalAI(medicalInput);
  setMedicalResponse(answer);
};

  // --------- AI Doctor System ----------
  const getDoctorGreeting = creategetDoctorGreeting(() => ({  }));

  // --------- Location-based distance formatting ----------
  const [userCountry, setUserCountry] = useState(null);

  // Function to detect user's country based on coordinates
  const detectUserCountry = async (latitude, longitude) => {
    try {
      console.log('🌍 Country detection - coordinates:', { latitude, longitude });
      
      // Use a simple reverse geocoding approach
      // For USA: roughly between 24-49°N and 66-125°W
      if (latitude >= 24 && latitude <= 49 && longitude >= -125 && longitude <= -66) {
        console.log('🌍 Detected as USA');
        return 'US';
      }
      // For Mexico: roughly between 14-33°N and 86-118°W (expanded range)
      if (latitude >= 14 && latitude <= 33 && longitude >= -118 && longitude <= -86) {
        console.log('🌍 Detected as Mexico');
        return 'MX';
      }
      // For China: roughly between 18-54°N and 73-135°E
      if (latitude >= 18 && latitude <= 54 && longitude >= 73 && longitude <= 135) {
        return 'CN';
      }
      // Fallback: if language is Spanish, likely in a Spanish-speaking country (metric)
      if (lang === 'es') {
        console.log('🌍 Language is Spanish, defaulting to metric units');
        return 'MX'; // Use MX to trigger metric units
      }
      
      // Default to metric for other countries
      console.log('🌍 Detected as other country (using metric)');
      return 'OTHER';
    } catch (error) {
      console.log('Error detecting country:', error);
      console.log('🌍 Country detection failed, defaulting to metric');
      return 'OTHER'; // Default to metric
    }
  };

  // --------- Pharmacies ----------
  async function openPharmaciesNearMe() {
    try {
      const { status } = await requestSearchLocationPermission();
      if (status !== 'granted') return Alert.alert('Location denied', 'Enable location to search nearby pharmacies.');
      const { coords } = await Location.getCurrentPositionAsync({});
      const q = encodeURIComponent('pharmacy');
      const url = Platform.select({
        ios: `http://maps.apple.com/?q=${q}&ll=${coords.latitude},${coords.longitude}`,
        android: `geo:${coords.latitude},${coords.longitude}?q=${q}`,
        default: `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=`,
      });
      Linking.openURL(url);
    } catch (e) {
      Alert.alert('Map error', 'Could not open maps.');
    }
  }

  // --------- Prescription: pick image & create simple PDF ----------
  async function addRxPhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Camera needed', 'Please allow camera.');
    const photo = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!photo.canceled) {
      const uri = photo.assets?.[0]?.uri;
      if (uri) setRxPhotos((p) => [...p, { id: `${Date.now()}`, uri }]);
    }
  }

  async function exportRxToPDF() {
    if (rxPhotos.length === 0) return Alert.alert('No photos', 'Add at least one prescription photo.');
    const imgs = rxPhotos.map(p => `<div style="margin:12px 0"><img src="${p.uri}" style="width:100%"/></div>`).join('');
    const html = `<html><body>${imgs}</body></html>`;
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share prescription PDF' });
    } else {
      Alert.alert('PDF saved', uri);
    }
  }

  // --------- Appointment Log: voice note ----------
  const recRef = useRef(null);
  const soundRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  async function toggleRecord() {
    try {
      if (!isRecording) {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') return;
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const rec = new Audio.Recording();
        await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await rec.startAsync();
        recRef.current = rec;
        setIsRecording(true);
      } else {
        const rec = recRef.current;
        if (!rec) return;
        await rec.stopAndUnloadAsync();
        const uri = rec.getURI();
        setIsRecording(false);
        if (uri) {
          const note = { id: `${Date.now()}`, uri, createdAt: Date.now() };
          setVoiceNotes((v) => [note, ...v]);
          Alert.alert(S.saved);
        }
      }
    } catch (e) {
      setIsRecording(false);
      Alert.alert('Recording error');
    }
  }

  async function playNote(uri) {
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      await sound.playAsync();
    } catch { /* noop */ }
  }

  // --------- AI Sheet (stub: replace with your backend later) ----------
  async function askAI() {
  const q = aiInput.trim();
  if (!q) return;
  setAiMessages(m => [...m, { role: 'user', text: q }]);
  setAiInput('');

  try {
    const res = await authenticatedFetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: q }),
    });
    const data = await res.json();
    const reply = data?.reply || 'Sorry—no response.';
    setAiMessages(m => [...m, { role: 'assistant', text: addCatExpressions(reply, selectedAIDoctor, lang) }]);
  } catch (e) {
    setAiMessages(m => [...m, { role: 'assistant', text: S.networkError || 'Network error. Try again.' }]);
  }
}

  // --------- Membership Modals Component (Cancel Confirmation + Result) ----------
  const MembershipModals = createMembershipModals(() => ({ showCancelMembershipModal, setShowCancelMembershipModal, showMembershipResultModal, setShowMembershipResultModal, membershipResult, confirmCancelMembership, S }));

  // --------- Dashboard Help Modal ----------
  const DashboardHelpModal = createDashboardHelpModal(() => ({ showHelpModal, setShowHelpModal, lang, t, isReady, S }));

  // --------- Screens ----------
  const Dashboard = createDashboard(() => ({ setRoute, S, Card, TopBar, nextReminder }));

  const Pharmacies = createPharmacies(() => ({ lang, pharmacies, setPharmacies, pharmaciesLoading, setPharmaciesLoading, pharmaciesError, setPharmaciesError, labsLoading, labsError, S, theme, userCountry, Header }));

  const Labs = createLabs(() => ({ lang, labs, setLabs, labsLoading, setLabsLoading, labsError, setLabsError, S, theme, userCountry, Header }));

  const Prescription = createPrescription(() => ({ S, rxPhotos, theme, addRxPhoto, exportRxToPDF, Header }));

  const Appointments = createAppointments(() => ({ S, voiceNotes, theme, isRecording, toggleRecord, playNote, Header }));

  // State for dropdown sections
  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    notifications: false,
    security: false,
    privacy: false,
    wallpaper: false,
    language: false,
    colorSettings: false,
    doctorAI: false,
    fontColor: false,
    dayNight: false,
    help: true,
    account: false
  });

  const CollapsibleSection = createCollapsibleSection(() => ({ theme, expandedSections }));

  const Header = createHeader(() => ({ route, setRoute, theme, AnimatedButton }));

  const Settings = createSettings(() => ({ setRoute, setPrivacyOpen, handleSignOut, handleCancelMembership, handleRestartMembership, lang, notificationsEnabled, setNotificationsEnabled, emailNotifications, setEmailNotifications, smsNotifications, setSmsNotifications, selectedAIDoctor, setSelectedAIDoctor, dataCollection, setDataCollection, analytics, setAnalytics, subscriptionStatus, t, currentLanguage, handleLanguageChange, S, theme, setExpandedSections, CollapsibleSection, Header, RowSwitch, SwitchRow }));

  const Section = createSection(() => ({  }));

  const RowSwitch = createRowSwitch(() => ({ theme }));

  const SwitchRow = createSwitchRow(() => ({  }));
// --------- Medications Screen ----------
// Medications component now imported from separate file

// --------- Supplements Screen ---------- 
// Supplements component now imported from separate file

 // DISABLED - ALL SUPPLEMENTS CODE COMMENTED OUT
 // The inline Supplements component has been moved to components/Supplements.js

 // Screen selection moved to return statement to prevent remounting

// ---------- Utility functions ----------
// Utility: trim a string to n chars, add ellipsis if needed

  // final return (inside the App function)
  return !fontsLoaded ? (
  <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#222' }}>
    <Text style={{ color:'#fff' }}>Loading...</Text>
  </View>
) : (
  <AppProviders theme={theme}>
    <ConsentHost language={lang} user={showAuth ? null : user} privacyOpen={privacyOpen} onHealthConsentChange={setHealthConsentReady} onPrivacyClose={() => setPrivacyOpen(false)} />
    <StatusBar 
      barStyle={theme.mode === 'light' ? 'dark-content' : 'light-content'} 
      backgroundColor="transparent"
      translucent={true}
    />
    
    {/* Authentication Screen - Show first */}
        {isRestoringAuth ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
            <Text style={{ color: '#D4AF37', fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 20 }}>
              🔄 Restoring your session...
            </Text>
            <Text style={{ color: '#D4AF37', fontSize: 14, fontFamily: 'Inter_400Regular', opacity: 0.7, textAlign: 'center', paddingHorizontal: 40, marginBottom: 20 }}>
              Checking if you're already signed in
            </Text>
            <ActivityIndicator size="large" color="#D4AF37" />
          </View>
        ) : isLoading ? (
          <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />
        ) : showAuth ? (
          <LoginIntro enabled={!introComplete} language={lang} onComplete={() => setIntroComplete(true)}>
          <SignInScreen
            onAuthSuccess={handleAuthSuccess}
            onClose={handleAuthClose}
            onLanguageChange={handleLanguageChange}
            resetToSignIn={resetAuthToSignIn}
            onResubscribe={showResubscribeButton ? () => {
              // Open checkout modal for resubscription
              // User is already authenticated at this point
              setShowCheckout(true);
            } : undefined}
          />
          </LoginIntro>
        ) : !healthConsentReady ? (
          <View style={{ flex: 1, backgroundColor: '#161616' }} />
        ) : (
      /* Main App Content - Only show after authentication and health consent */
      <>
        <View style={{ flex: 1 }}>
        {createAppNavigator(() => ({ route, setRoute, user, lang, themeKey, fastingProfile, setFastingProfile, saveFastingProfileToDB, refillPharmacies, refillCoords, refillCurrency, refillFxMeta, isReady, S, reminders, setReminders, meds, setMeds, supplements, setSupplements, theme, userCountry, Dashboard, Pharmacies, Labs, Prescription, Settings }))()}
        </View>

        {/* Floating AI button */}
        <AnimatedFloatingButton />
        
        {/* Dashboard Help Modal */}
        <DashboardHelpModal />
        
        {/* Cancel Membership Confirmation Modal */}
        <MembershipModals />
        <PremiumTabBar route={route} onNavigate={setRoute} dark={theme.mode === 'dark'} language={lang} />
      </>
    )}

    {/* AI modal */}
    <Modal
      visible={aiOpen}
      animationType="slide"
      transparent
      onRequestClose={() => setAiOpen(false)}
      presentationStyle="overFullScreen"
>
  <View style={styles.sheetBackdrop}>
    <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.chip, flex: 1 }]}>
        <View style={styles.sheetHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: theme.text, fontFamily: 'Inter_800ExtraBold', marginRight: 8 }}>
              {(() => {
                const names = {
                  'alfred': S.drAlfred || 'Alfred',
                  'mimi': S.drMimi || 'Mimi',
                  'pawlmer': S.pawlmer || 'Pawlmer'
                };
                return names[selectedAIDoctor] || (S.drAlfred || 'Alfred');
              })()}
            </Text>
            <Text accessibilityLabel={lang === 'es' ? 'Asistente de IA' : 'AI assistant'} style={{ fontSize: 32 }}>{selectedAIDoctor === 'pawlmer' ? '\u{1F431}' : '\u{1F4AC}'}</Text>
        </View>
        <TouchableOpacity onPress={() => setAiOpen(false)}>
          <Text style={{ color: theme.sub, fontFamily: 'Inter_600SemiBold' }}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, minHeight: 200, paddingBottom: 100 }}>
        <ScrollView
          ref={aiScrollRef}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {aiMessages.map((m, idx) => (
            <View
              key={idx}
              style={[
                styles.msg,
                m.role === 'user' ? styles.msgUser : styles.msgBot,
                { borderColor: theme.chip, backgroundColor: m.role === 'user' ? theme.chip : theme.card },
              ]}
            >
              {m.role === 'assistant' && idx === aiMessages.length - 1 && aiSending ? (
                <TypingEffect 
                  text={m.text} 
                  speed={20}
                  style={{ color: theme.text, fontFamily: 'Inter_400Regular' }}
                  showCursor={true}
                />
              ) : (
              <Text style={{ color: theme.text, fontFamily: 'Inter_400Regular' }}>{m.text}</Text>
              )}
            </View>
          ))}
          
          {/* Typing indicator when AI is starting to respond */}
          {aiSending && aiMessages.length > 0 && aiMessages[aiMessages.length - 1].role === 'user' && (
            <View
              style={[
                styles.msg,
                styles.msgBot,
                { borderColor: theme.chip, backgroundColor: theme.card },
              ]}
            >
              <TypingEffect 
                text={S.aiThinking || "AI is thinking..."}
                speed={100}
                style={{ color: theme.sub, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}
                showCursor={true}
              />
            </View>
          )}
        </ScrollView>
      </View>

      {/* Fixed input area that stays visible - ALWAYS RENDERED */}
      <View style={[
        styles.aiInputContainer,
        { 
          backgroundColor: theme.card,
          borderTopColor: theme.chip,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          minHeight: 80, // Ensure minimum height
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }
      ]}>
      <View style={styles.aiInputRow}>
        <TextInput
          ref={aiInputRef}
          value={aiInput}
          onChangeText={setAiInput}
          placeholder="Ask about medications, pharmacies…"
          placeholderTextColor={theme.sub}
            onSubmitEditing={() => sendAi(reminders, rxPhotos, meds, supplements, herbs, theme, fastingProfile, pharmacies, labs, userCountry)}
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
            returnKeyType="send"
            enablesReturnKeyAutomatically={true}
            onFocus={() => {
              // Keep keyboard open when AI input is focused
              setTimeout(() => {
                if (aiInputRef.current) {
                  aiInputRef.current.focus();
                }
              }, 100);
            }}
          style={[
            styles.aiInput,
              { 
                color: theme.text, 
                borderColor: theme.chip, 
                fontFamily: 'Inter_400Regular', 
                minHeight: 44,
                backgroundColor: theme.card,
              },
            ]}
          />
          <PremiumButton 
            style={[styles.aiBtn, { backgroundColor: theme.accent }]} 
            onPress={() => sendAi(reminders, rxPhotos, meds, supplements, herbs, theme, fastingProfile, pharmacies, labs, userCountry)} 
            disabled={aiSending || streamLoading}
          >
            <Text style={{ color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }}>
              {streamLoading ? '...' : 'Send'}
            </Text>
        </PremiumButton>
        {streamLoading ? (
          <TouchableOpacity style={[styles.aiBtn, { backgroundColor: theme.card, borderWidth:1, borderColor: theme.chip }]} onPress={streamCancel}>
            <Text style={{ color: theme.text, fontFamily: 'Inter_800ExtraBold' }}>Stop</Text>
          </TouchableOpacity>
        ) : null}
        </View>
      </View>

      <Text style={{ color: theme.sub, fontSize: 12, marginTop: 4, textAlign: 'center', fontFamily: 'Inter_400Regular' }}>
        {S.tapToTalk}: (voice input wired in next build)
      </Text>
    </View>
  </View>
    </Modal>

    {/* Custom Alert */}
    <CustomAlert
      visible={!!alert}
      title={alert?.title || ''}
      message={alert?.message || ''}
      buttonText={alert?.buttonText || 'OK'}
      onPress={handlePress}
    />

    {/* Stripe Checkout Modal */}
    <StripeCheckoutModal
      visible={showCheckout}
      onClose={() => setShowCheckout(false)}
      theme={theme}
      country={userCountry || (userData?.country || 'US')}
      onSuccess={async () => {
        // Refresh subscription status after successful payment
        try {
          const status = await getSubscriptionStatus(user?.firebaseUser);
          if (status.ok) {
            setSubscriptionStatus(status);
            // If user was on auth screen (resubscribing), close it and go to dashboard
            if (showAuth) {
              setShowAuth(false);
              setRoute('dashboard');
              setShowResubscribeButton(false);
            }
            // Close checkout modal
            setShowCheckout(false);
          }
        } catch (error) {
          console.error('Failed to refresh subscription status:', error);
        }
      }}
    />

    {/* Subscription Expired Modal */}
    <SubscriptionExpiredModal
      visible={showSubscriptionExpiredModal}
      onSubscribe={handleSubscriptionExpiredSubscribe}
      onDismiss={handleSubscriptionExpiredDismiss}
      theme={theme}
      lang={lang}
    />
    </AppProviders>
);
}
