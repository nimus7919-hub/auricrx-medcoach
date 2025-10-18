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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
import { createAIHealthTranslations } from '../services/aiHealthTranslations';
import { useTranslation } from 'react-i18next';
const { width: screenWidth } = Dimensions.get('window');

interface AIHealthScreenProps {
  onClose: () => void;
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

// Simple symptom tracking function (no AI analysis/diagnosis)
const analyzeSymptomsWithAI = (symptoms: string[], t: any, S: any): SymptomAnalysis => {
  const id = `symptom_${Date.now()}`;
  
  // Just store symptoms without any diagnosis
  return {
    id,
    symptoms,
    severity: 'mild',
    possibleConditions: [],  // No diagnosis
    urgency: 'low',
    recommendations: [
      S?.trackOverTime || 'Track your symptoms over time',
      S?.monitorChanges || 'Monitor any changes in severity or frequency',
      S?.contactDoctorImmediately || 'Contact your doctor if symptoms worsen'
    ],
    followUpActions: [
      S?.contactDoctorImmediately || 'Contact your doctor immediately if symptoms worsen',
      S?.exportSymptomReport || 'Export your symptom report to share with your healthcare provider'
    ],
    createdAt: new Date().toISOString()
  };
};

export default function AIHealthScreen({ onClose, theme, S, fastingProfile, medications = [], supplements = [] }: AIHealthScreenProps) {
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
      backgroundColor: currentTheme.accent + '40',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 12,
      borderColor: currentTheme.accent,
      borderWidth: 1,
    },
    viewAllButtonText: {
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
        setSymptomAnalyses(parsed);
      }
      
      if (savedStoredSymptoms) {
        const parsed = JSON.parse(savedStoredSymptoms);
        setStoredSymptomAnalyses(parsed);
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
  const [showDrugCheckModal, setShowDrugCheckModal] = useState(false);
  const [showSymptomResultModal, setShowSymptomResultModal] = useState(false);
  const [showSymptomHistoryModal, setShowSymptomHistoryModal] = useState(false);
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
      setStoredSymptomAnalyses(prev => [analysis, ...prev]);
      setSymptomAnalyses(prev => prev.filter(a => a.id !== id));
      triggerHaptic('medium');
    }
  };

  const emptyAllSymptoms = () => {
    Alert.alert(
      S?.confirmEmptySymptoms || 'Empty All Symptoms',
      S?.confirmEmptySymptomsMessage || 'Are you sure you want to delete all tracked symptoms? This cannot be undone.',
      [
        {
          text: S?.cancel || 'Cancel',
          style: 'cancel'
        },
        {
          text: S?.delete || 'Delete All',
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
      Alert.alert('❌ Error', t('pleaseEnterSymptoms'));
      return;
    }

    try {
      const symptoms = symptomText.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      // Enhanced AI-driven analysis based on symptom patterns
      const analysis = analyzeSymptomsWithAI(symptoms, t, S);
      
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

  const checkDrugInteractions = async () => {
    // Combine medications and supplements
    const allItems = [
      ...(medications || []).map((m: any) => ({
        name: m.name,
        strength: m.components && m.components.length > 0 
          ? m.components.map((c: any) => `${c.strength}${c.unit}`).join('+')
          : m.strengthValue ? `${m.strengthValue}${m.strengthUnit}` : '',
        type: 'medication'
      })),
      ...(supplements || []).map((s: any) => ({
        name: s.name,
        strength: s.strengthValue ? `${s.strengthValue}${s.strengthUnit}` : '',
        type: 'supplement'
      }))
    ];

    if (allItems.length < 2) {
      Alert.alert(
        '❌ ' + (S?.error || 'Error'), 
        S?.needTwoItems || 'You need at least 2 medications or supplements to check for interactions.'
      );
      return;
    }

    try {
      setShowDrugCheckModal(false);
      
      // Show loading state
      Alert.alert(
        '🔄 ' + (S?.analyzing || 'Analyzing...'),
        S?.checkingInteractions || 'Checking for drug interactions using AI...'
      );

      // Prepare the medication list for AI
      const itemList = allItems.map(item => 
        `${item.name}${item.strength ? ' (' + item.strength + ')' : ''} [${item.type}]`
      ).join('\n');

      // Call AI API - Use Render service (cloud)
      const apiUrl = 'https://auricrx-medcoach.onrender.com/api/ai/drug-interactions';
      
      console.log('Calling AI API:', apiUrl);
      console.log('Items to check:', allItems);

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - AI server may not be running')), 15000); // 15 second timeout
      });

      // Race between fetch and timeout
      const fetchPromise = fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: allItems,
          messages: [
            {
              role: 'system',
              content: `You are a clinical pharmacist AI assistant. Analyze drug and supplement interactions comprehensively. 
              
IMPORTANT: Always provide a medical disclaimer that this is for educational purposes only and users should consult their healthcare provider.

For each interaction found, provide:
1. The two interacting items
2. Severity level (Minor, Moderate, Major, or Contraindicated)
3. Description of the interaction
4. Clinical effects
5. Management recommendations

If no significant interactions are found, state that clearly but still recommend consulting a pharmacist or doctor.

Format your response as JSON with this structure:
{
  "disclaimer": "Your medical disclaimer text",
  "interactions": [
    {
      "item1": "Drug A",
      "item2": "Drug B",
      "severity": "Moderate",
      "description": "Description of interaction",
      "clinicalEffects": ["Effect 1", "Effect 2"],
      "management": "How to manage this interaction",
      "urgency": "immediate|monitor|routine"
    }
  ],
  "overallRisk": "low|moderate|high",
  "summary": "Brief overall summary"
}`
            },
            {
              role: 'user',
              content: `Please analyze these medications and supplements for potential interactions:\n\n${itemList}`
            }
          ]
        })
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      
      // Parse AI response
      let aiResult;
      try {
        aiResult = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      } catch {
        aiResult = {
          disclaimer: data.result || 'Unable to parse response',
          interactions: [],
          overallRisk: 'unknown',
          summary: data.result
        };
      }

      // Save to AsyncStorage
      const interactionCheck = {
        id: `check_${Date.now()}`,
        timestamp: new Date().toISOString(),
        items: allItems,
        result: aiResult,
        itemCount: allItems.length
      };

      const saved = await AsyncStorage.getItem('drug_interaction_checks');
      const checks = saved ? JSON.parse(saved) : [];
      checks.unshift(interactionCheck);
      await AsyncStorage.setItem('drug_interaction_checks', JSON.stringify(checks.slice(0, 20))); // Keep last 20

      triggerHaptic('medium');

      // Show results
      const interactionCount = aiResult.interactions?.length || 0;
      const severity = aiResult.overallRisk || 'unknown';
      
      let icon = '✅';
      if (severity === 'high') icon = '🚨';
      else if (severity === 'moderate') icon = '⚠️';
      else if (severity === 'low') icon = 'ℹ️';

      const message = `${aiResult.disclaimer || ''}\n\n${aiResult.summary || ''}\n\n${
        interactionCount > 0 
          ? `Found ${interactionCount} interaction(s):\n\n` + aiResult.interactions.map((int: any, idx: number) => 
              `${idx + 1}. ${int.item1} + ${int.item2}\n   Severity: ${int.severity}\n   ${int.description}`
            ).join('\n\n')
          : 'No significant interactions found.'
      }`;

      Alert.alert(
        `${icon} ${S?.interactionResults || 'Interaction Check Results'}`,
        message,
        [
          { text: S?.ok || 'OK', style: 'default' }
        ]
      );

    } catch (error: any) {
      console.error('Failed to check drug interactions:', error);
      console.error('Error details:', error.message);
      
      let errorMessage = S?.failedToCheckInteractions || 'Failed to check interactions.';
      
      // Check for timeout
      if (error.message?.includes('timeout')) {
        errorMessage = '⏱️ Connection Timeout\n\nThe AI server is not responding. Please:\n\n1. Make sure the server is running:\n   cd server\n   node aI-stream.js\n\n2. Check that port 3001 is available\n\n3. Verify your .env file has OPENAI_API_KEY';
      }
      // Check for network errors
      else if (error.message?.includes('Network') || error.message?.includes('Failed to fetch')) {
        errorMessage = '🌐 Network Error\n\nCannot connect to AI server. Please:\n\n1. Start the server: node server/aI-stream.js\n2. Check if running on port 3001\n3. Make sure firewall allows the connection';
      }
      // Add error details for other errors
      else if (error.message) {
        errorMessage += `\n\nDetails: ${error.message}`;
      }
      
      Alert.alert(
        '❌ ' + (S?.error || 'Error'), 
        errorMessage
      );
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
        const foodText = S?.shouldBeTakenWithFood || 'should be taken with food.';
        console.log('🔍 Debug - S object:', S);
        console.log('🔍 Debug - shouldBeTakenWithFood:', S?.shouldBeTakenWithFood);
        console.log('🔍 Debug - final foodText:', foodText);
        warnings.push(`${med.name} ${foodText}`);
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
      
      // Analysis results are now displayed on screen via fastingResult state
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
      
      // Get AuricRX logo as base64 (using Image.resolveAssetSource for proper handling)
      const logoSource = Image.resolveAssetSource(require('../../assets/sign in logo.png'));
      console.log('🔍 Logo source:', logoSource);
      
      // Download the logo to local storage
      const logoUri = await FileSystem.downloadAsync(
        logoSource.uri,
        FileSystem.documentDirectory + 'sign-in-logo.png'
      );
      console.log('🔍 Logo downloaded to:', logoUri.uri);
      
      const logoBase64 = await FileSystem.readAsStringAsync(logoUri.uri, {
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
              <h4>${S?.importantConsiderations || 'Important Considerations'}:</h4>
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
          <DynamicText type="card" style={dynamicStyles.statLabel}>{S?.healthInsights || 'Health Insights'}</DynamicText>
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
                      {S?.importantConsiderations || 'Important Considerations'}:
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
                {fastingAnalysis ? (S?.reAnalyzeFasting || 'Re-analyze Fasting') : (S?.analyzeFastingCompatibility || 'Analyze Fasting Compatibility')}
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
      <DynamicText type="primary" style={dynamicStyles.sectionTitle}>💡 {S?.healthInsights || 'Health Insights'}</DynamicText>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {S?.aiGeneratedInsights || 'AI-generated insights based on your health data'}
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
                {S?.actionItems || 'Action Items'}
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
          {S?.noHealthInsights || 'No health insights available yet'}
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
                {S?.[analysis.urgency] || analysis.urgency.toUpperCase()}
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
                  📁 {S?.store || 'Store'}
                </DynamicText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[dynamicStyles.actionButton, dynamicStyles.deleteButton]}
                onPress={() => deleteSymptomAnalysis(analysis.id)}
              >
                <DynamicText type="card" style={dynamicStyles.actionButtonText}>
                  🗑️ {S?.delete || 'Delete'}
                </DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
      
      {symptomAnalyses.length === 0 && (
        <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          {t('noSymptomAnalyses')}
        </DynamicText>
      )}
      
      <TouchableOpacity
        style={dynamicStyles.viewAllButton}
        onPress={() => {
          setShowSymptomHistoryModal(true);
          triggerHaptic('light');
        }}
      >
        <DynamicText type="card" style={dynamicStyles.viewAllButtonText}>
          📋 {S?.viewAllSymptoms || 'View All Symptoms'} ({symptomAnalyses.length})
        </DynamicText>
      </TouchableOpacity>
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
          <View style={[dynamicStyles.modalContent, { maxHeight: '85%' }]}>
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>💊 {S?.drugInteractionCheck || 'Drug Interaction Check'}</DynamicText>
            
            {/* Medical Disclaimer */}
            <View style={[dynamicStyles.doctorWarningCard, { marginBottom: 16 }]}>
              <DynamicText type="card" style={dynamicStyles.doctorWarningTitle}>
                ⚠️ {S?.medicalDisclaimer || 'Medical Disclaimer'}
              </DynamicText>
              <DynamicText type="card" style={dynamicStyles.doctorWarningText}>
                {S?.interactionDisclaimerText || 'This is AI-generated information for educational purposes only. Always consult your doctor or pharmacist before making any changes to your medications.'}
              </DynamicText>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {/* Medications Section */}
              {medications && medications.length > 0 && (
                <View style={dynamicStyles.inputGroup}>
                  <DynamicText type="card" style={dynamicStyles.inputLabel}>
                    📋 {S?.yourMedications || 'Your Medications'} ({medications.length})
                  </DynamicText>
                  {medications.map((med: any, index: number) => (
                    <View key={index} style={[dynamicStyles.insightCard, { marginBottom: 8 }]}>
                      <DynamicText type="card" style={{ fontWeight: '600', fontSize: 13 }}>
                        {med.name}
                      </DynamicText>
                      {med.strengthValue && (
                        <DynamicText type="card" style={{ fontSize: 12, marginTop: 2 }}>
                          {med.strengthValue} {med.strengthUnit}
                        </DynamicText>
                      )}
                      {med.components && med.components.length > 0 && (
                        <DynamicText type="card" style={{ fontSize: 12, marginTop: 2 }}>
                          {med.components.map((c: any) => `${c.strength} ${c.unit}`).join(' + ')}
                        </DynamicText>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Supplements Section */}
              {supplements && supplements.length > 0 && (
                <View style={dynamicStyles.inputGroup}>
                  <DynamicText type="card" style={dynamicStyles.inputLabel}>
                    💊 {S?.yourSupplements || 'Your Supplements'} ({supplements.length})
                  </DynamicText>
                  {supplements.map((sup: any, index: number) => (
                    <View key={index} style={[dynamicStyles.insightCard, { marginBottom: 8 }]}>
                      <DynamicText type="card" style={{ fontWeight: '600', fontSize: 13 }}>
                        {sup.name}
                      </DynamicText>
                      {sup.strengthValue && (
                        <DynamicText type="card" style={{ fontSize: 12, marginTop: 2 }}>
                          {sup.strengthValue} {sup.strengthUnit}
                        </DynamicText>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Empty State */}
              {(!medications || medications.length === 0) && (!supplements || supplements.length === 0) && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <DynamicText type="secondary" style={{ textAlign: 'center', fontStyle: 'italic' }}>
                    {S?.noMedicationsToCheck || 'No medications or supplements found. Please add them in the Medications or Supplements cards first.'}
                  </DynamicText>
                </View>
              )}
            </ScrollView>

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => setShowDrugCheckModal(false)}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>
                  {S?.cancel || 'Cancel'}
                </DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  dynamicStyles.modalButton, 
                  dynamicStyles.modalButtonPrimary,
                  ((medications?.length || 0) + (supplements?.length || 0) < 2) && { opacity: 0.5 }
                ]}
                onPress={checkDrugInteractions}
                disabled={(medications?.length || 0) + (supplements?.length || 0) < 2}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary, { textAlign: 'center' }]}>
                  {S?.checkInteractions || 'Check Interactions'}
                </DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Symptom Analysis Result Modal */}
      <Modal
        visible={showSymptomResultModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSymptomResultModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={[dynamicStyles.modalContent, { maxHeight: '80%' }]}>
            {currentSymptomAnalysis && (
              <>
                <View style={dynamicStyles.modalHeader}>
                  <DynamicText type="primary" style={dynamicStyles.modalTitle}>
                    {currentSymptomAnalysis.urgency === 'emergency' ? '🚨' : 
                     currentSymptomAnalysis.urgency === 'high' ? '⚠️' : 
                     currentSymptomAnalysis.urgency === 'medium' ? '⚡' : 'ℹ️'} {S?.symptomAnalysisComplete || 'Symptom Analysis Complete'}
                  </DynamicText>
                </View>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  <View style={dynamicStyles.analysisSection}>
                    <DynamicText type="card" style={dynamicStyles.analysisLabel}>
                      {S?.severity || 'Severity'}: <DynamicText type="card" style={[dynamicStyles.analysisValue, { color: getSeverityColor(currentSymptomAnalysis.severity) }]}>
                        {currentSymptomAnalysis.severity}
                      </DynamicText>
                    </DynamicText>
                    <DynamicText type="card" style={dynamicStyles.analysisLabel}>
                      {S?.urgency || 'Urgency'}: <DynamicText type="card" style={[dynamicStyles.analysisValue, { color: getUrgencyColor(currentSymptomAnalysis.urgency) }]}>
                        {currentSymptomAnalysis.urgency}
                      </DynamicText>
                    </DynamicText>
                  </View>

                  <View style={dynamicStyles.analysisSection}>
                    <DynamicText type="card" style={dynamicStyles.sectionTitle}>
                      {S?.possibleConditions || 'Possible Conditions'}:
                    </DynamicText>
                    {currentSymptomAnalysis.possibleConditions.map((condition, index) => (
                      <View key={index} style={dynamicStyles.conditionCard}>
                        <DynamicText type="card" style={dynamicStyles.conditionTitle}>
                          • {condition.condition} ({Math.round(condition.probability * 100)}%)
                        </DynamicText>
                        <DynamicText type="card" style={dynamicStyles.conditionDescription}>
                          {condition.description}
                        </DynamicText>
                        <View style={dynamicStyles.recommendationsContainer}>
                          <DynamicText type="card" style={dynamicStyles.recommendationsTitle}>
                            {S?.recommendations || 'Recommendations'}:
                          </DynamicText>
                          {condition.recommendations.map((rec, recIndex) => (
                            <DynamicText key={recIndex} type="card" style={dynamicStyles.recommendationItem}>
                              • {rec}
                            </DynamicText>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Doctor Contact Warning */}
                  <View style={[dynamicStyles.analysisSection, dynamicStyles.doctorWarningCard]}>
                    <DynamicText type="card" style={dynamicStyles.doctorWarningTitle}>
                      ⚠️ {S?.importantNotice || 'Important Notice'}
                    </DynamicText>
                    <DynamicText type="card" style={dynamicStyles.doctorWarningText}>
                      {S?.contactDoctorImmediately || 'Contact your doctor immediately if symptoms worsen'}
                    </DynamicText>
                    <DynamicText type="card" style={dynamicStyles.doctorWarningText}>
                      {S?.exportSymptomReport || 'Export your symptom report to share with your healthcare provider'}
                    </DynamicText>
                  </View>

                  <View style={dynamicStyles.analysisSection}>
                    <DynamicText type="card" style={dynamicStyles.sectionTitle}>
                      {S?.followUpActions || 'Follow-up Actions'}:
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
                      {S?.ok || 'OK'}
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
          <View style={[dynamicStyles.modalContent, { maxHeight: '85%' }]}>
            <View style={dynamicStyles.modalHeader}>
              <DynamicText type="primary" style={dynamicStyles.modalTitle}>
                📋 {S?.symptomHistory || 'Symptom History'}
              </DynamicText>
              <TouchableOpacity
                onPress={() => setShowSymptomHistoryModal(false)}
                style={{ position: 'absolute', right: 0, top: 0, padding: 8 }}
              >
                <DynamicText type="primary" style={{ fontSize: 24 }}>×</DynamicText>
              </TouchableOpacity>
            </View>

            <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { marginBottom: 12 }]}>
              {S?.totalSymptoms || 'Total symptoms tracked'}: {symptomAnalyses.length}
            </DynamicText>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {symptomAnalyses.map((analysis) => (
                <View key={analysis.id} style={dynamicStyles.insightCard}>
                  <View style={dynamicStyles.insightHeader}>
                    <DynamicText type="card" style={[dynamicStyles.insightTitle, { flex: 1 }]}>
                      {analysis.symptoms.join(', ')}
                    </DynamicText>
                    <View style={[
                      dynamicStyles.insightSeverity,
                      { backgroundColor: getSeverityColor(analysis.urgency === 'emergency' ? 'critical' : analysis.urgency === 'high' ? 'warning' : 'info') }
                    ]}>
                      <DynamicText type="card" style={dynamicStyles.severityText}>
                        {S?.[analysis.urgency] || analysis.urgency.toUpperCase()}
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
                          📁 {S?.store || 'Store'}
                        </DynamicText>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[dynamicStyles.actionButton, dynamicStyles.deleteButton]}
                        onPress={() => {
                          deleteSymptomAnalysis(analysis.id);
                        }}
                      >
                        <DynamicText type="card" style={dynamicStyles.actionButtonText}>
                          🗑️ {S?.delete || 'Delete'}
                        </DynamicText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

              {symptomAnalyses.length === 0 && (
                <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic', marginTop: 20 }]}>
                  {S?.noSymptomAnalyses || 'No symptoms tracked yet'}
                </DynamicText>
              )}
            </ScrollView>

            <View style={dynamicStyles.modalButtons}>
              {symptomAnalyses.length > 0 && (
                <TouchableOpacity
                  style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary, { marginBottom: 8 }]}
                  onPress={emptyAllSymptoms}
                >
                  <DynamicText type="card" style={dynamicStyles.modalButtonTextSecondary}>
                    🗑️ {S?.emptyAllSymptoms || 'Empty All Symptoms'}
                  </DynamicText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={() => setShowSymptomHistoryModal(false)}
              >
                <DynamicText type="card" style={dynamicStyles.modalButtonTextPrimary}>
                  {S?.close || 'Close'}
                </DynamicText>
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
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>{S?.analyzeFastingCompatibility || 'Analyze'}</DynamicText>
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
