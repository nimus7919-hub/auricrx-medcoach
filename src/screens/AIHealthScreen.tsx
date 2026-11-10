import { getRegion } from '../services/region';
import USScreen from './USReferenceScreen';
import Modal from '../components/BackModal';
import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import KeyboardForm from '../../components/KeyboardForm';
import { authenticatedFetch } from '../services/authenticatedFetch';
import { symptomInformation } from '../services/symptomInformation';
import { API_BASE } from "../config/api";
import MedicationReferenceScreen from './MedicationReferenceScreen';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Animated, StatusBar, Image, Platform, Vibration, Dimensions, TextInput, Share } from 'react-native';
import { PremiumEntitlementService } from '../services/premiumEntitlementService';
import PremiumUpgradeScreen from './PremiumUpgradeScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as ImageManipulator from 'expo-image-manipulator';
import DynamicText from '../components/DynamicText';
import GoldHealthIcon from '../components/GoldHealthIcon';
import { ActivityHealthSection } from './ActivityHealthScreen';
import { useWallpaper } from '../contexts/WallpaperContext';
import { createAIHealthTranslations } from '../services/aiHealthTranslations';
import { useTranslation } from 'react-i18next';
const { width: screenWidth } = Dimensions.get('window');

interface AIHealthScreenProps {
  onClose: () => void;
  userId?: string;
  onConnectHealth: () => void;
  onHealthPrivacy: () => void;
  theme?: any;
  S?: any;
  fastingProfile?: any;
  medications?: any[];
  supplements?: any[];
}


// Type definitions with fallbacks
interface HealthInsight {
  id: string;
  type: 'medication_adherence' | 'symptom_pattern' | 'health_trend' | 'risk_assessment' | 'lifestyle' | 'appointment_reminder';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  actionable: boolean;
  actionItems: string[];
  relatedData: any;
  confidence: number;
  createdAt: string;
}

type SymptomAnalysis = ReturnType<typeof symptomInformation> & { notes?: string };

interface DrugInteraction {
  id: string;
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  clinicalEffects: string[];
  management: string;
  references: string[];
}

function MexicoAIHealthScreen({ onClose, userId, onConnectHealth, onHealthPrivacy, theme, S, fastingProfile, medications = [], supplements = [] }: AIHealthScreenProps) {
  useUILanguage();
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor, getAccentColor } = useWallpaper();
  
  // Premium access state
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [entitlement, setEntitlement] = useState<any>(null);
  
  useEffect(() => {
    checkPremiumAccess();
  }, []);
  
  const checkPremiumAccess = async () => {
    const ent = await PremiumEntitlementService.getInstance().checkPremiumAccess();
    setEntitlement(ent);
    if (!ent.hasPremiumAccess) {
      setShowUpgrade(true);
    }
  };
  
  if (showUpgrade && entitlement) {
    return <PremiumUpgradeScreen 
      onClose={onClose} 
      entitlement={entitlement} 
      feature="general" 
    />;
  }
  
  // Use translation hook directly for AI Health
  const { t: i18nT, i18n } = useTranslation();
  
  // AI Health specific translations
  const aiTranslations: Record<string, string> = createAIHealthTranslations(i18nT);
  
  // Translation function using aiTranslations object
  const t = i18nT;
  
  // Default theme if not provided
  const defaultTheme = {
    card: '#ffffff',
    text: '#2c2c2c',
    sub: '#6b6b6b',
    accent: '#d4af37',
    chip: '#e8e3d8',
    bgStart: '#faf8f5',
    bgEnd: '#f5f2ed',
  };
  
  const currentTheme = theme || defaultTheme;
  
  // Generate dynamic styles based on theme
  const getDynamicStyles = () => StyleSheet.create({
    sectionCard: {
      backgroundColor: getCardBackgroundColor() + 'CC',
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    sectionDescription: {
      fontSize: 12,
      marginBottom: 16,
      lineHeight: 18,
    },
    insightCard: {
      backgroundColor: getCardBackgroundColor() + '80',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderLeftWidth: 4,
      borderColor: getCardBorderColor(),
    },
    insightHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    insightTitle: {
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
    },
    insightSeverity: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    severityText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
    },
    insightDescription: {
      fontSize: 14,
      marginBottom: 8,
      lineHeight: 20,
    },
    actionItems: {
      marginTop: 8,
    },
    actionItem: {
      fontSize: 12,
      marginBottom: 4,
    },
    addButton: {
      backgroundColor: currentTheme.accent + 'CC',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    addButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    featureCard: {
      backgroundColor: getCardBackgroundColor() + '80',
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
      alignItems: 'center',
      borderColor: getCardBorderColor(),
      borderWidth: 1,
    },
    featureIcon: {
      fontSize: 32,
      marginBottom: 8,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    featureDescription: {
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 16,
    },
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingTop: 10,
      paddingBottom: 10,
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: getCardBackgroundColor(),
      borderRadius: 12,
      padding: 16,
      width: '95%',
      flex: 1,
      maxHeight: '100%',
      alignSelf: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: getCardBackgroundColor() + '80',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      color: getCardTextColor(),
      fontSize: 14,
      borderColor: getCardBorderColor(),
      borderWidth: 1,
    },
    multilineInput: {
      backgroundColor: getCardBackgroundColor() + '80',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      color: getCardTextColor(),
      fontSize: 14,
      height: 80,
      textAlignVertical: 'top',
      borderColor: getCardBorderColor(),
      borderWidth: 1,
    },
    pickerButton: {
      backgroundColor: getCardBackgroundColor() + '80',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderColor: getCardBorderColor(),
      borderWidth: 1,
    },
    pickerText: {
      fontSize: 14,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalButtonPrimary: {
      backgroundColor: currentTheme.accent + 'CC',
    },
    modalButtonSecondary: {
      backgroundColor: getCardBackgroundColor() + '80',
      borderColor: getCardBorderColor(),
      borderWidth: 1,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    modalButtonTextPrimary: {
      color: '#ffffff',
    },
    modalButtonTextSecondary: {
      color: getCardTextColor(),
    },
    modalHeader: {
      marginBottom: 16,
    },
    analysisSection: {
      marginBottom: 20,
    },
    analysisLabel: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
    },
    analysisValue: {
      fontSize: 14,
      fontWeight: '600',
    },
    conditionCard: {
      backgroundColor: getCardBackgroundColor() + '60',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: currentTheme.accent,
    },
    conditionTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 6,
    },
    conditionDescription: {
      fontSize: 13,
      marginBottom: 8,
      opacity: 0.8,
    },
    recommendationsContainer: {
      marginTop: 8,
    },
    recommendationsTitle: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 4,
    },
    recommendationItem: {
      fontSize: 12,
      marginBottom: 2,
      opacity: 0.9,
    },
    followUpItem: {
      fontSize: 13,
      marginBottom: 4,
    },
    insightFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    insightActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      minWidth: 60,
      alignItems: 'center',
    },
    storeButton: {
      backgroundColor: currentTheme.accent + '40',
      borderColor: currentTheme.accent,
      borderWidth: 1,
    },
    deleteButton: {
      backgroundColor: '#ef444440',
      borderColor: '#ef4444',
      borderWidth: 1,
    },
    actionButtonText: {
      fontSize: 11,
      fontWeight: '500',
    },
    viewAllButton: {
      backgroundColor: '#D4AF37',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 12,
    },
    viewAllButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '600',
    },
    doctorWarningCard: {
      backgroundColor: '#ff444420',
      borderRadius: 8,
      padding: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#ff4444',
      marginBottom: 16,
    },
    doctorWarningTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#ff4444',
      marginBottom: 8,
    },
    doctorWarningText: {
      fontSize: 12,
      color: '#ff4444',
      marginBottom: 4,
      fontWeight: '500',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      backgroundColor: getCardBackgroundColor() + '80',
      padding: 12,
      borderRadius: 8,
      flex: 1,
      minWidth: (screenWidth - 48) / 2,
      alignItems: 'center',
      borderColor: getCardBorderColor(),
      borderWidth: 1,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.accent,
    },
    statLabel: {
      fontSize: 12,
      marginTop: 4,
    },
    quickActions: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    quickActionButton: {
      backgroundColor: getCardBackgroundColor() + '80',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      flex: 1,
      alignItems: 'center',
      borderColor: getCardBorderColor(),
      borderWidth: 1,
    },
    quickActionText: {
      fontSize: 12,
      fontWeight: '500',
    },
    // Fasting Analytics Dynamic Styles
    fastingProfileCard: {
      backgroundColor: getCardBackgroundColor() + '80',
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    fastingProfileHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    fastingProfileTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: getCardTextColor(),
    },
    fastingStatusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    fastingStatusText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '600',
    },
    fastingAnalysisResult: {
      marginBottom: 16,
    },
    fastingTimeRecommendation: {
      backgroundColor: getCardBackgroundColor() + '40',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    fastingTimeLabel: {
      fontSize: 14,
      opacity: 0.8,
      marginBottom: 4,
      color: getCardTextColor(),
    },
    fastingTimeValue: {
      fontSize: 24,
      fontWeight: '700',
      color: '#10b981',
    },
    fastingMessage: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
      color: getCardTextColor(),
    },
    fastingWarnings: {
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      borderRadius: 8,
      padding: 12,
      borderLeftWidth: 3,
      borderLeftColor: '#f59e0b',
    },
    fastingWarningsTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
      color: '#f59e0b',
    },
    fastingWarningItem: {
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 4,
      color: getCardTextColor(),
    },
    fastingAnalysisPrompt: {
      backgroundColor: getCardBackgroundColor() + '40',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    fastingAnalysisPromptText: {
      fontSize: 14,
      textAlign: 'center',
      opacity: 0.8,
      color: getCardTextColor(),
    },
    fastingAnalyzeButton: {
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    fastingAnalyzeButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
    exportSection: {
      backgroundColor: getCardBackgroundColor(),
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: getCardBorderColor(),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    exportButton: {
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      marginTop: 16,
    },
    exportButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
    fastingNoProfileCard: {
      backgroundColor: getCardBackgroundColor() + '80',
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
      borderWidth: 1,
      borderColor: getCardBorderColor(),
      alignItems: 'center',
    },
    fastingNoProfileTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: getCardTextColor(),
    },
    fastingNoProfileDescription: {
      fontSize: 14,
      textAlign: 'center',
      opacity: 0.8,
      marginBottom: 16,
      lineHeight: 20,
      color: getCardTextColor(),
    },
    fastingSetupButton: {
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    fastingSetupButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
  });
  
  const dynamicStyles = getDynamicStyles();
  // Simplified state - no external service
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [symptomAnalyses, setSymptomAnalyses] = useState<SymptomAnalysis[]>([]);
  const [storedSymptomAnalyses, setStoredSymptomAnalyses] = useState<SymptomAnalysis[]>([]);
  const [drugInteractions, setDrugInteractions] = useState<DrugInteraction[]>([]);

  // Load symptom analyses from AsyncStorage on mount
  useEffect(() => {
    loadSymptomAnalyses();
  }, []);

  // Load saved symptom analyses
  const loadSymptomAnalyses = async () => {
    try {
      const savedSymptoms = await AsyncStorage.getItem('symptom_analyses');
      const savedStoredSymptoms = await AsyncStorage.getItem('stored_symptom_analyses');
      
      if (savedSymptoms) {
        const parsed = JSON.parse(savedSymptoms);
        setSymptomAnalyses(parsed.map((entry: any) => ({ ...symptomInformation(entry.symptoms || [], i18n.language), id: entry.id, createdAt: entry.createdAt, notes: entry.notes })));
      }
      
      if (savedStoredSymptoms) {
        const parsed = JSON.parse(savedStoredSymptoms);
        setStoredSymptomAnalyses(parsed.map((entry: any) => ({ ...symptomInformation(entry.symptoms || [], i18n.language), id: entry.id, createdAt: entry.createdAt, notes: entry.notes })));
      }
    } catch (error) {
      console.error('Failed to load symptom analyses:', error);
    }
  };

  // Save symptom analyses to AsyncStorage whenever they change
  useEffect(() => {
    saveSymptomAnalyses();
  }, [symptomAnalyses, storedSymptomAnalyses]);

  const saveSymptomAnalyses = async () => {
    try {
      await AsyncStorage.setItem('symptom_analyses', JSON.stringify(symptomAnalyses));
      await AsyncStorage.setItem('stored_symptom_analyses', JSON.stringify(storedSymptomAnalyses));
    } catch (error) {
      console.error('Failed to save symptom analyses:', error);
    }
  };


  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [showMedicationReferenceScreen, setShowMedicationReferenceScreen] = useState(false);
  const [showSymptomResultModal, setShowSymptomResultModal] = useState(false);
  const [showSymptomHistoryModal, setShowSymptomHistoryModal] = useState(false);
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);
  const [currentSymptomAnalysis, setCurrentSymptomAnalysis] = useState<SymptomAnalysis | null>(null);
  const [symptomText, setSymptomText] = useState('');
  const [medicationList, setMedicationList] = useState('');
  
  // Fasting Analytics State
  const [showFastingModal, setShowFastingModal] = useState(false);
  const [fastingResult, setFastingResult] = useState<string>('');
  const [fastingAnalysis, setFastingAnalysis] = useState<{
    compatible: boolean;
    warnings: string[];
    suggestedHours: number;
    message: string;
  } | null>(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Haptic feedback
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS === 'ios') {
      const style = type === 'light' ? Haptics.ImpactFeedbackStyle.Light : 
                   type === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : 
                   Haptics.ImpactFeedbackStyle.Heavy;
      Haptics.impactAsync(style);
    } else {
      Vibration.vibrate(type === 'light' ? 50 : type === 'medium' ? 100 : 200);
    }
  };


  useEffect(() => {
    // Simplified initialization - no external service
    console.log('AI Health Screen initialized');
    
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const deleteSymptomAnalysis = (id: string) => {
    setSymptomAnalyses(prev => prev.filter(analysis => analysis.id !== id));
    triggerHaptic('light');
  };

  const storeSymptomAnalysis = (id: string) => {
    const analysis = symptomAnalyses.find(a => a.id === id);
    if (analysis) {
      // Add to stored list
      setStoredSymptomAnalyses(prev => {
        // Check if already stored to avoid duplicates
        const alreadyStored = prev.some(item => item.id === id);
        if (!alreadyStored) {
          return [analysis, ...prev];
        }
        return prev;
      });
      
      // Keep symptom in current list - only delete when user explicitly clicks Delete
      
      triggerHaptic('medium');
      
      // Show brief confirmation
      setShowSavedConfirmation(true);
      setTimeout(() => {
        setShowSavedConfirmation(false);
      }, 1500);
    }
  };

  const emptyAllSymptoms = () => {
    Alert.alert(
      S?.confirmEmptySymptoms || uiI18n.t("ai.emptyAllSymptoms"),
      S?.confirmEmptySymptomsMessage || uiI18n.t("ai.confirmEmptySymptomsMessage"),
      [
        {
          text: S?.cancel || uiI18n.t("healthAnalytics.cancel"),
          style: 'cancel'
        },
        {
          text: S?.delete || uiI18n.t("ui.deleteAll"),
          style: 'destructive',
          onPress: () => {
            setSymptomAnalyses([]);
            triggerHaptic('heavy');
          }
        }
      ]
    );
  };

  const analyzeSymptoms = async () => {
    if (!symptomText.trim()) {
      Alert.alert(uiI18n.t("adminProfile.error"), t("ai.pleaseEnterSymptoms"));
      return;
    }

    try {
      const symptoms = symptomText.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      // Enhanced AI-driven analysis based on symptom patterns
      const analysis = symptomInformation(symptoms, i18n.language);
      
      setSymptomAnalyses(prev => [analysis, ...prev]);
      setSymptomText('');
      setShowSymptomModal(false);
      
      triggerHaptic('medium');
      
      // Show analysis results in custom modal
      setCurrentSymptomAnalysis(analysis);
      setShowSymptomResultModal(true);
    } catch (error) {
      console.error('Failed to analyze symptoms:', error);
      Alert.alert('❌ ' + aiTranslations.error, aiTranslations.failedToAnalyzeSymptoms);
    }
  };

  // REMOVED: AI-based drug interaction checker (COFEPRIS compliance)
  // Replaced with static medication reference lookup in MedicationReferenceScreen
  const openMedicationReference = () => {
    setShowMedicationReferenceScreen(true);
  };

  // Helper function to translate stored values
  const translateValue = (value: string | undefined, translationKey: string) => {
    if (!value) return t("ai.notSpecified");
    
    // Map stored values to translation keys
    const valueTranslations: { [key: string]: string } = {
      'normal': t("healthProfile.normal"),
      'high': t("healthProfile.high"),
      'low': t("healthProfile.low"),
      'poor': t("healthProfile.poor"),
      'fair': t("healthProfile.fair"),
      'good': t("healthProfile.good"),
      'excellent': t("healthProfile.excellent"),
      'sedentary': t("healthProfile.sedentary"),
      'light': t("healthProfile.light"),
      'moderate': t("healthProfile.moderate"),
      'athlete': t("healthProfile.athlete"),
      'timeRestricted': t("healthProfile.timeRestricted"),
      'alternateDay': t("healthProfile.alternateDay"),
      'extended': t("healthProfile.extended"),
      'custom': t("healthProfile.custom"),
      'daily': t("healthProfile.daily"),
      'weekly': t("healthProfile.weekly"),
      'monthly': t("healthProfile.monthly"),
      'weightLoss': t("healthProfile.weightLoss"),
      'metabolicHealth': t("healthProfile.metabolicHealth"),
      'generalHealth': t("healthProfile.generalHealth"),
      'spiritual': t("healthProfile.spiritual"),
    };
    
    return valueTranslations[value] || value;
  };

  const exportToPDF = async () => {
    console.log('🚀 Export PDF button pressed');
    console.log('📊 Medications count:', medications?.length || 0);
    console.log('👤 Fasting profile exists:', !!fastingProfile);
    console.log('🧠 Fasting analysis exists:', !!fastingAnalysis);
    
    try {
      const currentDate = new Date().toLocaleDateString();
      console.log('📅 Generated date:', currentDate);
      
      console.log('📝 Creating HTML content for PDF...');
      
      // Get AuricRX logo as base64 (using Image.resolveAssetSource for proper handling)
      const logoSource = Image.resolveAssetSource(require('../../assets/sign in logo.png'));
      console.log('🔍 Logo source:', logoSource);
      
      // Download the logo to local storage
      const logoUri = await FileSystem.downloadAsync(
        logoSource.uri,
        FileSystem.documentDirectory + 'sign-in-logo.png'
      );
      console.log('🔍 Logo downloaded to:', logoUri.uri);
      
      // Compress the logo to reduce file size for PDF
      console.log('📦 Compressing logo for PDF...');
      const compressedLogo = await ImageManipulator.manipulateAsync(
        logoUri.uri,
        [{ resize: { width: 400 } }], // Resize to 400px width for PDF
        { 
          compress: 0.7, // 70% quality
          format: ImageManipulator.SaveFormat.PNG,
          base64: true 
        }
      );
      
      if (!compressedLogo.base64) {
        throw new Error(uiI18n.t("ui.failedToCompressLogo"));
      }
      
      const logoBase64 = compressedLogo.base64;
      console.log('✅ Logo compressed successfully, base64 length:', logoBase64.length);
      
      // Create HTML content for PDF (similar to DocumentsScreen)
      const medicationsHtml = medications && medications.length > 0 ? 
        medications.map((med, index) => `
          <div class="medication-item">
            <h3>${index + 1}. ${med.name || 'N/A'}</h3>
            <p><strong>${t("ai.dosage")}:</strong> ${med.strength || 'N/A'}</p>
            <p><strong>${t("ai.quantity")}:</strong> ${med.quantity || 'N/A'}</p>
            <p><strong>${t("ai.times")}:</strong> ${med.times ? med.times.join(', ') : 'N/A'}</p>
            ${med.notes ? `<p><strong>${t("ai.notes")}:</strong> ${med.notes}</p>` : ''}
          </div>
        `).join('') : 
        `<p>${t("ai.noMedicationsRecorded")}</p>`;

      const fastingProfileHtml = fastingProfile ? `
        <div class="profile-section">
          <h3>${t("ai.basicInformation")}</h3>
          <p><strong>${t("healthProfile.weight")}:</strong> ${fastingProfile.weight || t("ai.notSpecified")} ${fastingProfile.weightUnit || 'kg'}</p>
          <p><strong>${t("healthProfile.height")}:</strong> ${fastingProfile.height || t("ai.notSpecified")} ${fastingProfile.heightUnit || 'cm'}</p>
          
          <h3>${t("ai.healthConditions")}</h3>
          <p><strong>${t("ai.healthConditions")}:</strong> ${[
            fastingProfile.diabetes ? t("ai.diabetes") : '',
            fastingProfile.hypoglycemia ? t("ai.hypoglycemia") : '',
            fastingProfile.heartConditions ? t("ai.heartConditions") : '',
            fastingProfile.kidneyDisease ? t("ai.kidneyDisease") : '',
            fastingProfile.liverDisease ? t("ai.liverDisease") : '',
            fastingProfile.eatingDisorders ? t("ai.eatingDisorders") : '',
            fastingProfile.pregnancy ? t("ai.pregnancy") : '',
            fastingProfile.breastfeeding ? t("ai.breastfeeding") : '',
            fastingProfile.gastrointestinalIssues ? t("ai.gastrointestinalIssues") : '',
            ...(fastingProfile.otherHealthConditions || [])
          ].filter(Boolean).join(', ') || t("ai.noneReported")}</p>
          
          <h3>${t("ai.nutritionalStatusBodyComposition")}</h3>
          <p><strong>${t("ai.bodyFatLevel")}:</strong> ${translateValue(fastingProfile.bodyFatLevel, 'bodyFatLevel')}</p>
          <p><strong>${t("ai.muscleMass")}:</strong> ${translateValue(fastingProfile.muscleMass, 'muscleMass')}</p>
          <p><strong>${t("ai.micronutrientLevels")}:</strong> ${translateValue(fastingProfile.micronutrientLevels, 'micronutrientLevels')}</p>
          <p><strong>${t("ai.hydrationLevel")}:</strong> ${translateValue(fastingProfile.hydrationLevel, 'hydrationLevel')}</p>
          
          <h3>${t("ai.mentalHealthCognitiveDemands")}</h3>
          <p><strong>${t("ai.highStressEnvironment")}:</strong> ${fastingProfile.highStressEnvironment ? t("ai.yes") : t("ai.no")}</p>
          <p><strong>${t("ai.intensiveMentalTasks")}:</strong> ${fastingProfile.intensiveMentalTasks ? t("ai.yes") : t("ai.no")}</p>
          <p><strong>${t("ai.anxiety")}:</strong> ${fastingProfile.anxiety ? t("ai.yes") : t("ai.no")}</p>
          <p><strong>${t("ai.depression")}:</strong> ${fastingProfile.depression ? t("ai.yes") : t("ai.no")}</p>
          
          <h3>${t("ai.lifestyleActivityLevel")}</h3>
          <p><strong>${t("ai.activityLevel")}:</strong> ${translateValue(fastingProfile.activityLevel, 'activityLevel')}</p>
          <p><strong>${t("ai.physicalLaborJob")}:</strong> ${fastingProfile.physicalLabor ? t("ai.yes") : t("ai.no")}</p>
          <p><strong>${t("ai.longWorkShifts")}:</strong> ${fastingProfile.longShifts ? t("ai.yes") : t("ai.no")}</p>
          <p><strong>${t("ai.sleepQuality")}:</strong> ${translateValue(fastingProfile.sleepQuality, 'sleepQuality')}</p>
          
          <h3>${t("ai.fastingProtocolPreferences")}</h3>
          <p><strong>${t("ai.preferredFastingType")}:</strong> ${translateValue(fastingProfile.preferredFastingType, 'preferredFastingType')}</p>
          <p><strong>${t("ai.maximumFastingHours")}:</strong> ${fastingProfile.maxFastingHours || t("ai.notSpecified")}</p>
          <p><strong>${t("ai.fastingFrequency")}:</strong> ${translateValue(fastingProfile.fastingFrequency, 'fastingFrequency')}</p>
          
          <h3>${t("ai.goals")}</h3>
          <p><strong>${t("ai.primaryGoal")}:</strong> ${translateValue(fastingProfile.primaryGoal, 'primaryGoal')}</p>
          
          <h3>${t("ai.medicalSupervisionMonitoring")}</h3>
          <p><strong>${t("ai.medicalSupervision")}:</strong> ${fastingProfile.medicalSupervision ? t("ai.yes") : t("ai.no")}</p>
          <p><strong>${t("ai.selfMonitoring")}:</strong> ${fastingProfile.selfMonitoring ? t("ai.yes") : t("ai.no")}</p>
          <p><strong>${t("ai.wearableDevices")}:</strong> ${fastingProfile.wearableDevices ? t("ai.yes") : t("ai.no")}</p>
        </div>
      ` : `<p>${t("ai.noFastingProfileCompleted")}</p>`;

      const fastingAnalysisHtml = fastingAnalysis ? `
        <div class="analysis-section">
          <h3>${t("ai.fastingAnalysis")}</h3>
          <div class="analysis-result ${fastingAnalysis.compatible ? 'compatible' : 'needs-review'}">
            <p><strong>${t("ai.status")}:</strong> ${fastingAnalysis.compatible ? t("ai.compatible") : t("ai.needsReview")}</p>
            <p><strong>${t("ai.recommendedFastingWindow")}:</strong> ${fastingAnalysis.suggestedHours > 0 ? fastingAnalysis.suggestedHours + ':' + (24-fastingAnalysis.suggestedHours) : fastingAnalysis.message}</p>
            <p><strong>${t("ai.analysis")}:</strong> ${fastingAnalysis.message}</p>
          </div>
          ${fastingAnalysis.warnings && fastingAnalysis.warnings.length > 0 ? `
            <div class="warnings">
              <h4>${S?.importantConsiderations || uiI18n.t("ai.importantConsiderations")}:</h4>
              <ul>
                ${fastingAnalysis.warnings.map(warning => `<li>${warning}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      ` : '';

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${aiTranslations.auricrxHealthReport}</title>
            <style>
              body { 
                font-family: Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", sans-serif; 
                margin: 20px; 
                line-height: 1.6;
                color: #333;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #3B82F6;
                padding-bottom: 20px;
              }
              .logo {
                max-width: 200px;
                height: auto;
                margin-bottom: 10px;
              }
              .title {
                color: #D4AF37;
                font-size: 24px;
                font-weight: bold;
                margin: 0;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
              }
              .subtitle {
                color: #6B7280;
                font-size: 16px;
                margin: 5px 0 0 0;
              }
              .section { 
                margin-bottom: 25px; 
              }
              .section-title { 
                font-size: 18px; 
                font-weight: bold; 
                color: #333; 
                margin-bottom: 15px; 
              }
              .medication-item { 
                background: #f8f9fa; 
                padding: 15px; 
                margin: 10px 0; 
                border-radius: 5px; 
              }
              .medication-item h3 {
                margin-top: 0;
                color: #000000;
              }
              .profile-section, .analysis-section {
                background: #f8f9fa;
                padding: 15px;
                margin: 10px 0;
                border-radius: 5px;
              }
              .analysis-result.compatible {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                padding: 10px;
                border-radius: 5px;
                margin: 10px 0;
              }
              .analysis-result.needs-review {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 10px;
                border-radius: 5px;
                margin: 10px 0;
              }
              .warnings {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                padding: 10px;
                border-radius: 5px;
                margin: 10px 0;
              }
              .warnings ul {
                margin: 5px 0;
                padding-left: 20px;
              }
              .footer { 
                margin-top: 30px; 
                text-align: center; 
                font-size: 12px; 
                color: #666; 
                border-top: 1px solid #ddd; 
                padding-top: 20px; 
              }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="data:image/png;base64,${logoBase64}" alt="AuricRX Logo" class="logo">
              <h1 class="title">${aiTranslations.healthReport}</h1>
              <p class="subtitle">${aiTranslations.generatedOn} ${currentDate}</p>
            </div>

            <div class="section">
              <h2 class="section-title">${t("ai.currentMedications")}</h2>
              ${medicationsHtml}
            </div>

            <div class="section" style="page-break-before: always;">
              <h2 class="section-title">${t("ai.healthProfile")}</h2>
              ${fastingProfileHtml}
            </div>

            ${fastingAnalysisHtml}

            <div class="footer">
              <p>${aiTranslations.auricrxHealthReport}</p>
              <p>${aiTranslations.thisReportWasGenerated}</p>
              <p>${aiTranslations.consultHealthcareProvider}</p>
            </div>
          </body>
        </html>
      `;

      console.log('📄 HTML content created, length:', html.length);
      console.log('🔍 HTML contains logo:', html.includes('data:image/png;base64'));
      console.log('🔍 Logo in HTML preview:', html.substring(html.indexOf('data:image/png;base64'), html.indexOf('data:image/png;base64') + 100));
      
      // Generate PDF using expo-print (same as DocumentsScreen)
      console.log('🖨️ Generating PDF with expo-print...');
      console.log('📄 HTML length:', html.length);
      console.log('🌐 Language:', i18n.language);
      
      // Don't use timeout wrapper as it can cause issues with large PDFs or special characters
      // expo-print will handle the generation time naturally
      const { uri } = await Print.printToFileAsync({ html });
      console.log('✅ PDF generated at:', uri);
      
      // Save to docs directory
      console.log('💾 Saving PDF to documents directory...');
      const docsDir = FileSystem.documentDirectory + 'health-reports/';
      
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(docsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(docsDir, { intermediates: true });
        console.log('📁 Created health-reports directory');
      }
      
      const fileName = `AuricRX_Health_Report_${currentDate.replace(/\//g, '-')}.pdf`;
      const finalUri = docsDir + fileName;
      
      await FileSystem.moveAsync({
        from: uri,
        to: finalUri,
      });
      console.log('✅ PDF saved to:', finalUri);

      // Share the PDF using expo-sharing (same as DocumentsScreen)
      console.log('📤 Sharing PDF with expo-sharing...');
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error(uiI18n.t("medicalDocuments.sharingNotAvailablePlatform"));
      }
      
      // Share the PDF with timeout to prevent app hang if dialog doesn't close properly
      console.log('📤 Opening share dialog...');
      try {
        await Promise.race([
          Sharing.shareAsync(finalUri, {
            mimeType: 'application/pdf',
            dialogTitle: uiI18n.t("ui.shareHealthReport"),
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(uiI18n.t("ui.shareTimeout"))), 10000)
          )
        ]);
        console.log('✅ PDF share completed');
      } catch (shareError) {
        // If timeout or error, just log and continue - don't crash the app
        console.warn('⚠️ Share dialog issue (this is OK):', shareError);
      }
    } catch (error) {
      console.error('❌ Error exporting health report:', error);
      console.error('❌ Error type:', typeof error);
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      
      // Show error to user so they know what happened
      Alert.alert(
        uiI18n.t("adminProfile.error"),
        uiI18n.t("ui.failedToExportHealthReportThisMayBeDueToLargeFileSizeOrSpecialCharactersInTheContentPlease"),
        [{ text: uiI18n.t("adminProfile.ok") }]
      );
    }
  };

  // Export ACTIVE symptoms only (unsaved symptoms)
  const exportActiveSymptomsToPDF = async () => {
    console.log('🚀 Export Active Symptoms PDF button pressed');
    console.log('📊 Active symptoms count:', symptomAnalyses?.length || 0);
    
    if (!symptomAnalyses || symptomAnalyses.length === 0) {
      Alert.alert(
        S?.noActiveSymptoms || uiI18n.t("ai.noActiveSymptoms"),
        S?.noActiveSymptomsMessage || uiI18n.t("ai.noActiveSymptomsMessage"),
        [{ text: S?.ok || uiI18n.t("adminProfile.ok") }]
      );
      return;
    }
    
    try {
      const currentDate = new Date().toLocaleDateString();
      console.log('📅 Generated date:', currentDate);
      
      console.log('📝 Creating HTML content for Active Symptoms PDF...');
      
      // Try to load logo with better error handling
      let logoBase64 = '';
      try {
        const logoAsset = require('../../assets/sign in logo.png');
        const logoSource = Image.resolveAssetSource(logoAsset);
        console.log('🔍 Logo source:', logoSource);
        
        // Try to download and convert to base64
        const downloadPath = FileSystem.documentDirectory + 'temp-logo-active.png';
        await FileSystem.downloadAsync(logoSource.uri, downloadPath);
        
        // Compress the logo for PDF to reduce file size
        console.log('📦 Compressing logo for PDF...');
        const compressedLogo = await ImageManipulator.manipulateAsync(
          downloadPath,
          [{ resize: { width: 400 } }],
          { 
            compress: 0.7,
            format: ImageManipulator.SaveFormat.PNG,
            base64: true 
          }
        );
        
        if (!compressedLogo.base64) {
          throw new Error(uiI18n.t("ui.failedToCompressLogo"));
        }
        logoBase64 = compressedLogo.base64;
        console.log('✅ Logo compressed, size:', logoBase64.length);
        
        // Clean up temp file
        await FileSystem.deleteAsync(downloadPath, { idempotent: true });
      } catch (error) {
        console.warn('⚠️ Logo load failed, using text header:', error);
      }
      
      // Create HTML content for ACTIVE symptoms only
      const symptomsHtml = symptomAnalyses.map((analysis, index) => `
        <div style="margin: 15px 0; padding: 10px; border-left: 3px solid #3B82F6;">
          <p style="margin: 0;"><strong>${index + 1}. ${analysis.symptoms.join(', ')}</strong> <span style="color: #666;"></span></p>
          <p style="margin: 5px 0 0 0; font-size: 12px;">${S?.date || uiI18n.t("ai.date")}: ${new Date(analysis.createdAt).toLocaleDateString()} ${new Date(analysis.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          ${analysis.notes ? `<p style="margin: 5px 0 0 0; font-size: 12px;">${S?.notes || uiI18n.t("ai.notes")}: ${analysis.notes}</p>` : ''}
        </div>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${S?.activeSymptomReport || uiI18n.t("ai.activeSymptomReport")}</title>
            <style>
              body { font-family: Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #D4AF37; }
              .logo { max-width: 120px; height: auto; margin-bottom: 10px; }
              h1 { color: #D4AF37; margin: 10px 0; font-size: 22px; }
              h2 { color: #333; margin: 5px 0; font-size: 18px; }
              p { margin: 5px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" alt="Logo" class="logo">` : ''}
              <h1>${S?.auricrxMedCoach || uiI18n.t("ai.auricrxMedCoach")}</h1>
              <h2>${S?.activeSymptomReport || uiI18n.t("ai.activeSymptomReport")}</h2>
              <p style="color: #666; font-size: 12px;">${S?.generatedOn || uiI18n.t("ai.generatedOn")}: ${currentDate}</p>
            </div>
            <div style="margin: 15px 0; padding: 10px; background: #f0f9ff; border-left: 3px solid #0284c7;">
              <p><strong>${S?.activeSymptoms || uiI18n.t("ai.activeSymptoms")}:</strong> ${symptomAnalyses.length}</p>
            </div>
            ${symptomsHtml}
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center;">
              <p style="font-size: 10px; color: #666;">${S?.symptomTrackerDisclaimer || uiI18n.t("ai.symptomTrackerDisclaimer")}</p>
            </div>
          </body>
        </html>
      `;

      console.log('📄 HTML content created, length:', html.length);
      
      // Generate PDF using expo-print (Active Symptoms)
      console.log('🖨️ Generating PDF with expo-print...');
      console.log('📄 HTML length:', html.length);
      const pdfResult = await Print.printToFileAsync({ html });
      const { uri } = pdfResult;
      console.log('✅ PDF generated at:', uri);
      
      // Save to docs directory
      console.log('💾 Saving PDF to documents directory...');
      const docsDir = FileSystem.documentDirectory + 'symptom-reports/';
      
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(docsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(docsDir, { intermediates: true });
        console.log('📁 Created symptom-reports directory');
      }
      
      const fileName = `AuricRX_Active_Symptoms_${currentDate.replace(/\//g, '-')}.pdf`;
      const finalUri = docsDir + fileName;
      
      await FileSystem.moveAsync({
        from: uri,
        to: finalUri,
      });
      console.log('✅ PDF saved to:', finalUri);

      // Share the PDF using expo-sharing (CORRECT - no destructuring!)
      console.log('📤 Sharing PDF with expo-sharing...');
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error(uiI18n.t("medicalDocuments.sharingNotAvailablePlatform"));
      }
      
      // Share the PDF with timeout to prevent app hang if dialog doesn't close properly
      console.log('📤 Opening share dialog...');
      try {
        await Promise.race([
          Sharing.shareAsync(finalUri, {
            mimeType: 'application/pdf',
            dialogTitle: uiI18n.t("ui.shareSymptomReport"),
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(uiI18n.t("ui.shareTimeout"))), 10000)
          )
        ]);
        console.log('✅ PDF share completed');
      } catch (shareError) {
        // If timeout or error, just log and continue - don't crash the app
        console.warn('⚠️ Share dialog issue (this is OK):', shareError);
      }
      
      // No alert - silent success
    } catch (error) {
      console.error('❌ Error exporting active symptom report:', error);
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      
      Alert.alert(
        S?.exportFailed || uiI18n.t("ai.exportFailed"),
        S?.symptomReportFailed || uiI18n.t("ai.symptomReportFailed"),
        [{ text: uiI18n.t("adminProfile.ok") }]
      );
    }
  };

  // Export ALL symptoms (stored + active history)
  const exportAllSymptomsToPDF = async () => {
    console.log('🚀 Export All Symptoms PDF button pressed');
    const allSymptoms = [...storedSymptomAnalyses, ...symptomAnalyses];
    console.log('📊 Total symptoms count:', allSymptoms.length);
    
    if (allSymptoms.length === 0) {
      Alert.alert(
        S?.noSymptomsToExport || uiI18n.t("ai.noSymptomsToExport"),
        S?.noSymptomsMessage || uiI18n.t("ai.noSymptomsMessage"),
        [{ text: S?.ok || uiI18n.t("adminProfile.ok") }]
      );
      return;
    }
    
    try {
      const currentDate = new Date().toLocaleDateString();
      console.log('📅 Generated date:', currentDate);
      
      console.log('📝 Creating HTML content for Complete Symptom History PDF...');
      
      // Try to load logo with better error handling
      let logoBase64 = '';
      try {
        const logoAsset = require('../../assets/sign in logo.png');
        const logoSource = Image.resolveAssetSource(logoAsset);
        console.log('🔍 Logo source:', logoSource);
        
        // Try to download and convert to base64
        const downloadPath = FileSystem.documentDirectory + 'temp-logo-all.png';
        await FileSystem.downloadAsync(logoSource.uri, downloadPath);
        
        // Compress the logo for PDF to reduce file size
        console.log('📦 Compressing logo for PDF...');
        const compressedLogo = await ImageManipulator.manipulateAsync(
          downloadPath,
          [{ resize: { width: 400 } }],
          { 
            compress: 0.7,
            format: ImageManipulator.SaveFormat.PNG,
            base64: true 
          }
        );
        
        if (!compressedLogo.base64) {
          throw new Error(uiI18n.t("ui.failedToCompressLogo"));
        }
        logoBase64 = compressedLogo.base64;
        console.log('✅ Logo compressed, size:', logoBase64.length);
        
        // Clean up temp file
        await FileSystem.deleteAsync(downloadPath, { idempotent: true });
      } catch (error) {
        console.warn('⚠️ Logo load failed, using text header:', error);
      }
      
      // Sort all symptoms by date (newest first)
      const sortedSymptoms = allSymptoms.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Create HTML content for ALL symptoms
      const symptomsHtml = sortedSymptoms.map((analysis, index) => `
        <div style="margin: 15px 0; padding: 10px; border-left: 3px solid #3B82F6;">
          <p style="margin: 0;"><strong>${index + 1}. ${analysis.symptoms.join(', ')}</strong> <span style="color: #666;"></span></p>
          <p style="margin: 5px 0 0 0; font-size: 12px;">${S?.date || uiI18n.t("ai.date")}: ${new Date(analysis.createdAt).toLocaleDateString()} ${new Date(analysis.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          ${analysis.notes ? `<p style="margin: 5px 0 0 0; font-size: 12px;">${S?.notes || uiI18n.t("ai.notes")}: ${analysis.notes}</p>` : ''}
        </div>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${S?.symptomTrackerReport || uiI18n.t("ai.symptomTrackerReport")}</title>
            <style>
              body { font-family: Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #D4AF37; }
              .logo { max-width: 120px; height: auto; margin-bottom: 10px; }
              h1 { color: #D4AF37; margin: 10px 0; font-size: 22px; }
              h2 { color: #333; margin: 5px 0; font-size: 18px; }
              p { margin: 5px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" alt="Logo" class="logo">` : ''}
              <h1>${S?.auricrxMedCoach || uiI18n.t("ai.auricrxMedCoach")}</h1>
              <h2>${S?.symptomTrackerReport || uiI18n.t("ai.symptomTrackerReport")}</h2>
              <p style="color: #666; font-size: 12px;">${S?.generatedOn || uiI18n.t("ai.generatedOn")}: ${currentDate}</p>
            </div>
            <div style="margin: 15px 0; padding: 10px; background: #f0f9ff; border-left: 3px solid #0284c7;">
              <p><strong>${S?.totalSymptoms || uiI18n.t("ui.totalSymptoms")}:</strong> ${allSymptoms.length}</p>
              <p><strong>${S?.storedSymptoms || uiI18n.t("ui.stored")}:</strong> ${storedSymptomAnalyses.length} | <strong>${S?.activeSymptoms || uiI18n.t("settings.active")}:</strong> ${symptomAnalyses.length}</p>
            </div>
            ${symptomsHtml}
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center;">
              <p style="font-size: 10px; color: #666;">${S?.symptomTrackerDisclaimer || uiI18n.t("ai.symptomTrackerDisclaimer")}</p>
            </div>
          </body>
        </html>
      `;

      console.log('📄 HTML content created, length:', html.length);
      
      // Generate PDF using expo-print (All Symptoms)
      console.log('🖨️ Generating PDF with expo-print...');
      console.log('📄 HTML length:', html.length);
      const pdfResult = await Print.printToFileAsync({ html });
      const { uri } = pdfResult;
      console.log('✅ PDF generated at:', uri);
      
      // Save to docs directory
      console.log('💾 Saving PDF to documents directory...');
      const docsDir = FileSystem.documentDirectory + 'symptom-reports/';
      
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(docsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(docsDir, { intermediates: true });
        console.log('📁 Created symptom-reports directory');
      }
      
      const fileName = `AuricRX_Complete_Symptom_History_${currentDate.replace(/\//g, '-')}.pdf`;
      const finalUri = docsDir + fileName;
      
      await FileSystem.moveAsync({
        from: uri,
        to: finalUri,
      });
      console.log('✅ PDF saved to:', finalUri);

      // Share the PDF using expo-sharing (CORRECT - no destructuring!)
      console.log('📤 Sharing PDF with expo-sharing...');
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error(uiI18n.t("medicalDocuments.sharingNotAvailablePlatform"));
      }
      
      // Share the PDF with timeout to prevent app hang if dialog doesn't close properly
      console.log('📤 Opening share dialog...');
      try {
        await Promise.race([
          Sharing.shareAsync(finalUri, {
            mimeType: 'application/pdf',
            dialogTitle: uiI18n.t("ui.shareSymptomTrackerReport"),
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(uiI18n.t("ui.shareTimeout"))), 10000)
          )
        ]);
        console.log('✅ PDF share completed');
      } catch (shareError) {
        // If timeout or error, just log and continue - don't crash the app
        console.warn('⚠️ Share dialog issue (this is OK):', shareError);
      }
      
      // No alert - silent success
    } catch (error) {
      console.error('❌ Error exporting complete symptom history:', error);
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      
      Alert.alert(
        S?.exportFailed || uiI18n.t("ai.exportFailed"),
        S?.symptomReportFailed || uiI18n.t("ai.symptomReportFailed"),
        [{ text: uiI18n.t("adminProfile.ok") }]
      );
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return '#3b82f6'; // blue
      case 'warning': return '#f59e0b'; // yellow
      case 'critical': return '#ef4444'; // red
      case 'severe': return '#ef4444'; // red
      case 'moderate': return '#f59e0b'; // yellow
      case 'mild': return '#3b82f6'; // blue
      default: return '#6b7280'; // gray
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return '#ef4444'; // red
      case 'high': return '#f59e0b'; // yellow
      case 'medium': return '#3b82f6'; // blue
      case 'low': return '#10b981'; // green
      default: return '#6b7280'; // gray
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'info': return t("ai.info");
      case 'warning': return t("ai.warning");
      case 'critical': return t("ai.critical");
      default: return t("ai.unknown");
    }
  };

  const renderAIFeatures = () => (
    <Animated.View 
      style={[
        dynamicStyles.sectionCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <GoldHealthIcon name="sparkles-outline" />
        <DynamicText type="primary" style={dynamicStyles.sectionTitle}>{t("ai.aiHealthFeatures")}</DynamicText>
      </View>
<View style={dynamicStyles.statsGrid}>
        <View style={dynamicStyles.statCard}>
          <DynamicText type="card" style={dynamicStyles.statValue}>{insights.length}</DynamicText>
          <DynamicText type="card" style={dynamicStyles.statLabel}>{S?.healthInsights || uiI18n.t("ai.insights")}</DynamicText>
        </View>
        <View style={dynamicStyles.statCard}>
          <DynamicText type="card" style={dynamicStyles.statValue}>{symptomAnalyses.length}</DynamicText>
          <DynamicText type="card" style={dynamicStyles.statLabel}>{t("ai.symptomAnalyses")}</DynamicText>
        </View>
        <View style={dynamicStyles.statCard}>
          <DynamicText type="card" style={dynamicStyles.statValue}>{drugInteractions.length}</DynamicText>
          <DynamicText type="card" style={dynamicStyles.statLabel}>{t("ai.drugChecks")}</DynamicText>
        </View>
      </View>

      <View style={dynamicStyles.quickActions}>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={() => setShowSymptomModal(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image 
              source={require('../../assets/dashboard Emojies/med stats emoji.png')} 
              style={{ width: 18, height: 18, marginRight: 6 }}
            />
            <DynamicText type="card" style={dynamicStyles.quickActionText}>{t("ai.analyzeSymptoms")}</DynamicText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={openMedicationReference}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image 
              source={require('../../assets/dashboard Emojies/standard pill emoji.png')} 
              style={{ width: 18, height: 18, marginRight: 6 }}
            />
            <DynamicText type="card" style={dynamicStyles.quickActionText}>{t("ai.checkInteractions")}</DynamicText>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderFastingAnalytics = () => {
    // Check if user has a fasting profile
    const hasProfile = fastingProfile && (
      fastingProfile.weight || 
      fastingProfile.height || 
      fastingProfile.diabetes || 
      fastingProfile.heartConditions ||
      fastingProfile.otherHealthConditions?.length > 0
    );

    return (
      <Animated.View 
        style={[
          dynamicStyles.sectionCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <GoldHealthIcon name="time-outline" />
          <DynamicText type="primary" style={dynamicStyles.sectionTitle}>{t("ai.fastingAnalytics")}</DynamicText>
        </View>
        
        <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
          {t("ai.fastingDescription")}
        </DynamicText>

        {hasProfile ? (
          <View style={dynamicStyles.fastingProfileCard}>
            <View style={dynamicStyles.fastingProfileHeader}>
              <DynamicText type="card" style={dynamicStyles.fastingProfileTitle}>
                {t("ai.yourFastingProfile")}
              </DynamicText>
              <View style={[
                dynamicStyles.fastingStatusBadge,
                { backgroundColor: fastingAnalysis?.compatible ? '#10b981' : '#f59e0b' }
              ]}>
                <DynamicText type="card" style={dynamicStyles.fastingStatusText}>
                  {fastingAnalysis ? (fastingAnalysis.compatible ? t("ai.compatible") : t("ai.needsReview")) : t("ai.notAnalyzed")}
                </DynamicText>
              </View>
            </View>

            {fastingAnalysis ? (
              <View style={dynamicStyles.fastingAnalysisResult}>
                {fastingAnalysis.suggestedHours > 0 && <View style={dynamicStyles.fastingTimeRecommendation}>
                  <DynamicText type="card" style={dynamicStyles.fastingTimeLabel}>{t("ai.recommendedFastingWindow")}</DynamicText>
                  <DynamicText type="card" style={dynamicStyles.fastingTimeValue}>
                    {fastingAnalysis.suggestedHours}:{24-fastingAnalysis.suggestedHours}
                  </DynamicText>
                </View>}

                <DynamicText type="card" style={dynamicStyles.fastingMessage}>
                  {fastingAnalysis.message}
                </DynamicText>

                {fastingAnalysis.warnings.length > 0 && (
                  <View style={dynamicStyles.fastingWarnings}>
                    <DynamicText type="card" style={dynamicStyles.fastingWarningsTitle}>
                      {S?.importantConsiderations || uiI18n.t("ai.importantConsiderations")}:
                    </DynamicText>
                    {fastingAnalysis.warnings.map((warning, index) => (
                      <DynamicText key={index} type="card" style={dynamicStyles.fastingWarningItem}>
                        • {warning}
                      </DynamicText>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={dynamicStyles.fastingAnalysisPrompt}>
                <DynamicText type="card" style={dynamicStyles.fastingAnalysisPromptText}>
                  {t("ai.fastingCompatibilityDescription")}
                </DynamicText>
              </View>
            )}

            <TouchableOpacity
              style={[dynamicStyles.fastingAnalyzeButton, { backgroundColor: '#D4AF37' }]}
              onPress={analyzeFastingCompatibility}
            >
              <DynamicText type="card" style={dynamicStyles.fastingAnalyzeButtonText}>
                {fastingAnalysis ? (S?.reAnalyzeFasting || uiI18n.t("ai.reAnalyzeFasting")) : (S?.analyzeFastingCompatibility || uiI18n.t("ai.analyzeFastingCompatibility"))}
              </DynamicText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={dynamicStyles.fastingNoProfileCard}>
            <DynamicText type="card" style={dynamicStyles.fastingNoProfileTitle}>
              {t("ai.completeYourFastingProfile")}
            </DynamicText>
            <DynamicText type="card" style={dynamicStyles.fastingNoProfileDescription}>{uiI18n.t("ui.setUpYourFastingProfileInSettingsToGetPersonalizedFastingRecommendationsBasedOnYourHealthC")}</DynamicText>
            <TouchableOpacity
              style={[dynamicStyles.fastingSetupButton, { backgroundColor: getAccentColor() }]}
              onPress={() => {
                // This would navigate to settings - you might want to add a callback prop for this
                Alert.alert(t("ai.setupRequired"), t("ai.pleaseGoToSettings"));
              }}
            >
              <DynamicText type="card" style={dynamicStyles.fastingSetupButtonText}>{uiI18n.t("ui.goToSettings")}</DynamicText>
            </TouchableOpacity>
          </View>
        )}

        <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { fontSize: 12, fontStyle: 'italic', marginTop: 8 }]}>
          {t("ai.consultHealthcareProviderDisclaimer")}
        </DynamicText>
      </Animated.View>

    );
  };

  const renderHealthInsights = () => (
    <Animated.View 
      style={[
        dynamicStyles.sectionCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}><GoldHealthIcon name="bulb-outline" /><DynamicText type="primary" style={[dynamicStyles.sectionTitle, { flex: 1 }]}>{S?.healthInsights || uiI18n.t("ai.insights")}</DynamicText></View>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {S?.aiGeneratedInsights || uiI18n.t("ai.aiGeneratedInsights")}
      </DynamicText>
      
      {insights.slice(0, 5).map(insight => (
        <View key={insight.id} style={[
          dynamicStyles.insightCard,
          { borderLeftColor: getSeverityColor(insight.severity) }
        ]}>
          <View style={dynamicStyles.insightHeader}>
            <DynamicText type="card" style={dynamicStyles.insightTitle}>{insight.title}</DynamicText>
            <View style={[
              dynamicStyles.insightSeverity,
              { backgroundColor: getSeverityColor(insight.severity) }
            ]}>
              <DynamicText type="card" style={dynamicStyles.severityText}>
                {getSeverityLabel(insight.severity)}
              </DynamicText>
            </View>
          </View>
          
          <DynamicText type="card" style={dynamicStyles.insightDescription}>
            {insight.description}
          </DynamicText>
          
          {insight.actionable && insight.actionItems.length > 0 && (
            <View style={dynamicStyles.actionItems}>
              <DynamicText type="card" style={[dynamicStyles.actionItem, { fontWeight: '600', marginBottom: 4 }]}>
                {S?.actionItems || uiI18n.t("ui.actionItems")}
              </DynamicText>
              {insight.actionItems.slice(0, 3).map((item, index) => (
                <DynamicText key={index} type="card" style={dynamicStyles.actionItem}>
                  • {item}
                </DynamicText>
              ))}
            </View>
          )}
        </View>
      ))}
      
      {insights.length === 0 && (
        <View><DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          {S?.noHealthInsights || uiI18n.t("ai.noHealthInsights")}
        </DynamicText>
        <TouchableOpacity accessibilityRole="button" style={styles.emptyAction} onPress={() => Alert.alert(t("ai.healthInsights"), t("ai.insightsEmptyHelp"))}><Text style={styles.emptyActionText}>{t("ai.insightsHelp")}</Text></TouchableOpacity>
</View>
      )}
    </Animated.View>
  );

  const renderRecentAnalyses = () => (
    <Animated.View 
      style={[
        dynamicStyles.sectionCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <GoldHealthIcon name="pulse-outline" />
          <DynamicText type="primary" style={dynamicStyles.sectionTitle}>{t("ai.recentAnalyses")}</DynamicText>
        </View>
        
        {/* Export Active Symptoms Button - Small, Top Right */}
        {symptomAnalyses.length > 0 && (
          <TouchableOpacity
            style={{
              backgroundColor: getAccentColor() + '20',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: getAccentColor() + '60',
            }}
            onPress={() => {
              exportActiveSymptomsToPDF();
              triggerHaptic('light');
            }}
          >
            <DynamicText type="card" style={{ fontSize: 12, fontWeight: '600', letterSpacing: 0.3 }}>
              {S?.export || uiI18n.t("ai.export")}
            </DynamicText>
          </TouchableOpacity>
        )}
      </View>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {t("ai.recentSymptomAnalyses")}
      </DynamicText>
      
      {symptomAnalyses.slice(0, 3).map(analysis => (
        <View key={analysis.id} style={dynamicStyles.insightCard}>
          <View style={dynamicStyles.insightHeader}>
            <DynamicText type="card" style={dynamicStyles.insightTitle}>
              {analysis.symptoms.join(', ')}
            </DynamicText>
            <View style={[
              dynamicStyles.insightSeverity,
              { backgroundColor: getSeverityColor('info') }
            ]}>
              <DynamicText type="card" style={dynamicStyles.severityText}>
                {t("ai.analyzeSymptoms")}
              </DynamicText>
            </View>
          </View>
          
          <DynamicText type="card" style={dynamicStyles.insightDescription}>
            {new Date(analysis.createdAt).toLocaleDateString()}
          </DynamicText>
          
          <View style={dynamicStyles.insightFooter}>
            
            <View style={dynamicStyles.insightActions}>
              <TouchableOpacity
                style={[dynamicStyles.actionButton, dynamicStyles.storeButton]}
                onPress={() => storeSymptomAnalysis(analysis.id)}
              >
                <DynamicText type="card" style={dynamicStyles.actionButtonText}>
                  📁 {S?.store || uiI18n.t("ai.store")}
                </DynamicText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[dynamicStyles.actionButton, dynamicStyles.deleteButton]}
                onPress={() => deleteSymptomAnalysis(analysis.id)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image 
                    source={require('../../assets/dashboard Emojies/trash.png')} 
                    style={{ width: 16, height: 16, marginRight: 4 }}
                  />
                  <DynamicText type="card" style={dynamicStyles.actionButtonText}>
                    {S?.delete || uiI18n.t("ai.delete")}
                  </DynamicText>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
      
      {symptomAnalyses.length === 0 && (
        <View><DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          {t("ai.noSymptomAnalyses")}
        </DynamicText>
        <TouchableOpacity accessibilityRole="button" style={styles.emptyAction} onPress={() => setShowSymptomModal(true)}><Text style={styles.emptyActionText}>{t("ai.recordSymptom")}</Text></TouchableOpacity>
</View>
      )}
      
      <TouchableOpacity
        style={dynamicStyles.viewAllButton}
        onPress={() => {
          setShowSymptomHistoryModal(true);
          triggerHaptic('light');
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image 
            source={require('../../assets/dashboard Emojies/med stats emoji.png')} 
            style={{ width: 16, height: 16, marginRight: 6 }}
          />
          <DynamicText type="card" style={dynamicStyles.viewAllButtonText}>
            {S?.viewAllSymptoms || uiI18n.t("ai.viewAllSymptoms")} ({symptomAnalyses.length + storedSymptomAnalyses.length})
          </DynamicText>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  // Simplified AI Health - no external service needed

  return (
    <KeyboardForm><View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.container}>
        <ScrollView keyboardShouldPersistTaps="handled" 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]} 
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <TouchableOpacity style={styles.homeButton} onPress={onClose}>
              <Image 
                source={require('../../assets/AuricRX_home_button_across_screens.png')} 
                style={styles.homeButtonIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Title */}
          <Animated.View 
            style={[
              styles.titleSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <GoldHealthIcon name="sparkles-outline" />
              <DynamicText type="primary" style={styles.title}>
                {t("ai.assistant")}
              </DynamicText>
            </View>
            <DynamicText type="secondary" style={styles.subtitle}>
              {t("ai.intelligentFeatures")}
            </DynamicText>
          </Animated.View>

          {/* AI Features */}
          {renderAIFeatures()}

          {/* Display-only snapshots stay separate from AI state and reports. */}
          <ActivityHealthSection key={userId} userId={userId} onConnect={onConnectHealth} onPrivacy={onHealthPrivacy} />

          {/* Fasting Analytics Section */}
          {renderFastingAnalytics()}

          {/* Export Health Report Section */}
          <Animated.View style={[
            dynamicStyles.exportSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <GoldHealthIcon name="file-export-outline" />
              <DynamicText type="primary" style={dynamicStyles.sectionTitle}>{t("ai.exportHealthReport")}</DynamicText>
            </View>
            
            <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
              {t("ai.generateHealthReportDescription")}
            </DynamicText>

            <TouchableOpacity
              style={[dynamicStyles.exportButton, { backgroundColor: '#D4AF37' }]}
              onPress={exportToPDF}
            >
              <DynamicText type="card" style={dynamicStyles.exportButtonText}>
                {t("ai.exportHealthReport")}
              </DynamicText>
            </TouchableOpacity>
          </Animated.View>

          {/* Health Insights */}
          {renderHealthInsights()}

          {/* Recent Analyses */}
          {renderRecentAnalyses()}
        </ScrollView>
      </View>

      {/* Symptom Analysis Modal */}
      <Modal
        visible={showSymptomModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSymptomModal(false)}
      >
        <KeyboardForm><View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}><ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled contentContainerStyle={{ paddingBottom: 24 }} style={{ flexShrink: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image 
                source={require('../../assets/dashboard Emojies/med stats emoji.png')} 
                style={{ width: 24, height: 24, marginRight: 8 }}
              />
              <DynamicText type="primary" style={dynamicStyles.modalTitle}>{uiI18n.t("ai.symptomAnalysis")}</DynamicText>
            </View>
            
            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{uiI18n.t("ai.describeSymptoms")}</DynamicText>
              <TextInput
                style={dynamicStyles.multilineInput}
                placeholder={aiTranslations.enterSymptomsPlaceholder}
                placeholderTextColor={getCardTextColor() + '80'}
                value={symptomText}
                onChangeText={setSymptomText}
                multiline
              />
            </View>

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => setShowSymptomModal(false)}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{S?.cancel || uiI18n.t("healthAnalytics.cancel")}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={analyzeSymptoms}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>{S?.analyze || uiI18n.t("ai.analyze")}</DynamicText>
              </TouchableOpacity>
            </View>
          </ScrollView></View>
        </View></KeyboardForm>
      </Modal>

      {/* Medication Reference Screen Modal */}
      <Modal
        visible={showMedicationReferenceScreen}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowMedicationReferenceScreen(false)}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
            <TouchableOpacity onPress={() => setShowMedicationReferenceScreen(false)} style={{ marginRight: 16 }}>
              <DynamicText type="card" style={{ fontSize: 18 }}>←</DynamicText>
            </TouchableOpacity>
            <DynamicText type="card" style={{ fontSize: 18, fontWeight: 'bold' }}>{t("ai.checkInteractions")}</DynamicText>
          </View>
          <MedicationReferenceScreen />
        </View>
      </Modal>

      {/* OLD INTERACTION MODALS REMOVED FOR COFEPRIS COMPLIANCE */}
      {/* The following modals have been removed:
        - Drug Interaction Check Modal (user selection)
        <View style={dynamicStyles.modalOverlay}>
          <View style={[dynamicStyles.modalContent, { maxHeight: '80%' }]}>
            {currentSymptomAnalysis && (
              <>
                <View style={dynamicStyles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                    <DynamicText type="primary" style={dynamicStyles.modalTitle}>
                      {S?.symptomAnalysisComplete || uiI18n.t("ai.symptomAnalysisComplete")}
                    </DynamicText>
                  </View>
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled" style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  <View style={dynamicStyles.analysisSection}>
                    <Text style={{ color: theme?.text || '#fff' }}>{symptomInformation(currentSymptomAnalysis.symptoms, i18n.language).generalInformation}</Text>
                    {symptomInformation(currentSymptomAnalysis.symptoms, i18n.language).followUpActions.map((action, index) => <Text key={index} style={{ color: theme?.text || '#fff', marginVertical: 8 }}>{action}</Text>)}
                  </View>

                  {/* Doctor Contact Warning */}
                  <View style={[dynamicStyles.analysisSection, dynamicStyles.doctorWarningCard]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image 
                        source={require('../../assets/dashboard Emojies/warning sign emoji.png')} 
                        style={{ width: 18, height: 18, marginRight: 6 }}
                      />
                      <DynamicText type="card" style={dynamicStyles.doctorWarningTitle}>
                        {S?.importantNotice || uiI18n.t("ai.importantNotice")}
                      </DynamicText>
                    </View>
                    <DynamicText type="card" style={dynamicStyles.doctorWarningText}>
                      {S?.contactDoctorImmediately || uiI18n.t("ai.contactDoctorImmediately")}
                    </DynamicText>
                    <DynamicText type="card" style={dynamicStyles.doctorWarningText}>
                      {S?.exportSymptomReport || uiI18n.t("ai.exportSymptomReport")}
                    </DynamicText>
                  </View>

                  <View style={dynamicStyles.analysisSection}>
                    <DynamicText type="card" style={dynamicStyles.sectionTitle}>
                      {S?.followUpActions || uiI18n.t("ai.followUpActions")}:
                    </DynamicText>
                    {currentSymptomAnalysis.followUpActions.map((action, index) => (
                      <DynamicText key={index} type="card" style={dynamicStyles.followUpItem}>
                        • {action}
                      </DynamicText>
                    ))}
                  </View>
                </ScrollView>

                <View style={dynamicStyles.modalButtons}>
                  <TouchableOpacity
                    style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                    onPress={() => {
                      setShowSymptomResultModal(false);
                      setCurrentSymptomAnalysis(null);
                    }}
                  >
                    <DynamicText type="card" style={dynamicStyles.modalButtonTextPrimary}>
                      {S?.ok || uiI18n.t("adminProfile.ok")}
                    </DynamicText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Symptom History Modal - View All Symptoms */}
      <Modal
        visible={showSymptomHistoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSymptomHistoryModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={[dynamicStyles.modalContent, { maxHeight: '85%', display: 'flex', flexDirection: 'column' }]}>
            <View style={dynamicStyles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image 
                  source={require('../../assets/dashboard Emojies/med stats emoji.png')} 
                  style={{ width: 24, height: 24, marginRight: 8 }}
                />
                <DynamicText type="primary" style={dynamicStyles.modalTitle}>
                  {S?.symptomHistory || uiI18n.t("ai.symptomHistory")}
                </DynamicText>
              </View>
              <TouchableOpacity
                onPress={() => setShowSymptomHistoryModal(false)}
                style={{ position: 'absolute', right: 0, top: 0, padding: 8 }}
              >
                <DynamicText type="primary" style={{ fontSize: 24 }}>×</DynamicText>
              </TouchableOpacity>
            </View>

            <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { marginBottom: 12 }]}>
              {S?.totalSymptoms || uiI18n.t("ai.totalSymptoms")}: {symptomAnalyses.length + storedSymptomAnalyses.length}
            </DynamicText>

            <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 1, flexShrink: 1, maxHeight: '60%' }} contentContainerStyle={[{ paddingBottom: 10 }, { paddingBottom: 24 }]} showsVerticalScrollIndicator={true}>
              {/* Show Stored/Saved Symptoms First */}
              {storedSymptomAnalyses.map((analysis) => (
                <View key={analysis.id} style={dynamicStyles.insightCard}>
                  <View style={dynamicStyles.insightHeader}>
                    <DynamicText type="card" style={[dynamicStyles.insightTitle, { flex: 1 }]}>
                      {analysis.symptoms.join(', ')}
                    </DynamicText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={[
                        dynamicStyles.insightSeverity,
                        { backgroundColor: '#22c55e', paddingHorizontal: 8, paddingVertical: 3 }
                      ]}>
                        <DynamicText type="card" style={[dynamicStyles.severityText, { fontSize: 10 }]}>
                          {S?.saved || uiI18n.t("ai.saved")}
                        </DynamicText>
                      </View>
                      <View style={[
                        dynamicStyles.insightSeverity,
                        { backgroundColor: getSeverityColor('info') }
                      ]}>
                        <DynamicText type="card" style={dynamicStyles.severityText}>
                          {t("ai.analyzeSymptoms")}
                        </DynamicText>
                      </View>
                    </View>
                  </View>
                  
                  <DynamicText type="card" style={dynamicStyles.insightDescription}>
                    {new Date(analysis.createdAt).toLocaleDateString()} {new Date(analysis.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </DynamicText>
                  
                  <View style={dynamicStyles.insightFooter}>
                    <View style={dynamicStyles.insightActions}>
                      <TouchableOpacity
                        style={[dynamicStyles.actionButton, dynamicStyles.deleteButton]}
                        onPress={() => {
                          setStoredSymptomAnalyses(prev => prev.filter(item => item.id !== analysis.id));
                          triggerHaptic('light');
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Image 
                            source={require('../../assets/dashboard Emojies/trash.png')} 
                            style={{ width: 16, height: 16, marginRight: 4 }}
                          />
                          <DynamicText type="card" style={dynamicStyles.actionButtonText}>
                            {S?.delete || uiI18n.t("ai.delete")}
                          </DynamicText>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

              {/* Show Current Symptoms */}
              {symptomAnalyses.map((analysis) => (
                <View key={analysis.id} style={dynamicStyles.insightCard}>
                  <View style={dynamicStyles.insightHeader}>
                    <DynamicText type="card" style={[dynamicStyles.insightTitle, { flex: 1 }]}>
                      {analysis.symptoms.join(', ')}
                    </DynamicText>
                    <View style={[
                      dynamicStyles.insightSeverity,
                      { backgroundColor: getSeverityColor('info') }
                    ]}>
                      <DynamicText type="card" style={dynamicStyles.severityText}>
                        {t("ai.analyzeSymptoms")}
                      </DynamicText>
                    </View>
                  </View>
                  
                  <DynamicText type="card" style={dynamicStyles.insightDescription}>
                    {new Date(analysis.createdAt).toLocaleDateString()} {new Date(analysis.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </DynamicText>
                  
                  <View style={dynamicStyles.insightFooter}>
                    <View style={dynamicStyles.insightActions}>
                      <TouchableOpacity
                        style={[dynamicStyles.actionButton, dynamicStyles.storeButton]}
                        onPress={() => {
                          storeSymptomAnalysis(analysis.id);
                        }}
                      >
                        <DynamicText type="card" style={dynamicStyles.actionButtonText}>
                          📁 {S?.store || uiI18n.t("ai.store")}
                        </DynamicText>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[dynamicStyles.actionButton, dynamicStyles.deleteButton]}
                        onPress={() => {
                          deleteSymptomAnalysis(analysis.id);
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Image 
                            source={require('../../assets/dashboard Emojies/trash.png')} 
                            style={{ width: 16, height: 16, marginRight: 4 }}
                          />
                          <DynamicText type="card" style={dynamicStyles.actionButtonText}>
                            {S?.delete || uiI18n.t("ai.delete")}
                          </DynamicText>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

              {symptomAnalyses.length === 0 && storedSymptomAnalyses.length === 0 && (
                <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic', marginTop: 20 }]}>
                  {S?.noSymptomAnalyses || uiI18n.t("ai.noSymptomAnalyses")}
                </DynamicText>
              )}
            </ScrollView>

            {(symptomAnalyses.length > 0 || storedSymptomAnalyses.length > 0) && (
              <View style={[dynamicStyles.modalButtons, { marginTop: 16, flexShrink: 0 }]}>
                <TouchableOpacity
                  style={[
                    dynamicStyles.modalButton, 
                    { 
                      backgroundColor: getCardBackgroundColor(),
                      marginBottom: 8,
                      borderWidth: 1.5,
                      borderColor: getAccentColor(),
                      borderRadius: 6,
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      shadowColor: getAccentColor(),
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.25,
                      shadowRadius: 2,
                      elevation: 2,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }
                  ]}
                  onPress={exportAllSymptomsToPDF}
                >
                  <DynamicText type="card" style={{ 
                    fontSize: 13, 
                    fontWeight: '600',
                    fontFamily: 'Inter_600SemiBold',
                    textAlign: 'center',
                    letterSpacing: 0.3,
                    width: '100%'
                  }}>
                    {S?.exportPDF || uiI18n.t("documents.exportPDF")}
                  </DynamicText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    dynamicStyles.modalButton, 
                    { 
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      marginBottom: 8,
                      borderWidth: 1.5,
                      borderColor: 'rgba(239, 68, 68, 0.5)',
                      borderRadius: 6,
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      shadowColor: '#ef4444',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.2,
                      shadowRadius: 2,
                      elevation: 2,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }
                  ]}
                  onPress={emptyAllSymptoms}
                >
                  <Text style={{ 
                    color: '#ef4444', 
                    fontSize: 13, 
                    fontWeight: '600',
                    fontFamily: 'Inter_600SemiBold',
                    textAlign: 'center',
                    letterSpacing: 0.3,
                    width: '100%'
                  }}>
                    {S?.emptyAllSymptoms || uiI18n.t("ai.emptyAllSymptoms")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Close Button - Separate with explicit dimensions */}
            <TouchableOpacity
              style={{ 
                width: 280,
                height: 34,
                backgroundColor: getCardBackgroundColor(),
                marginTop: (symptomAnalyses.length > 0 || storedSymptomAnalyses.length > 0) ? 0 : 16,
                borderWidth: 1.5,
                borderColor: getAccentColor(),
                borderRadius: 6,
                alignSelf: 'center',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: getAccentColor(),
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.25,
                shadowRadius: 2,
                elevation: 2
              }}
              onPress={() => setShowSymptomHistoryModal(false)}
            >
              <DynamicText type="card" style={{ 
                fontSize: 13, 
                fontWeight: '600',
                fontFamily: 'Inter_600SemiBold',
                textAlign: 'center',
                letterSpacing: 0.3
              }}>
                {S?.close || uiI18n.t("ai.close")}
              </DynamicText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Saved Confirmation Modal */}
      <Modal
        visible={showSavedConfirmation}
        onRequestClose={() => setShowSavedConfirmation(false)}
        transparent
        animationType="fade"
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={{
            backgroundColor: getCardBackgroundColor(),
            borderRadius: 12,
            padding: 24,
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 200,
            borderWidth: 2,
            borderColor: getAccentColor(),
            shadowColor: getAccentColor(),
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8
          }}>
            <DynamicText type="primary" style={{ 
              fontSize: 20, 
              fontWeight: '700',
              fontFamily: 'Inter_700Bold',
              textAlign: 'center'
            }}>
              ✅ {S?.saved || uiI18n.t("ai.saved")}
            </DynamicText>
          </View>
        </View>
      </Modal>

      {/* Fasting Analytics Modal */}
      <Modal
        visible={showFastingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFastingModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image 
                source={require('../../assets/dashboard Emojies/med stats emoji.png')} 
                style={{ width: 24, height: 24, marginRight: 8 }}
              />
              <DynamicText type="primary" style={dynamicStyles.modalTitle}>{uiI18n.t("ai.fastingAnalytics")}</DynamicText>
            </View>
            
            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{uiI18n.t("ai.fastingCompatibilityCheck")}</DynamicText>
              <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>{uiI18n.t("ai.fastingDescription")}</DynamicText>
            </View>

            {fastingAnalysis && (
              <View style={[dynamicStyles.insightCard, { 
                borderLeftColor: fastingAnalysis.compatible ? '#10b981' : '#f59e0b',
                marginBottom: 16 
              }]}>
                <View style={dynamicStyles.insightHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {!fastingAnalysis.compatible && (
                      <Image 
                        source={require('../../assets/dashboard Emojies/warning sign emoji.png')} 
                        style={{ width: 18, height: 18, marginRight: 6 }}
                      />
                    )}
                    <DynamicText type="card" style={dynamicStyles.insightTitle}>
                      {fastingAnalysis.compatible ? uiI18n.t("ai.compatible") : uiI18n.t("ai.warning")}
                    </DynamicText>
                  </View>
                  <View style={[
                    dynamicStyles.insightSeverity,
                    { backgroundColor: fastingAnalysis.compatible ? '#10b981' : '#f59e0b' }
                  ]}>
                    <DynamicText type="card" style={dynamicStyles.severityText}>
                      {fastingAnalysis.suggestedHours}:{24-fastingAnalysis.suggestedHours}
                    </DynamicText>
                  </View>
                </View>
                <DynamicText type="card" style={dynamicStyles.insightDescription}>
                  {fastingAnalysis.message}
                </DynamicText>
                {fastingAnalysis.warnings.length > 0 && (
                  <View style={dynamicStyles.actionItems}>
                    <DynamicText type="card" style={[dynamicStyles.actionItem, { fontWeight: '600', marginBottom: 4 }]}>{uiI18n.t("ai.warnings")}</DynamicText>
                    {fastingAnalysis.warnings.map((warning, index) => (
                      <DynamicText key={index} type="card" style={dynamicStyles.actionItem}>
                        • {warning}
                      </DynamicText>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => setShowFastingModal(false)}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{S?.cancel || uiI18n.t("healthAnalytics.cancel")}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={analyzeFastingCompatibility}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>{S?.analyzeFastingCompatibility || uiI18n.t("ai.analyze")}</DynamicText>
              </TouchableOpacity>
            </View>
            
            <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { fontSize: 12, fontStyle: 'italic', marginTop: 8 }]}>
              {t("ai.consultHealthcareProviderDisclaimer")}
            </DynamicText>
          </View>
        </View>
      </Modal>

      {/* Drug Interaction Loading Modal - Centered and Compact */}
      <Modal
        visible={showInteractionLoadingModal}
        animationType="fade"
        onRequestClose={() => setShowInteractionLoadingModal(false)}
      >
        <View style={[dynamicStyles.modalOverlay, { justifyContent: 'center' }]}>
          <View style={[dynamicStyles.modalContent, { 
            maxWidth: 280, 
            width: '80%',
            maxHeight: 'auto',
            flex: 0,
            padding: 24 
          }]}>
            <View style={{ alignItems: 'center' }}>
              <Image 
                source={require('../../assets/dashboard Emojies/AI Health.png')} 
                style={{ width: 48, height: 48, marginBottom: 16 }}
              />
              <DynamicText type="primary" style={[dynamicStyles.modalTitle, { textAlign: 'center', marginBottom: 8 }]}>
                {S?.analyzing || uiI18n.t("ai.analyzing")}
              </DynamicText>
              <DynamicText type="secondary" style={{ textAlign: 'center', fontSize: 13, lineHeight: 20 }}>
                {S?.checkingInteractions || uiI18n.t("ai.checkingInteractions")}
              </DynamicText>
            </View>
          </View>
        </View>
      </Modal>

      {/* Drug Interaction Results Modal */}
      <Modal
        visible={showInteractionResultModal}
        animationType="fade"
        onRequestClose={() => setShowInteractionResultModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={[dynamicStyles.modalContent, { flex: 1 }]}>
            {/* Title with Icon */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Image 
                source={require('../../assets/dashboard Emojies/warning sign emoji.png')} 
                style={{ width: 20, height: 20, marginRight: 8 }}
              />
              <DynamicText type="primary" style={[dynamicStyles.modalTitle, { flex: 1 }]}>
                {S?.interactionResults || uiI18n.t("ai.interactionResults")}
              </DynamicText>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled" style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
              {/* Disclaimer */}
              {interactionResult?.disclaimer && (
                <View style={[dynamicStyles.doctorWarningCard, { marginBottom: 16 }]}>
                  <DynamicText type="card" style={dynamicStyles.doctorWarningText}>
                    {interactionResult.disclaimer}
                  </DynamicText>
                </View>
              )}

              {/* Summary */}
              {interactionResult?.summary && (
                <View style={[dynamicStyles.insightCard, { marginBottom: 16 }]}>
                  <DynamicText type="card" style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                    {S?.generalSummary || uiI18n.t("ai.generalSummary")}
                  </DynamicText>
                  <DynamicText type="card" style={{ fontSize: 13, lineHeight: 20 }}>
                    {interactionResult.summary}
                  </DynamicText>
                </View>
              )}

              {/* Interactions List */}
              {interactionResult?.interactions && interactionResult.interactions.length > 0 ? (
                <View style={{ marginBottom: 16 }}>
                  <DynamicText type="card" style={{ fontSize: 14, fontWeight: '600', marginBottom: 12 }}>
                    {S?.foundInteractions || uiI18n.t("ui.foundValueInteractionS", { value1: interactionResult.interactions.length })}
                  </DynamicText>
                  
                  {interactionResult.interactions.map((interaction: any, index: number) => (
                    <View key={index} style={[dynamicStyles.insightCard, { marginBottom: 12 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <DynamicText type="card" style={{ fontSize: 13, fontWeight: '700', flex: 1 }}>
                          {index + 1}. {interaction.item1} + {interaction.item2}
                        </DynamicText>
                      </View>
                      
                      <View style={{ marginBottom: 6 }}>
                        <DynamicText type="card" style={{ fontSize: 12, fontWeight: '600', color: '#D4AF37' }}>
                          {S?.severity || uiI18n.t("ai.severity")}: {interaction.severity}
                        </DynamicText>
                      </View>
                      
                      <DynamicText type="card" style={{ fontSize: 12, lineHeight: 18, marginBottom: 8 }}>
                        {interaction.description}
                      </DynamicText>
                      
                      {interaction.clinicalEffects && interaction.clinicalEffects.length > 0 && (
                        <View style={{ marginBottom: 8 }}>
                          <DynamicText type="card" style={{ fontSize: 11, fontWeight: '600', marginBottom: 4 }}>
                            {S?.clinicalEffects || uiI18n.t("ai.clinicalEffects")}:
                          </DynamicText>
                          {interaction.clinicalEffects.map((effect: string, i: number) => (
                            <DynamicText key={i} type="card" style={{ fontSize: 11, lineHeight: 16, marginLeft: 8 }}>
                              • {effect}
                            </DynamicText>
                          ))}
                        </View>
                      )}
                      
                      {interaction.management && (
                        <View>
                          <DynamicText type="card" style={{ fontSize: 11, fontWeight: '600', marginBottom: 4 }}>
                            {S?.management || uiI18n.t("ai.management")}:
                          </DynamicText>
                          <DynamicText type="card" style={{ fontSize: 11, lineHeight: 16 }}>
                            {interaction.management}
                          </DynamicText>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={[dynamicStyles.insightCard, { marginBottom: 16 }]}>
                  <DynamicText type="card" style={{ fontSize: 13, textAlign: 'center', fontStyle: 'italic' }}>
                    {S?.noInteractionsFound || uiI18n.t("ai.noInteractionsFound")}
                  </DynamicText>
                </View>
              )}
            </ScrollView>

            {/* Close Button */}
            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary, { width: '100%' }]}
                onPress={() => setShowInteractionResultModal(false)}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>
                  {S?.ok || uiI18n.t("adminProfile.ok")}
                </DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View></KeyboardForm>
  );
}

const styles = StyleSheet.create({
  emptyAction: { alignSelf: 'center', borderWidth: 1, borderColor: '#D4AF37', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 8 },
  emptyActionText: { color: '#D4AF37', fontSize: 13, fontWeight: '600' },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  homeButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -65,
  },
  homeButtonIcon: {
    width: 180,
    height: 70,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  // Fasting Analytics Styles
  fastingProfileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  fastingProfileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fastingProfileTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  fastingStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fastingStatusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  fastingAnalysisResult: {
    marginBottom: 16,
  },
  fastingTimeRecommendation: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  fastingTimeLabel: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  fastingTimeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10b981',
  },
  fastingMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  fastingWarnings: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  fastingWarningsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#f59e0b',
  },
  fastingWarningItem: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  fastingAnalysisPrompt: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  fastingAnalysisPromptText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  fastingAnalyzeButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  fastingAnalyzeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  fastingNoProfileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  fastingNoProfileTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  fastingNoProfileDescription: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 16,
    lineHeight: 20,
  },
  fastingSetupButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  fastingSetupButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default function AIHealthScreen(props: AIHealthScreenProps) {
  return getRegion() === 'US' ? <USScreen onClose={props.onClose} initialMode="drugs" /> : <MexicoAIHealthScreen {...props} />;
}
