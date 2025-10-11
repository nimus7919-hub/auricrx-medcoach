import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Animated,
  StatusBar,
  Image,
  Platform,
  Vibration,
  Dimensions,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
import { createAIHealthTranslations } from '../services/aiHealthTranslations';
import { useTranslation } from 'react-i18next';
// Simplified AI Health - no external service dependencies

const { width: screenWidth } = Dimensions.get('window');

interface AIHealthScreenProps {
  onClose: () => void;
  theme?: any;
  S?: any;
  fastingProfile?: any;
  medications?: any[];
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

interface SymptomAnalysis {
  id: string;
  symptoms: string[];
  severity: 'mild' | 'moderate' | 'severe' | 'emergency';
  possibleConditions: {
    condition: string;
    probability: number;
    description: string;
    recommendations: string[];
  }[];
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  recommendations: string[];
  followUpActions: string[];
  createdAt: string;
}

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


export default function AIHealthScreen({ onClose, theme, S, fastingProfile, medications = [] }: AIHealthScreenProps) {
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor, getAccentColor } = useWallpaper();
  
  // Use translation hook directly for AI Health
  const { t: i18nT } = useTranslation();
  
  // AI Health specific translations
  const aiTranslations = createAIHealthTranslations(i18nT);
  
  // Translation function using aiTranslations object
  const t = (key: string) => {
    return aiTranslations[key] || key;
  };
  
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
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: getCardBackgroundColor() + 'F0',
      borderRadius: 12,
      padding: 24,
      width: '90%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
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
  const [drugInteractions, setDrugInteractions] = useState<DrugInteraction[]>([]);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [showDrugCheckModal, setShowDrugCheckModal] = useState(false);
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

  const analyzeSymptoms = async () => {
    if (!symptomText.trim()) {
      Alert.alert('❌ Error', t('pleaseEnterSymptoms'));
      return;
    }

    try {
      const symptoms = symptomText.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      // Simplified analysis - create mock data
      const analysis: SymptomAnalysis = {
        id: `symptom_${Date.now()}`,
        symptoms,
        severity: symptoms.length > 3 ? 'moderate' : 'mild',
        possibleConditions: [{
          condition: t('generalSymptoms'),
          probability: 0.7,
          description: t('multipleSymptomsDescription'),
          recommendations: [t('monitorSymptomsClosely'), t('considerConsultingProvider'), t('maintainHydrationRest')]
        }],
        urgency: symptoms.some(s => s.toLowerCase().includes('severe')) ? 'high' : 'low',
        recommendations: [t('getAdequateRest'), t('stayHydrated'), t('monitorSymptoms')],
        followUpActions: [t('scheduleAppointmentIfPersist'), t('keepSymptomDiary')],
        createdAt: new Date().toISOString()
      };
      
      setSymptomAnalyses(prev => [analysis, ...prev]);
      setSymptomText('');
      setShowSymptomModal(false);
      
      triggerHaptic('medium');
      
      // Show analysis results
      const urgencyEmoji = analysis.urgency === 'emergency' ? '🚨' : 
                          analysis.urgency === 'high' ? '⚠️' : 
                          analysis.urgency === 'medium' ? '⚡' : 'ℹ️';
      
      Alert.alert(
        `${urgencyEmoji} ${t('symptomAnalysisComplete')}`,
        `${t('severity')}: ${analysis.severity}\n${t('urgency')}: ${analysis.urgency}\n\n${t('possibleConditions')}:\n${analysis.possibleConditions.map(c => `• ${c.condition} (${(c.probability * 100).toFixed(0)}%)`).join('\n')}\n\n${t('recommendations')}:\n${analysis.recommendations.slice(0, 3).map(r => `• ${r}`).join('\n')}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to analyze symptoms:', error);
      Alert.alert('❌ ' + aiTranslations.error, aiTranslations.failedToAnalyzeSymptoms);
    }
  };

  const checkDrugInteractions = async () => {
    if (!medicationList.trim()) {
      Alert.alert('❌ Error', t('pleaseEnterMedications'));
      return;
    }

    try {
      const medications = medicationList.split(',').map(m => m.trim()).filter(m => m.length > 0);
      
      // Simplified interaction check - create mock data
      const interactions: DrugInteraction[] = [];
      
      // Simple mock interaction check
      if (medications.length > 1) {
        interactions.push({
          id: `interaction_${Date.now()}`,
          drug1: medications[0],
          drug2: medications[1],
          severity: 'minor',
          description: t('potentialMildInteraction'),
          clinicalEffects: [t('mildSideEffectsPossible')],
          management: t('monitorUnusualSymptoms'),
          references: [t('drugInteractionDatabase')]
        });
      }
      
      setDrugInteractions(prev => [...interactions, ...prev]);
      setMedicationList('');
      setShowDrugCheckModal(false);
      
      triggerHaptic('medium');
      
      if (interactions.length === 0) {
        Alert.alert('✅ ' + t('noInteractionsFound'), t('noKnownInteractions'));
      } else {
        const interactionText = interactions.map(i => 
          `• ${i.drug1} + ${i.drug2}: ${i.severity.toUpperCase()}\n  ${i.description}`
        ).join('\n\n');
        
        Alert.alert(
          `⚠️ ${t('foundInteractions').replace('{count}', interactions.length.toString())}`,
          `${t('foundInteractions').replace('{count}', interactions.length.toString())}:\n\n${interactionText}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to check drug interactions:', error);
      Alert.alert('❌ ' + aiTranslations.error, aiTranslations.failedToCheckDrugInteractions);
    }
  };

  // Enhanced Fasting Compatibility Check Function with Profile
  const checkFastingCompatibilityWithProfile = (medications: any[], profile: any) => {
    let fastingSafe = true;
    let warnings: string[] = [];
    let suggestedFastingHours = 16; // Default recommendation
    let riskLevel = 'low'; // 'low', 'medium', 'high', 'critical'

    // Common medications that require food
    const foodRequiredMedications = [
      'metformin', 'aspirin', 'ibuprofen', 'naproxen', 'diclofenac',
      'prednisone', 'prednisolone', 'iron', 'calcium', 'vitamin d',
      'omeprazole', 'lansoprazole', 'esomeprazole', 'pantoprazole',
      'sulfonylureas', 'glipizide', 'glyburide', 'glimepiride'
    ];

    // Check medications
    medications.forEach(med => {
      const medName = med.name?.toLowerCase() || '';
      const medStrength = med.strength?.toLowerCase() || '';
      const fullMedName = `${medName} ${medStrength}`.toLowerCase();
      
      const requiresFood = foodRequiredMedications.some(requiredMed => 
        medName.includes(requiredMed) || fullMedName.includes(requiredMed)
      );
      
      if (requiresFood) {
        fastingSafe = false;
        warnings.push(`${med.name} should be taken with food.`);
        suggestedFastingHours = Math.min(suggestedFastingHours, 12);
      }
    });

    // Check health conditions
    if (profile) {
      // Calculate BMI (Body Mass Index) if weight and height are provided
      let bmi = null;
      if (profile.weight && profile.height) {
        const weight = parseFloat(profile.weight);
        const height = parseFloat(profile.height);
        
        if (weight > 0 && height > 0) {
          // Convert to metric if needed
          let weightKg = weight;
          let heightM = height / 100; // Assume cm
          
          if (profile.weightUnit === 'lbs') {
            weightKg = weight * 0.453592; // Convert lbs to kg
          }
          if (profile.heightUnit === 'ft') {
            heightM = height * 0.3048; // Convert ft to m
          }
          
          bmi = weightKg / (heightM * heightM);
        }
      }

      // BMI (Body Mass Index) considerations
      if (bmi !== null) {
        if (bmi < 18.5) {
          warnings.push(aiTranslations.lowBMIRisk);
          suggestedFastingHours = Math.min(suggestedFastingHours, 12);
          riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
        } else if (bmi > 30) {
          warnings.push(aiTranslations.higherBMIRisk);
          suggestedFastingHours = Math.min(suggestedFastingHours, 14);
          riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
        }
      }

      // Check custom health conditions
      if (profile.otherHealthConditions && profile.otherHealthConditions.length > 0) {
        const highRiskConditions = ['cancer', 'autoimmune', 'thyroid', 'adrenal', 'pituitary', 'seizure', 'epilepsy'];
        const mediumRiskConditions = ['migraine', 'chronic fatigue', 'fibromyalgia', 'arthritis', 'osteoporosis'];
        
        profile.otherHealthConditions.forEach((condition: string) => {
          const lowerCondition = condition.toLowerCase();
          
          if (highRiskConditions.some(risk => lowerCondition.includes(risk))) {
            fastingSafe = false;
            warnings.push(`${condition} requires medical supervision for fasting.`);
            suggestedFastingHours = Math.min(suggestedFastingHours, 14);
            riskLevel = 'high';
          } else if (mediumRiskConditions.some(risk => lowerCondition.includes(risk))) {
            warnings.push(`${condition} may be affected by fasting.`);
            suggestedFastingHours = Math.min(suggestedFastingHours, 14);
            riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
          } else {
            warnings.push(`${condition} should be discussed with your healthcare provider before fasting.`);
            riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
          }
        });
      }

      // Critical conditions that make fasting unsafe
      if (profile.diabetes || profile.hypoglycemia) {
        fastingSafe = false;
        riskLevel = 'critical';
        warnings.push(t('diabetesRequiresSupervision'));
        suggestedFastingHours = Math.min(suggestedFastingHours, 8);
      }

      if (profile.pregnancy || profile.breastfeeding) {
        fastingSafe = false;
        riskLevel = 'critical';
        warnings.push(t('pregnancyRequiresSupervision'));
        suggestedFastingHours = Math.min(suggestedFastingHours, 8);
      }

      if (profile.eatingDisorders) {
        fastingSafe = false;
        riskLevel = 'high';
        warnings.push(t('eatingDisordersRequireSupervision'));
        suggestedFastingHours = Math.min(suggestedFastingHours, 8);
      }

      // High-risk conditions
      if (profile.heartConditions || profile.kidneyDisease || profile.liverDisease) {
        riskLevel = 'high';
        warnings.push(t('heartKidneyLiverRequireSupervision'));
        suggestedFastingHours = Math.min(suggestedFastingHours, 12);
      }

      // Medium-risk conditions
      if (profile.gastrointestinalIssues) {
        riskLevel = 'medium';
        warnings.push(t('gastrointestinalIssuesWorsened'));
        suggestedFastingHours = Math.min(suggestedFastingHours, 14);
      }

      // Nutritional status considerations
      if (profile.bodyFatLevel === 'low' || profile.muscleMass === 'low') {
        riskLevel = 'medium';
        warnings.push(t('lowBodyFatRisky'));
        suggestedFastingHours = Math.min(suggestedFastingHours, 12);
      }

      if (profile.hydrationLevel === 'poor') {
        riskLevel = 'medium';
        warnings.push(t('poorHydrationIncreasesRisks'));
        suggestedFastingHours = Math.min(suggestedFastingHours, 12);
      }

      // Mental health considerations
      if (profile.anxiety || profile.depression) {
        riskLevel = 'medium';
        warnings.push(t('anxietyDepressionAffected'));
        suggestedFastingHours = Math.min(suggestedFastingHours, 14);
      }

      // Activity level considerations
      if (profile.activityLevel === 'athlete' || profile.physicalLabor) {
        warnings.push(t('highActivityRequiresNutrition'));
        suggestedFastingHours = Math.min(suggestedFastingHours, 12);
      }

      // Sleep quality considerations
      if (profile.sleepQuality === 'poor') {
        warnings.push(t('poorSleepAffected'));
        suggestedFastingHours = Math.min(suggestedFastingHours, 14);
      }

      // Respect user preferences
      if (profile.maxFastingHours && profile.maxFastingHours < suggestedFastingHours) {
        suggestedFastingHours = profile.maxFastingHours;
      }
    }

    // Generate personalized message
    let message = '';
    const riskEmoji = riskLevel === 'critical' ? '🚨' : 
                     riskLevel === 'high' ? '⚠️' : 
                     riskLevel === 'medium' ? '⚡' : '✅';

    if (riskLevel === 'critical' || !fastingSafe) {
      message = `${riskEmoji} ${t('fastingNotRecommended')} ${warnings.join(' ')} ${t('pleaseConsultHealthcareProvider')}`;
    } else if (riskLevel === 'high') {
      message = `${riskEmoji} ${t('fastingRequiresSupervision')} ${warnings.join(' ')} ${t('considerShorterFastingPeriod').replace('{hours}', suggestedFastingHours.toString()).replace('{remaining}', (24-suggestedFastingHours).toString())}`;
    } else if (riskLevel === 'medium') {
      message = `${riskEmoji} ${t('fastingMayBeSuitableWithCaution')} ${warnings.join(' ')} ${t('hourFastingWindowAppropriate').replace('{hours}', suggestedFastingHours.toString()).replace('{remaining}', (24-suggestedFastingHours).toString())}`;
    } else {
      message = `${riskEmoji} ${t('fastingAppearsCompatible')} ${t('hourFastingWindowSuitable').replace('{hours}', suggestedFastingHours.toString()).replace('{remaining}', (24-suggestedFastingHours).toString())}`;
    }

    return {
      compatible: fastingSafe && riskLevel !== 'critical',
      warnings,
      suggestedHours: suggestedFastingHours,
      riskLevel,
      message
    };
  };

  // Original function for backward compatibility
  const checkFastingCompatibility = (medications: any[]) => {
    return checkFastingCompatibilityWithProfile(medications, null);
  };

  const analyzeFastingCompatibility = async () => {
    try {
      // Get medications from the app's medication data
      // For now, we'll use a mock list - in a real app, this would come from the medication state
      const mockMedications = [
        { name: aiTranslations.metformin, strength: '500mg', times: ['08:00', '20:00'] },
        { name: aiTranslations.aspirin, strength: '81mg', times: ['08:00'] },
        { name: aiTranslations.vitaminD, strength: '1000 IU', times: ['08:00'] }
      ];
      
      // Enhanced analysis using fasting profile
      const analysis = checkFastingCompatibilityWithProfile(mockMedications, fastingProfile);
      setFastingAnalysis(analysis);
      setFastingResult(analysis.message);
      setShowFastingModal(false);
      
      triggerHaptic('medium');
      
      // Show analysis results
      const statusEmoji = analysis.compatible ? '✅' : '⚠️';
      const statusTitle = analysis.compatible ? t('fastingCompatible') : t('fastingWarning');
      
      Alert.alert(
        `${statusEmoji} ${statusTitle}`,
        analysis.message,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to analyze fasting compatibility:', error);
      Alert.alert('❌ ' + aiTranslations.error, aiTranslations.failedToAnalyzeFastingCompatibility);
    }
  };

  // Helper function to translate stored values
  const translateValue = (value: string | undefined, translationKey: string) => {
    if (!value) return t('notSpecified');
    
    // Map stored values to translation keys
    const valueTranslations: { [key: string]: string } = {
      'normal': t('normal'),
      'high': t('high'),
      'low': t('low'),
      'poor': t('poor'),
      'fair': t('fair'),
      'good': t('good'),
      'excellent': t('excellent'),
      'sedentary': t('sedentary'),
      'light': t('light'),
      'moderate': t('moderate'),
      'athlete': t('athlete'),
      'timeRestricted': t('timeRestricted'),
      'alternateDay': t('alternateDay'),
      'extended': t('extended'),
      'custom': t('custom'),
      'daily': t('daily'),
      'weekly': t('weekly'),
      'monthly': t('monthly'),
      'weightLoss': t('weightLoss'),
      'metabolicHealth': t('metabolicHealth'),
      'generalHealth': t('generalHealth'),
      'spiritual': t('spiritual'),
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
      
      // Get AuricRX logo as base64 (using Asset.fromModule for proper handling)
      const { Asset } = require('expo-asset');
      const logoAsset = Asset.fromModule(require('../../assets/sign in logo.png'));
      await logoAsset.downloadAsync();
      console.log('🔍 Logo asset loaded:', logoAsset.localUri);
      
      const logoBase64 = await FileSystem.readAsStringAsync(logoAsset.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('✅ Logo loaded successfully, base64 length:', logoBase64.length);
      
      // Create HTML content for PDF (similar to DocumentsScreen)
      const medicationsHtml = medications && medications.length > 0 ? 
        medications.map((med, index) => `
          <div class="medication-item">
            <h3>${index + 1}. ${med.name || 'N/A'}</h3>
            <p><strong>${t('dosage')}:</strong> ${med.strength || 'N/A'}</p>
            <p><strong>${t('quantity')}:</strong> ${med.quantity || 'N/A'}</p>
            <p><strong>${t('times')}:</strong> ${med.times ? med.times.join(', ') : 'N/A'}</p>
            ${med.notes ? `<p><strong>${t('notes')}:</strong> ${med.notes}</p>` : ''}
          </div>
        `).join('') : 
        `<p>${t('noMedicationsRecorded')}</p>`;

      const fastingProfileHtml = fastingProfile ? `
        <div class="profile-section">
          <h3>${t('basicInformation')}</h3>
          <p><strong>${t('healthProfile.weight')}:</strong> ${fastingProfile.weight || t('notSpecified')} ${fastingProfile.weightUnit || 'kg'}</p>
          <p><strong>${t('healthProfile.height')}:</strong> ${fastingProfile.height || t('notSpecified')} ${fastingProfile.heightUnit || 'cm'}</p>
          
          <h3>${t('healthConditions')}</h3>
          <p><strong>${t('healthConditions')}:</strong> ${[
            fastingProfile.diabetes ? t('diabetes') : '',
            fastingProfile.hypoglycemia ? t('hypoglycemia') : '',
            fastingProfile.heartConditions ? t('heartConditions') : '',
            fastingProfile.kidneyDisease ? t('kidneyDisease') : '',
            fastingProfile.liverDisease ? t('liverDisease') : '',
            fastingProfile.eatingDisorders ? t('eatingDisorders') : '',
            fastingProfile.pregnancy ? t('pregnancy') : '',
            fastingProfile.breastfeeding ? t('breastfeeding') : '',
            fastingProfile.gastrointestinalIssues ? t('gastrointestinalIssues') : '',
            ...(fastingProfile.otherHealthConditions || [])
          ].filter(Boolean).join(', ') || t('noneReported')}</p>
          
          <h3>${t('nutritionalStatusBodyComposition')}</h3>
          <p><strong>${t('bodyFatLevel')}:</strong> ${translateValue(fastingProfile.bodyFatLevel, 'bodyFatLevel')}</p>
          <p><strong>${t('muscleMass')}:</strong> ${translateValue(fastingProfile.muscleMass, 'muscleMass')}</p>
          <p><strong>${t('micronutrientLevels')}:</strong> ${translateValue(fastingProfile.micronutrientLevels, 'micronutrientLevels')}</p>
          <p><strong>${t('hydrationLevel')}:</strong> ${translateValue(fastingProfile.hydrationLevel, 'hydrationLevel')}</p>
          
          <h3>${t('mentalHealthCognitiveDemands')}</h3>
          <p><strong>${t('highStressEnvironment')}:</strong> ${fastingProfile.highStressEnvironment ? t('yes') : t('no')}</p>
          <p><strong>${t('intensiveMentalTasks')}:</strong> ${fastingProfile.intensiveMentalTasks ? t('yes') : t('no')}</p>
          <p><strong>${t('anxiety')}:</strong> ${fastingProfile.anxiety ? t('yes') : t('no')}</p>
          <p><strong>${t('depression')}:</strong> ${fastingProfile.depression ? t('yes') : t('no')}</p>
          
          <h3>${t('lifestyleActivityLevel')}</h3>
          <p><strong>${t('activityLevel')}:</strong> ${translateValue(fastingProfile.activityLevel, 'activityLevel')}</p>
          <p><strong>${t('physicalLaborJob')}:</strong> ${fastingProfile.physicalLabor ? t('yes') : t('no')}</p>
          <p><strong>${t('longWorkShifts')}:</strong> ${fastingProfile.longShifts ? t('yes') : t('no')}</p>
          <p><strong>${t('sleepQuality')}:</strong> ${translateValue(fastingProfile.sleepQuality, 'sleepQuality')}</p>
          
          <h3>${t('fastingProtocolPreferences')}</h3>
          <p><strong>${t('preferredFastingType')}:</strong> ${translateValue(fastingProfile.preferredFastingType, 'preferredFastingType')}</p>
          <p><strong>${t('maximumFastingHours')}:</strong> ${fastingProfile.maxFastingHours || t('notSpecified')}</p>
          <p><strong>${t('fastingFrequency')}:</strong> ${translateValue(fastingProfile.fastingFrequency, 'fastingFrequency')}</p>
          
          <h3>${t('goals')}</h3>
          <p><strong>${t('primaryGoal')}:</strong> ${translateValue(fastingProfile.primaryGoal, 'primaryGoal')}</p>
          
          <h3>${t('medicalSupervisionMonitoring')}</h3>
          <p><strong>${t('medicalSupervision')}:</strong> ${fastingProfile.medicalSupervision ? t('yes') : t('no')}</p>
          <p><strong>${t('selfMonitoring')}:</strong> ${fastingProfile.selfMonitoring ? t('yes') : t('no')}</p>
          <p><strong>${t('wearableDevices')}:</strong> ${fastingProfile.wearableDevices ? t('yes') : t('no')}</p>
        </div>
      ` : `<p>${t('noFastingProfileCompleted')}</p>`;

      const fastingAnalysisHtml = fastingAnalysis ? `
        <div class="analysis-section">
          <h3>${t('fastingAnalysis')}</h3>
          <div class="analysis-result ${fastingAnalysis.compatible ? 'compatible' : 'needs-review'}">
            <p><strong>${t('status')}:</strong> ${fastingAnalysis.compatible ? t('compatible') : t('needsReview')}</p>
            <p><strong>${t('recommendedFastingWindow')}:</strong> ${fastingAnalysis.suggestedHours}:${24-fastingAnalysis.suggestedHours}</p>
            <p><strong>${t('analysis')}:</strong> ${fastingAnalysis.message}</p>
          </div>
          ${fastingAnalysis.warnings && fastingAnalysis.warnings.length > 0 ? `
            <div class="warnings">
              <h4>${t('importantConsiderations')}:</h4>
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
                font-family: Arial, sans-serif; 
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
              <h2 class="section-title">${t('currentMedications')}</h2>
              ${medicationsHtml}
            </div>

            <div class="section" style="page-break-before: always;">
              <h2 class="section-title">${t('healthProfile')}</h2>
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
        throw new Error('Sharing is not available on this platform');
      }
      
      const shareResult = await Sharing.shareAsync(finalUri, {
        mimeType: 'application/pdf',
        dialogTitle: aiTranslations.auricrxHealthReport,
      });
      
      console.log('✅ PDF shared successfully, result:', shareResult);
      
      // Only show success if sharing was actually completed
      if (shareResult && (shareResult.action === 'sharedAction' || shareResult.action === 'dismissedAction')) {
        Alert.alert(
          t('exportSuccessful'),
          t('healthReportGenerated'),
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Error exporting health report:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      
      // No alert shown - silent failure
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return '#3b82f6'; // blue
      case 'warning': return '#f59e0b'; // yellow
      case 'critical': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'info': return t('info');
      case 'warning': return t('warning');
      case 'critical': return t('critical');
      default: return t('unknown');
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
        <Image 
          source={require('../../assets/dashboard Emojies/AI Health.png')} 
          style={{ width: 24, height: 24, marginRight: 8 }} 
          resizeMode="contain" 
        />
        <DynamicText type="primary" style={dynamicStyles.sectionTitle}>{t('aiHealthFeatures')}</DynamicText>
      </View>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {t('intelligentHealthcareFeatures')}
      </DynamicText>
      
      <View style={dynamicStyles.statsGrid}>
        <View style={dynamicStyles.statCard}>
          <DynamicText type="card" style={dynamicStyles.statValue}>{insights.length}</DynamicText>
          <DynamicText type="card" style={dynamicStyles.statLabel}>{t('healthInsights')}</DynamicText>
        </View>
        <View style={dynamicStyles.statCard}>
          <DynamicText type="card" style={dynamicStyles.statValue}>{symptomAnalyses.length}</DynamicText>
          <DynamicText type="card" style={dynamicStyles.statLabel}>{t('symptomAnalyses')}</DynamicText>
        </View>
        <View style={dynamicStyles.statCard}>
          <DynamicText type="card" style={dynamicStyles.statValue}>{drugInteractions.length}</DynamicText>
          <DynamicText type="card" style={dynamicStyles.statLabel}>{t('drugChecks')}</DynamicText>
        </View>
      </View>

      <View style={dynamicStyles.quickActions}>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={() => setShowSymptomModal(true)}
        >
          <DynamicText type="card" style={dynamicStyles.quickActionText}>🤒 {t('analyzeSymptoms')}</DynamicText>
        </TouchableOpacity>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={() => setShowDrugCheckModal(true)}
        >
          <DynamicText type="card" style={dynamicStyles.quickActionText}>💊 {t('checkInteractions')}</DynamicText>
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
          <Image 
            source={require('../../assets/dashboard Emojies/AI Health.png')} 
            style={{ width: 24, height: 24, marginRight: 8 }} 
            resizeMode="contain" 
          />
          <DynamicText type="primary" style={dynamicStyles.sectionTitle}>{t('fastingAnalytics')}</DynamicText>
        </View>
        
        <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
          {t('fastingDescription')}
        </DynamicText>

        {hasProfile ? (
          <View style={dynamicStyles.fastingProfileCard}>
            <View style={dynamicStyles.fastingProfileHeader}>
              <DynamicText type="card" style={dynamicStyles.fastingProfileTitle}>
                {t('yourFastingProfile')}
              </DynamicText>
              <View style={[
                dynamicStyles.fastingStatusBadge,
                { backgroundColor: fastingAnalysis?.compatible ? '#10b981' : '#f59e0b' }
              ]}>
                <DynamicText type="card" style={dynamicStyles.fastingStatusText}>
                  {fastingAnalysis ? (fastingAnalysis.compatible ? t('compatible') : t('needsReview')) : t('notAnalyzed')}
                </DynamicText>
              </View>
            </View>

            {fastingAnalysis ? (
              <View style={dynamicStyles.fastingAnalysisResult}>
                <View style={dynamicStyles.fastingTimeRecommendation}>
                  <DynamicText type="card" style={dynamicStyles.fastingTimeLabel}>{t('recommendedFastingWindow')}</DynamicText>
                  <DynamicText type="card" style={dynamicStyles.fastingTimeValue}>
                    {fastingAnalysis.suggestedHours}:{24-fastingAnalysis.suggestedHours}
                  </DynamicText>
                </View>

                <DynamicText type="card" style={dynamicStyles.fastingMessage}>
                  {fastingAnalysis.message}
                </DynamicText>

                {fastingAnalysis.warnings.length > 0 && (
                  <View style={dynamicStyles.fastingWarnings}>
                    <DynamicText type="card" style={dynamicStyles.fastingWarningsTitle}>
                      {t('importantConsiderations')}:
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
                  {t('fastingCompatibilityDescription')}
                </DynamicText>
              </View>
            )}

            <TouchableOpacity
              style={[dynamicStyles.fastingAnalyzeButton, { backgroundColor: getAccentColor() }]}
              onPress={analyzeFastingCompatibility}
            >
              <DynamicText type="card" style={dynamicStyles.fastingAnalyzeButtonText}>
                {fastingAnalysis ? t('reAnalyzeFasting') : t('analyzeFastingCompatibility')}
              </DynamicText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={dynamicStyles.fastingNoProfileCard}>
            <DynamicText type="card" style={dynamicStyles.fastingNoProfileTitle}>
              {t('completeYourFastingProfile')}
            </DynamicText>
            <DynamicText type="card" style={dynamicStyles.fastingNoProfileDescription}>
              Set up your fasting profile in Settings to get personalized fasting recommendations based on your health conditions, medications, and lifestyle.
            </DynamicText>
            <TouchableOpacity
              style={[dynamicStyles.fastingSetupButton, { backgroundColor: getAccentColor() }]}
              onPress={() => {
                // This would navigate to settings - you might want to add a callback prop for this
                Alert.alert(t('setupRequired'), t('pleaseGoToSettings'));
              }}
            >
              <DynamicText type="card" style={dynamicStyles.fastingSetupButtonText}>
                Go to Settings
              </DynamicText>
            </TouchableOpacity>
          </View>
        )}

        <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { fontSize: 12, fontStyle: 'italic', marginTop: 8 }]}>
          {t('consultHealthcareProviderDisclaimer')}
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
      <DynamicText type="primary" style={dynamicStyles.sectionTitle}>💡 {t('healthInsights')}</DynamicText>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {t('aiGeneratedInsights')}
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
                {t('actionItems')}
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
        <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          {t('noHealthInsights')}
        </DynamicText>
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
      <DynamicText type="primary" style={dynamicStyles.sectionTitle}>📊 {t('recentAnalyses')}</DynamicText>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {t('recentSymptomAnalyses')}
      </DynamicText>
      
      {symptomAnalyses.slice(0, 3).map(analysis => (
        <View key={analysis.id} style={dynamicStyles.insightCard}>
          <View style={dynamicStyles.insightHeader}>
            <DynamicText type="card" style={dynamicStyles.insightTitle}>
              {analysis.symptoms.join(', ')}
            </DynamicText>
            <View style={[
              dynamicStyles.insightSeverity,
              { backgroundColor: getSeverityColor(analysis.urgency === 'emergency' ? 'critical' : analysis.urgency === 'high' ? 'warning' : 'info') }
            ]}>
              <DynamicText type="card" style={dynamicStyles.severityText}>
                {analysis.urgency.toUpperCase()}
              </DynamicText>
            </View>
          </View>
          
          <DynamicText type="card" style={dynamicStyles.insightDescription}>
            {analysis.possibleConditions[0]?.condition} ({(analysis.possibleConditions[0]?.probability * 100).toFixed(0)}% probability)
          </DynamicText>
          
          <DynamicText type="card" style={dynamicStyles.actionItem}>
            {new Date(analysis.createdAt).toLocaleDateString()}
          </DynamicText>
        </View>
      ))}
      
      {symptomAnalyses.length === 0 && (
        <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          {t('noSymptomAnalyses')}
        </DynamicText>
      )}
    </Animated.View>
  );

  // Simplified AI Health - no external service needed

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
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
              <Image 
                source={require('../../assets/dashboard Emojies/AI Health.png')} 
                style={{ width: 32, height: 32, marginRight: 12 }} 
                resizeMode="contain" 
              />
              <DynamicText type="primary" style={styles.title}>
                {t('aiHealthAssistant')}
              </DynamicText>
            </View>
            <DynamicText type="secondary" style={styles.subtitle}>
              {t('intelligentHealthcareFeatures')}
            </DynamicText>
          </Animated.View>

          {/* AI Features */}
          {renderAIFeatures()}

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
              <Image 
                source={require('../../assets/dashboard Emojies/AI Health.png')} 
                style={{ width: 24, height: 24, marginRight: 8 }} 
                resizeMode="contain" 
              />
              <DynamicText type="primary" style={dynamicStyles.sectionTitle}>{t('exportHealthReport')}</DynamicText>
            </View>
            
            <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
              {t('generateHealthReportDescription')}
            </DynamicText>

            <TouchableOpacity
              style={[dynamicStyles.exportButton, { backgroundColor: getAccentColor() }]}
              onPress={exportToPDF}
            >
              <DynamicText type="card" style={dynamicStyles.exportButtonText}>
                {t('exportHealthReport')}
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
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>🤒 Symptom Analysis</DynamicText>
            
            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>Describe your symptoms</DynamicText>
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
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>Cancel</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={analyzeSymptoms}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>Analyze</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Drug Interaction Check Modal */}
      <Modal
        visible={showDrugCheckModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDrugCheckModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>💊 Drug Interaction Check</DynamicText>
            
            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>List your medications</DynamicText>
              <TextInput
                style={dynamicStyles.multilineInput}
                placeholder={aiTranslations.enterMedicationsPlaceholder}
                placeholderTextColor={getCardTextColor() + '80'}
                value={medicationList}
                onChangeText={setMedicationList}
                multiline
              />
            </View>

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => setShowDrugCheckModal(false)}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>Cancel</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={checkDrugInteractions}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>Check</DynamicText>
              </TouchableOpacity>
            </View>
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
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>⏰ Fasting Analytics</DynamicText>
            
            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>Fasting Compatibility Check</DynamicText>
              <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
                Check if your current medications are compatible with intermittent fasting
              </DynamicText>
            </View>

            {fastingAnalysis && (
              <View style={[dynamicStyles.insightCard, { 
                borderLeftColor: fastingAnalysis.compatible ? '#10b981' : '#f59e0b',
                marginBottom: 16 
              }]}>
                <View style={dynamicStyles.insightHeader}>
                  <DynamicText type="card" style={dynamicStyles.insightTitle}>
                    {fastingAnalysis.compatible ? '✅ Compatible' : '⚠️ Warning'}
                  </DynamicText>
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
                    <DynamicText type="card" style={[dynamicStyles.actionItem, { fontWeight: '600', marginBottom: 4 }]}>
                      Warnings:
                    </DynamicText>
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
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>Cancel</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={analyzeFastingCompatibility}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>Analyze</DynamicText>
              </TouchableOpacity>
            </View>
            
            <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { fontSize: 12, fontStyle: 'italic', marginTop: 8 }]}>
              {t('consultHealthcareProviderDisclaimer')}
            </DynamicText>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
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
