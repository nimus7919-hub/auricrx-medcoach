
// AuricRx MedCoach — Dashboard Build (single-file version) with Themes + Fonts
// SDK 53 friendly. Minimal deps; stubs where cloud keys are needed.

import React, { useEffect, useMemo, useRef, useState } from 'react';
  import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  Modal, TextInput, Switch, Image, Linking, Platform, Animated, Keyboard,
  StatusBar, SafeAreaView, FlatList, ActivityIndicator
} from 'react-native';
import TypingEffect from './src/components/TypingEffect';
import * as ImagePicker from 'expo-image-picker';
import { herbs } from './src/data/herbs';	
import DateTimePicker from '@react-native-community/datetimepicker';

import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import authService from './src/services/authService';
import { getSubscriptionStatus } from './src/services/trialService';
import cloudSyncService from './src/services/cloudSyncService';
import StripeCheckoutModal from './src/components/StripeCheckoutModal';
import * as Location from 'expo-location';
import { Audio } from 'expo-audio';
import { Video } from 'expo-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { askMedicalAI } from './src/api/api.medical-ai';
import Constants from "expo-constants";
import MedicationRefillModal from './components/MedicationRefillModal';
import ErrorBoundary from './components/ErrorBoundary';
import HerbsScreen from './src/screens/HerbsScreen';
import DocScanScreen from './src/screens/DocScanScreen';
import MedicalDocumentsScreen from './src/screens/MedicalDocumentsScreen';
import SmartNotificationsScreen from './src/screens/SmartNotificationsScreen';
import HealthAnalyticsScreen from './src/screens/HealthAnalyticsScreen';
import AppointmentManagementScreen from './src/screens/AppointmentManagementScreen';
import AIHealthScreen from './src/screens/AIHealthScreen';
import FastingProfileScreen from './src/screens/FastingProfileScreen';
import Medications from './components/Medications';
import Supplements from './components/Supplements';
import Reminders from './components/Reminders';
import SignInScreen from './src/screens/SignInScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AdminProfileScreen from './src/screens/AdminProfileScreen';
import LoadingScreen from './src/components/LoadingScreen';
import { WallpaperProvider, useWallpaper } from './src/contexts/WallpaperContext';
import WallpaperSettingsScreen from './src/screens/WallpaperSettingsScreen';
import { useTimeFormat } from './src/hooks/useTimeFormat';
import { formatTime, TIME_FORMAT_LABELS } from './src/utils/time';
import WallpaperWrapper from './src/components/WallpaperWrapper';
import DynamicText from './src/components/DynamicText';
import { useDynamicTheme } from './src/hooks/useDynamicTheme';
import CustomAlert from './src/components/CustomAlert';
import { useCustomAlert } from './src/hooks/useCustomAlert';
import { useTranslation } from './src/hooks/useTranslation';
import { createTranslationService } from './src/services/translationService';
import './src/i18n';

const USING_EXPO_GO = Constants.appOwnership === "expo";

// Test console log to verify logging works
console.log('🚀 AuricRx MedCoach App Starting...', { USING_EXPO_GO });

import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black
} from '@expo-google-fonts/inter';

// --- backend endpoint ---
const BACKEND_URL = "https://auricrx-medcoach.onrender.com/ask";
const API_BASE_URL = "https://auricrx-medcoach.onrender.com";


// ---------- i18n (inline, tiny) ----------
const STRINGS = {
  en: {
    nextReminder: 'Next reminder',
    reminders: 'Reminders',
    pharmacyLocations: 'Pharmacy Locations',
    aiConsultant: 'AI Consultant',
    labsLocations: 'Labs Locations',
    prescription: 'Prescription',
    appointmentLog: 'Appointment Tracker',
    appointmentSubtitle: 'Schedule & manage healthcare visits',
    // Appointment Management translations
    doctorVisit: 'Doctor Visit',
    labTest: 'Lab Test',
    specialist: 'Specialist',
    emergency: 'Emergency',
    appointmentManagement: 'Appointment Management',
    appointmentManagementDesc: 'Schedule appointments, manage doctor contacts, and track your healthcare visits',
    schedule: 'Schedule',
    addDoctor: 'Add Doctor',
    refresh: 'Refresh',
    primary: 'Primary',
    followUp: 'Follow-up',
    checkup: 'Checkup',
    other: 'Other',
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rescheduled: 'Rescheduled',
    unknown: 'Unknown',
    totalAppointments: 'Total Appointments',
    upcoming: 'Upcoming',
    doctors: 'Doctors',
    upcomingAppointments: 'Upcoming Appointments',
    upcomingAppointmentsDesc: 'Your next scheduled healthcare visits',
    noUpcomingAppointments: 'No upcoming appointments scheduled',
    doctorContacts: 'Doctor Contacts',
    doctorContactsDesc: 'Your healthcare providers and their contact information',
    pharmacy: 'Pharmacy',
    error: 'Error',
    success: 'Success',
    fillAllFields: 'Please fill in all required fields',
    appointmentScheduled: 'Appointment scheduled successfully!',
    failedToSchedule: 'Failed to schedule appointment',
    doctorContactAdded: 'Doctor contact added successfully!',
    failedToAddDoctor: 'Failed to add doctor contact',
    appointmentCompleted: 'Appointment marked as completed!',
    failedToUpdate: 'Failed to update appointment',
    scheduleAppointment: 'Schedule Appointment',
    addDoctorContact: 'Add Doctor Contact',
    appointmentType: 'Appointment Type',
    selectAppointmentType: 'Select Appointment Type',
    doctorName: 'Doctor Name',
    doctorNamePlaceholder: 'Enter doctor name',
    specialty: 'Specialty',
    specialtyPlaceholder: 'Enter specialty',
    phoneNumber: 'Phone Number',
    phonePlaceholder: 'Enter phone number',
    address: 'Address',
    addressPlaceholder: 'Enter address',
    appointmentOverview: 'Appointment Overview',
    noDoctorContactsYet: 'No doctor contacts added yet',
    title: 'Title',
    location: 'Location',
    date: 'Date',
    time: 'Time',
    notes: 'Notes',
    notesOptional: 'Notes (Optional)',
    cancel: 'Cancel',
    titlePlaceholder: 'e.g., Annual Checkup, Blood Test',
    locationPlaceholder: 'e.g., Dr. Smith\'s Office, LabCorp',
    datePlaceholder: 'YYYY-MM-DD',
    timePlaceholder: 'HH:MM (24-hour format)',
    notesPlaceholder: 'Add any notes or special instructions...',
    appointmentServiceNotAvailable: 'Appointment service not available',
    // Health Metric Types
    bloodPressure: 'Blood Pressure',
    weight: 'Weight',
    bloodSugar: 'Blood Sugar',
    heartRate: 'Heart Rate',
    temperature: 'Temperature',
    oxygenSaturation: 'Oxygen Saturation',
    painLevel: 'Pain Level',
    mood: 'Mood',
    energyLevel: 'Energy Level',
    sleepHours: 'Sleep Hours',
    steps: 'Steps',
    // AI Health Screen translations
    aiHealthAssistant: 'AI Health Assistant',
    intelligentHealthcareFeatures: 'Intelligent healthcare features powered by AI for better health decisions',
    aiHealthFeatures: 'AI Health Features',
    healthInsights: 'Health Insights',
    symptomAnalyses: 'Symptom Analyses',
    drugChecks: 'Drug Checks',
    voiceNotes: 'Voice Notes',
    analyzeSymptoms: 'Analyze Symptoms',
    checkInteractions: 'Check Interactions',
    voiceNote: 'Voice Note',
    recentAnalyses: 'Recent Analyses',
    noHealthInsights: 'No health insights available yet. Use the AI features to generate insights.',
    noSymptomAnalyses: 'No symptom analyses yet. Try analyzing your symptoms.',
    describeSymptoms: 'Describe your symptoms',
    enterSymptomsPlaceholder: 'Enter your symptoms separated by commas (e.g., fever, headache, fatigue)',
    listMedications: 'List your medications',
    enterMedicationsPlaceholder: 'Enter your medications separated by commas (e.g., Aspirin, Metformin, Lisinopril)',
    // Fasting Analytics translations
    fastingAnalytics: 'Fasting Analytics',
    fastingCompatibilityCheck: 'Fasting Compatibility Check',
    fastingDescription: 'Check if your current medications are compatible with intermittent fasting',
    fastingDisclaimer: 'This recommendation is AI-generated and should not replace professional medical advice.',
    warnings: 'Warnings',
    // Fasting Profile translations
    fastingProfile: 'Fasting Profile',
    fastingProfileDescription: 'Set up your health profile for personalized fasting recommendations',
    healthConditions: 'Health Conditions',
    nutritionalStatus: 'Nutritional Status & Body Composition',
    mentalHealth: 'Mental Health & Cognitive Demands',
    lifestyleActivity: 'Lifestyle & Activity Level',
    fastingPreferences: 'Fasting Protocol Preferences',
    fastingGoals: 'Goals',
    medicalSupervision: 'Medical Supervision & Monitoring',
    // Health Conditions
    diabetes: 'Diabetes',
    hypoglycemia: 'Hypoglycemia',
    heartConditions: 'Heart Conditions',
    kidneyDisease: 'Kidney Disease',
    liverDisease: 'Liver Disease',
    eatingDisorders: 'Eating Disorders (past or present)',
    pregnancy: 'Pregnancy',
    breastfeeding: 'Breastfeeding',
    gastrointestinalIssues: 'Gastrointestinal Issues (ulcers, GERD, IBS)',
    // Nutritional Status
    bodyFatLevel: 'Body Fat Level',
    muscleMass: 'Muscle Mass',
    micronutrientLevels: 'Micronutrient Levels',
    hydrationLevel: 'Hydration Level',
    // Mental Health
    highStressEnvironment: 'High-Stress Environment',
    intensiveMentalTasks: 'Intensive Mental Tasks',
    anxiety: 'Anxiety',
    depression: 'Depression',
    // Lifestyle
    activityLevel: 'Activity Level',
    physicalLabor: 'Physical Labor Job',
    longShifts: 'Long Work Shifts',
    sleepQuality: 'Sleep Quality',
    // Fasting Preferences
    preferredFastingType: 'Preferred Fasting Type',
    maxFastingHours: 'Maximum Fasting Hours',
    fastingFrequency: 'Fasting Frequency',
    // Goals
    primaryGoal: 'Primary Goal',
    weightLossGoal: 'Weight Loss Goal',
    metabolicHealthGoal: 'Metabolic Health Goal',
    // Medical Supervision
    selfMonitoring: 'Self-Monitoring',
    wearableDevices: 'Wearable Devices',
    // Options
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    poor: 'Poor',
    fair: 'Fair',
    good: 'Good',
    excellent: 'Excellent',
    sedentary: 'Sedentary',
    light: 'Light',
    moderate: 'Moderate',
    athlete: 'Athlete',
    timeRestricted: 'Time-Restricted Feeding (16:8, 14:10)',
    alternateDay: 'Alternate Day Fasting',
    extended: 'Extended Fasting (24h+)',
    custom: 'Custom',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    weightLoss: 'Weight Loss',
    metabolicHealth: 'Metabolic Health',
    generalHealth: 'General Health',
    spiritual: 'Spiritual/Religious',
    medical: 'Medical',
    // Additional translations
    profileSaved: 'Profile Saved',
    fastingProfileSavedMessage: 'Your fasting profile has been saved and will be used for personalized recommendations.',
    saveProfile: 'Save Profile',
    noteType: 'Note Type',
    selectNoteType: 'Select Note Type',
    transcription: 'Transcription',
    enterVoiceNotePlaceholder: 'Enter your voice note transcription...',
    addNote: 'Add Note',
    analyze: 'Analyze',
    check: 'Check',
    enterSymptoms: 'Please enter your symptoms',
    enterMedications: 'Please enter your medications',
    enterVoiceNote: 'Please enter your voice note',
    symptomAnalysisComplete: 'Symptom Analysis Complete',
    noInteractionsFound: 'No Interactions Found',
    noKnownInteractions: 'No known drug interactions were detected between your medications.',
    drugInteractionsDetected: 'Drug Interactions Detected',
    foundInteractions: 'Found interaction(s):',
    voiceNoteAdded: 'Voice note added and processed!',
    actionItems: 'Action Items:',
    generalHealth: 'General Health',
    appointment: 'Appointment',
    sideEffect: 'Side Effect',
    symptom: 'Symptom',
    aiGeneratedInsights: 'AI-generated insights based on your health data and patterns.',
    // Documents Screen translations
    medicalDocuments: 'Medical Documents',
    organizeDocuments: 'Keep your important medical documents organized and ready for doctor visits',
    addDocument: 'Add Document',
    takePhoto: 'Take Photo',
    uploadFromGallery: 'Upload from Gallery',
    frontSide: 'Front Side',
    backSide: 'Back Side',
    frontOfCard: 'Front of Card',
    backOfCard: 'Back of Card',
    document: 'Document',
    noDocumentsUploaded: 'No documents uploaded yet',
    documentUploadedSuccessfully: 'Document uploaded successfully!',
    photoTakenSuccessfully: 'Photo taken successfully!',
    deleteDocument: 'Delete Document',
    areYouSureDeleteDocument: 'Are you sure you want to delete this document? This cannot be undone.',
    delete: 'Delete',
    permissionRequired: 'Permission Required',
    grantCameraRollAccess: 'Please grant camera roll access to upload documents.',
    grantCameraAccess: 'Please grant camera access to take photos.',
    failedToUploadDocument: 'Failed to upload document',
    failedToTakePhoto: 'Failed to take photo',
    // Document Categories
    photoID: 'Photo ID',
    driversLicensePassport: 'Driver\'s License, Passport, etc.',
    birthCertificate: 'Birth Certificate',
    officialBirthCertificate: 'Official birth certificate',
    insuranceCard: 'Insurance Card',
    healthInsuranceInfo: 'Health insurance information',
    labResults: 'Lab Results',
    bloodTestsLabWork: 'Blood tests, lab work, etc.',
    prescriptions: 'Prescriptions',
    currentAndPastPrescriptions: 'Current and past prescriptions',
    medicalRecords: 'Medical Records',
    medicalHistoryReports: 'Medical history, reports',
    otherDocuments: 'Other Documents',
    anyOtherMedicalDocuments: 'Any other medical documents',
    recentSymptomAnalyses: 'Your recent symptom analyses and health assessments.',
    symptomAnalysis: 'Symptom Analysis',
    drugInteractionCheck: 'Drug Interaction Check',
    upcoming: 'Upcoming',
    doctors: 'Doctors',
    upcomingAppointments: 'Upcoming Appointments',
    upcomingAppointmentsDesc: 'Your scheduled appointments for the next 30 days.',
    noUpcomingAppointments: 'No upcoming appointments scheduled',
    doctorContacts: 'Doctor Contacts',
    doctorContactsDesc: 'Your healthcare providers and their contact information.',
    scheduleAppointment: 'Schedule Appointment',
    addDoctorContact: 'Add Doctor Contact',
    appointmentType: 'Appointment Type',
    selectAppointmentType: 'Select Appointment Type',
    doctorName: 'Doctor Name',
    specialty: 'Specialty',
    phoneNumber: 'Phone Number',
    address: 'Address',
    doctorNamePlaceholder: 'e.g., Dr. John Smith',
    specialtyPlaceholder: 'e.g., General Practice, Cardiology',
    phonePlaceholder: 'e.g., (555) 123-4567',
    addressPlaceholder: 'Enter full address...',
    error: 'Error',
    success: 'Success',
    fillAllFields: 'Please fill in all required fields',
    appointmentScheduled: 'Appointment scheduled successfully!',
    failedToSchedule: 'Failed to schedule appointment',
    doctorContactAdded: 'Doctor contact added successfully!',
    failedToAddDoctor: 'Failed to add doctor contact',
    appointmentCompleted: 'Appointment marked as completed!',
    failedToUpdate: 'Failed to update appointment',
    // AI Health translations
    symptom: 'Symptom',
    sideEffect: 'Side Effect',
    generalHealth: 'General Health',
    enterSymptoms: 'Please enter your symptoms',
    // Smart Notifications translations
    smartServiceNotAvailable: 'Smart notifications service not available',
    addLocationReminder: 'Add Location Reminder',
    enterLocationName: 'Enter the name of the location (e.g., "CVS Pharmacy", "Dr. Smith\'s Office"):',
    reminderMessage: 'Reminder Message',
    reminderMessagePrompt: 'What should the reminder say when you\'re near this location?',
    locationReminderAdded: 'Location reminder added!',
    failedToAddLocationReminder: 'Failed to add location reminder',
    addWeatherAlert: 'Add Weather Alert',
    chooseWeatherCondition: 'Choose the weather condition to monitor:',
    highPollen: 'High Pollen',
    extremeTemperature: 'Extreme Temperature',
    highHumidity: 'High Humidity',
    poorAirQuality: 'Poor Air Quality',
    pollenMessage: 'Consider taking allergy medication',
    temperatureMessage: 'Check if you need temperature-sensitive medications',
    humidityMessage: 'High humidity may affect your condition',
    airQualityMessage: 'Consider wearing a mask or staying indoors',
    weatherAlertAdded: 'Weather alert added!',
    failedToAddWeatherAlert: 'Failed to add weather alert',
    healthJournal: 'Health Journal Widget',
    dashboard: 'Dashboard',
    settings: 'Settings',
    profile: 'Profile',
    notifications: 'Notifications',
    security: 'Security',
    privacy: 'Privacy',
    appearance: 'Appearance',
    wallpaper: 'Wallpaper',
    pushNotifications: 'Push Notifications',
    emailNotifications: 'Email Notifications',
    smsNotifications: 'SMS Notifications',
    changePassword: 'Change Password',
    dataCollection: 'Data Collection',
    analytics: 'Analytics',
    changeWallpaper: 'Change Wallpaper',
    chooseWallpaperDescription: 'Choose from beautiful wallpapers or solid colors',
    language: 'Language',
    colorSettings: 'Color Settings',
    dayNight: 'Day / Night',
    moodShift: 'Mood-Based Theme Shift',
    help: 'Help',
    emailUs: 'Email us',
    askAI: 'Ask AI',
    tapToTalk: 'Tap to speak',
    stop: 'Stop',
    addReminder: 'Add Reminder',
    addPhoto: 'Add Photo',
    toPDF: 'Create PDF',
    record: 'Record',
    play: 'Play',
    save: 'Save',
    recording: 'Recording…',
    saved: 'Saved',
    startServerInfo: 'Start local dev server and connect',
    medications: 'Medications',
    refill: 'Refill',
    edit: 'Edit',
    addMedication: 'Add Medication',
    editMedication: 'Edit Medication',
    dosesLeft: 'Doses left',
    status: 'Status',
    times: 'Times',
    delete: 'Delete',
    cancel: 'Cancel',
    saveBtn: 'Save',
    add: 'Add',
    pickTime: 'Pick time',
    herbs: 'Herbs',
    supplements: 'Supplements',
    smartAlerts: 'Smart Alerts',
    healthAnalytics: 'Health Analytics',
    aiHealth: 'AI Health',
    documents: 'Documents',
    appointments: 'Appointments',
    findNearbyPharmacies: 'Find pharmacies near your location',
    findNearbyLabs: 'Find medical labs near your location',
    loading: 'Loading...',
    loadingPharmacies: 'Loading nearby pharmacies...',
    loadingLabs: 'Loading nearby labs...',
    refresh: 'Refresh',
    findNearbyPharmaciesBtn: 'Find Nearby Pharmacies',
    findNearbyLabsBtn: 'Find Nearby Labs',
    lastUpdated: 'Last updated',
    noPharmaciesFound: 'No pharmacies found',
    noLabsFound: 'No labs found',
    errorLoadingPharmacies: 'Failed to load nearby pharmacies. Please try again.',
    errorLoadingLabs: 'Failed to load nearby labs. Please try again.',
    myDoctorAI: 'My Doctor AI',
    selectAI: 'Select AI Doctor',
    drAlfred: 'Dr. Alfred',
    drMimi: 'Dr. Mimi',
    drPawlmer: 'Dr. Pawlmer',
    directions: 'Directions',
    info: 'Info',
    call: 'Call',
    noPharmaciesFound: 'No pharmacies found',
    noLabsFound: 'No labs found',
    foundPharmacies: 'Found {count} nearby pharmacies',
    foundLabs: 'Found {count} nearby labs',
    lastUpdated: 'Last updated',
    testTypes: 'Test Types',
    showAll: 'Show all',
    close: 'Close',
    addMedication: 'Add Medication',
    editMedication: 'Edit Medication',
    deleteMedication: 'Delete Medication',
    dosesLeft: 'doses left',
    taking: 'Taking',
    onHold: 'On hold',
    finished: 'Finished',
    addReminder: 'Add Reminder',
    namePlaceholder: 'Name',
    pickTime: 'Pick time',
    addReminderBtn: 'Add Reminder',
    searchHerbs: 'Search herbs...',
    searchSupplements: 'Search supplements...',
    addSupplement: 'Add Supplement',
    refill: 'Refill',
    refillSoon: 'Refill soon',
    taking: 'Taking',
    helpUsGetPrice: 'Help Us Get Price',
    lowest: 'Lowest',
    sortBy: 'Sort',
    distance: 'Distance',
    price: 'Price',
    name: 'Name',
    refresh: 'Refresh',
    showAll: 'Show all',
    close: 'Close',
    reserve: 'Reserve (stub)',
    contributionDescription: 'Help us improve our medication price database by sharing what you found:',
    medicationNamePlaceholder: 'Enter medication name',
    strengthPlaceholder: 'e.g., 100mg, 50mg/500mg',
    pricePlaceholder: 'Enter price (e.g., 25.50)',
    quantityPlaceholder: 'e.g., 30 tablets, 1 bottle',
    storeNamePlaceholder: 'Enter store name',
    storeAddressPlaceholder: 'Enter store address',
    contributionError: 'Missing Information',
    contributionErrorText: 'Please fill in medication name, price, and store name.',
    contributionSuccess: 'Thank You!',
    contributionSuccessText: 'Your price information has been saved and will help improve our database for everyone.',
    noPharmaciesFound: 'No Pharmacies Found',
    noPharmaciesMessage: 'No pharmacies found in your area. Please try again.',
    retry: 'Retry',
    ok: 'OK',
    fxLabel: 'FX',
    never: 'Never',
    refillComplete: 'Refill Complete',
    smartNotifications: 'Smart Notifications',
    smartNotificationsActive: 'Smart Notifications Active',
    smartFeatures: 'Smart Features',
    smartRefillPredictions: 'Smart Refill Predictions',
    intelligentTiming: 'Intelligent Timing',
    contextAwareReminders: 'Context-Aware Reminders',
    locationBasedReminders: 'Location-Based Reminders',
    noLocationReminders: 'No location reminders set up yet',
    addLocationReminder: 'Add Location Reminder',
    weatherBasedAlerts: 'Weather-Based Alerts',
    noWeatherAlerts: 'No weather alerts set up yet',
    addWeatherAlert: 'Add Weather Alert',
    healthAnalytics: 'Health Analytics',
    trackHealthMetrics: 'Track your health metrics, medication adherence, and side effects',
    healthOverview: 'Health Overview',
    metricsRecorded: 'Metrics Recorded',
    adherenceRate: 'Adherence Rate',
    sideEffects: 'Side Effects',
    medications: 'Medications',
    recentHealthMetrics: 'Recent Health Metrics',
    trackVitalSigns: 'Track your vital signs and health indicators over time',
    noHealthMetrics: 'No health metrics recorded yet',
    addHealthMetric: 'Add Health Metric',
    medicationAdherence: 'Medication Adherence',
    trackMedicationSchedule: 'Track how well you\'re following your medication schedule',
    noAdherenceData: 'No medication adherence data yet',
    sideEffectsMonitoring: 'Side Effects Monitoring',
    trackSideEffects: 'Track any side effects you experience from medications',
    noSideEffectsRecorded: 'No side effects recorded yet',
    recordSideEffect: 'Record Side Effect',
    medicalDocuments: 'Medical Documents',
    organizeDocuments: 'Keep your important medical documents organized and ready for doctor visits',
    photoID: 'Photo ID',
    driversLicensePassport: 'Driver\'s License, Passport, etc.',
    birthCertificate: 'Birth Certificate',
    officialBirthCertificate: 'Official birth certificate',
    insuranceCard: 'Insurance Card',
    healthInsuranceInfo: 'Health insurance information',
    labResults: 'Lab Results',
    bloodTestsLabWork: 'Blood tests, lab work, etc.',
    noDocumentsUploaded: 'No documents uploaded yet',
    aiHealthAssistant: 'AI Health Assistant',
    intelligentHealthcareFeatures: 'Intelligent healthcare features powered by AI for better health decisions',
    aiHealthFeatures: 'AI Health Features',
    intelligentHealthcareFeaturesDesc: 'Intelligent healthcare features powered by AI to help you make informed health decisions',
    healthInsights: 'Health Insights',
    symptomAnalyses: 'Symptom Analyses',
    drugChecks: 'Drug Checks',
    voiceNotes: 'Voice Notes',
    analyzeSymptoms: 'Analyze Symptoms',
    checkInteractions: 'Check Interactions',
    voiceNote: 'Voice Note',
    locationBasedRemindersDesc: 'Get reminded when you\'re near pharmacies, doctor offices, or other important locations',
    weatherBasedAlertsDesc: 'Get notified when weather conditions might affect your health or medications',
    smartFeaturesDesc: 'AI-powered features that learn from your medication patterns and provide intelligent reminders',
    smartRefillPredictionsDesc: 'Predict when you\'ll need medication refills based on usage patterns',
    intelligentTimingDesc: 'Learn your medication schedule and suggest optimal reminder times',
    contextAwareRemindersDesc: 'Consider your location, weather, and schedule when sending reminders',
    smartNotificationsDesc: 'Intelligent reminders that adapt to your lifestyle and environment',
    initializing: 'Initializing...',
    active: 'Active',
    disabled: 'Disabled',
    threshold: 'Threshold',
    pollenAlert: 'Pollen Alert',
    temperatureAlert: 'Temperature Alert',
    humidityAlert: 'Humidity Alert',
    airQualityAlert: 'Air Quality Alert',
    origin: 'Origin',
    poisonous: 'Poisonous',
    summary: 'Summary',
    yes: 'Yes',
    no: 'No',
    noHerbsFound: 'No herbs found',
    generateHealthReport: 'Generate Health Report',
    metricType: 'Metric Type',
    value: 'Value',
    enterValue: 'Enter value',
    notesOptional: 'Notes (Optional)',
    addAnyNotes: 'Add any notes...',
    cancel: 'Cancel',
    addMetric: 'Add Metric',
    symptom: 'Symptom',
    symptomPlaceholder: 'e.g., headache, nausea, dizziness',
    severity: 'Severity',
    mild: 'Mild',
    moderate: 'Moderate',
    moderateSevere: 'Moderate-Severe',
    severe: 'Severe',
    verySevere: 'Very Severe',
    unknown: 'Unknown',
    selectMetricType: 'Select Metric Type',
    healthReportGenerated: 'Health Report Generated',
    summary: 'Summary',
    keyInsights: 'Key Insights',
    yourHealthMetricsNormal: 'Your health metrics are within normal ranges',
    considerMaintainingSchedule: 'Consider maintaining consistent medication schedule',
    monitorNewSideEffects: 'Monitor any new side effects closely',
    ok: 'OK',
    pleaseEnterValue: 'Please enter a value',
    pleaseEnterValidNumber: 'Please enter a valid number',
    pleaseEnterSymptom: 'Please enter a symptom',
    sideEffectRecorded: 'Side effect recorded!',
    error: 'Error',
    success: 'Success',
    medicationName: 'Medication name',
    strengthExample: 'Strength (e.g., 500mg)',
    selectTimes: 'Select times',
    startDate: 'Start Date',
    endDateOptional: 'End Date (optional)',
    notesOptional: 'Notes (optional)',
    status: 'Status',
    taking: 'Taking',
    onHold: 'On Hold',
    stopped: 'Stopped',
    addMedication: 'Add Medication',
    editMedication: 'Edit Medication',
    deleteMedication: 'Delete Medication',
    supplementName: 'Supplement name',
    brand: 'Brand',
    dosage: 'Dosage',
    selectTimes: 'Select times',
    startDate: 'Start Date',
    endDateOptional: 'End Date (optional)',
    notesOptional: 'Notes (optional)',
    dosesLeft: 'Doses left',
    prn: 'PRN',
    finished: 'Finished',
    stopped: 'Stopped',
    refillSoon: 'Refill soon',
    lowStock: 'Low stock',
    locationDenied: 'Location denied',
    enableLocation: 'Enable location to search nearby stores.',
    cancel: 'Cancel',
    addSupplement: 'Add Supplement',
    noTimingSet: 'No timing set',
    noSupplementsFound: 'No supplements found. Add your first supplement to get started.'
  },
  es: {
    nextReminder: 'Próximo recordatorio',
    reminders: 'Recordatorios',
    pharmacyLocations: 'Farmacias',
    aiConsultant: 'Consultor IA',
    labsLocations: 'Laboratorios',
    prescription: 'Receta',
    appointmentLog: 'Citas',
    appointmentSubtitle: 'Programa y gestiona visitas médicas',
    // Appointment Management translations
    doctorVisit: 'Visita al Doctor',
    labTest: 'Prueba de Laboratorio',
    specialist: 'Especialista',
    emergency: 'Emergencia',
    appointmentManagement: 'Gestión de Citas',
    appointmentManagementDesc: 'Programa citas, gestiona contactos de doctores y rastrea tus visitas médicas',
    schedule: 'Programar',
    addDoctor: 'Agregar Doctor',
    refresh: 'Actualizar',
    primary: 'Principal',
    followUp: 'Seguimiento',
    checkup: 'Revisión',
    other: 'Otro',
    scheduled: 'Programada',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    rescheduled: 'Reprogramada',
    unknown: 'Desconocida',
    totalAppointments: 'Total de Citas',
    upcoming: 'Próximas',
    doctors: 'Doctores',
    upcomingAppointments: 'Citas Próximas',
    upcomingAppointmentsDesc: 'Tus próximas visitas médicas programadas',
    noUpcomingAppointments: 'No hay citas próximas programadas',
    doctorContacts: 'Contactos de Doctores',
    doctorContactsDesc: 'Tus proveedores de atención médica y su información de contacto',
    pharmacy: 'Farmacia',
    error: 'Error',
    success: 'Éxito',
    fillAllFields: 'Por favor completa todos los campos requeridos',
    appointmentScheduled: '¡Cita programada exitosamente!',
    failedToSchedule: 'Error al programar la cita',
    doctorContactAdded: '¡Contacto de doctor agregado exitosamente!',
    failedToAddDoctor: 'Error al agregar contacto de doctor',
    appointmentCompleted: '¡Cita marcada como completada!',
    failedToUpdate: 'Error al actualizar la cita',
    scheduleAppointment: 'Programar Cita',
    addDoctorContact: 'Agregar Contacto de Doctor',
    appointmentType: 'Tipo de Cita',
    selectAppointmentType: 'Seleccionar Tipo de Cita',
    doctorName: 'Nombre del Doctor',
    doctorNamePlaceholder: 'Ingresa el nombre del doctor',
    specialty: 'Especialidad',
    specialtyPlaceholder: 'Ingresa la especialidad',
    phoneNumber: 'Número de Teléfono',
    phonePlaceholder: 'Ingresa el número de teléfono',
    address: 'Dirección',
    addressPlaceholder: 'Ingresa la dirección',
    appointmentOverview: 'Resumen de Citas',
    noDoctorContactsYet: 'Aún no se han agregado contactos de doctores',
    title: 'Título',
    location: 'Ubicación',
    date: 'Fecha',
    time: 'Hora',
    notes: 'Notas',
    notesOptional: 'Notas (Opcional)',
    cancel: 'Cancelar',
    titlePlaceholder: 'ej., Revisión Anual, Análisis de Sangre',
    locationPlaceholder: 'ej., Consultorio del Dr. Smith, LabCorp',
    datePlaceholder: 'AAAA-MM-DD',
    timePlaceholder: 'HH:MM (formato 24 horas)',
    notesPlaceholder: 'Agrega cualquier nota o instrucción especial...',
    appointmentServiceNotAvailable: 'Servicio de citas no disponible',
    // Health Metric Types
    bloodPressure: 'Presión Arterial',
    weight: 'Peso',
    bloodSugar: 'Azúcar en Sangre',
    heartRate: 'Frecuencia Cardíaca',
    temperature: 'Temperatura',
    oxygenSaturation: 'Saturación de Oxígeno',
    painLevel: 'Nivel de Dolor',
    mood: 'Estado de Ánimo',
    energyLevel: 'Nivel de Energía',
    sleepHours: 'Horas de Sueño',
    steps: 'Pasos',
    // AI Health Screen translations
    aiHealthAssistant: 'Asistente de Salud IA',
    intelligentHealthcareFeatures: 'Características de atención médica inteligente impulsadas por IA para mejores decisiones de salud',
    aiHealthFeatures: 'Características de Salud IA',
    healthInsights: 'Perspectivas de Salud',
    symptomAnalyses: 'Análisis de Síntomas',
    drugChecks: 'Verificaciones de Medicamentos',
    voiceNotes: 'Notas de Voz',
    analyzeSymptoms: 'Analizar Síntomas',
    checkInteractions: 'Verificar Interacciones',
    voiceNote: 'Nota de Voz',
    recentAnalyses: 'Análisis Recientes',
    noHealthInsights: 'Aún no hay perspectivas de salud disponibles. Usa las características de IA para generar perspectivas.',
    noSymptomAnalyses: 'Aún no hay análisis de síntomas. Intenta analizar tus síntomas.',
    describeSymptoms: 'Describe tus síntomas',
    enterSymptomsPlaceholder: 'Ingresa tus síntomas separados por comas (ej., fiebre, dolor de cabeza, fatiga)',
    listMedications: 'Lista tus medicamentos',
    enterMedicationsPlaceholder: 'Ingresa tus medicamentos separados por comas (ej., Aspirina, Metformina, Lisinopril)',
    // Fasting Analytics translations
    fastingAnalytics: 'Análisis de Ayuno',
    fastingCompatibilityCheck: 'Verificación de Compatibilidad con Ayuno',
    fastingDescription: 'Verifica si tus medicamentos actuales son compatibles con el ayuno intermitente',
    fastingDisclaimer: 'Esta recomendación es generada por IA y no debe reemplazar el consejo médico profesional.',
    warnings: 'Advertencias',
    // Fasting Profile translations
    fastingProfile: 'Perfil de Ayuno',
    fastingProfileDescription: 'Configura tu perfil de salud para recomendaciones personalizadas de ayuno',
    healthConditions: 'Condiciones de Salud',
    nutritionalStatus: 'Estado Nutricional y Composición Corporal',
    mentalHealth: 'Salud Mental y Demandas Cognitivas',
    lifestyleActivity: 'Estilo de Vida y Nivel de Actividad',
    fastingPreferences: 'Preferencias del Protocolo de Ayuno',
    fastingGoals: 'Objetivos',
    medicalSupervision: 'Supervisión Médica y Monitoreo',
    // Health Conditions
    diabetes: 'Diabetes',
    hypoglycemia: 'Hipoglucemia',
    heartConditions: 'Condiciones Cardíacas',
    kidneyDisease: 'Enfermedad Renal',
    liverDisease: 'Enfermedad Hepática',
    eatingDisorders: 'Trastornos Alimentarios (pasados o presentes)',
    pregnancy: 'Embarazo',
    breastfeeding: 'Lactancia',
    gastrointestinalIssues: 'Problemas Gastrointestinales (úlceras, GERD, SII)',
    // Nutritional Status
    bodyFatLevel: 'Nivel de Grasa Corporal',
    muscleMass: 'Masa Muscular',
    micronutrientLevels: 'Niveles de Micronutrientes',
    hydrationLevel: 'Nivel de Hidratación',
    // Mental Health
    highStressEnvironment: 'Ambiente de Alto Estrés',
    intensiveMentalTasks: 'Tareas Mentales Intensivas',
    anxiety: 'Ansiedad',
    depression: 'Depresión',
    // Lifestyle
    activityLevel: 'Nivel de Actividad',
    physicalLabor: 'Trabajo de Esfuerzo Físico',
    longShifts: 'Turnos Largos',
    sleepQuality: 'Calidad del Sueño',
    // Fasting Preferences
    preferredFastingType: 'Tipo de Ayuno Preferido',
    maxFastingHours: 'Horas Máximas de Ayuno',
    fastingFrequency: 'Frecuencia de Ayuno',
    // Goals
    primaryGoal: 'Objetivo Principal',
    weightLossGoal: 'Objetivo de Pérdida de Peso',
    metabolicHealthGoal: 'Objetivo de Salud Metabólica',
    // Medical Supervision
    selfMonitoring: 'Automonitoreo',
    wearableDevices: 'Dispositivos Portátiles',
    // Options
    low: 'Bajo',
    normal: 'Normal',
    high: 'Alto',
    poor: 'Pobre',
    fair: 'Regular',
    good: 'Bueno',
    excellent: 'Excelente',
    sedentary: 'Sedentario',
    light: 'Ligero',
    moderate: 'Moderado',
    athlete: 'Atleta',
    timeRestricted: 'Alimentación con Restricción de Tiempo (16:8, 14:10)',
    alternateDay: 'Ayuno en Días Alternos',
    extended: 'Ayuno Extendido (24h+)',
    custom: 'Personalizado',
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    weightLoss: 'Pérdida de Peso',
    metabolicHealth: 'Salud Metabólica',
    generalHealth: 'Salud General',
    spiritual: 'Espiritual/Religioso',
    medical: 'Médico',
    // Additional translations
    profileSaved: 'Perfil Guardado',
    fastingProfileSavedMessage: 'Tu perfil de ayuno ha sido guardado y se utilizará para recomendaciones personalizadas.',
    saveProfile: 'Guardar Perfil',
    noteType: 'Tipo de Nota',
    selectNoteType: 'Seleccionar Tipo de Nota',
    transcription: 'Transcripción',
    enterVoiceNotePlaceholder: 'Ingresa la transcripción de tu nota de voz...',
    addNote: 'Agregar Nota',
    analyze: 'Analizar',
    check: 'Verificar',
    enterSymptoms: 'Por favor ingresa tus síntomas',
    enterMedications: 'Por favor ingresa tus medicamentos',
    enterVoiceNote: 'Por favor ingresa tu nota de voz',
    symptomAnalysisComplete: 'Análisis de Síntomas Completado',
    noInteractionsFound: 'No se Encontraron Interacciones',
    noKnownInteractions: 'No se detectaron interacciones conocidas entre tus medicamentos.',
    drugInteractionsDetected: 'Interacciones de Medicamentos Detectadas',
    foundInteractions: 'Se encontraron interacción(es):',
    voiceNoteAdded: '¡Nota de voz agregada y procesada!',
    actionItems: 'Elementos de Acción:',
    generalHealth: 'Salud General',
    appointment: 'Cita',
    sideEffect: 'Efecto Secundario',
    symptom: 'Síntoma',
    aiGeneratedInsights: 'Perspectivas generadas por IA basadas en tus datos de salud y patrones.',
    // Documents Screen translations
    medicalDocuments: 'Documentos Médicos',
    organizeDocuments: 'Mantén tus documentos médicos importantes organizados y listos para visitas al médico',
    addDocument: 'Agregar Documento',
    takePhoto: 'Tomar Foto',
    uploadFromGallery: 'Subir desde Galería',
    frontSide: 'Lado Frontal',
    backSide: 'Lado Trasero',
    frontOfCard: 'Frente de la Tarjeta',
    backOfCard: 'Reverso de la Tarjeta',
    document: 'Documento',
    noDocumentsUploaded: 'No se han subido documentos aún',
    documentUploadedSuccessfully: '¡Documento subido exitosamente!',
    photoTakenSuccessfully: '¡Foto tomada exitosamente!',
    deleteDocument: 'Eliminar Documento',
    areYouSureDeleteDocument: '¿Estás seguro de que quieres eliminar este documento? Esto no se puede deshacer.',
    delete: 'Eliminar',
    permissionRequired: 'Permiso Requerido',
    grantCameraRollAccess: 'Por favor permite el acceso a la galería para subir documentos.',
    grantCameraAccess: 'Por favor permite el acceso a la cámara para tomar fotos.',
    failedToUploadDocument: 'Error al subir documento',
    failedToTakePhoto: 'Error al tomar foto',
    // Document Categories
    photoID: 'ID con Foto',
    driversLicensePassport: 'Licencia de Conducir, Pasaporte, etc.',
    birthCertificate: 'Certificado de Nacimiento',
    officialBirthCertificate: 'Certificado de nacimiento oficial',
    insuranceCard: 'Tarjeta de Seguro',
    healthInsuranceInfo: 'Información del seguro de salud',
    labResults: 'Resultados de Laboratorio',
    bloodTestsLabWork: 'Análisis de sangre, trabajo de laboratorio, etc.',
    prescriptions: 'Recetas',
    currentAndPastPrescriptions: 'Recetas actuales y pasadas',
    medicalRecords: 'Expedientes Médicos',
    medicalHistoryReports: 'Historial médico, reportes',
    otherDocuments: 'Otros Documentos',
    anyOtherMedicalDocuments: 'Cualquier otro documento médico',
    recentSymptomAnalyses: 'Tus análisis de síntomas recientes y evaluaciones de salud.',
    symptomAnalysis: 'Análisis de Síntomas',
    drugInteractionCheck: 'Verificación de Interacciones de Medicamentos',
    upcoming: 'Próximas',
    doctors: 'Doctores',
    upcomingAppointments: 'Próximas Citas',
    upcomingAppointmentsDesc: 'Tus citas programadas para los próximos 30 días.',
    noUpcomingAppointments: 'No hay citas próximas programadas',
    doctorContacts: 'Contactos de Doctores',
    doctorContactsDesc: 'Tus proveedores de atención médica y su información de contacto.',
    scheduleAppointment: 'Programar Cita',
    addDoctorContact: 'Agregar Contacto de Doctor',
    appointmentType: 'Tipo de Cita',
    selectAppointmentType: 'Seleccionar Tipo de Cita',
    doctorName: 'Nombre del Doctor',
    specialty: 'Especialidad',
    phoneNumber: 'Número de Teléfono',
    address: 'Dirección',
    doctorNamePlaceholder: 'ej., Dr. Juan Pérez',
    specialtyPlaceholder: 'ej., Medicina General, Cardiología',
    phonePlaceholder: 'ej., (555) 123-4567',
    addressPlaceholder: 'Ingresa la dirección completa...',
    error: 'Error',
    success: 'Éxito',
    fillAllFields: 'Por favor completa todos los campos requeridos',
    appointmentScheduled: '¡Cita programada exitosamente!',
    failedToSchedule: 'Error al programar la cita',
    doctorContactAdded: '¡Contacto de doctor agregado exitosamente!',
    failedToAddDoctor: 'Error al agregar contacto de doctor',
    appointmentCompleted: '¡Cita marcada como completada!',
    failedToUpdate: 'Error al actualizar la cita',
    // AI Health translations
    symptom: 'Síntoma',
    sideEffect: 'Efecto Secundario',
    generalHealth: 'Salud General',
    enterSymptoms: 'Por favor ingresa tus síntomas',
    // Smart Notifications translations
    smartServiceNotAvailable: 'Servicio de notificaciones inteligentes no disponible',
    addLocationReminder: 'Agregar Recordatorio de Ubicación',
    enterLocationName: 'Ingresa el nombre de la ubicación (ej., "Farmacia CVS", "Oficina del Dr. Smith"):',
    reminderMessage: 'Mensaje de Recordatorio',
    reminderMessagePrompt: '¿Qué debería decir el recordatorio cuando estés cerca de esta ubicación?',
    locationReminderAdded: '¡Recordatorio de ubicación agregado!',
    failedToAddLocationReminder: 'Error al agregar recordatorio de ubicación',
    addWeatherAlert: 'Agregar Alerta del Clima',
    chooseWeatherCondition: 'Elige la condición climática a monitorear:',
    highPollen: 'Alto Polen',
    extremeTemperature: 'Temperatura Extrema',
    highHumidity: 'Alta Humedad',
    poorAirQuality: 'Mala Calidad del Aire',
    pollenMessage: 'Considera tomar medicamento para alergias',
    temperatureMessage: 'Verifica si necesitas medicamentos sensibles a la temperatura',
    humidityMessage: 'La alta humedad puede afectar tu condición',
    airQualityMessage: 'Considera usar mascarilla o quedarte en casa',
    weatherAlertAdded: '¡Alerta del clima agregada!',
    failedToAddWeatherAlert: 'Error al agregar alerta del clima',
    healthJournal: 'Registro de Salud',
    dashboard: 'Panel',
    settings: 'Configuración',
    profile: 'Perfil',
    notifications: 'Notificaciones',
    security: 'Seguridad',
    privacy: 'Privacidad',
    appearance: 'Apariencia',
    wallpaper: 'Fondo de Pantalla',
    pushNotifications: 'Notificaciones Push',
    emailNotifications: 'Notificaciones por Email',
    smsNotifications: 'Notificaciones SMS',
    changePassword: 'Cambiar Contraseña',
    dataCollection: 'Recopilación de Datos',
    analytics: 'Análisis',
    changeWallpaper: 'Cambiar Fondo de Pantalla',
    chooseWallpaperDescription: 'Elige entre hermosos fondos de pantalla o colores sólidos',
    language: 'Idioma',
    colorSettings: 'Colores',
    dayNight: 'Día / Noche',
    moodShift: 'Cambio de humor',
    help: 'Ayuda',
    emailUs: 'Escríbenos',
    askAI: 'Preguntar a IA',
    tapToTalk: 'Toca para hablar',
    stop: 'Detener',
    addReminder: 'Agregar recordatorio',
    addPhoto: 'Agregar foto',
    toPDF: 'Crear PDF',
    record: 'Grabar',
    play: 'Reproducir',
    save: 'Guardar',
    recording: 'Grabando…',
    saved: 'Guardado',
    startServerInfo: 'Iniciar servidor local y conectar',
    medications: 'Medicamentos',
    refill: 'Recargar',
    edit: 'Editar',
    addMedication: 'Agregar Medicamento',
    editMedication: 'Editar Medicamento',
    dosesLeft: 'Dosis restantes',
    status: 'Estado',
    times: 'Horarios',
    delete: 'Eliminar',
    cancel: 'Cancelar',
    saveBtn: 'Guardar',
    add: 'Agregar',
  pickTime: 'Elegir hora',
  namePlaceholder: 'Nombre',
  directions: 'Direcciones',
  pickup: 'Retiro',
  delivery: 'Entrega',
  cash: 'Efectivo',
  coupon: 'Cupón',
  showAll: 'Ver todo',
  close: 'Cerrar',
  reserve: 'Reservar (demo)',
  lastRefill: 'Última recarga'
  ,past: 'Pasado'
  ,refillSoon: 'Recargar pronto'
  ,expired: 'Vencido',
  herbs: 'Hierbas',
  supplements: 'Suplementos',
  smartAlerts: 'Alertas Inteligentes',
  healthAnalytics: 'Análisis de Salud',
  aiHealth: 'Salud IA',
  documents: 'Documentos',
  appointments: 'Citas',
  findNearbyPharmacies: 'Encuentra farmacias cerca de tu ubicación',
  findNearbyLabs: 'Encuentra laboratorios médicos cerca de tu ubicación',
  loading: 'Cargando...',
  loadingPharmacies: 'Cargando farmacias cercanas...',
  loadingLabs: 'Cargando laboratorios cercanos...',
  refresh: 'Actualizar',
  findNearbyPharmaciesBtn: 'Encontrar Farmacias Cercanas',
  findNearbyLabsBtn: 'Encontrar Laboratorios Cercanos',
  lastUpdated: 'Última actualización',
  noPharmaciesFound: 'No se encontraron farmacias',
  noLabsFound: 'No se encontraron laboratorios',
  errorLoadingPharmacies: 'Error al cargar farmacias cercanas. Inténtalo de nuevo.',
  errorLoadingLabs: 'Error al cargar laboratorios cercanos. Inténtalo de nuevo.',
  myDoctorAI: 'Mis Doctores IA',
  selectAI: 'Seleccionar Doctor IA',
  drAlfred: 'Dr. Alfred',
  drMimi: 'Dr. Mimi',
  drPawlmer: 'Dr. Pawlmer',
  directions: 'Direcciones',
  info: 'Información',
  call: 'Llamar',
  noPharmaciesFound: 'No se encontraron farmacias',
  noLabsFound: 'No se encontraron laboratorios',
  foundPharmacies: 'Se encontraron {count} farmacias cercanas',
  foundLabs: 'Se encontraron {count} laboratorios cercanos',
  lastUpdated: 'Última actualización',
  testTypes: 'Tipos de Pruebas',
  showAll: 'Ver todo',
  close: 'Cerrar',
  addMedication: 'Agregar Medicamento',
  editMedication: 'Editar Medicamento',
  deleteMedication: 'Eliminar Medicamento',
  dosesLeft: 'dosis restantes',
  taking: 'Tomando',
  onHold: 'En espera',
  finished: 'Terminado',
  addReminder: 'Agregar Recordatorio',
  namePlaceholder: 'Nombre',
  pickTime: 'Elegir hora',
  addReminderBtn: 'Agregar Recordatorio',
  searchHerbs: 'Buscar hierbas...',
  searchSupplements: 'Buscar suplementos...',
  addSupplement: 'Agregar Suplemento',
  refill: 'Recargar',
  refillSoon: 'Recargar pronto',
  taking: 'Tomando',
  helpUsGetPrice: 'Ayúdanos a Obtener Precio',
  lowest: 'Más Bajo',
  sortBy: 'Ordenar',
  distance: 'Distancia',
  price: 'Precio',
  name: 'Nombre',
  refresh: 'Actualizar',
  showAll: 'Mostrar todo',
  close: 'Cerrar',
  reserve: 'Reservar (demo)',
  contributionDescription: 'Ayúdanos a mejorar nuestra base de datos de precios de medicamentos compartiendo lo que encontraste:',
  medicationNamePlaceholder: 'Ingresa el nombre del medicamento',
  strengthPlaceholder: 'ej., 100mg, 50mg/500mg',
  pricePlaceholder: 'Ingresa el precio (ej., 25.50)',
  quantityPlaceholder: 'ej., 30 tabletas, 1 botella',
  storeNamePlaceholder: 'Ingresa el nombre de la tienda',
  storeAddressPlaceholder: 'Ingresa la dirección de la tienda',
  contributionError: 'Información Faltante',
  contributionErrorText: 'Por favor completa el nombre del medicamento, precio y nombre de la tienda.',
  contributionSuccess: '¡Gracias!',
  contributionSuccessText: 'Tu información de precio ha sido guardada y ayudará a mejorar nuestra base de datos para todos.',
  noPharmaciesFound: 'No se Encontraron Farmacias',
  noPharmaciesMessage: 'No se encontraron farmacias en tu área. Por favor intenta de nuevo.',
  retry: 'Reintentar',
  ok: 'OK',
  fxLabel: 'FX',
  never: 'Nunca',
  refillComplete: 'Recarga Completada',
  smartNotifications: 'Notificaciones Inteligentes',
  smartNotificationsActive: 'Notificaciones Inteligentes Activas',
  smartFeatures: 'Características Inteligentes',
  smartRefillPredictions: 'Predicciones de Recarga Inteligentes',
  intelligentTiming: 'Tiempo Inteligente',
  contextAwareReminders: 'Recordatorios Conscientes del Contexto',
  locationBasedReminders: 'Recordatorios Basados en Ubicación',
  noLocationReminders: 'No hay recordatorios de ubicación configurados aún',
  addLocationReminder: 'Agregar Recordatorio de Ubicación',
  weatherBasedAlerts: 'Alertas Basadas en el Clima',
  noWeatherAlerts: 'No hay alertas climáticas configuradas aún',
  addWeatherAlert: 'Agregar Alerta Climática',
  healthAnalytics: 'Análisis de Salud',
  trackHealthMetrics: 'Rastrea tus métricas de salud, adherencia a medicamentos y efectos secundarios',
  healthOverview: 'Resumen de Salud',
  metricsRecorded: 'Métricas Registradas',
  adherenceRate: 'Tasa de Adherencia',
  sideEffects: 'Efectos Secundarios',
  medications: 'Medicamentos',
  recentHealthMetrics: 'Métricas de Salud Recientes',
  trackVitalSigns: 'Rastrea tus signos vitales e indicadores de salud a lo largo del tiempo',
  noHealthMetrics: 'No se han registrado métricas de salud aún',
  addHealthMetric: 'Agregar Métrica de Salud',
  medicationAdherence: 'Adherencia a Medicamentos',
  trackMedicationSchedule: 'Rastrea qué tan bien sigues tu horario de medicamentos',
  noAdherenceData: 'No hay datos de adherencia a medicamentos aún',
  sideEffectsMonitoring: 'Monitoreo de Efectos Secundarios',
  trackSideEffects: 'Rastrea cualquier efecto secundario que experimentes por los medicamentos',
  noSideEffectsRecorded: 'No se han registrado efectos secundarios aún',
  recordSideEffect: 'Registrar Efecto Secundario',
  medicalDocuments: 'Documentos Médicos',
  organizeDocuments: 'Mantén tus documentos médicos importantes organizados y listos para visitas al médico',
  photoID: 'ID con Foto',
  driversLicensePassport: 'Licencia de Conducir, Pasaporte, etc.',
  birthCertificate: 'Certificado de Nacimiento',
  officialBirthCertificate: 'Certificado de nacimiento oficial',
  insuranceCard: 'Tarjeta de Seguro',
  healthInsuranceInfo: 'Información del seguro de salud',
  labResults: 'Resultados de Laboratorio',
  bloodTestsLabWork: 'Análisis de sangre, trabajo de laboratorio, etc.',
  noDocumentsUploaded: 'No se han subido documentos aún',
  aiHealthAssistant: 'Asistente de Salud IA',
  intelligentHealthcareFeatures: 'Características de atención médica inteligentes impulsadas por IA para mejores decisiones de salud',
  aiHealthFeatures: 'Características de Salud IA',
  intelligentHealthcareFeaturesDesc: 'Características de atención médica inteligentes impulsadas por IA para ayudarte a tomar decisiones de salud informadas',
  healthInsights: 'Perspectivas de Salud',
  symptomAnalyses: 'Análisis de Síntomas',
  drugChecks: 'Verificaciones de Medicamentos',
  voiceNotes: 'Notas de Voz',
  analyzeSymptoms: 'Analizar Síntomas',
  checkInteractions: 'Verificar Interacciones',
  voiceNote: 'Nota de Voz',
  locationBasedRemindersDesc: 'Recibe recordatorios cuando estés cerca de farmacias, consultorios médicos u otras ubicaciones importantes',
  weatherBasedAlertsDesc: 'Recibe notificaciones cuando las condiciones climáticas puedan afectar tu salud o medicamentos',
  smartFeaturesDesc: 'Características impulsadas por IA que aprenden de tus patrones de medicación y proporcionan recordatorios inteligentes',
  smartRefillPredictionsDesc: 'Predice cuándo necesitarás recargas de medicamentos basándose en patrones de uso',
  intelligentTimingDesc: 'Aprende tu horario de medicamentos y sugiere horarios óptimos para recordatorios',
  contextAwareRemindersDesc: 'Considera tu ubicación, clima y horario al enviar recordatorios',
  smartNotificationsDesc: 'Recordatorios inteligentes que se adaptan a tu estilo de vida y entorno',
  initializing: 'Inicializando...',
  active: 'Activo',
  disabled: 'Deshabilitado',
  threshold: 'Umbral',
  pollenAlert: 'Alerta de Polen',
  temperatureAlert: 'Alerta de Temperatura',
  humidityAlert: 'Alerta de Humedad',
  airQualityAlert: 'Alerta de Calidad del Aire',
  origin: 'Origen',
  poisonous: 'Venenoso',
  summary: 'Resumen',
  yes: 'Sí',
  no: 'No',
  noHerbsFound: 'No se encontraron hierbas',
  generateHealthReport: 'Generar Reporte de Salud',
  metricType: 'Tipo de Métrica',
  value: 'Valor',
  enterValue: 'Ingresar valor',
  notesOptional: 'Notas (Opcional)',
  addAnyNotes: 'Agregar cualquier nota...',
  cancel: 'Cancelar',
  addMetric: 'Agregar Métrica',
  symptom: 'Síntoma',
  symptomPlaceholder: 'ej., dolor de cabeza, náuseas, mareos',
  severity: 'Gravedad',
  mild: 'Leve',
  moderate: 'Moderado',
  moderateSevere: 'Moderado-Severo',
  severe: 'Severo',
  verySevere: 'Muy Severo',
  unknown: 'Desconocido',
  selectMetricType: 'Seleccionar Tipo de Métrica',
  healthReportGenerated: 'Reporte de Salud Generado',
  summary: 'Resumen',
  keyInsights: 'Perspectivas Clave',
  yourHealthMetricsNormal: 'Tus métricas de salud están dentro de rangos normales',
  considerMaintainingSchedule: 'Considera mantener un horario de medicamentos consistente',
  monitorNewSideEffects: 'Monitorea cualquier efecto secundario nuevo de cerca',
  ok: 'OK',
  pleaseEnterValue: 'Por favor ingresa un valor',
  pleaseEnterValidNumber: 'Por favor ingresa un número válido',
  pleaseEnterSymptom: 'Por favor ingresa un síntoma',
  sideEffectRecorded: '¡Efecto secundario registrado!',
  error: 'Error',
  success: 'Éxito',
  medicationName: 'Nombre del medicamento',
  strengthExample: 'Fuerza (ej., 500mg)',
  selectTimes: 'Seleccionar horarios',
  startDate: 'Fecha de inicio',
  endDateOptional: 'Fecha de fin (opcional)',
  notesOptional: 'Notas (opcional)',
  status: 'Estado',
  taking: 'Tomando',
  onHold: 'En espera',
  stopped: 'Detenido',
  addMedication: 'Agregar Medicamento',
  editMedication: 'Editar Medicamento',
  deleteMedication: 'Eliminar Medicamento',
  supplementName: 'Nombre del suplemento',
  brand: 'Marca',
  dosage: 'Dosis',
  selectTimes: 'Seleccionar horarios',
  startDate: 'Fecha de inicio',
  endDateOptional: 'Fecha de fin (opcional)',
  notesOptional: 'Notas (opcional)',
  dosesLeft: 'Dosis restantes',
  prn: 'PRN',
  finished: 'Terminado',
  stopped: 'Detenido',
  refillSoon: 'Recargar pronto',
  lowStock: 'Stock bajo',
  locationDenied: 'Ubicación denegada',
  enableLocation: 'Habilita la ubicación para buscar tiendas cercanas.',
  cancel: 'Cancelar',
  addSupplement: 'Agregar Suplemento',
  noTimingSet: 'Sin horario establecido',
  noSupplementsFound: 'No se encontraron suplementos. Agrega tu primer suplemento para comenzar.'
  },
  zh: {
    nextReminder: '下一个提醒',
    reminders: '提醒',
    pharmacyLocations: '药房位置',
    aiConsultant: 'AI顾问',
    labsLocations: '实验室',
    prescription: '处方',
    appointmentLog: '预约日志',
    appointmentSubtitle: '安排和管理医疗访问',
    // Appointment Management translations
    doctorVisit: '医生访问',
    labTest: '实验室测试',
    specialist: '专科医生',
    emergency: '紧急情况',
    appointmentManagement: '预约管理',
    appointmentManagementDesc: '安排预约，管理医生联系人，并跟踪您的医疗访问',
    schedule: '安排',
    addDoctor: '添加医生',
    refresh: '刷新',
    primary: '主要',
    followUp: '随访',
    checkup: '体检',
    other: '其他',
    scheduled: '已安排',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消',
    rescheduled: '已重新安排',
    unknown: '未知',
    totalAppointments: '总预约数',
    upcoming: '即将到来',
    doctors: '医生',
    upcomingAppointments: '即将到来的预约',
    upcomingAppointmentsDesc: '您接下来30天的预定预约',
    noUpcomingAppointments: '没有即将到来的预约',
    doctorContacts: '医生联系人',
    doctorContactsDesc: '您的医疗保健提供者及其联系信息',
    pharmacy: '药房',
    error: '错误',
    success: '成功',
    fillAllFields: '请填写所有必填字段',
    appointmentScheduled: '预约安排成功！',
    failedToSchedule: '安排预约失败',
    doctorContactAdded: '医生联系人添加成功！',
    failedToAddDoctor: '添加医生联系人失败',
    appointmentCompleted: '预约标记为已完成！',
    failedToUpdate: '更新预约失败',
    scheduleAppointment: '安排预约',
    addDoctorContact: '添加医生联系人',
    appointmentType: '预约类型',
    selectAppointmentType: '选择预约类型',
    doctorName: '医生姓名',
    doctorNamePlaceholder: '输入医生姓名',
    specialty: '专业',
    specialtyPlaceholder: '输入专业',
    phoneNumber: '电话号码',
    phonePlaceholder: '输入电话号码',
    address: '地址',
    addressPlaceholder: '输入地址',
    appointmentOverview: '预约概览',
    noDoctorContactsYet: '尚未添加医生联系人',
    title: '标题',
    location: '位置',
    date: '日期',
    time: '时间',
    notes: '备注',
    notesOptional: '备注（可选）',
    cancel: '取消',
    titlePlaceholder: '例如：年度体检、血液检查',
    locationPlaceholder: '例如：史密斯医生办公室、LabCorp',
    datePlaceholder: 'YYYY-MM-DD',
    timePlaceholder: 'HH:MM（24小时制）',
    notesPlaceholder: '添加任何备注或特殊说明...',
    appointmentServiceNotAvailable: '预约服务不可用',
    // Health Metric Types
    bloodPressure: '血压',
    weight: '体重',
    bloodSugar: '血糖',
    heartRate: '心率',
    temperature: '体温',
    oxygenSaturation: '血氧饱和度',
    painLevel: '疼痛程度',
    mood: '情绪',
    energyLevel: '能量水平',
    sleepHours: '睡眠时间',
    steps: '步数',
    // AI Health Screen translations
    aiHealthAssistant: 'AI健康助手',
    intelligentHealthcareFeatures: '由AI驱动的智能医疗功能，帮助您做出更好的健康决策',
    aiHealthFeatures: 'AI健康功能',
    healthInsights: '健康洞察',
    symptomAnalyses: '症状分析',
    drugChecks: '药物检查',
    voiceNotes: '语音笔记',
    analyzeSymptoms: '分析症状',
    checkInteractions: '检查相互作用',
    voiceNote: '语音笔记',
    recentAnalyses: '最近分析',
    noHealthInsights: '暂无健康洞察。使用AI功能生成洞察。',
    noSymptomAnalyses: '暂无症状分析。尝试分析您的症状。',
    describeSymptoms: '描述您的症状',
    enterSymptomsPlaceholder: '输入您的症状，用逗号分隔（例如：发烧、头痛、疲劳）',
    listMedications: '列出您的药物',
    enterMedicationsPlaceholder: '输入您的药物，用逗号分隔（例如：阿司匹林、二甲双胍、赖诺普利）',
    // Fasting Analytics translations
    fastingAnalytics: '禁食分析',
    fastingCompatibilityCheck: '禁食兼容性检查',
    fastingDescription: '检查您当前的药物是否与间歇性禁食兼容',
    fastingDisclaimer: '此建议由AI生成，不应替代专业医疗建议。',
    warnings: '警告',
    // Fasting Profile translations
    fastingProfile: '禁食档案',
    fastingProfileDescription: '设置您的健康档案以获得个性化禁食建议',
    healthConditions: '健康状况',
    nutritionalStatus: '营养状态和身体组成',
    mentalHealth: '心理健康和认知需求',
    lifestyleActivity: '生活方式和活动水平',
    fastingPreferences: '禁食协议偏好',
    fastingGoals: '目标',
    medicalSupervision: '医疗监督和监测',
    // Health Conditions
    diabetes: '糖尿病',
    hypoglycemia: '低血糖',
    heartConditions: '心脏疾病',
    kidneyDisease: '肾脏疾病',
    liverDisease: '肝脏疾病',
    eatingDisorders: '饮食失调（过去或现在）',
    pregnancy: '怀孕',
    breastfeeding: '哺乳',
    gastrointestinalIssues: '胃肠道问题（溃疡、胃食管反流、肠易激综合征）',
    // Nutritional Status
    bodyFatLevel: '体脂水平',
    muscleMass: '肌肉量',
    micronutrientLevels: '微量营养素水平',
    hydrationLevel: '水合水平',
    // Mental Health
    highStressEnvironment: '高压力环境',
    intensiveMentalTasks: '高强度脑力任务',
    anxiety: '焦虑',
    depression: '抑郁',
    // Lifestyle
    activityLevel: '活动水平',
    physicalLabor: '体力劳动工作',
    longShifts: '长时间轮班',
    sleepQuality: '睡眠质量',
    // Fasting Preferences
    preferredFastingType: '首选禁食类型',
    maxFastingHours: '最大禁食小时数',
    fastingFrequency: '禁食频率',
    // Goals
    primaryGoal: '主要目标',
    weightLossGoal: '减重目标',
    metabolicHealthGoal: '代谢健康目标',
    // Medical Supervision
    selfMonitoring: '自我监测',
    wearableDevices: '可穿戴设备',
    // Options
    low: '低',
    normal: '正常',
    high: '高',
    poor: '差',
    fair: '一般',
    good: '好',
    excellent: '优秀',
    sedentary: '久坐',
    light: '轻度',
    moderate: '中度',
    athlete: '运动员',
    timeRestricted: '限时进食（16:8、14:10）',
    alternateDay: '隔日禁食',
    extended: '延长禁食（24小时+）',
    custom: '自定义',
    daily: '每日',
    weekly: '每周',
    monthly: '每月',
    weightLoss: '减重',
    metabolicHealth: '代谢健康',
    generalHealth: '一般健康',
    spiritual: '精神/宗教',
    medical: '医疗',
    // Additional translations
    profileSaved: '档案已保存',
    fastingProfileSavedMessage: '您的禁食档案已保存，将用于个性化建议。',
    saveProfile: '保存档案',
    noteType: '笔记类型',
    selectNoteType: '选择笔记类型',
    transcription: '转录',
    enterVoiceNotePlaceholder: '输入您的语音笔记转录...',
    addNote: '添加笔记',
    analyze: '分析',
    check: '检查',
    enterSymptoms: '请输入您的症状',
    enterMedications: '请输入您的药物',
    enterVoiceNote: '请输入您的语音笔记',
    symptomAnalysisComplete: '症状分析完成',
    noInteractionsFound: '未发现相互作用',
    noKnownInteractions: '在您的药物之间未检测到已知的药物相互作用。',
    drugInteractionsDetected: '检测到药物相互作用',
    foundInteractions: '发现相互作用：',
    voiceNoteAdded: '语音笔记已添加并处理！',
    actionItems: '行动项目：',
    generalHealth: '一般健康',
    appointment: '预约',
    sideEffect: '副作用',
    symptom: '症状',
    aiGeneratedInsights: '基于您的健康数据和模式的AI生成洞察。',
    // Documents Screen translations
    medicalDocuments: '医疗文档',
    organizeDocuments: '保持您的重要医疗文档井然有序，为医生就诊做好准备',
    addDocument: '添加文档',
    takePhoto: '拍照',
    uploadFromGallery: '从相册上传',
    frontSide: '正面',
    backSide: '背面',
    frontOfCard: '卡片正面',
    backOfCard: '卡片背面',
    document: '文档',
    noDocumentsUploaded: '尚未上传文档',
    documentUploadedSuccessfully: '文档上传成功！',
    photoTakenSuccessfully: '拍照成功！',
    deleteDocument: '删除文档',
    areYouSureDeleteDocument: '您确定要删除此文档吗？此操作无法撤销。',
    delete: '删除',
    permissionRequired: '需要权限',
    grantCameraRollAccess: '请允许访问相册以上传文档。',
    grantCameraAccess: '请允许访问相机以拍照。',
    failedToUploadDocument: '上传文档失败',
    failedToTakePhoto: '拍照失败',
    // Document Categories
    photoID: '带照片身份证',
    driversLicensePassport: '驾照、护照等',
    birthCertificate: '出生证明',
    officialBirthCertificate: '官方出生证明',
    insuranceCard: '保险卡',
    healthInsuranceInfo: '健康保险信息',
    labResults: '实验室结果',
    bloodTestsLabWork: '血液检查、实验室工作等',
    prescriptions: '处方',
    currentAndPastPrescriptions: '当前和过去的处方',
    medicalRecords: '医疗记录',
    medicalHistoryReports: '医疗历史、报告',
    otherDocuments: '其他文档',
    anyOtherMedicalDocuments: '任何其他医疗文档',
    recentSymptomAnalyses: '您最近的症状分析和健康评估。',
    symptomAnalysis: '症状分析',
    drugInteractionCheck: '药物相互作用检查',
    upcoming: '即将到来',
    doctors: '医生',
    upcomingAppointments: '即将到来的预约',
    upcomingAppointmentsDesc: '您未来30天的预定预约。',
    noUpcomingAppointments: '没有即将到来的预约',
    doctorContacts: '医生联系人',
    doctorContactsDesc: '您的医疗保健提供者及其联系信息。',
    scheduleAppointment: '安排预约',
    addDoctorContact: '添加医生联系人',
    appointmentType: '预约类型',
    selectAppointmentType: '选择预约类型',
    doctorName: '医生姓名',
    specialty: '专业',
    phoneNumber: '电话号码',
    address: '地址',
    doctorNamePlaceholder: '例如：张医生',
    specialtyPlaceholder: '例如：全科医学、心脏病学',
    phonePlaceholder: '例如：(555) 123-4567',
    addressPlaceholder: '输入完整地址...',
    error: '错误',
    success: '成功',
    fillAllFields: '请填写所有必填字段',
    appointmentScheduled: '预约安排成功！',
    failedToSchedule: '安排预约失败',
    doctorContactAdded: '医生联系人添加成功！',
    failedToAddDoctor: '添加医生联系人失败',
    appointmentCompleted: '预约标记为已完成！',
    failedToUpdate: '更新预约失败',
    // AI Health translations
    symptom: '症状',
    sideEffect: '副作用',
    generalHealth: '一般健康',
    enterSymptoms: '请输入您的症状',
    // Smart Notifications translations
    smartServiceNotAvailable: '智能通知服务不可用',
    addLocationReminder: '添加位置提醒',
    enterLocationName: '输入位置名称（例如："CVS药房"，"Smith医生办公室"）：',
    reminderMessage: '提醒消息',
    reminderMessagePrompt: '当您接近此位置时，提醒应该说什么？',
    locationReminderAdded: '位置提醒已添加！',
    failedToAddLocationReminder: '添加位置提醒失败',
    addWeatherAlert: '添加天气警报',
    chooseWeatherCondition: '选择要监控的天气条件：',
    highPollen: '高花粉',
    extremeTemperature: '极端温度',
    highHumidity: '高湿度',
    poorAirQuality: '空气质量差',
    pollenMessage: '考虑服用过敏药物',
    temperatureMessage: '检查是否需要温度敏感的药物',
    humidityMessage: '高湿度可能影响您的状况',
    airQualityMessage: '考虑戴口罩或待在室内',
    weatherAlertAdded: '天气警报已添加！',
    failedToAddWeatherAlert: '添加天气警报失败',
    healthJournal: '健康日记',
    dashboard: '仪表盘',
    settings: '设置',
    profile: '个人资料',
    language: '语言',
    colorSettings: '颜色设置',
    dayNight: '昼 / 夜',
    moodShift: '情绪主题切换',
    help: '帮助',
    notifications: '通知',
    security: '安全',
    privacy: '隐私',
    wallpaper: '壁纸',
    pushNotifications: '推送通知',
    emailNotifications: '邮件通知',
    smsNotifications: '短信通知',
    changePassword: '修改密码',
    dataCollection: '数据收集',
    analytics: '分析',
    changeWallpaper: '更换壁纸',
    chooseWallpaperDescription: '选择您喜欢的壁纸来个性化您的应用',
    never: '从未',
    refillComplete: '续药完成',
    emailUs: '给我们发邮件',
    askAI: '询问 AI',
    tapToTalk: '点击说话',
    stop: '停止',
    addReminder: '添加提醒',
    addPhoto: '添加照片',
    toPDF: '生成 PDF',
    record: '录音',
    play: '播放',
    save: '保存',
    recording: '录音中…',
    saved: '已保存',
    startServerInfo: '启动本地服务器并连接',
    medications: '药物',
  refill: '续药',
  helpUsGetPrice: '帮助我们获取价格',
  lowest: '最低',
  sortBy: '排序',
  distance: '距离',
  price: '价格',
  name: '名称',
  refresh: '刷新',
  showAll: '显示全部',
  close: '关闭',
  reserve: '预订 (演示)',
  contributionDescription: '通过分享您发现的信息来帮助我们改善药物价格数据库：',
  medicationNamePlaceholder: '输入药物名称',
  strengthPlaceholder: '例如：100mg, 50mg/500mg',
  pricePlaceholder: '输入价格 (例如：25.50)',
  quantityPlaceholder: '例如：30片, 1瓶',
  storeNamePlaceholder: '输入商店名称',
  storeAddressPlaceholder: '输入商店地址',
  contributionError: '信息缺失',
  contributionErrorText: '请填写药物名称、价格和商店名称。',
  contributionSuccess: '谢谢！',
  contributionSuccessText: '您的价格信息已保存，将有助于改善我们的数据库。',
  noPharmaciesFound: '未找到药店',
  noPharmaciesMessage: '在您的地区未找到药店。请重试。',
  retry: '重试',
  ok: '确定',
  fxLabel: '汇率',
  never: '从未',
  refillComplete: '续药完成',
  edit: '编辑',
    addMedication: '添加药物',
    editMedication: '编辑药物',
    dosesLeft: '剩余剂量',
    status: '状态',
    times: '时间',
    delete: '删除',
    cancel: '取消',
    saveBtn: '保存',
    add: '添加',
  pickTime: '选择时间',
  namePlaceholder: '名称',
  directions: '导航',
  pickup: '自取',
  delivery: '配送',
  cash: '现金',
  coupon: '优惠券',
  showAll: '显示全部',
  close: '关闭',
  reserve: '预定 (演示)',
  lastRefill: '上次续药'
  ,past: '已过'
  ,refillSoon: '快用完'
  ,expired: '已过期',
  herbs: '草药',
  supplements: '补充剂',
  smartAlerts: '智能提醒',
  healthAnalytics: '健康分析',
  aiHealth: 'AI健康',
  documents: '文档',
  appointments: '预约',
  findNearbyPharmacies: '查找附近的药房',
  findNearbyLabs: '查找附近的医疗实验室',
  loading: '加载中...',
  loadingPharmacies: '正在加载附近的药房...',
  loadingLabs: '正在加载附近的实验室...',
  refresh: '刷新',
  findNearbyPharmaciesBtn: '查找附近药房',
  findNearbyLabsBtn: '查找附近实验室',
  lastUpdated: '最后更新',
  noPharmaciesFound: '未找到药房',
  noLabsFound: '未找到实验室',
  errorLoadingPharmacies: '加载附近药房失败。请重试。',
  errorLoadingLabs: '加载附近实验室失败。请重试。',
  myDoctorAI: '我的AI医生',
  selectAI: '选择AI医生',
  drAlfred: 'Alfred医生',
  drMimi: 'Mimi医生',
  drPawlmer: 'Pawlmer医生',
  directions: '导航',
  info: '信息',
  call: '致电',
  noPharmaciesFound: '未找到药房',
  noLabsFound: '未找到实验室',
  foundPharmacies: '找到{count}个附近药房',
  foundLabs: '找到{count}个附近实验室',
  lastUpdated: '最后更新',
  testTypes: '测试类型',
  showAll: '显示全部',
  close: '关闭',
  addMedication: '添加药物',
  editMedication: '编辑药物',
  deleteMedication: '删除药物',
  dosesLeft: '剩余剂量',
  taking: '服用中',
  onHold: '暂停',
  finished: '已完成',
  addReminder: '添加提醒',
  namePlaceholder: '名称',
  pickTime: '选择时间',
  addReminderBtn: '添加提醒',
  searchHerbs: '搜索草药...',
  searchSupplements: '搜索补充剂...',
  addSupplement: '添加补充剂',
  refill: '补充',
  refillSoon: '即将补充',
  taking: '服用中',
  smartNotifications: '智能通知',
  smartNotificationsActive: '智能通知已激活',
  smartFeatures: '智能功能',
  smartRefillPredictions: '智能补充预测',
  intelligentTiming: '智能时间',
  contextAwareReminders: '情境感知提醒',
  locationBasedReminders: '基于位置的提醒',
  noLocationReminders: '尚未设置位置提醒',
  addLocationReminder: '添加位置提醒',
  weatherBasedAlerts: '基于天气的警报',
  noWeatherAlerts: '尚未设置天气警报',
  addWeatherAlert: '添加天气警报',
  healthAnalytics: '健康分析',
  trackHealthMetrics: '跟踪您的健康指标、药物依从性和副作用',
  healthOverview: '健康概览',
  metricsRecorded: '已记录指标',
  adherenceRate: '依从率',
  sideEffects: '副作用',
  medications: '药物',
  recentHealthMetrics: '最近的健康指标',
  trackVitalSigns: '跟踪您的生命体征和健康指标随时间的变化',
  noHealthMetrics: '尚未记录健康指标',
  addHealthMetric: '添加健康指标',
  medicationAdherence: '药物依从性',
  trackMedicationSchedule: '跟踪您遵循药物时间表的情况',
  noAdherenceData: '尚无药物依从性数据',
  sideEffectsMonitoring: '副作用监测',
  trackSideEffects: '跟踪您因药物而经历的任何副作用',
  noSideEffectsRecorded: '尚未记录副作用',
  recordSideEffect: '记录副作用',
  medicalDocuments: '医疗文档',
  organizeDocuments: '保持您的重要医疗文档井然有序，为医生就诊做好准备',
  photoID: '带照片身份证',
  driversLicensePassport: '驾照、护照等',
  birthCertificate: '出生证明',
  officialBirthCertificate: '官方出生证明',
  insuranceCard: '保险卡',
  healthInsuranceInfo: '健康保险信息',
  labResults: '实验室结果',
  bloodTestsLabWork: '血液检查、实验室工作等',
  noDocumentsUploaded: '尚未上传文档',
  aiHealthAssistant: 'AI健康助手',
  intelligentHealthcareFeatures: '由AI驱动的智能医疗功能，帮助您做出更好的健康决策',
  aiHealthFeatures: 'AI健康功能',
  intelligentHealthcareFeaturesDesc: '由AI驱动的智能医疗功能，帮助您做出明智的健康决策',
  healthInsights: '健康洞察',
  symptomAnalyses: '症状分析',
  drugChecks: '药物检查',
  voiceNotes: '语音笔记',
  analyzeSymptoms: '分析症状',
  checkInteractions: '检查相互作用',
  voiceNote: '语音笔记',
  locationBasedRemindersDesc: '当您靠近药房、医生办公室或其他重要地点时收到提醒',
  weatherBasedAlertsDesc: '当天气条件可能影响您的健康或药物时收到通知',
  smartFeaturesDesc: '由AI驱动的功能，学习您的用药模式并提供智能提醒',
  smartRefillPredictionsDesc: '根据使用模式预测您何时需要药物补充',
  intelligentTimingDesc: '学习您的用药时间表并建议最佳提醒时间',
  contextAwareRemindersDesc: '在发送提醒时考虑您的位置、天气和时间表',
  smartNotificationsDesc: '适应您生活方式和环境的智能提醒',
  initializing: '正在初始化...',
  active: '活跃',
  disabled: '已禁用',
  threshold: '阈值',
  pollenAlert: '花粉警报',
  temperatureAlert: '温度警报',
  humidityAlert: '湿度警报',
  airQualityAlert: '空气质量警报',
  origin: '起源',
  poisonous: '有毒',
  summary: '摘要',
  yes: '是',
  no: '否',
  noHerbsFound: '未找到草药',
  generateHealthReport: '生成健康报告',
  metricType: '指标类型',
  value: '数值',
  enterValue: '输入数值',
  notesOptional: '备注（可选）',
  addAnyNotes: '添加任何备注...',
  cancel: '取消',
  addMetric: '添加指标',
  symptom: '症状',
  symptomPlaceholder: '例如：头痛、恶心、头晕',
  severity: '严重程度',
  mild: '轻微',
  moderate: '中等',
  moderateSevere: '中等-严重',
  severe: '严重',
  verySevere: '非常严重',
  unknown: '未知',
  selectMetricType: '选择指标类型',
  healthReportGenerated: '健康报告已生成',
  summary: '摘要',
  keyInsights: '关键洞察',
  yourHealthMetricsNormal: '您的健康指标在正常范围内',
  considerMaintainingSchedule: '考虑保持一致的用药时间表',
  monitorNewSideEffects: '密切监测任何新的副作用',
  ok: '确定',
  pleaseEnterValue: '请输入数值',
  pleaseEnterValidNumber: '请输入有效数字',
  pleaseEnterSymptom: '请输入症状',
  sideEffectRecorded: '副作用已记录！',
  error: '错误',
  success: '成功',
  medicationName: '药物名称',
  strengthExample: '强度（例如：500mg）',
  selectTimes: '选择时间',
  startDate: '开始日期',
  endDateOptional: '结束日期（可选）',
  notesOptional: '备注（可选）',
  status: '状态',
  taking: '服用中',
  onHold: '暂停',
  stopped: '已停止',
  addMedication: '添加药物',
  editMedication: '编辑药物',
  deleteMedication: '删除药物',
  supplementName: '补充剂名称',
  brand: '品牌',
  dosage: '剂量',
  selectTimes: '选择时间',
  startDate: '开始日期',
  endDateOptional: '结束日期（可选）',
  notesOptional: '备注（可选）',
  dosesLeft: '剩余剂量',
  prn: '按需',
  finished: '已完成',
  stopped: '已停止',
  refillSoon: '即将补充',
  lowStock: '库存不足',
  locationDenied: '位置被拒绝',
  enableLocation: '启用位置以搜索附近商店。',
  cancel: '取消',
  addSupplement: '添加补充剂',
  noTimingSet: '未设置时间',
  noSupplementsFound: '未找到补充剂。添加您的第一个补充剂开始使用。'
  }
};

// ---------- THEMES ----------
const PALETTES = {
  whiteGold: {
    id: 'whiteGold',
    bg: '#ffffff',
    bgStart: '#ffffff',
    bgEnd: '#fefefe',
    card: '#ffffff',
    text: '#1a1a1a',
    sub: '#666666',
    accent: '#D4AF37',
    chip: '#f8f6f0',
  },
  gold: {
    id: 'gold',
    bg: '#faf8f5',
    bgStart: '#faf8f5',
    bgEnd: '#f5f2ed',
    card: '#ffffff',
    text: '#2c2c2c',
    sub: '#6b6b6b',
    accent: '#D4AF37',
    chip: '#e8e3d8',
  },
  blue: {
    id: 'blue',
    bg: '#0e1324',
    bgStart: '#0e1324',
    bgEnd: '#0b1020',
    card: '#121a33',
    text: '#bcd2ff',
    sub: '#91a6d8',
    accent: '#3a7bfd',
    chip: '#141b2e',
  },
  teal: {
    id: 'teal',
    bg: '#071b1b',
    bgStart: '#071b1b',
    bgEnd: '#052222',
    card: '#0d2424',
    text: '#aafaf0',
    sub: '#6bd7cb',
    accent: '#2dd4bf',
    chip: '#0c2a29',
  },
  black: {
    id: 'black',
    bg: '#000000',
    bgStart: '#000000',
    bgEnd: '#1a1a1a',
    card: '#1a1a1a',
    text: '#FFA500',
    sub: '#FFB84D',
    accent: '#FFA500',
    chip: '#2a2a2a',
  },
};

const STORAGE = {
  lang: 'AURIC_LANG',
  theme: 'AURIC_THEME',
  night: 'AURIC_NIGHT',
  mood: 'AURIC_MOOD',
  reminders: 'AURIC_REMINDERS',
  rxPhotos: 'AURIC_RX_PHOTOS',
  voiceNotes: 'AURIC_VOICE_NOTES',
  meds: 'AURIC_MEDS',
  selectedAIDoctor: 'AURIC_SELECTED_AI_DOCTOR',
};

// Lightweight streaming hook (defined inline to avoid extra files)
function useMedicalStreamLocal(endpoint) {
  const controllerRef = useRef(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  async function ask(messages) {
    if (!endpoint) throw new Error('No stream endpoint provided');
    try {
      if (controllerRef.current) controllerRef.current.abort();
    } catch {}

    controllerRef.current = new AbortController();
    setText('');
    setLoading(true);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          messages,
          stream: false, // Disable streaming for now to fix the issue
          temperature: 0.7,
          max_tokens: 500
        }),
        signal: controllerRef.current.signal,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Stream endpoint returned ${res.status}`);
      }

        const full = await res.text();
        setText(full);
        return full;
    } catch (e) {
      if (e.name === 'AbortError') return;
      throw e;
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    try { controllerRef.current?.abort(); } catch {}
    setLoading(false);
  }

  return { text, loading, ask, cancel };
}

// ---------- ROOT APP ----------
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
  
  // Authentication state
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showAuth, setShowAuth] = useState(true); // Start with auth screen
  const [isRestoringAuth, setIsRestoringAuth] = useState(true); // Track auth restoration
  const [isLoading, setIsLoading] = useState(true); // Show loading screen initially
  const [resetAuthToSignIn, setResetAuthToSignIn] = useState(0); // Counter to trigger reset

  // Authentication handlers
  const handleAuthSuccess = async (authData) => {
    console.log('Auth success:', authData);
    try {
      const result = await authService.handleAuth(authData);
      
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
        setShowAuth(false);
        
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
      console.log('👋 User signed out');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };
  
  // 'reminders' | 'pharmacies' | 'labs' | 'prescription' | 'appointments' | 'settings'

  // language & theme
  const [lang, setLang] = useState('en');
  const [themeKey, setThemeKey] = useState('whiteGold');
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
      const response = await fetch(`${API_BASE_URL}/api/fasting-profile?userId=${userId}`);
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
      const response = await fetch(`${API_BASE_URL}/api/fasting-profile`, {
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
    drPawlmer: t('ai.drPawlmer'),
    drPawlmerIntro: t('ai.drPawlmerIntro'),
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
    possibleConditions: t('ai.possibleConditions'),
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
    probability: t('ai.probability'),
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
    possibleConditions: t('ai.possibleConditions'),
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
      name: 'Aspirin',
      strength: '81mg',
      status: 'taking',
      times: ['08:00'],
      startDate: '2024-01-01',
      endDate: '',
      notes: 'Low dose for heart health',
      dosesLeft: '30'
    },
    {
      id: '2',
      name: 'Metformin',
      strength: '500mg',
      status: 'taking',
      times: ['08:00', '20:00'],
      startDate: '2024-01-15',
      endDate: '',
      notes: 'For diabetes management',
      dosesLeft: '60'
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
      notes: 'Take with breakfast',
      dosesLeft: '90',
      refillSoon: false
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
      notes: 'Take with lunch',
      dosesLeft: '60',
      refillSoon: true
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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('📍 Location permission denied - skipping auto-load');
        return;
      }

      // Get current position
      const { coords } = await Location.getCurrentPositionAsync({});
      console.log('📍 Auto-loading data for coordinates:', coords.latitude, coords.longitude);

      // Load pharmacies
      setPharmaciesLoading(true);
      try {
        const { findNearbyPharmacies } = await import('./services/pharmacySearch');
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
        const { findNearbyLabs } = await import('./services/labSearch');
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
        const { findNearbyPharmacies } = await import('./services/pharmacySearch');
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
    loadLocationData();
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
const getInitialAIMessage = (selectedDoctor) => {
  const introductions = {
    'alfred': S.drAlfredIntro || "Hello! I'm Dr. Alfred, your AI health consultant. I'm here to help you with medication information, health insights, and answer any medical questions you might have. How can I assist you today?",
    'mimi': S.drMimiIntro || "Hi there! I'm Dr. Mimi, your friendly AI health assistant. I specialize in providing personalized health advice, medication guidance, and helping you understand your health better. What would you like to know?",
    'pawlmer': S.drPawlmerIntro || "Meow! I'm Dr. Pawlmer, your purr-fessional AI health companion! As a feline doctor, I bring a unique perspective to healthcare. I'm here to help you with medication management, health tips, and make your healthcare journey more enjoyable. How can I help you today?"
  };
  return introductions[selectedDoctor] || introductions['alfred'];
};

// Function to add cat-like expressions to Dr. Pawlmer's responses
const addCatExpressions = (response, selectedDoctor, lang) => {
  if (selectedDoctor !== 'pawlmer') {
    return response;
  }

  // Cat expressions based on language
  const catExpressions = {
    'en': ['Purr...', 'Meow!', '🐱', 'Purr-fect!', 'Feline-ly speaking...', 'Cat-egorically speaking...'],
    'es': ['Ronroneo...', '¡Miau!', '🐱', '¡Purr-fecto!', 'Felino-hablando...', 'Categoría-mente hablando...'],
    'zh': ['呼噜...', '喵！', '🐱', '完美！', '猫科医生说...', '从猫的角度...']
  };

  const expressions = catExpressions[lang] || catExpressions['en'];
  
  // Randomly add cat expressions to responses
  const shouldAddExpression = Math.random() > 0.7; // 30% chance
  
  if (shouldAddExpression) {
    const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
    
    // Add expression at the beginning or end
    if (Math.random() > 0.5) {
      return `${randomExpression} ${response}`;
    } else {
      return `${response} ${randomExpression}`;
    }
  }
  
  return response;
};

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
  const { text: streamText, loading: streamLoading, ask: streamAsk, cancel: streamCancel } = useMedicalStreamLocal("https://auricrx-medcoach.onrender.com/ask-stream");

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
  console.log('API Base URL:', 'https://auricrx-medcoach.onrender.com');
  
  // Add immediate response
  setAiMessages(m => [...m, { role: 'assistant', text: S.aiThinking || 'AI is thinking...' }]);
  
  try {
    console.log('Sending question with user data for tool calling...');
    console.log('Request payload:', {
      message: q,
      userData: userData
    });
    
    const response = await fetch('https://auricrx-medcoach.onrender.com/ask', {
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
  if (MD) { try { setMeds(JSON.parse(MD)); } catch {} }
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
    let isRestoring = true; // Flag to prevent race conditions
    
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      console.log('🔥 Firebase auth state changed:', firebaseUser ? firebaseUser.uid : 'null');
      
      // Don't process auth state changes while we're still restoring
      if (isRestoring) {
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
        setIsRestoringAuth(false);
        
        // Try to get user data
        try {
          const userDataResult = await authService.getUserData(firebaseUser.uid);
          if (userDataResult.success) {
            setUserData(userDataResult.data);
          }
        } catch (error) {
          console.error('Failed to get user data:', error);
        }
      } else {
        // User is signed out
        setUser(null);
        setUserData(null);
        setShowAuth(true);
        setIsRestoringAuth(false);
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
        console.error('Failed to restore auth state:', error);
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
          const status = await getSubscriptionStatus(user.firebaseUser);
          if (status.ok) {
            console.log('✅ Subscription status loaded:', status);
            setSubscriptionStatus(status);
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

  // mood shift color tweak (toy demo: if last AI message contains "stress", switch to teal)
  const theme = useMemo(() => {
    let base = PALETTES[themeKey] || PALETTES.whiteGold;
    if (night) base = { ...base, bg: '#1a1a1a', bgStart: '#1a1a1a', bgEnd: '#2a2a2a', card: '#2d2d2d', text: '#f5f5f5', sub: '#b8b8b8' };
    if (moodShift && aiMessages.slice(-1)[0]?.text?.toLowerCase?.().includes('stress')) {
      base = PALETTES.teal;
    }
    
    // Apply font color override
    if (fontColor !== 'default') {
      const fontColors = {
        'white': { text: '#ffffff', sub: '#e0e0e0' },
        'black': { text: '#000000', sub: '#333333' },
        'blue': { text: '#3b82f6', sub: '#60a5fa' },
        'green': { text: '#10b981', sub: '#34d399' },
        'purple': { text: '#8b5cf6', sub: '#a78bfa' },
        'red': { text: '#ef4444', sub: '#f87171' },
        'orange': { text: '#f97316', sub: '#fb923c' },
        'pink': { text: '#ec4899', sub: '#f472b6' },
        'gold': { text: '#D4AF37', sub: '#E6C866' },
        'silver': { text: '#9ca3af', sub: '#d1d5db' }
      };
      
      if (fontColors[fontColor]) {
        base = { ...base, ...fontColors[fontColor] };
      }
    }
    
    return base;
  }, [themeKey, night, moodShift, aiMessages, fontColor]);


// animation refs
const splashOpacity = useRef(new Animated.Value(1)).current;
const logoScale = useRef(new Animated.Value(1)).current;
const textOpacity = useRef(new Animated.Value(1)).current;

useEffect(() => {
  if (!fontsLoaded) {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(logoScale, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(logoScale, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(textOpacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
          Animated.timing(textOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }
}, [fontsLoaded]);

// fade out when fonts loaded
useEffect(() => {
  if (fontsLoaded) {
    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }
}, [fontsLoaded]);




  // --------- Helpers ----------
  const Card = ({ title, icon, onPress }) => {
    const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor() }]} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.cardIcon}>{icon}</View>
        <DynamicText type="card" style={[styles.cardText, { fontFamily: 'Inter_700Bold' }]}>{title}</DynamicText>
      </TouchableOpacity>
    );
  };

  const AnimatedFloatingButton = () => {
    const getDoctorDisplayName = (doctorKey) => {
      const names = {
        'alfred': S.drAlfred || 'Dr. Alfred',
        'mimi': S.drMimi || 'Dr. Mimi',
        'pawlmer': S.drPawlmer || 'Dr. Pawlmer'
      };
      return names[doctorKey] || (S.drAlfred || 'Dr. Alfred');
    };

    return (
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: 'transparent' }]}
        onPress={() => {
          setAiOpen(true);
          // Always show the selected doctor's greeting when opening AI
          const newIntro = getInitialAIMessage(selectedAIDoctor);
          setAiMessages([{ role: 'assistant', text: newIntro }]);
        }}
        activeOpacity={0.8}
      >
        <Image 
          source={getDoctorImage(getDoctorDisplayName(selectedAIDoctor))} 
          style={{ width: 60, height: 60, borderRadius: 30 }} 
          resizeMode="contain" 
        />
      </TouchableOpacity>
    );
  };

  const AnimatedButton = ({ onPress, children, style }) => (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
      style={style}
    >
      {children}
    </TouchableOpacity>
  );

  // Trial countdown widget
  const TrialWidget = () => {
    const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
    
    if (!subscriptionStatus || subscriptionStatus.plan === 'pro') {
      return null;
    }
    
    const daysLeft = subscriptionStatus.daysLeft || 0;
    const isExpired = subscriptionStatus.status === 'expired';
    const isGrace = subscriptionStatus.status === 'grace';
    
    return (
      <TouchableOpacity
        onPress={() => setShowCheckout(true)}
        activeOpacity={0.7}
        style={{
          marginRight: 8,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          backgroundColor: getCardBackgroundColor() + 'DD',
          borderWidth: 1,
          borderColor: getCardBorderColor(),
        }}
      >
        {isExpired ? (
          <Text style={{ color: '#ef4444', fontSize: 11, fontFamily: 'Inter_700Bold' }}>
            Trial Expired
          </Text>
        ) : isGrace ? (
          <Text style={{ color: '#f59e0b', fontSize: 11, fontFamily: 'Inter_700Bold' }}>
            Grace: {daysLeft}d
          </Text>
        ) : (
          <Text style={{ color: '#22c55e', fontSize: 11, fontFamily: 'Inter_700Bold' }}>
            Trial: {daysLeft}d
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const TopBar = () => (
  <View style={[styles.topbar, { borderColor: theme.chip }]}>
    <AnimatedButton onPress={() => setRoute('dashboard')} style={[styles.brandButton, { marginLeft: -65 }]}>
        <Image 
          source={require('./assets/AuricRX_home_button_across_screens.png')} 
          style={styles.brandLogo}
          resizeMode="contain"
        />
    </AnimatedButton>
    <View style={{ flex: 1 }} />
    
    <TrialWidget />
    
    <AnimatedButton onPress={() => setRoute('settings')}>
      <Image 
        source={require('./assets/dashboard Emojies/settings cog.png')} 
        style={{ width: 48, height: 48, tintColor: theme.accent }}
        resizeMode="contain"
      />
    </AnimatedButton>
  </View>
);

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
  const getDoctorGreeting = (doctor) => {
    const greetings = {
      'Dr. Alfred': "Hello! I'm Dr. Alfred, your experienced medical AI assistant. I'm here to help you with comprehensive health guidance, medication management, and supplement recommendations. How can I assist you with your health journey today?",
      'Dr. Mimi': "Hi there! I'm Dr. Mimi, your friendly and approachable health companion. I specialize in making healthcare feel comfortable and easy to understand. Whether it's about your medications, supplements, or general wellness, I'm here to help! What would you like to discuss?",
      'Dr. Pawlmer': "Meow! I'm Dr. Pawlmer, your purr-fessional feline health expert! 🐱 I bring a unique perspective to healthcare with my cat-like curiosity and attention to detail. I'm here to help you with your medications, supplements, and health questions. What's on your mind today?"
    };
    return greetings[doctor] || greetings['Dr. Alfred'];
  };

  const getDoctorImage = (doctor) => {
    const images = {
      'Dr. Alfred': require('./assets/dashboard Emojies/Dr. Alfred AI Widget.png'),
      'Dr. Mimi': require('./assets/dashboard Emojies/Dr. Mimi AI Widget.png'),
      'Dr. Pawlmer': require('./assets/dashboard Emojies/Dr. Pawlmer AI Widget.png')
    };
    return images[doctor] || images['Dr. Alfred'];
  };


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
      const { status } = await Location.requestForegroundPermissionsAsync();
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
    const res = await fetch(BACKEND_URL, {
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

  // --------- Screens ----------
  const Dashboard = () => {
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
            <Card title={S.labsLocations} icon={<Image source={require('./assets/dashboard Emojies/Lab Locations.png')} style={styles.cardIcon} resizeMode="contain" />} onPress={() => setRoute('labs')} />
          <Card title={S.pharmacyLocations} icon={<Image source={require('./assets/dashboard Emojies/Pharmacy locations.png')} style={styles.cardIcon} resizeMode="contain" />} onPress={() => setRoute('pharmacies')} />
            <Card title={S.reminders} icon={<Image source={require('./assets/dashboard Emojies/Reminders.png')} style={styles.cardIcon} resizeMode="contain" />} onPress={() => setRoute('reminders')} />
          <Card title={S.medications} icon={<Image source={require('./assets/dashboard Emojies/Medications.png')} style={styles.cardIcon} resizeMode="contain" />} onPress={() => setRoute('medications')} />
            <Card title={S.herbs} icon={<Image source={require('./assets/dashboard Emojies/Herbs.png')} style={styles.cardIcon} resizeMode="contain" />} onPress={() => setRoute('herbs')} />
            <Card title={S.supplements} icon={<Image source={require('./assets/dashboard Emojies/supplements.png')} style={styles.cardIcon} resizeMode="contain" />} onPress={() => setRoute('supplements')} />
            <Card 
              title={S.smartAlerts} 
              icon={<Image source={require('./assets/dashboard Emojies/Smart Alerts.png')} style={styles.cardIconLarge} resizeMode="contain" />} 
              onPress={() => setRoute('smart-notifications')}
              subtitle="Intelligent reminders & notifications"
            />
            <Card 
              title={S.healthAnalytics} 
              icon={<Image source={require('./assets/dashboard Emojies/Health Analytics.png')} style={styles.cardIconLarge} resizeMode="contain" />} 
              onPress={() => setRoute('health-analytics')}
              subtitle="Track metrics, adherence & insights"
            />
            <Card 
              title={S.appointmentLog} 
              icon={<Image source={require('./assets/dashboard Emojies/Appointment Tracker.png')} style={styles.cardIcon} resizeMode="contain" />} 
              onPress={() => setRoute('appointments')}
              subtitle={S.appointmentSubtitle}
            />
            <Card 
              title={S.aiHealth} 
              icon={<Image source={require('./assets/dashboard Emojies/AI Health.png')} style={styles.cardIconExtraLarge} resizeMode="contain" />} 
              onPress={() => setRoute('ai-health')}
              subtitle="Intelligent health insights & analysis"
            />
            <Card 
              title={S.documents} 
              icon={<Image source={require('./assets/dashboard Emojies/Documents.png')} style={styles.cardIconExtraLarge} resizeMode="contain" />} 
              onPress={() => setRoute('documents')}
              subtitle="Medical documents for doctor visits"
              actionButton={
                <TouchableOpacity 
                  style={styles.quickScanButton}
                  onPress={() => {
                    // Quick scan functionality - could open camera directly
                    Alert.alert(
                      '📷 Quick Scan',
                      'Choose what to scan:',
                      [
                        { text: 'Photo ID', onPress: () => setRoute('documents') },
                        { text: 'Insurance Card', onPress: () => setRoute('documents') },
                        { text: 'Lab Results', onPress: () => setRoute('documents') },
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <Text style={styles.quickScanButtonText}>📷</Text>
                </TouchableOpacity>
              }
            />
        </View>
      </ScrollView>
      </>
  );
};

  const Pharmacies = () => {
    const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
    const [lastUpdated, setLastUpdated] = useState(null);

    // Use pre-loaded data from main App component
    // No need for local state - using pharmacies, pharmaciesLoading, pharmaciesError from main component

    // Refresh function - reloads data if needed
    const refreshPharmacies = async () => {
      try {
        setPharmaciesLoading(true);
        setPharmaciesError(null);
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setPharmaciesError('Location permission denied. Please enable location services.');
          return;
        }
        
        const { coords } = await Location.getCurrentPositionAsync({});
        
        // Import the pharmacy search function
        const { findNearbyPharmacies } = await import('./services/pharmacySearch');
        const nearbyPharmacies = await findNearbyPharmacies(coords.latitude, coords.longitude, lang, { noCache: true });
        
        setPharmacies(nearbyPharmacies);
        setLastUpdated(new Date());
        console.log('🏪 Refreshed pharmacies:', nearbyPharmacies.length);
      } catch (e) {
        console.error('Error refreshing pharmacies:', e);
        setPharmaciesError('Failed to refresh pharmacies. Please try again.');
      } finally {
        setPharmaciesLoading(false);
      }
    };

    const formatDistance = (miles) => {
      // Use location-based units: miles for USA, kilometers for other countries
      if (userCountry === 'US') {
        return `${miles.toFixed(1)} ${S.mi}`;
      } else {
        const km = miles * 1.60934;
        return `${km.toFixed(1)} ${S.km}`;
      }
    };

    const openDirections = (pharmacy) => {
      const q = encodeURIComponent(pharmacy.name);
      const url = Platform.select({
        ios: `http://maps.apple.com/?q=${q}&ll=${pharmacy.lat},${pharmacy.lon}`,
        android: `geo:${pharmacy.lat},${pharmacy.lon}?q=${q}`,
        default: `https://www.google.com/maps/search/?api=1&query=${q}`,
      });
      Linking.openURL(url);
    };

    const callPharmacy = (pharmacy) => {
      // Debug logging
      console.log('🔍 callPharmacy DEBUG - RECEIVED DATA:', {
        pharmacyName: pharmacy.name,
        pharmacyPhone: pharmacy.phone,
        pharmacyWebsite: pharmacy.website,
        pharmacyRating: pharmacy.rating,
        pharmacyAddress: pharmacy.address,
        pharmacyId: pharmacy.id,
        fullPharmacyObject: pharmacy
      });
      
      // Use only the real phone number from the API
      const phoneNumber = pharmacy.phone;
      
      if (!phoneNumber) {
        console.log('❌ No phone number found for pharmacy:', pharmacy.name);
        // Show alert if no phone number available
        Alert.alert(
          'Phone Not Available',
          `No phone number found for ${pharmacy.name}. Please try calling them directly or visit their website.`,
          [
            { text: 'OK', style: 'cancel' }
          ]
        );
        return;
      }
      
      console.log('✅ Phone number found:', phoneNumber);
      
      // Clean up the phone number (remove spaces, dashes, etc.)
      const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
      const phoneUrl = `tel:${cleanPhoneNumber}`;
      
      Alert.alert(
        'Call Pharmacy',
        `Call ${pharmacy.name}?\n${phoneNumber}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => {
              Linking.openURL(phoneUrl).catch(() => {
                Alert.alert('Error', 'Unable to make phone call');
              });
            }
          }
        ]
      );
    };

    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Header title={S.pharmacyLocations} />
          
          {/* Header with refresh button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, flex: 1, opacity: 0.8 }}>
              {pharmacies.length > 0 
                ? (S.foundPharmacies || 'Found {count} pharmacies nearby').replace('{count}', pharmacies.length)
                : (S.findNearbyPharmacies || 'Find nearby pharmacies')
              }
            </DynamicText>
            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: theme.accent, paddingHorizontal: 16, paddingVertical: 8 }]} 
              onPress={refreshPharmacies}
              disabled={labsLoading}
            >
              <DynamicText type="card" style={[styles.btnText, { fontFamily: 'Inter_600SemiBold', fontSize: 14 }]}>
                {labsLoading ? S.loading : S.refresh}
              </DynamicText>
            </TouchableOpacity>
          </View>

          {/* Error message */}
          {pharmaciesError && (
            <View style={{ backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), borderWidth: 2, padding: 12, borderRadius: 18, marginBottom: 16 }}>
              <DynamicText type="card" style={{ color: '#c62828', fontFamily: 'Inter_600SemiBold' }}>{pharmaciesError}</DynamicText>
          </View>
          )}

          {/* Last updated */}
          {lastUpdated && (
            <DynamicText type="card" style={{ fontSize: 12, marginBottom: 16, fontFamily: 'Inter_500Medium', opacity: 0.7 }}>
              {S.lastUpdated}: {lastUpdated.toLocaleTimeString()}
            </DynamicText>
          )}

          {/* Pharmacies list */}
          {pharmacies.length > 0 ? (
            pharmacies.map((pharmacy, index) => (
              <View key={pharmacy.id || index} style={{ 
                backgroundColor: getCardBackgroundColor() + 'CC', 
                borderColor: getCardBorderColor(),
                borderWidth: 2,
                borderRadius: 12, 
                padding: 16, 
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }}>
                {/* Pharmacy header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 12, 
                    backgroundColor: getCardBackgroundColor() + '80', 
                    borderColor: getCardBorderColor(),
                    borderWidth: 1,
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <Text style={{ fontSize: 20 }}>🏪</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <DynamicText type="card" style={{ fontSize: 16, fontFamily: 'Inter_700Bold' }}>
                      {pharmacy.name}
                    </DynamicText>
                    <DynamicText type="card" style={{ fontSize: 12, fontFamily: 'Inter_500Medium', opacity: 0.7 }}>
                      {formatDistance(pharmacy.distanceMiles)} • {pharmacy.address}
                    </DynamicText>
                    {/* Additional info */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <DynamicText type="card" style={{ fontSize: 10, fontFamily: 'Inter_400Regular', opacity: 0.6 }}>
                        {pharmacy.pickup ? '🏃 Pickup' : ''} {pharmacy.delivery ? '🚚 Delivery' : ''}
                      </DynamicText>
                    </View>
                  </View>
                </View>

                {/* Action buttons */}
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity 
                    style={{ 
                      flex: 1, 
                      backgroundColor: theme.accent, 
                      borderRadius: 8, 
                      paddingVertical: 12, 
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 4
                    }}
                    onPress={() => openDirections(pharmacy)}
                  >
                    <Text style={{ fontSize: 16 }}>🗺️</Text>
                    <DynamicText type="card" style={{ color: '#ffffff', fontFamily: 'Inter_700Bold', fontSize: 12 }}>
                      {S.directions}
                    </DynamicText>
                  </TouchableOpacity>
          </View>
              </View>
            ))
          ) : !labsLoading && !labsError ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: theme.sub, fontSize: 16, marginBottom: 16, fontFamily: 'Inter_400Regular' }}>
                No pharmacies loaded yet
              </Text>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: theme.accent }]} 
                onPress={refreshPharmacies}
              >
                <Text style={[styles.btnText, { color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }]}>
                  Find Nearby Pharmacies
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Loading indicator */}
          {pharmaciesLoading && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: theme.sub, fontFamily: 'Inter_400Regular' }}>{S.loadingPharmacies}</Text>
            </View>
          )}
        </ScrollView>
    );
  };

  const Labs = () => {
    const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
    const [lastUpdated, setLastUpdated] = useState(null);
    const [selectedLab, setSelectedLab] = useState(null);
    const [showTestTypes, setShowTestTypes] = useState(false);

    // Use pre-loaded data from main App component
    // No need for local state - using labs, labsLoading, labsError from main component

    // Refresh function - reloads data if needed
    const refreshLabs = async () => {
      try {
        setLabsLoading(true);
        setLabsError(null);
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLabsError('Location permission denied. Please enable location services.');
          return;
        }
        
        const { coords } = await Location.getCurrentPositionAsync({});
        
        // Import the lab search function
        const { findNearbyLabs, getTestTypesForLab } = await import('./services/labSearch');
        const nearbyLabs = await findNearbyLabs(coords.latitude, coords.longitude, lang, { noCache: true });
        
        // Add test types to each lab
        const labsWithTests = nearbyLabs.map(lab => ({
          ...lab,
          testTypes: lab.testTypes || getTestTypesForLab(lab.name)
        }));
        
        setLabs(labsWithTests);
        setLastUpdated(new Date());
        console.log('🧪 Refreshed labs:', labsWithTests.length);
      } catch (e) {
        console.error('Error refreshing labs:', e);
        setLabsError('Failed to refresh labs. Please try again.');
      } finally {
        setLabsLoading(false);
      }
    };

    const formatDistance = (miles) => {
      // Use location-based units: miles for USA, kilometers for other countries
      console.log(`🧪 LAB formatDistance called with:`, { miles, userCountry });
      if (userCountry === 'US') {
        console.log(`🧪 LAB Using miles: ${miles.toFixed(1)} mi`);
        return `${miles.toFixed(1)} ${S.mi}`;
      } else {
        const km = miles * 1.60934;
        console.log(`🧪 LAB Conversion: ${miles} miles × 1.60934 = ${km} km`);
        console.log(`🧪 LAB Final display: ${km.toFixed(1)} km`);
        return `${km.toFixed(1)} ${S.km}`;
      }
    };

    const openDirections = (lab) => {
      const q = encodeURIComponent(lab.name);
            const url = Platform.select({
        ios: `http://maps.apple.com/?q=${q}&ll=${lab.lat},${lab.lon}`,
        android: `geo:${lab.lat},${lab.lon}?q=${q}`,
              default: `https://www.google.com/maps/search/?api=1&query=${q}`,
            });
            Linking.openURL(url);
    };

    const callLab = (lab) => {
      // Debug logging
      console.log('🔍 callLab DEBUG - RECEIVED DATA:', {
        labName: lab.name,
        labPhone: lab.phone,
        labWebsite: lab.website,
        labRating: lab.rating,
        labAddress: lab.address,
        labId: lab.id,
        fullLabObject: lab
      });
      
      // Use only the real phone number from the API
      const phoneNumber = lab.phone;
      
      if (!phoneNumber) {
        console.log('❌ No phone number found for lab:', lab.name);
        // Show alert if no phone number available
        Alert.alert(
          'Phone Not Available',
          `No phone number found for ${lab.name}. Please try calling them directly or visit their website.`,
          [
            { text: 'OK', style: 'cancel' }
          ]
        );
        return;
      }
      
      console.log('✅ Phone number found:', phoneNumber);
      
      // Clean up the phone number (remove spaces, dashes, etc.)
      const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
      const phoneUrl = `tel:${cleanPhoneNumber}`;
      
      Alert.alert(
        'Call Lab',
        `Call ${lab.name}?\n${phoneNumber}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => {
              Linking.openURL(phoneUrl).catch(() => {
                Alert.alert('Error', 'Unable to make phone call');
              });
            }
          }
        ]
      );
    };

    const showLabTestTypes = (lab) => {
      setSelectedLab(lab);
      setShowTestTypes(true);
    };

    const getTestTypeIcon = (testType) => {
      const icons = {
        'blood-work': '🩸',
        'imaging': '📷',
        'cardiac': '❤️',
        'pathology': '🔬',
        'infectious-disease': '🦠',
        'allergy': '🤧',
        'specialty': '⚕️'
      };
      return icons[testType] || '🧪';
    };

    const getTestTypeName = (testType) => {
      const names = {
        'blood-work': S.bloodWork,
        'imaging': S.imaging,
        'cardiac': S.cardiac,
        'pathology': S.pathology,
        'infectious-disease': S.infectiousDisease,
        'allergy': S.allergy,
        'specialty': S.specialty
      };
      return names[testType] || testType;
    };

    const getTestTypeDescription = (testType) => {
      const descriptions = {
        'blood-work': 'Complete blood count, metabolic panels, lipid profiles, thyroid function, diabetes screening, vitamin levels, and more.',
        'imaging': 'X-rays, MRI, CT scans, ultrasounds, mammography, bone density tests, and other diagnostic imaging.',
        'cardiac': 'EKG/ECG, stress tests, echocardiograms, Holter monitoring, and other heart-related diagnostics.',
        'pathology': 'Biopsies, cytology, histology, cancer screening, tumor markers, and genetic testing.',
        'infectious-disease': 'COVID-19 testing, flu tests, STD screening, hepatitis panels, HIV testing, and tuberculosis tests.',
        'allergy': 'Allergy testing, food allergy panels, environmental allergy tests, patch testing, and RAST testing.',
        'specialty': 'Sleep studies, pulmonary function tests, neurological testing, endocrinology, rheumatology, and dermatology tests.'
      };
      return descriptions[testType] || 'Various medical tests and diagnostics available.';
    };

    return (
      <>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Header title={S.labsLocations} />
          
          {/* Header with refresh button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, flex: 1, opacity: 0.8 }}>
              {labs.length > 0 
                ? (S.foundLabs || 'Found {count} labs nearby').replace('{count}', labs.length)
                : (S.findNearbyLabs || 'Find nearby labs')
              }
            </DynamicText>
            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: theme.accent, paddingHorizontal: 16, paddingVertical: 8 }]} 
              onPress={refreshLabs}
              disabled={labsLoading}
            >
              <Text style={[styles.btnText, { color: '#ffffff', fontFamily: 'Inter_600SemiBold', fontSize: 14 }]}>
                {labsLoading ? S.loading : S.refresh}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error message */}
          {labsError && (
            <View style={{ backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), borderWidth: 2, padding: 12, borderRadius: 18, marginBottom: 16 }}>
              <DynamicText type="card" style={{ color: '#c62828', fontFamily: 'Inter_600SemiBold' }}>{labsError}</DynamicText>
            </View>
          )}

          {/* Last updated */}
          {lastUpdated && (
            <DynamicText type="card" style={{ fontSize: 12, marginBottom: 16, fontFamily: 'Inter_500Medium', opacity: 0.7 }}>
              {S.lastUpdated}: {lastUpdated.toLocaleTimeString()}
            </DynamicText>
          )}

          {/* Labs list */}
          {labs.length > 0 ? (
            labs.map((lab, index) => (
              <View key={lab.id || index} style={{ 
                backgroundColor: getCardBackgroundColor() + 'CC', 
                borderColor: getCardBorderColor(),
                borderWidth: 2,
                borderRadius: 12, 
                padding: 16, 
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }}>
                {/* Lab header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 8, 
                    backgroundColor: theme.muted, 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <Text style={{ fontSize: 20 }}>🧪</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <DynamicText type="card" style={{ fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}>
                      {lab.name}
                    </DynamicText>
                    <DynamicText type="card" style={{ fontSize: 12, fontFamily: 'Inter_400Regular', opacity: 0.7 }}>
                      {formatDistance(lab.distanceMiles)} • {lab.address}
                    </DynamicText>
                    {/* Test types preview */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                      {lab.testTypes && lab.testTypes.slice(0, 3).map((testType, idx) => (
                        <DynamicText key={idx} type="card" style={{ fontSize: 10, fontFamily: 'Inter_400Regular', marginRight: 8, opacity: 0.7 }}>
                          {getTestTypeIcon(testType)} {getTestTypeName(testType)}
                        </DynamicText>
                      ))}
                      {lab.testTypes && lab.testTypes.length > 3 && (
                        <DynamicText type="card" style={{ fontSize: 10, fontFamily: 'Inter_400Regular', opacity: 0.7 }}>
                          +{lab.testTypes.length - 3} {S.moreLab.replace('+1 ', '')}
                        </DynamicText>
                      )}
                    </View>
                  </View>
                </View>

                {/* Action buttons */}
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity 
                    style={{ 
                      flex: 1, 
                      backgroundColor: theme.accent, 
                      borderRadius: 8, 
                      paddingVertical: 12, 
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 4
                    }}
                    onPress={() => openDirections(lab)}
                  >
                    <Text style={{ fontSize: 16 }}>🗺️</Text>
                    <DynamicText type="card" style={{ color: '#ffffff', fontFamily: 'Inter_700Bold', fontSize: 12 }}>
                      {S.directions}
                    </DynamicText>
        </TouchableOpacity>
                </View>
              </View>
            ))
          ) : !labsLoading && !labsError ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <DynamicText type="card" style={{ fontSize: 16, marginBottom: 16, fontFamily: 'Inter_400Regular', opacity: 0.7 }}>
                No labs loaded yet
              </DynamicText>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: theme.accent }]} 
                onPress={refreshLabs}
              >
                <DynamicText type="card" style={[styles.btnText, { color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }]}>
                  Find Nearby Labs
                </DynamicText>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Loading indicator */}
          {labsLoading && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular', opacity: 0.7 }}>{S.loadingLabs}</DynamicText>
            </View>
          )}
      </ScrollView>

        {/* Test Types Modal */}
        <Modal visible={showTestTypes} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
            <View style={{ 
              backgroundColor: theme.card, 
              borderRadius: 16, 
              padding: 20, 
              maxHeight: '80%' 
            }}>
              <Text style={{ 
                color: theme.text, 
                fontSize: 14, 
                fontWeight: '600', 
                fontFamily: 'Inter_600SemiBold',
                marginBottom: 16 
              }}>
                {S.testTypes} - {selectedLab?.name}
              </Text>
              
              {selectedLab?.testTypes && (
                <ScrollView style={{ maxHeight: 400 }}>
                  {selectedLab.testTypes.map((testType, index) => (
                    <View key={index} style={{ 
                      backgroundColor: theme.muted, 
                      borderRadius: 8, 
                      padding: 12, 
                      marginBottom: 8 
                    }}>
                      <Text style={{ 
                        color: theme.text, 
                        fontSize: 14, 
                        fontWeight: '600', 
                        fontFamily: 'Inter_600SemiBold',
                        marginBottom: 4 
                      }}>
                        {getTestTypeIcon(testType)} {getTestTypeName(testType)}
                      </Text>
                      <Text style={{ 
                        color: theme.sub, 
                        fontSize: 12, 
                        fontFamily: 'Inter_400Regular' 
                      }}>
                        {getTestTypeDescription(testType)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
              
              <TouchableOpacity 
                style={{ 
                  backgroundColor: theme.accent, 
                  borderRadius: 8, 
                  paddingVertical: 12, 
                  alignItems: 'center',
                  marginTop: 16 
                }}
                onPress={() => setShowTestTypes(false)}
              >
                <Text style={{ 
                  color: '#ffffff', 
                  fontFamily: 'Inter_600SemiBold' 
                }}>
                  {S.close}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
  );
  };

  const Prescription = () => (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <Header title={S.prescription} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={[styles.btnSm, { backgroundColor: theme.accent }]} onPress={addRxPhoto}>
            <Text style={[styles.btnText, { color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }]}>{S.addPhoto}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnSm, { backgroundColor: theme.accent }]} onPress={exportRxToPDF}>
            <Text style={[styles.btnText, { color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }]}>{S.toPDF}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gallery}>
          {rxPhotos.map(p => (
            <Image key={p.id} source={{ uri: p.uri }} style={styles.thumb} />
          ))}
        </View>
      </ScrollView>
  );

  const Appointments = () => (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      <Header title="Appointments" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={[styles.btnSm, { backgroundColor: theme.accent }]} onPress={toggleRecord}>
            <Text style={[styles.btnText, { color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }]}>{isRecording ? S.stop : S.record}</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: theme.sub, marginTop: 8, fontFamily: 'Inter_600SemiBold' }}>{isRecording ? S.recording : ' '}</Text>

        {voiceNotes.map(n => (
          <View key={n.id} style={[styles.row, { backgroundColor: theme.card, borderColor: theme.chip, marginTop: 12 }]}>
            <Text style={{ color: theme.text, flex: 1, fontFamily: 'Inter_400Regular' }}>{new Date(n.createdAt).toLocaleString()}</Text>
            <TouchableOpacity onPress={() => playNote(n.uri)}><Text style={{ color: theme.sub, fontFamily: 'Inter_600SemiBold' }}>{S.play}</Text></TouchableOpacity>
          </View>
        ))}
      </ScrollView>
  );

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

  const CollapsibleSection = ({ title, children, sectionKey, onToggle }) => {
    const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
    return (
      <View style={[styles.section, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor() }]}>
        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => onToggle(sectionKey)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <DynamicText type="card" style={[styles.sectionTitle, { fontFamily: 'Inter_700Bold' }]}>{title}</DynamicText>
          </View>
        <Text style={{ 
          color: theme.accent, 
          fontSize: 18, 
          transform: [{ rotate: expandedSections[sectionKey] ? '90deg' : '0deg' }] 
        }}>
          ▶
        </Text>
      </TouchableOpacity>
      {expandedSections[sectionKey] && children}
    </View>
    );
  };

  const Header = ({ title }) => (
    <View style={[styles.header, { borderColor: theme.chip }]}>
      {route !== 'dashboard' ? (
        <AnimatedButton onPress={() => setRoute('dashboard')} style={[styles.headerHomeButton, { marginLeft: -65 }]}>
          <Image 
            source={require('./assets/AuricRX_home_button_across_screens.png')} 
            style={styles.headerHomeIcon}
            resizeMode="contain"
          />
        </AnimatedButton>
      ) : (
        <View style={{ width: 180, height: 60 }} />
      )}
      <DynamicText type="primary" style={[styles.headerTitle, { 
        fontFamily: 'Inter_600SemiBold',
        textAlign: 'center',
        flex: 1,
        position: 'absolute',
        left: '50%',
        transform: [{ translateX: -50 }],
        maxWidth: '60%'
      }]}>{title}</DynamicText>
      {route !== 'dashboard' ? (
        <View style={{ width: 40 }} />
      ) : (
        <AnimatedButton onPress={() => setRoute('settings')} style={styles.headerSettingsButton}>
          <Image 
            source={require('./assets/dashboard Emojies/settings cog.png')} 
            style={styles.headerSettingsIcon}
            resizeMode="contain"
          />
        </AnimatedButton>
      )}
    </View>
  );

  const Settings = () => {
    const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
    const { timeFormat, setTimeFormat, getTimeFormatOptions, getTimeFormatLabel } = useTimeFormat({
      translations: {
        useDeviceSetting: t('settings.useDeviceSetting'),
        twelveHour: t('settings.twelveHour'),
        twentyFourHour: t('settings.twentyFourHour'),
      }
    });
    
    const toggleSection = (section) => {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    };
    
    return (
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
        scrollsToTop={false}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <Header title={S.settings} />
        
        <CollapsibleSection title={S.profile} sectionKey="profile" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular', marginBottom: 12, opacity: 0.7 }}>{S.appDescription}</DynamicText>
            <TouchableOpacity 
              onPress={() => setRoute('admin-profile')}
              style={[styles.settingsButton, {
                backgroundColor: getCardBackgroundColor() + 'CC',
                borderColor: getCardBorderColor(),
                borderWidth: 2,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }]}
            >
              <DynamicText type="card" style={{ 
                fontFamily: 'Inter_700Bold', 
                fontSize: 15,
                textAlign: 'center'
              }}>{S.profile}</DynamicText>
            </TouchableOpacity>
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={S.healthProfile} sectionKey="healthProfile" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <TouchableOpacity 
              onPress={() => setRoute('health-profile')}
              style={[styles.settingsButton, {
                backgroundColor: getCardBackgroundColor() + 'CC',
                borderColor: getCardBorderColor(),
                borderWidth: 2,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }]}
            >
              <DynamicText type="card" style={{ 
                fontFamily: 'Inter_700Bold', 
                fontSize: 15,
                textAlign: 'center',
                marginBottom: 4,
                width: '100%'
              }}>{S.healthProfileSettings}</DynamicText>
              <DynamicText type="card" style={{ 
                fontFamily: 'Inter_400Regular', 
                fontSize: 12, 
                opacity: 0.7,
                textAlign: 'center'
              }}>
                {S.fastingProfileDescription}
              </DynamicText>
            </TouchableOpacity>
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={S.myDoctorAI} sectionKey="aiDoctor" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <View style={{ marginBottom: 12 }}>
              <DynamicText type="card" style={{ 
                fontFamily: 'Inter_600SemiBold', 
                fontSize: 14,
                marginBottom: 8,
                opacity: 0.8
              }}>{S.selectAI || 'Select AI Doctor'}</DynamicText>
              
              <TouchableOpacity 
                onPress={() => setSelectedAIDoctor('alfred')}
                style={[styles.settingsButton, {
                  backgroundColor: selectedAIDoctor === 'alfred' ? theme.accent + 'CC' : getCardBackgroundColor() + 'CC',
                  borderColor: selectedAIDoctor === 'alfred' ? theme.accent : getCardBorderColor(),
                  borderWidth: 2,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8
                }]}
              >
                <DynamicText type="card" style={{ 
                  fontFamily: 'Inter_700Bold', 
                  fontSize: 15,
                  textAlign: 'center'
                }}>🧑‍⚕️ {S.drAlfred || 'Dr. Alfred'}</DynamicText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setSelectedAIDoctor('mimi')}
                style={[styles.settingsButton, {
                  backgroundColor: selectedAIDoctor === 'mimi' ? theme.accent + 'CC' : getCardBackgroundColor() + 'CC',
                  borderColor: selectedAIDoctor === 'mimi' ? theme.accent : getCardBorderColor(),
                  borderWidth: 2,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8
                }]}
              >
                <DynamicText type="card" style={{ 
                  fontFamily: 'Inter_700Bold', 
                  fontSize: 15,
                  textAlign: 'center'
                }}>👩‍⚕️ {S.drMimi || 'Dr. Mimi'}</DynamicText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setSelectedAIDoctor('pawlmer')}
                style={[styles.settingsButton, {
                  backgroundColor: selectedAIDoctor === 'pawlmer' ? theme.accent + 'CC' : getCardBackgroundColor() + 'CC',
                  borderColor: selectedAIDoctor === 'pawlmer' ? theme.accent : getCardBorderColor(),
                  borderWidth: 2,
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  justifyContent: 'center'
                }]}
              >
                <DynamicText type="card" style={{ 
                  fontFamily: 'Inter_700Bold', 
                  fontSize: 15,
                  textAlign: 'center'
                }}>🐱 {S.drPawlmer || 'Dr. Pawlmer'}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={S.wallpaper} sectionKey="wallpaper" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <TouchableOpacity 
              onPress={() => setRoute('wallpaper')}
              style={[styles.settingsButton, {
                backgroundColor: getCardBackgroundColor() + 'CC',
                borderColor: getCardBorderColor(),
                borderWidth: 2,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }]}
            >
              <DynamicText type="card" style={{ 
                fontFamily: 'Inter_700Bold', 
                fontSize: 15,
                textAlign: 'center',
                marginBottom: 4
              }}>{S.changeWallpaper}</DynamicText>
              <DynamicText type="card" style={{ 
                fontFamily: 'Inter_400Regular', 
                fontSize: 12, 
                opacity: 0.7,
                textAlign: 'center'
              }}>
                {S.chooseWallpaperDescription}
              </DynamicText>
            </TouchableOpacity>
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={t('settings.timeFormat')} sectionKey="timeFormat" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <DynamicText type="card" style={{ 
              fontFamily: 'Inter_400Regular', 
              fontSize: 12, 
              opacity: 0.7,
              marginBottom: 12,
              textAlign: 'center'
            }}>
              {t('settings.timeFormatDescription')}
            </DynamicText>
            
            {getTimeFormatOptions().map((option) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => setTimeFormat(option.value)}
                style={{
                  backgroundColor: timeFormat === option.value ? theme.accent : getCardBackgroundColor(),
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: timeFormat === option.value ? theme.accent : getCardBorderColor(),
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <DynamicText type="card" style={{ 
                  fontFamily: 'Inter_600SemiBold', 
                  fontSize: 14
                }}>
                  {option.label}
                </DynamicText>
                {timeFormat === option.value && (
                  <DynamicText type="card" style={{ 
                    fontSize: 16
                  }}>
                    ✓
                  </DynamicText>
                )}
              </TouchableOpacity>
            ))}
            
            {/* Preview */}
            <View style={{
              backgroundColor: getCardBackgroundColor() + '50',
              borderRadius: 8,
              padding: 12,
              marginTop: 8,
              borderWidth: 1,
              borderColor: getCardBorderColor() + '50'
            }}>
              <DynamicText type="card" style={{ 
                fontFamily: 'Inter_500Medium', 
                fontSize: 12, 
                opacity: 0.8,
                textAlign: 'center',
                marginBottom: 4
              }}>
                {t('settings.preview')}:
              </DynamicText>
              <DynamicText type="card" style={{ 
                fontFamily: 'Inter_600SemiBold', 
                fontSize: 14,
                textAlign: 'center'
              }}>
                {formatTime('13:30', { format: timeFormat })}
              </DynamicText>
            </View>
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={S.notifications} sectionKey="notifications" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <RowSwitch
              label={S.pushNotifications}
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
            <RowSwitch
              label={S.emailNotifications}
              value={emailNotifications}
              onValueChange={setEmailNotifications}
            />
            <RowSwitch
              label={S.smsNotifications}
              value={smsNotifications}
              onValueChange={setSmsNotifications}
            />
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={S.security} sectionKey="security" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <TouchableOpacity 
              onPress={() => setRoute('admin-profile')}
              style={[styles.settingsButton, {
                backgroundColor: getCardBackgroundColor() + 'CC',
                borderColor: getCardBorderColor(),
                borderWidth: 2,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }]}
            >
              <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold' }}>{S.changePassword}</DynamicText>
            </TouchableOpacity>
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={S.privacy} sectionKey="privacy" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <RowSwitch
              label={S.dataCollection}
              value={dataCollection}
              onValueChange={setDataCollection}
            />
            <RowSwitch
              label={S.analytics}
              value={analytics}
              onValueChange={setAnalytics}
            />
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={S.language} sectionKey="language" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <SwitchRow
              label={S.english}
              value={currentLanguage === 'en'}
              onValueChange={() => handleLanguageChange('en')}
            />
            <SwitchRow
              label={S.spanish}
              value={currentLanguage === 'es'}
              onValueChange={() => handleLanguageChange('es')}
            />
            <SwitchRow
              label={S.portuguese}
              value={currentLanguage === 'pt'}
              onValueChange={() => handleLanguageChange('pt')}
            />
            <SwitchRow
              label={S.french}
              value={currentLanguage === 'fr'}
              onValueChange={() => handleLanguageChange('fr')}
            />
            <SwitchRow
              label={S.german}
              value={currentLanguage === 'de'}
              onValueChange={() => handleLanguageChange('de')}
            />
            <SwitchRow
              label={S.chinese}
              value={currentLanguage === 'zh'}
              onValueChange={() => handleLanguageChange('zh')}
            />
          </View>
        </CollapsibleSection>
        
        <CollapsibleSection title={S.help} sectionKey="help" onToggle={toggleSection}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular', marginBottom: 12, opacity: 0.7 }}>{S.emailUs}</DynamicText>
            <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: theme.accent }}>{S.emailAddress}</DynamicText>
          </View>
        </CollapsibleSection>
        
        <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
          <TouchableOpacity 
            onPress={handleSignOut}
            style={[styles.settingsButton, {
              backgroundColor: '#dc2626',
              borderColor: '#b91c1c',
              borderWidth: 2,
              borderRadius: 18,
              paddingVertical: 16,
              paddingHorizontal: 20,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#dc2626',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5
            }]}
          >
            <DynamicText type="card" style={{ 
              fontFamily: 'Inter_700Bold',
              color: '#ffffff',
              fontSize: 16,
              textAlign: 'center'
            }}>
              {S.signOut}
            </DynamicText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const Section = ({ title, children }) => {
    const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
    return (
      <View style={[styles.section, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor() }]}>
        <DynamicText type="card" style={[styles.sectionTitle, { fontFamily: 'Inter_700Bold' }]}>{title}</DynamicText>
        {children}
      </View>
    );
  };

  


  const RowSwitch = ({ label, value, onToggle }) => (
    <TouchableOpacity style={styles.rowBetween} onPress={onToggle}>
      <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular' }}>{label}</DynamicText>
      <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: value ? theme.accent : theme.chip }} />
    </TouchableOpacity>
  );

  const SwitchRow = ({ label, value, onValueChange }) => (
    <View style={styles.rowBetween}>
      <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular' }}>{label}</DynamicText>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
// --------- Medications Screen ----------
// Medications component now imported from separate file

// --------- Supplements Screen ---------- 
// Supplements component now imported from separate file

 // DISABLED - ALL SUPPLEMENTS CODE COMMENTED OUT
 // The inline Supplements component has been moved to components/Supplements.js

  

 // Screen selection moved to return statement to prevent remounting

// ---------- Utility functions ----------
// Utility: trim a string to n chars, add ellipsis if needed
function trimTo(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

  // final return (inside the App function)
  return !fontsLoaded ? (
  <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#222' }}>
    <Text style={{ color:'#fff' }}>Loading...</Text>
  </View>
) : (
  <WallpaperProvider>
    <WallpaperWrapper>
    <StatusBar 
      barStyle={themeKey === 'whiteGold' || themeKey === 'gold' ? 'dark-content' : 'light-content'} 
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
          <SignInScreen
            onAuthSuccess={handleAuthSuccess}
            onClose={handleAuthClose}
            onLanguageChange={handleLanguageChange}
            resetToSignIn={resetAuthToSignIn}
          />
        ) : (
      /* Main App Content - Only show after authentication */
      <>
        {route === 'dashboard' ? <Dashboard /> :
     route === 'reminders' ? <Reminders theme={theme} reminders={reminders} setReminders={setReminders} S={S} themeKey={themeKey} onNavigateToDashboard={() => setRoute('dashboard')} onNavigateToSettings={() => setRoute('settings')} meds={meds} setMeds={setMeds} onAddMedicationFromReminder={(medData) => setMeds(prev => [...prev, medData])} onAddAppointmentFromReminder={(apptData) => console.log('Add appointment:', apptData)} /> :
     route === 'pharmacies' ? <Pharmacies /> :
     route === 'labs' ? <Labs /> :
     route === 'prescription' ? <Prescription /> :
     route === 'settings' ? <Settings /> :
     route === 'medications' ? <Medications theme={theme} meds={meds} setMeds={setMeds} S={S} themeKey={themeKey} lang={lang} userCountry={userCountry} user={user} onNavigateToDashboard={() => setRoute('dashboard')} preloadedPharmacies={refillPharmacies} preloadedCoords={refillCoords} preloadedCurrency={refillCurrency} preloadedFxMeta={refillFxMeta} reminders={reminders} setReminders={setReminders} /> :
     route === 'herbs' ? <HerbsScreen onClose={() => setRoute('dashboard')} theme={theme} S={S} currentLang={lang} /> :
     route === 'supplements' ? <Supplements supplements={supplements} setSupplements={setSupplements} S={S} theme={theme} lang={lang} userCountry={userCountry} onNavigateToDashboard={() => setRoute('dashboard')} preloadedPharmacies={refillPharmacies} preloadedCoords={refillCoords} preloadedCurrency={refillCurrency} preloadedFxMeta={refillFxMeta} /> :
     route === 'documents' ? <MedicalDocumentsScreen onClose={() => setRoute('dashboard')} theme={theme} S={S} /> :
    route === 'smart-notifications' ? <SmartNotificationsScreen onClose={() => setRoute('dashboard')} theme={theme} S={S} /> :
    route === 'health-analytics' ? <HealthAnalyticsScreen onClose={() => setRoute('dashboard')} theme={theme} S={S} /> :
    route === 'appointments' ? <AppointmentManagementScreen onClose={() => setRoute('dashboard')} theme={theme} S={S} /> :
    route === 'ai-health' ? (isReady ? <AIHealthScreen onClose={() => setRoute('dashboard')} theme={theme} S={S} fastingProfile={fastingProfile} medications={meds} supplements={supplements} /> : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading translations...</Text></View>) :
        route === 'health-profile' ? <FastingProfileScreen onClose={() => setRoute('settings')} theme={theme} S={S} fastingProfile={fastingProfile} setFastingProfile={setFastingProfile} saveFastingProfileToDB={saveFastingProfileToDB} /> :
    route === 'wallpaper' ? <WallpaperSettingsScreen onClose={() => setRoute('dashboard')} onNavigateToSettings={() => setRoute('settings')} theme={theme} S={S} /> :
    route === 'admin-profile' ? <AdminProfileScreen onClose={() => setRoute('dashboard')} onNavigateToSettings={() => setRoute('settings')} currentUser={user} theme={theme} S={S} /> :
     <Dashboard />}

        {/* Floating AI button */}
        <AnimatedFloatingButton />
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
                  'alfred': S.drAlfred || 'Dr. Alfred',
                  'mimi': S.drMimi || 'Dr. Mimi',
                  'pawlmer': S.drPawlmer || 'Dr. Pawlmer'
                };
                return names[selectedAIDoctor] || (S.drAlfred || 'Dr. Alfred');
              })()}
            </Text>
            <Image 
              source={getDoctorImage((() => {
                const names = {
                  'alfred': 'Dr. Alfred',
                  'mimi': 'Dr. Mimi',
                  'pawlmer': 'Dr. Pawlmer'
                };
                return names[selectedAIDoctor] || 'Dr. Alfred';
              })())} 
              style={{ width: 24, height: 24 }} 
              resizeMode="contain" 
            />
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
          <TouchableOpacity 
            style={[styles.aiBtn, { backgroundColor: theme.accent }]} 
            onPress={() => sendAi(reminders, rxPhotos, meds, supplements, herbs, theme, fastingProfile, pharmacies, labs, userCountry)} 
            disabled={aiSending || streamLoading}
          >
            <Text style={{ color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }}>
              {streamLoading ? '...' : 'Send'}
            </Text>
        </TouchableOpacity>
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
      onSuccess={async () => {
        // Refresh subscription status after successful payment
        try {
          const status = await getSubscriptionStatus(user?.firebaseUser);
          if (status.ok) {
            setSubscriptionStatus(status);
          }
        } catch (error) {
          console.error('Failed to refresh subscription status:', error);
        }
      }}
    />
    </WallpaperWrapper>
  </WallpaperProvider>
);
} // closes export default function App()

// ---------- styles ----------
const styles = StyleSheet.create({
  topbar: { 
    borderBottomWidth: 1, 
    paddingBottom: 12, 
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  brand: { fontSize: 28 },
  brandButton: {
    padding: 0,
    backgroundColor: 'transparent',
  },
  brandLogo: {
    width: 180,
    height: 70,
  },
  headerHomeButton: {
    padding: 0,
    backgroundColor: 'transparent',
  },
  headerHomeIcon: {
    width: 180,
    height: 70,
  },
  quickRow: { flexDirection: 'row', gap: 18, marginTop: 8, flexWrap: 'wrap' },
  quick: { fontSize: 14 },

  widget: { borderWidth: 2, borderRadius: 18, padding: 12, marginBottom: 16 },
  widgetTitle: { fontSize: 16, marginBottom: 10 },
  widgetInner: { borderRadius: 16, padding: 14 },
  widgetSub: { fontSize: 12, marginBottom: 4 },
  widgetBig: { fontSize: 20, marginBottom: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingBottom: 100 },
card: {
    width: '46%',
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    minHeight: 120,
  },
  cardIcon: { marginBottom: 12, width: 32, height: 32 },
  cardIconLarge: { marginBottom: 12, width: 40, height: 40 },
  cardIconExtraLarge: { marginBottom: 12, width: 48, height: 48 },
  quickScanButton: {
    backgroundColor: '#d4af37',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  quickScanButtonText: {
    fontSize: 16,
    color: '#0b1117',
  },
  cardText: { fontSize: 16, textAlign: 'center' },

  headerTitle: { fontSize: 18 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },

  section: { borderWidth: 2, borderRadius: 18, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, marginBottom: 8, textAlign: 'center' },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 12,
    paddingHorizontal: 4
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },

  form: { borderWidth: 2, borderRadius: 16, padding: 12, marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },

  row: { borderWidth: 2, padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: { marginTop: 6, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  btnSm: { borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  btnText: { fontSize: 15 },

  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  thumb: { width: '48%', height: 160, borderRadius: 12 },

  fab: {
    position: 'absolute',
    right: 16,
    bottom: 60,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { 
  maxHeight: '80%', 
  borderTopLeftRadius: 18, 
  borderTopRightRadius: 18, 
  borderWidth: 1, 
  padding: 12,
    flex: 1,
},
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  msg: { padding: 10, borderRadius: 12, borderWidth: 1, marginVertical: 4, marginHorizontal: 2 },
  msgUser: { alignSelf: 'flex-end' },
  msgBot: { alignSelf: 'flex-start' },

  aiInputContainer: {
    position: 'relative',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 80,
    width: '100%',
  },
  aiInputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  aiInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  aiBtn: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emoji: { fontSize: 28, lineHeight: 32, textAlign: 'center' },
});

const consultStyles = StyleSheet.create({
  fab: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheetWrapper: { width: '100%' },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16, 
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 8 },

  bubble: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    maxWidth: '85%',
  },
  user: { alignSelf: 'flex-end' },
  assistant: { alignSelf: 'flex-start' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginRight: 8,
  },
  sendBtn: {      
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
});

// App registration is handled by index.js
