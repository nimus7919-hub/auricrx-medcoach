import Modal from '../components/BackModal';
import { useTranslation as useScreenTranslation } from "react-i18next";
import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import KeyboardForm from '../../components/KeyboardForm';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Animated, StatusBar, Platform, Vibration, Dimensions, TextInput, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
// Simplified Health Analytics - no external service dependencies

const { width: screenWidth } = Dimensions.get('window');

interface HealthAnalyticsScreenProps {
  onClose: () => void;
  theme?: any;
  S?: any; // Translation helper
}

type MetricType = 'blood_pressure' | 'weight' | 'blood_sugar' | 'heart_rate' | 'temperature' | 'oxygen_saturation' | 'pain_level' | 'mood' | 'energy_level' | 'sleep_hours' | 'steps';

// Type definitions with fallbacks
interface HealthMetric {
  id: string;
  type: 'blood_pressure' | 'weight' | 'blood_sugar' | 'heart_rate' | 'temperature' | 'oxygen_saturation' | 'pain_level' | 'mood' | 'energy_level' | 'sleep_hours' | 'steps' | 'custom';
  value: number;
  unit: string;
  timestamp: string;
  notes?: string;
  tags?: string[];
  systolic?: string;  // For blood pressure
  diastolic?: string; // For blood pressure
}

interface MedicationAdherence {
  id: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  takenTime?: string;
  taken: boolean;
  skipped: boolean;
  sideEffects: string[];
  notes?: string;
  createdAt: string;
}

interface SideEffect {
  id: string;
  medicationId: string;
  medicationName: string;
  effect: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: number; // in hours
  notes?: string;
  reportedAt: string;
}

interface HealthReport {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  period: {
    start: string;
    end: string;
  };
  metrics: HealthMetric[];
  adherence: MedicationAdherence[];
  sideEffects: SideEffect[];
  insights: string[];
  recommendations: string[];
  createdAt: string;
}

export default function HealthAnalyticsScreen({ onClose, theme, S }: HealthAnalyticsScreenProps) {
  useUILanguage();
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
  
  // Create translation function from S object
  const { t } = useScreenTranslation();
  
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
    modalHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 12 },
    metricType: { fontSize: 16, fontWeight: '600' as const, color: getCardTextColor() },
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
    metricCard: {
      backgroundColor: getCardBackgroundColor() + '80',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    metricInfo: {
      flex: 1,
    },
    metricName: {
      fontSize: 12,
      fontWeight: '500',
    },
    metricValue: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    metricDate: {
      fontSize: 10,
      marginTop: 2,
    },
    trendIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    trendText: {
      fontSize: 12,
      marginLeft: 4,
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
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
    adherenceCard: {
      backgroundColor: getCardBackgroundColor() + '80',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    adherenceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    adherenceName: {
      fontSize: 14,
      fontWeight: '500',
      flex: 1,
    },
    adherenceRate: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    adherenceDetails: {
      fontSize: 12,
    },
    sideEffectCard: {
      backgroundColor: getCardBackgroundColor() + '80',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderLeftWidth: 4,
      borderLeftColor: currentTheme.accent,
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    sideEffectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    sideEffectSymptom: {
      fontSize: 14,
      fontWeight: '500',
    },
    severityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    severityText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
    },
    sideEffectDetails: {
      fontSize: 12,
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
      maxHeight: '85%',
      marginTop: 'auto',
      marginBottom: 'auto',
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
      color: '#ffffff',
      fontSize: 14,
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    pickerButton: {
      backgroundColor: getCardBackgroundColor() + '80',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    pickerText: {
      color: '#ffffff',
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
      borderWidth: 1.5,
      borderColor: currentTheme.accent,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    modalButtonTextPrimary: {
      color: '#ffffff',
    },
    modalButtonTextSecondary: {
      color: '#ffffff',
    },
    // Health Report Modal Styles
    reportContent: {
      marginVertical: 16,
    },
    reportSection: {
      marginBottom: 16,
    },
    reportSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: getCardTextColor(),
    },
    reportText: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 4,
      color: getCardTextColor(),
    },
    // Multiple Metrics Modal Styles
    modalScrollView: {
      maxHeight: 400,
      marginBottom: 16,
    },
    metricEntry: {
      backgroundColor: getCardBackgroundColor() + '40',
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    metricEntryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    metricEntryTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: getCardTextColor(),
    },
    removeMetricButton: {
      backgroundColor: '#ef4444' + 'CC',
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeMetricButtonText: {
      fontSize: 12,
      color: '#ffffff',
      fontWeight: 'bold',
    },
    addAnotherButton: {
      backgroundColor: currentTheme.accent + '20',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: currentTheme.accent + '40',
      borderStyle: 'dashed',
    },
    addAnotherButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.accent,
    },
    addAnotherButtonTop: {
      backgroundColor: currentTheme.accent + '30',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 2,
      borderColor: currentTheme.accent + '60',
    },
    addAnotherButtonTextTop: {
      fontSize: 16,
      fontWeight: '700',
      color: currentTheme.accent,
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
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    statLabel: {
      fontSize: 12,
      marginTop: 4,
    },
  });
  
  const dynamicStyles = getDynamicStyles();
  // Simplified state - no external service
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [adherence, setAdherence] = useState<MedicationAdherence[]>([]);
  const [sideEffects, setSideEffects] = useState<SideEffect[]>([]);
  const [overallAdherence, setOverallAdherence] = useState(0);
  const [showAddMetricModal, setShowAddMetricModal] = useState(false);
  const [showAddSideEffectModal, setShowAddSideEffectModal] = useState(false);
  const [showHealthReportModal, setShowHealthReportModal] = useState(false);
  const [showMetricsHistoryModal, setShowMetricsHistoryModal] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showMetricTypeDropdown, setShowMetricTypeDropdown] = useState(false);
  const [currentMetricId, setCurrentMetricId] = useState<string>('');
  const [healthReportData, setHealthReportData] = useState<any>(null);
  const [selectedMetricType, setSelectedMetricType] = useState<MetricType>('blood_pressure');
  const [metricValue, setMetricValue] = useState('');
  const [metricNotes, setMetricNotes] = useState('');
  const [multipleMetrics, setMultipleMetrics] = useState<Array<{
    id: string;
    type: MetricType;
    value: string;
    unit?: string;      // Custom unit (for weight, temperature, etc.)
    systolic?: string;  // For blood pressure
    diastolic?: string; // For blood pressure
    notes: string;
  }>>([{ id: '1', type: 'blood_pressure', value: '', systolic: '', diastolic: '', notes: '' }]);
  const [sideEffectSymptom, setSideEffectSymptom] = useState('');
  const [sideEffectSeverity, setSideEffectSeverity] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [sideEffectNotes, setSideEffectNotes] = useState('');
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState({ title: '', message: '', type: 'success' as 'success' | 'error' });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showSeverityModal, setShowSeverityModal] = useState(false);
  const [currentSeverityEffectId, setCurrentSeverityEffectId] = useState<string>('');
  const [multipleSideEffects, setMultipleSideEffects] = useState<Array<{
    id: string;
    symptom: string;
    severity: 1 | 2 | 3 | 4 | 5;
    notes: string;
  }>>([{ id: '1', symptom: '', severity: 1, notes: '' }]);
  
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
  
  // Custom alert helper
  const showCustomAlertMsg = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setCustomAlertMessage({ title, message, type });
    setShowCustomAlert(true);
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowCustomAlert(false);
    }, 3000);
  };

  // Load health data from storage
  const loadHealthData = async () => {
    try {
      console.log('📊 Loading health data from storage...');
      const [savedMetrics, savedAdherence, savedSideEffects] = await Promise.all([
        AsyncStorage.getItem('health_metrics'),
        AsyncStorage.getItem('medication_adherence'),
        AsyncStorage.getItem('side_effects')
      ]);
      
      if (savedMetrics) {
        const parsed = JSON.parse(savedMetrics);
        setMetrics(parsed);
        console.log('✅ Loaded', parsed.length, 'health metrics');
      }
      
      if (savedAdherence) {
        const parsed = JSON.parse(savedAdherence);
        setAdherence(parsed);
        console.log('✅ Loaded', parsed.length, 'adherence records');
      }
      
      if (savedSideEffects) {
        const parsed = JSON.parse(savedSideEffects);
        setSideEffects(parsed);
        console.log('✅ Loaded', parsed.length, 'side effects');
      }
    } catch (error) {
      console.error('❌ Failed to load health data:', error);
    }
  };

  // Save health data to storage
  const saveHealthData = async () => {
    try {
      console.log('💾 Saving health data to storage...');
      await Promise.all([
        AsyncStorage.setItem('health_metrics', JSON.stringify(metrics)),
        AsyncStorage.setItem('medication_adherence', JSON.stringify(adherence)),
        AsyncStorage.setItem('side_effects', JSON.stringify(sideEffects))
      ]);
      console.log('✅ Health data saved successfully');
    } catch (error) {
      console.error('❌ Failed to save health data:', error);
    }
  };

  const metricTypes: { value: MetricType; label: string; unit: string; icon: string; alternateUnits?: string[] }[] = [
    { value: 'blood_pressure', label: t("healthAnalytics.bloodPressure"), unit: 'mmHg', icon: '🩸' },
    { value: 'weight', label: t("healthAnalytics.weight"), unit: 'kg', icon: '⚖️', alternateUnits: ['kg', 'lbs'] },
    { value: 'blood_sugar', label: t("healthAnalytics.bloodSugar"), unit: 'mg/dL', icon: '🍯' },
    { value: 'heart_rate', label: t("healthAnalytics.heartRate"), unit: 'bpm', icon: '❤️' },
    { value: 'temperature', label: t("healthAnalytics.temperature"), unit: '°C', icon: '🌡️', alternateUnits: ['°C', '°F'] },
    { value: 'oxygen_saturation', label: t("healthAnalytics.oxygenSaturation"), unit: '%', icon: '🫁' },
    { value: 'pain_level', label: t("healthAnalytics.painLevel"), unit: '/10', icon: '😣' },
    { value: 'mood', label: t("healthAnalytics.mood"), unit: '/5', icon: '😊' },
    { value: 'energy_level', label: t("healthAnalytics.energyLevel"), unit: '/5', icon: '⚡' },
    { value: 'sleep_hours', label: t("healthAnalytics.sleepHours"), unit: 'hours', icon: '😴' },
    { value: 'steps', label: t("healthAnalytics.steps"), unit: 'steps', icon: '👟' },
  ];

  // Load health data from AsyncStorage on mount
  useEffect(() => {
    const initData = async () => {
      await loadHealthData();
      setIsInitialLoad(false);
    };
    initData();
    
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

  // Save health data to AsyncStorage whenever it changes (skip initial load)
  useEffect(() => {
    if (!isInitialLoad) {
      saveHealthData();
    }
  }, [metrics, adherence, sideEffects, isInitialLoad]);

  const addMetric = async () => {
    if (!metricValue) {
      showCustomAlertMsg(t("healthAnalytics.error"), t("healthAnalytics.pleaseEnterValue"), 'error');
      return;
    }

    try {
      const value = parseFloat(metricValue);
      if (isNaN(value)) {
        showCustomAlertMsg(t("healthAnalytics.error"), t("healthAnalytics.pleaseEnterValidNumber"), 'error');
        return;
      }

      const selectedType = metricTypes.find(t => t.value === selectedMetricType);
      
      // Simplified metric addition - create mock data
      const newMetric: HealthMetric = {
        id: `metric_${Date.now()}`,
        type: selectedMetricType,
        value,
        unit: selectedType?.unit || '',
        timestamp: new Date().toISOString(),
        notes: metricNotes || undefined
      };

      setMetrics(prev => [newMetric, ...prev]);
      setMetricValue('');
      setMetricNotes('');
      setShowAddMetricModal(false);
      triggerHaptic('medium');
      showCustomAlertMsg(t("healthAnalytics.success"), t("healthAnalytics.healthMetricAdded"), 'success');
    } catch (error) {
      console.error('Failed to add metric:', error);
      showCustomAlertMsg(t("healthAnalytics.error"), t("healthAnalytics.failedToAddHealthMetric"), 'error');
    }
  };

  const addMultipleMetrics = async () => {
    // Validate all metrics
    const validMetrics = multipleMetrics.filter(metric => {
      if (metric.type === 'blood_pressure') {
        return metric.systolic?.trim() && metric.diastolic?.trim();
      }
      return metric.value.trim();
    });
    
    if (validMetrics.length === 0) {
      showCustomAlertMsg(t("healthAnalytics.error"), t("healthAnalytics.pleaseEnterValue"), 'error');
      return;
    }

    try {
      const newMetrics: HealthMetric[] = validMetrics.map(metric => {
        let value: number;
        
        // Special handling for blood pressure
        if (metric.type === 'blood_pressure') {
          const systolic = parseFloat(metric.systolic || '0');
          const diastolic = parseFloat(metric.diastolic || '0');
          if (isNaN(systolic) || isNaN(diastolic)) {
            throw new Error(uiI18n.t("ui.invalidBloodPressureValues"));
          }
          // Store as "systolic/diastolic" format, but use systolic as the numeric value for sorting
          value = systolic;
        } else {
          value = parseFloat(metric.value);
          if (isNaN(value)) {
            throw new Error(uiI18n.t("ui.invalidValue"));
          }
        }
        
        const selectedType = metricTypes.find(t => t.value === metric.type);
        return {
          id: `metric_${Date.now()}_${Math.random()}`,
          type: metric.type,
          value,
          unit: metric.unit || selectedType?.unit || '', // Use custom unit if provided
          timestamp: new Date().toISOString(),
          notes: metric.notes.trim() || undefined,
          // Store systolic/diastolic for blood pressure
          ...(metric.type === 'blood_pressure' && {
            systolic: metric.systolic,
            diastolic: metric.diastolic
          })
        };
      });

      setMetrics(prev => [...newMetrics, ...prev]);
      setMultipleMetrics([{ id: '1', type: 'blood_pressure', value: '', systolic: '', diastolic: '', notes: '' }]);
      setShowAddMetricModal(false);
      triggerHaptic('medium');
      showCustomAlertMsg(t("healthAnalytics.success"), `${validMetrics.length} ${t("healthAnalytics.healthMetricsAdded")}`, 'success');
    } catch (error) {
      console.error('Failed to add metrics:', error);
      showCustomAlertMsg(t("healthAnalytics.error"), t("healthAnalytics.failedToAddHealthMetric"), 'error');
    }
  };

  const addNewMetricEntry = () => {
    const newId = (multipleMetrics.length + 1).toString();
    setMultipleMetrics(prev => [...prev, { id: newId, type: 'blood_pressure', value: '', systolic: '', diastolic: '', notes: '' }]);
    triggerHaptic('light');
  };

  const removeMetricEntry = (id: string) => {
    if (multipleMetrics.length > 1) {
      setMultipleMetrics(prev => prev.filter(metric => metric.id !== id));
      triggerHaptic('light');
    }
  };

  const updateMetricEntry = (id: string, field: 'type' | 'value' | 'notes' | 'systolic' | 'diastolic' | 'unit', value: string | MetricType) => {
    setMultipleMetrics(prev => prev.map(metric => 
      metric.id === id ? { ...metric, [field]: value } : metric
    ));
  };

  const addSideEffect = async () => {
    if (!sideEffectSymptom) {
      showCustomAlertMsg(t("healthAnalytics.error"), t("healthAnalytics.pleaseEnterSymptom"), 'error');
      return;
    }

    try {
      // Simplified side effect addition - create mock data
      const newSideEffect: SideEffect = {
        id: `side_effect_${Date.now()}`,
        medicationId: 'general',
        medicationName: uiI18n.t("ui.general"),
        effect: sideEffectSymptom,
        severity: sideEffectSeverity === 1 ? 'mild' : sideEffectSeverity === 2 ? 'moderate' : 'severe',
        duration: 0,
        notes: sideEffectNotes || undefined,
        reportedAt: new Date().toISOString()
      };

      setSideEffects(prev => [newSideEffect, ...prev]);
      setSideEffectSymptom('');
      setSideEffectNotes('');
      setSideEffectSeverity(1);
      setShowAddSideEffectModal(false);
      triggerHaptic('medium');
      showCustomAlertMsg(t("healthAnalytics.success"), t("healthAnalytics.sideEffectRecorded"), 'success');
    } catch (error) {
      console.error('Failed to add side effect:', error);
      showCustomAlertMsg(t("healthAnalytics.error"), t("healthAnalytics.failedToRecordSideEffect"), 'error');
    }
  };

  const addMultipleSideEffects = async () => {
    // Validate all side effects
    const validSideEffects = multipleSideEffects.filter(effect => effect.symptom.trim());
    if (validSideEffects.length === 0) {
      showCustomAlertMsg(t("healthAnalytics.error"), t("healthAnalytics.pleaseEnterSymptom"), 'error');
      return;
    }

    try {
      const newSideEffects: SideEffect[] = validSideEffects.map(effect => ({
        id: `side_effect_${Date.now()}_${Math.random()}`,
        medicationId: 'general',
        medicationName: uiI18n.t("ui.general"),
        effect: effect.symptom,
        severity: effect.severity === 1 ? 'mild' : effect.severity === 2 ? 'moderate' : 'severe',
        duration: 0,
        notes: effect.notes.trim() || undefined,
        reportedAt: new Date().toISOString()
      }));

      setSideEffects(prev => [...newSideEffects, ...prev]);
      setMultipleSideEffects([{ id: '1', symptom: '', severity: 1, notes: '' }]);
      setShowAddSideEffectModal(false);
      triggerHaptic('medium');
      showCustomAlertMsg(t("healthAnalytics.success"), `${validSideEffects.length} ${t("healthAnalytics.sideEffectsRecorded")}`, 'success');
    } catch (error) {
      console.error('Failed to add side effects:', error);
      showCustomAlertMsg(t("healthAnalytics.error"), t("healthAnalytics.failedToRecordSideEffect"), 'error');
    }
  };

  const addNewSideEffectEntry = () => {
    const newId = (multipleSideEffects.length + 1).toString();
    setMultipleSideEffects(prev => [...prev, { id: newId, symptom: '', severity: 1, notes: '' }]);
    triggerHaptic('light');
  };

  const removeSideEffectEntry = (id: string) => {
    if (multipleSideEffects.length > 1) {
      setMultipleSideEffects(prev => prev.filter(effect => effect.id !== id));
      triggerHaptic('light');
    }
  };

  const updateSideEffectEntry = (id: string, field: 'symptom' | 'severity' | 'notes', value: string | number) => {
    setMultipleSideEffects(prev => prev.map(effect => 
      effect.id === id ? { ...effect, [field]: value } : effect
    ));
  };

  const exportMetricsToPDF = async () => {
    if (metrics.length === 0) {
      showCustomAlertMsg(
        t("healthAnalytics.noMetricsToExport") || uiI18n.t("healthAnalytics.noMetricsToExport"),
        t("healthAnalytics.noMetricsMessage") || uiI18n.t("ui.thereAreNoHealthMetricsToExport"),
        'error'
      );
      return;
    }
    
    try {
      const currentDate = new Date().toLocaleDateString();
      
      // Create HTML content for PDF
      const metricsHtml = metrics.map((metric, index) => {
        const metricType = metricTypes.find(mt => mt.value === metric.type);
        const displayValue = metric.type === 'blood_pressure' && metric.systolic && metric.diastolic
          ? `${metric.systolic}/${metric.diastolic} ${metric.unit || ''}`
          : `${metric.value} ${metric.unit || ''}`;
        
        return `
          <div class="metric-item">
            <h3>${index + 1}. ${metricType?.icon || ''} ${metricType?.label || metric.type}</h3>
            <p><strong>${t("healthAnalytics.value")}:</strong> ${displayValue}</p>
            <p><strong>${t("ai.date")}:</strong> ${new Date(metric.timestamp).toLocaleDateString()} ${new Date(metric.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            ${metric.notes ? `<p><strong>${t("ai.notes")}:</strong> ${metric.notes}</p>` : ''}
          </div>
        `;
      }).join('');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${t("healthAnalytics.healthMetrics") || uiI18n.t("healthAnalytics.healthMetrics")}</title>
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
                border-bottom: 2px solid #D4AF37;
                padding-bottom: 20px;
              }
              .title {
                color: #D4AF37;
                font-size: 24px;
                font-weight: bold;
                margin: 0;
              }
              .subtitle {
                color: #6B7280;
                font-size: 16px;
                margin: 5px 0 0 0;
              }
              .metric-item { 
                background: #f8f9fa; 
                padding: 15px; 
                margin: 10px 0; 
                border-radius: 5px; 
                border-left: 4px solid #D4AF37;
              }
              .metric-item h3 {
                margin-top: 0;
                color: #000000;
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
              <h1 class="title">${t("healthAnalytics.healthMetrics") || uiI18n.t("healthAnalytics.healthMetrics")}</h1>
              <p class="subtitle">${t("ai.generatedOn") || uiI18n.t("ai.generatedOn")} ${currentDate}</p>
              <p class="subtitle">${t("healthAnalytics.totalMetrics") || uiI18n.t("ui.totalMetrics")}: ${metrics.length}</p>
            </div>

            ${metricsHtml}

            <div class="footer">
              <p>AuricRx - ${t("healthAnalytics.healthMetrics") || uiI18n.t("healthAnalytics.healthMetrics")}</p>
              <p>${t("ai.consultHealthcareProvider") || uiI18n.t("ui.pleaseConsultYourHealthcareProviderForMedicalAdvice")}</p>
            </div>
          </body>
        </html>
      `;
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Share PDF with timeout to prevent app hang
      try {
        await Promise.race([
          Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: t("healthAnalytics.healthMetrics") || uiI18n.t("healthAnalytics.healthMetrics"),
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
      
      triggerHaptic('medium');
      showCustomAlertMsg(
        t("ai.exportSuccessful") || uiI18n.t("ai.exportSuccessful"),
        t("healthAnalytics.healthReportGenerated") || uiI18n.t("ai.healthReportGenerated"),
        'success'
      );
    } catch (error) {
      console.error('Error exporting metrics:', error);
      showCustomAlertMsg(
        t("ai.exportFailed") || uiI18n.t("ai.exportFailed"),
        t("healthAnalytics.failedToExportMetrics") || uiI18n.t("ui.failedToExportHealthMetricsPleaseTryAgain"),
        'error'
      );
    }
  };

  const getSeverityColor = (severity: string | number) => {
    // Handle string severity (SideEffect.medicationName)
    if (typeof severity === 'string') {
      switch (severity) {
        case 'mild': return '#10b981'; // green
        case 'moderate': return '#f59e0b'; // yellow
        case 'severe': return '#ef4444'; // red
        default: return '#6b7280'; // gray
      }
    }
    // Handle number severity (from multiple side effects form)
    switch (severity) {
      case 1: return '#10b981'; // green
      case 2: return '#f59e0b'; // yellow
      case 3: return '#f97316'; // orange
      case 4: return '#ef4444'; // red
      case 5: return '#dc2626'; // dark red
      default: return '#6b7280'; // gray
    }
  };

  const getSeverityLabel = (severity: string | number) => {
    // Handle string severity (SideEffect.medicationName)
    if (typeof severity === 'string') {
      switch (severity) {
        case 'mild': return t("healthAnalytics.mild");
        case 'moderate': return t("healthAnalytics.moderate");
        case 'severe': return t("healthAnalytics.severe");
        default: return t("healthAnalytics.unknown");
      }
    }
    // Handle number severity (from multiple side effects form)
    switch (severity) {
      case 1: return t("healthAnalytics.mild");
      case 2: return t("healthAnalytics.moderate");
      case 3: return t("healthAnalytics.moderateSevere");
      case 4: return t("healthAnalytics.severe");
      case 5: return t("healthAnalytics.verySevere");
      default: return t("healthAnalytics.unknown");
    }
  };

  const renderStatsOverview = () => (
    <Animated.View 
      style={[
        dynamicStyles.sectionCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image 
          source={require('../../assets/dashboard Emojies/med stats emoji.png')} 
          style={{ width: 20, height: 20, marginRight: 8 }}
        />
        <DynamicText type="primary" style={dynamicStyles.sectionTitle}>{t("healthAnalytics.healthOverview")}</DynamicText>
      </View>
      
      <View style={dynamicStyles.statsGrid}>
        <View style={dynamicStyles.statCard}>
          <DynamicText type="card" style={dynamicStyles.statValue}>{metrics.length}</DynamicText>
          <DynamicText type="card" style={dynamicStyles.statLabel}>{t("healthAnalytics.metricsRecorded")}</DynamicText>
        </View>
        <View style={dynamicStyles.statCard}>
          <DynamicText type="card" style={dynamicStyles.statValue}>{overallAdherence.toFixed(0)}%</DynamicText>
          <DynamicText type="card" style={dynamicStyles.statLabel}>{t("healthAnalytics.adherenceRate")}</DynamicText>
        </View>
        <View style={dynamicStyles.statCard}>
          <DynamicText type="card" style={dynamicStyles.statValue}>{sideEffects.length}</DynamicText>
          <DynamicText type="card" style={dynamicStyles.statLabel}>{t("healthAnalytics.sideEffects")}</DynamicText>
        </View>
        <View style={dynamicStyles.statCard}>
          <DynamicText type="card" style={dynamicStyles.statValue}>{adherence.length}</DynamicText>
          <DynamicText type="card" style={dynamicStyles.statLabel}>{t("healthAnalytics.medications")}</DynamicText>
        </View>
      </View>
    </Animated.View>
  );

  const renderRecentMetrics = () => (
    <Animated.View 
      style={[
        dynamicStyles.sectionCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <DynamicText type="primary" style={dynamicStyles.sectionTitle}>📈 {t("healthAnalytics.recentHealthMetrics")}</DynamicText>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {t("healthAnalytics.trackVitalSigns")}
      </DynamicText>
      
      {metrics.slice(0, 5).map(metric => {
        const metricType = metricTypes.find(t => t.value === metric.type);
        return (
          <View key={metric.id} style={dynamicStyles.metricCard}>
            <View style={dynamicStyles.metricInfo}>
              <DynamicText type="card" style={dynamicStyles.metricName}>
                {metricType?.icon} {metricType?.label}
              </DynamicText>
              <DynamicText type="card" style={dynamicStyles.metricValue}>
                {metric.type === uiI18n.t("healthAnalytics.bloodPressure") && metric.systolic && metric.diastolic
                  ? `${metric.systolic}/${metric.diastolic} ${metric.unit}`
                  : `${metric.value} ${metric.unit}`}
              </DynamicText>
              <DynamicText type="card" style={dynamicStyles.metricDate}>
                {new Date(metric.timestamp).toLocaleDateString()}
              </DynamicText>
            </View>
          </View>
        );
      })}
      
      {metrics.length === 0 && (
        <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          {t("healthAnalytics.noHealthMetrics")}
        </DynamicText>
      )}
      
      <TouchableOpacity
        style={dynamicStyles.addButton}
        onPress={() => setShowAddMetricModal(true)}
      >
        <DynamicText type="card" style={dynamicStyles.addButtonText}>+ {t("healthAnalytics.addHealthMetric")}</DynamicText>
      </TouchableOpacity>
      
      {metrics.length > 0 && (
        <TouchableOpacity
          style={[dynamicStyles.addButton, { backgroundColor: '#D4AF37', marginTop: 8 }]}
          onPress={() => setShowMetricsHistoryModal(true)}
        >
          <DynamicText type="card" style={[dynamicStyles.addButtonText, { color: '#ffffff' }]}>
            {t("healthAnalytics.viewAllMetrics") || uiI18n.t("healthAnalytics.viewAllMetrics")}
          </DynamicText>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  const renderMedicationAdherence = () => (
    <Animated.View 
      style={[
        dynamicStyles.sectionCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image 
          source={require('../../assets/dashboard Emojies/standard pill emoji.png')} 
          style={{ width: 20, height: 20, marginRight: 8 }}
        />
        <DynamicText type="primary" style={dynamicStyles.sectionTitle}>{t("healthAnalytics.medicationAdherence")}</DynamicText>
      </View>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {t("healthAnalytics.trackMedicationSchedule")}
      </DynamicText>
      
      {Array.from(adherence.reduce((groups, dose) => {
        const summary = groups.get(dose.medicationId) ?? {
          medicationId: dose.medicationId, medicationName: dose.medicationName,
          takenDoses: 0, missedDoses: 0, totalDoses: 0,
        };
        summary.totalDoses++;
        if (dose.taken) summary.takenDoses++;
        else summary.missedDoses++;
        groups.set(dose.medicationId, summary);
        return groups;
      }, new Map<string, { medicationId: string; medicationName: string; takenDoses: number; missedDoses: number; totalDoses: number }>()).values()).map(med => (
        <View key={med.medicationId} style={dynamicStyles.adherenceCard}>
          <View style={dynamicStyles.adherenceHeader}>
            <DynamicText type="card" style={dynamicStyles.adherenceName}>{med.medicationName}</DynamicText>
            <DynamicText type="card" style={dynamicStyles.adherenceRate}>{(100 * med.takenDoses / med.totalDoses).toFixed(0)}%</DynamicText>
          </View>
          <DynamicText type="card" style={dynamicStyles.adherenceDetails}>
            {med.takenDoses} {t("healthAnalytics.taken")} • {med.missedDoses} {t("healthAnalytics.missed")}
          </DynamicText>
        </View>
      ))}
      
      {adherence.length === 0 && (
        <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          {t("healthAnalytics.noAdherenceData")}
        </DynamicText>
      )}
    </Animated.View>
  );

  const renderSideEffects = () => (
    <Animated.View 
      style={[
        dynamicStyles.sectionCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image 
          source={require('../../assets/dashboard Emojies/warning sign emoji.png')} 
          style={{ width: 20, height: 20, marginRight: 8 }}
        />
        <DynamicText type="primary" style={dynamicStyles.sectionTitle}>{t("healthAnalytics.sideEffectsMonitoring")}</DynamicText>
      </View>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {t("healthAnalytics.trackSideEffects")}
      </DynamicText>
      
      {sideEffects.slice(0, 5).map(sideEffect => (
        <View key={sideEffect.id} style={dynamicStyles.sideEffectCard}>
          <View style={dynamicStyles.sideEffectHeader}>
            <DynamicText type="card" style={dynamicStyles.sideEffectSymptom}>{sideEffect.effect}</DynamicText>
            <View style={[
              dynamicStyles.severityBadge,
              { backgroundColor: getSeverityColor(sideEffect.severity) }
            ]}>
              <DynamicText type="card" style={dynamicStyles.severityText}>
                {getSeverityLabel(sideEffect.severity)}
              </DynamicText>
            </View>
          </View>
          <DynamicText type="card" style={dynamicStyles.sideEffectDetails}>
            {sideEffect.medicationName} • {t("healthAnalytics.started")} {new Date(sideEffect.reportedAt).toLocaleDateString()}
            {sideEffect.notes && uiI18n.t("healthAnalytics.value", { value1: sideEffect.notes })}
          </DynamicText>
        </View>
      ))}
      
      {sideEffects.length === 0 && (
        <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          {t("healthAnalytics.noSideEffectsRecorded")}
        </DynamicText>
      )}
      
      <TouchableOpacity
        style={dynamicStyles.addButton}
        onPress={() => setShowAddSideEffectModal(true)}
      >
        <DynamicText type="card" style={dynamicStyles.addButtonText}>+ {t("healthAnalytics.recordSideEffect")}</DynamicText>
      </TouchableOpacity>
    </Animated.View>
  );

  // Simplified Health Analytics - no external service needed

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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Image 
                source={require('../../assets/dashboard Emojies/med stats emoji.png')} 
                style={{ width: 24, height: 24, marginRight: 8 }}
              />
              <DynamicText type="primary" style={styles.title}>
                {t("healthAnalytics.healthAnalytics")}
              </DynamicText>
            </View>
            <DynamicText type="secondary" style={styles.subtitle}>
              {t("healthAnalytics.trackHealthMetrics")}
            </DynamicText>
          </Animated.View>

          {/* Stats Overview */}
          {renderStatsOverview()}

          {/* Recent Metrics */}
          {renderRecentMetrics()}

          {/* Medication Adherence */}
          {renderMedicationAdherence()}

          {/* Side Effects */}
          {renderSideEffects()}
        </ScrollView>
      </View>

      {/* Add Metric Modal */}
      <Modal
        visible={showAddMetricModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMetricModal(false)}
      >
        <KeyboardForm><View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>📈 {t("healthAnalytics.addHealthMetric")}</DynamicText>
            
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} 
              style={dynamicStyles.modalScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {multipleMetrics.map((metric, index) => (
                <View key={metric.id} style={dynamicStyles.metricEntry}>
                  <View style={dynamicStyles.metricEntryHeader}>
                    <DynamicText type="card" style={dynamicStyles.metricEntryTitle}>
                      {t("healthAnalytics.addHealthMetric").replace(uiI18n.t("medications.add"), '')} {index + 1}
                    </DynamicText>
                    {multipleMetrics.length > 1 && (
                      <TouchableOpacity
                        style={dynamicStyles.removeMetricButton}
                        onPress={() => removeMetricEntry(metric.id)}
                      >
                        <DynamicText type="card" style={dynamicStyles.removeMetricButtonText}>✕</DynamicText>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={dynamicStyles.inputGroup}>
                    <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("healthAnalytics.metricType")}</DynamicText>
                    <TouchableOpacity
                      style={dynamicStyles.pickerButton}
                      onPress={() => {
                        setCurrentMetricId(metric.id);
                        setShowMetricTypeDropdown(true);
                      }}
                    >
                      <DynamicText type="card" style={dynamicStyles.pickerText}>
                        {metricTypes.find(t => t.value === metric.type)?.icon} {metricTypes.find(t => t.value === metric.type)?.label}
                      </DynamicText>
                      <DynamicText type="card" style={dynamicStyles.pickerText}>▼</DynamicText>
                    </TouchableOpacity>
                  </View>

                  {metric.type === uiI18n.t("healthAnalytics.bloodPressure") ? (
                    <>
                      <View style={dynamicStyles.inputGroup}>
                        <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("healthAnalytics.systolic") || uiI18n.t("healthAnalytics.systolic")}</DynamicText>
                        <TextInput
                          style={dynamicStyles.textInput}
                          placeholder={t("healthAnalytics.enterSystolic") || uiI18n.t("healthAnalytics.enterSystolic")}
                          placeholderTextColor="#ffffff80"
                          value={metric.systolic || ''}
                          onChangeText={(value) => updateMetricEntry(metric.id, 'systolic', value)}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={dynamicStyles.inputGroup}>
                        <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("healthAnalytics.diastolic") || uiI18n.t("healthAnalytics.diastolic")}</DynamicText>
                        <TextInput
                          style={dynamicStyles.textInput}
                          placeholder={t("healthAnalytics.enterDiastolic") || uiI18n.t("healthAnalytics.enterDiastolic")}
                          placeholderTextColor="#ffffff80"
                          value={metric.diastolic || ''}
                          onChangeText={(value) => updateMetricEntry(metric.id, 'diastolic', value)}
                          keyboardType="numeric"
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={dynamicStyles.inputGroup}>
                        <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("healthAnalytics.value")}</DynamicText>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                          <TextInput
                            style={[dynamicStyles.textInput, { flex: 1 }]}
                            placeholder={t("healthAnalytics.enterValue")}
                            placeholderTextColor="#ffffff80"
                            value={metric.value}
                            onChangeText={(value) => updateMetricEntry(metric.id, 'value', value)}
                            keyboardType="numeric"
                          />
                 {(() => {
                   const currentMetricType = metricTypes.find(mt => mt.value === metric.type);
                   if (currentMetricType?.alternateUnits && currentMetricType.alternateUnits.length > 0) {
                     const selectedUnit = metric.unit || currentMetricType.unit;
                     return (
                       <TouchableOpacity
                         onPress={() => {
                           setCurrentMetricId(metric.id);
                           setShowUnitDropdown(true);
                         }}
                         style={{
                           backgroundColor: getCardBackgroundColor(),
                           borderRadius: 8,
                           paddingHorizontal: 16,
                           paddingVertical: 12,
                           borderWidth: 1,
                           borderColor: getCardBorderColor(),
                           minWidth: 80,
                           flexDirection: 'row',
                           alignItems: 'center',
                           justifyContent: 'space-between'
                         }}
                       >
                         <DynamicText type="card" style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold' }}>
                           {selectedUnit}
                         </DynamicText>
                         <DynamicText type="card" style={{ fontSize: 12, marginLeft: 8 }}>
                           ▼
                         </DynamicText>
                       </TouchableOpacity>
                     );
                   }
                   return null;
                 })()}
                        </View>
                      </View>
                    </>
                  )}

                  <View style={dynamicStyles.inputGroup}>
                    <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("healthAnalytics.notesOptional")}</DynamicText>
                    <TextInput
                      style={[dynamicStyles.textInput, { height: 60, textAlignVertical: 'top' }]}
                      placeholder={t("healthAnalytics.addAnyNotes")}
                      placeholderTextColor="#ffffff80"
                      value={metric.notes}
                      onChangeText={(value) => updateMetricEntry(metric.id, 'notes', value)}
                      multiline
                    />
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={dynamicStyles.addAnotherButton}
                onPress={addNewMetricEntry}
              >
                <DynamicText type="card" style={dynamicStyles.addAnotherButtonText}>+ {t("common.add")}</DynamicText>
              </TouchableOpacity>
            </ScrollView>

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => {
                  setShowAddMetricModal(false);
                  setMultipleMetrics([{ id: '1', type: 'blood_pressure', value: '', systolic: '', diastolic: '', notes: '' }]);
                }}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{t("healthAnalytics.cancel")}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={addMultipleMetrics}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>{t("healthAnalytics.ok")}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View></KeyboardForm>
      </Modal>

      {/* Add Side Effect Modal */}
      <Modal
        visible={showAddSideEffectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddSideEffectModal(false)}
      >
        <KeyboardForm><View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image 
                source={require('../../assets/dashboard Emojies/warning sign emoji.png')} 
                style={{ width: 24, height: 24, marginRight: 8 }}
              />
              <DynamicText type="primary" style={dynamicStyles.modalTitle}>{t("healthAnalytics.recordSideEffect")}</DynamicText>
            </View>
            
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} 
              style={dynamicStyles.modalScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {multipleSideEffects.map((effect, index) => (
                <View key={effect.id} style={dynamicStyles.metricEntry}>
                  <View style={dynamicStyles.metricEntryHeader}>
                    <DynamicText type="card" style={dynamicStyles.metricEntryTitle}>
                      {t("healthAnalytics.recordSideEffect").replace(uiI18n.t("appointments.record"), '')} {index + 1}
                    </DynamicText>
                    {multipleSideEffects.length > 1 && (
                      <TouchableOpacity
                        style={dynamicStyles.removeMetricButton}
                        onPress={() => removeSideEffectEntry(effect.id)}
                      >
                        <DynamicText type="card" style={dynamicStyles.removeMetricButtonText}>✕</DynamicText>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={dynamicStyles.inputGroup}>
                    <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("healthAnalytics.symptom")}</DynamicText>
                    <TextInput
                      style={dynamicStyles.textInput}
                      placeholder={t("healthAnalytics.symptomPlaceholder")}
                      placeholderTextColor="#ffffff80"
                      value={effect.symptom}
                      onChangeText={(value) => updateSideEffectEntry(effect.id, 'symptom', value)}
                    />
                  </View>

                  <View style={dynamicStyles.inputGroup}>
                    <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("healthAnalytics.severity")}</DynamicText>
                    <TouchableOpacity
                      style={dynamicStyles.pickerButton}
                      onPress={() => {
                        setCurrentSeverityEffectId(effect.id);
                        setShowSeverityModal(true);
                      }}
                    >
                      <DynamicText type="card" style={dynamicStyles.pickerText}>
                        {effect.severity} - {getSeverityLabel(effect.severity)}
                      </DynamicText>
                      <DynamicText type="card" style={dynamicStyles.pickerText}>▼</DynamicText>
                    </TouchableOpacity>
                  </View>

                  <View style={dynamicStyles.inputGroup}>
                    <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("healthAnalytics.notesOptional")}</DynamicText>
                    <TextInput
                      style={[dynamicStyles.textInput, { height: 60, textAlignVertical: 'top' }]}
                      placeholder={t("healthAnalytics.addAnyNotes")}
                      placeholderTextColor="#ffffff80"
                      value={effect.notes}
                      onChangeText={(value) => updateSideEffectEntry(effect.id, 'notes', value)}
                      multiline
                    />
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={dynamicStyles.addAnotherButtonTop}
                onPress={addNewSideEffectEntry}
              >
                <DynamicText type="card" style={dynamicStyles.addAnotherButtonTextTop}>+ {t("common.add")}</DynamicText>
              </TouchableOpacity>
            </ScrollView>

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => {
                  setShowAddSideEffectModal(false);
                  setMultipleSideEffects([{ id: '1', symptom: '', severity: 1, notes: '' }]);
                }}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{t("healthAnalytics.cancel")}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={addMultipleSideEffects}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>{t("healthAnalytics.ok")}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View></KeyboardForm>
      </Modal>

      {/* Severity Selection Modal */}
      <Modal
        visible={showSeverityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSeverityModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSeverityModal(false)}
        >
          <View style={[styles.customAlertContainer, {
            backgroundColor: getCardBackgroundColor(),
            borderColor: getCardBorderColor()
          }]}>
            <View style={styles.customAlertContent}>
              <DynamicText type="primary" style={styles.customAlertTitle}>
                {t("healthAnalytics.severity")}
              </DynamicText>
              <View style={styles.severityOptions}>
                <TouchableOpacity
                  style={[styles.severityOption, {
                    backgroundColor: getCardBorderColor()
                  }]}
                  onPress={() => {
                    if (currentSeverityEffectId) {
                      updateSideEffectEntry(currentSeverityEffectId, 'severity', 1);
                    }
                    setShowSeverityModal(false);
                  }}
                >
                  <DynamicText type="card" style={styles.severityOptionText}>
                    1 - {t("healthAnalytics.mild")}
                  </DynamicText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.severityOption, {
                    backgroundColor: getCardBorderColor()
                  }]}
                  onPress={() => {
                    if (currentSeverityEffectId) {
                      updateSideEffectEntry(currentSeverityEffectId, 'severity', 2);
                    }
                    setShowSeverityModal(false);
                  }}
                >
                  <DynamicText type="card" style={styles.severityOptionText}>
                    2 - {t("healthAnalytics.moderate")}
                  </DynamicText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.severityOption, {
                    backgroundColor: getCardBorderColor()
                  }]}
                  onPress={() => {
                    if (currentSeverityEffectId) {
                      updateSideEffectEntry(currentSeverityEffectId, 'severity', 3);
                    }
                    setShowSeverityModal(false);
                  }}
                >
                  <DynamicText type="card" style={styles.severityOptionText}>
                    3 - {t("healthAnalytics.moderateSevere")}
                  </DynamicText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.severityOption, {
                    backgroundColor: getCardBorderColor()
                  }]}
                  onPress={() => {
                    if (currentSeverityEffectId) {
                      updateSideEffectEntry(currentSeverityEffectId, 'severity', 4);
                    }
                    setShowSeverityModal(false);
                  }}
                >
                  <DynamicText type="card" style={styles.severityOptionText}>
                    4 - {t("healthAnalytics.severe")}
                  </DynamicText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.severityOption, {
                    backgroundColor: getCardBorderColor()
                  }]}
                  onPress={() => {
                    if (currentSeverityEffectId) {
                      updateSideEffectEntry(currentSeverityEffectId, 'severity', 5);
                    }
                    setShowSeverityModal(false);
                  }}
                >
                  <DynamicText type="card" style={styles.severityOptionText}>
                    5 - {t("healthAnalytics.verySevere")}
                  </DynamicText>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.customAlertButton, {
                  backgroundColor: getCardBorderColor()
                }]}
                onPress={() => setShowSeverityModal(false)}
              >
                <DynamicText type="card" style={styles.customAlertButtonText}>
                  {t("healthAnalytics.cancel")}
                </DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Health Report Modal */}
      <Modal
        visible={showHealthReportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHealthReportModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image 
                source={require('../../assets/dashboard Emojies/med stats emoji.png')} 
                style={{ width: 24, height: 24, marginRight: 8 }}
              />
              <DynamicText type="primary" style={dynamicStyles.modalTitle}>{t("healthAnalytics.healthReportGenerated")}</DynamicText>
            </View>
            
            {healthReportData && (
              <View style={dynamicStyles.reportContent}>
                <View style={dynamicStyles.reportSection}>
                  <DynamicText type="card" style={dynamicStyles.reportSectionTitle}>{t("healthAnalytics.summary")}</DynamicText>
                  <DynamicText type="card" style={dynamicStyles.reportText}>
                    • {healthReportData.summary.totalMetrics} {t("healthAnalytics.metricsRecorded").toLowerCase()}
                  </DynamicText>
                  <DynamicText type="card" style={dynamicStyles.reportText}>
                    • {healthReportData.summary.adherenceRate.toFixed(1)}% {t("healthAnalytics.adherenceRate").toLowerCase()}
                  </DynamicText>
                  <DynamicText type="card" style={dynamicStyles.reportText}>
                    • {healthReportData.summary.sideEffects} {t("healthAnalytics.sideEffects").toLowerCase()}
                  </DynamicText>
                </View>

                <View style={dynamicStyles.reportSection}>
                  <DynamicText type="card" style={dynamicStyles.reportSectionTitle}>{t("healthAnalytics.keyInsights")}</DynamicText>
                  {healthReportData.summary.keyInsights.slice(0, 3).map((insight: string, index: number) => (
                    <DynamicText key={index} type="card" style={dynamicStyles.reportText}>
                      • {insight}
                    </DynamicText>
                  ))}
                </View>
              </View>
            )}

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={() => setShowHealthReportModal(false)}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>{t("healthAnalytics.ok")}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Metrics History Modal */}
      <Modal
        visible={showMetricsHistoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMetricsHistoryModal(false)}
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
                  {t("healthAnalytics.metricsHistory") || uiI18n.t("healthAnalytics.metricsHistory")}
                </DynamicText>
              </View>
              <TouchableOpacity
                onPress={() => setShowMetricsHistoryModal(false)}
                style={{ position: 'absolute', right: 0, top: 0, padding: 8 }}
              >
                <DynamicText type="primary" style={{ fontSize: 24 }}>×</DynamicText>
              </TouchableOpacity>
            </View>

            <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { marginBottom: 12 }]}>
              {t("healthAnalytics.totalMetrics") || uiI18n.t("healthAnalytics.totalMetrics")}: {metrics.length}
            </DynamicText>

            <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 1, flexShrink: 1, maxHeight: '60%' }} contentContainerStyle={[{ paddingBottom: 10 }, { paddingBottom: 24 }]} showsVerticalScrollIndicator={true}>
              {metrics.map((metric) => {
                const metricType = metricTypes.find(mt => mt.value === metric.type);
                return (
                  <View key={metric.id} style={dynamicStyles.metricCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <DynamicText type="card" style={[dynamicStyles.metricType, { marginBottom: 4 }]}>
                          {metricType?.icon} {metricType?.label}
                        </DynamicText>
                        <DynamicText type="card" style={dynamicStyles.metricValue}>
                          {metric.type === uiI18n.t("healthAnalytics.bloodPressure") && metric.systolic && metric.diastolic
                            ? `${metric.systolic}/${metric.diastolic} ${metric.unit}`
                            : `${metric.value} ${metric.unit}`}
                        </DynamicText>
                        <DynamicText type="card" style={dynamicStyles.metricDate}>
                          {new Date(metric.timestamp).toLocaleDateString()} {new Date(metric.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </DynamicText>
                        {metric.notes && (
                          <DynamicText type="card" style={[dynamicStyles.metricDate, { fontStyle: 'italic', marginTop: 4 }]}>
                            {metric.notes}
                          </DynamicText>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}

              {metrics.length === 0 && (
                <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic', marginTop: 20 }]}>
                  {t("healthAnalytics.noHealthMetrics") || uiI18n.t("ui.noMetricsTrackedYet")}
                </DynamicText>
              )}
            </ScrollView>

            {metrics.length > 0 && (
              <View style={[dynamicStyles.modalButtons, { marginTop: 16, flexShrink: 0 }]}>
                <TouchableOpacity
                  style={[
                    dynamicStyles.modalButton, 
                    { 
                      backgroundColor: getCardBackgroundColor(),
                      marginBottom: 8,
                      borderWidth: 1.5,
                      borderColor: '#D4AF37',
                      borderRadius: 6,
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      shadowColor: '#D4AF37',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.25,
                      shadowRadius: 2,
                      elevation: 2,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }
                  ]}
                  onPress={exportMetricsToPDF}
                >
                  <DynamicText type="card" style={{ 
                    fontSize: 13, 
                    fontWeight: '600',
                    fontFamily: 'Inter_600SemiBold',
                    textAlign: 'center',
                    letterSpacing: 0.3,
                    width: '100%'
                  }}>
                    {t("documents.exportPDF") || uiI18n.t("documents.exportPDF")}
                  </DynamicText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    dynamicStyles.modalButton, 
                    dynamicStyles.modalButtonSecondary
                  ]}
                  onPress={() => setShowMetricsHistoryModal(false)}
                >
                  <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>
                    {t("common.close") || uiI18n.t("ai.close")}
                  </DynamicText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Unit Dropdown Modal */}
      <Modal
        visible={showUnitDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnitDropdown(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setShowUnitDropdown(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <TouchableOpacity 
              activeOpacity={1}
              style={{
                backgroundColor: getCardBackgroundColor(),
                borderRadius: 12,
                padding: 16,
                minWidth: 200,
                borderWidth: 1.5,
                borderColor: currentTheme.accent,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5
              }}
            >
              <DynamicText type="card" style={{ 
                fontSize: 16, 
                fontFamily: 'Inter_600SemiBold', 
                marginBottom: 16,
                textAlign: 'center'
              }}>
                {t("healthAnalytics.selectUnit") || uiI18n.t("healthAnalytics.selectUnit")}
              </DynamicText>
              
              {(() => {
                const currentMetric = multipleMetrics.find(m => m.id === currentMetricId);
                if (!currentMetric) return null;
                
                const currentMetricType = metricTypes.find(mt => mt.value === currentMetric.type);
                if (!currentMetricType?.alternateUnits) return null;
                
                return currentMetricType.alternateUnits.map((unit, index) => (
                  <TouchableOpacity
                    key={unit}
                    onPress={() => {
                      updateMetricEntry(currentMetricId, 'unit', unit);
                      setShowUnitDropdown(false);
                    }}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      backgroundColor: (currentMetric.unit || currentMetricType.unit) === unit 
                        ? currentTheme.accent + '20' 
                        : 'transparent',
                      marginBottom: index < currentMetricType.alternateUnits!.length - 1 ? 8 : 0,
                      borderWidth: 1,
                      borderColor: (currentMetric.unit || currentMetricType.unit) === unit 
                        ? currentTheme.accent 
                        : getCardBorderColor()
                    }}
                  >
                    <DynamicText type="card" style={{ 
                      fontSize: 15, 
                      fontFamily: 'Inter_600SemiBold',
                      textAlign: 'center',
                      color: (currentMetric.unit || currentMetricType.unit) === unit 
                        ? currentTheme.accent 
                        : getCardTextColor()
                    }}>
                      {unit}
                    </DynamicText>
                  </TouchableOpacity>
                ));
              })()}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Metric Type Dropdown Modal */}
      <Modal
        visible={showMetricTypeDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMetricTypeDropdown(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}
          activeOpacity={1}
          onPress={() => setShowMetricTypeDropdown(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <TouchableOpacity 
              activeOpacity={1}
              style={{
                backgroundColor: getCardBackgroundColor(),
                borderRadius: 12,
                padding: 20,
                width: '85%',
                maxWidth: 400,
                maxHeight: '70%',
                borderWidth: 1.5,
                borderColor: currentTheme.accent,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 8
              }}
            >
              <DynamicText type="card" style={{ 
                fontSize: 18, 
                fontFamily: 'Inter_600SemiBold', 
                marginBottom: 20,
                textAlign: 'center'
              }}>
                {t("healthAnalytics.selectMetricType") || uiI18n.t("healthAnalytics.selectMetricType")}
              </DynamicText>
              
              <ScrollView keyboardShouldPersistTaps="handled" 
                style={{ maxHeight: '80%' }}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={[{ paddingBottom: 10 }, { paddingBottom: 24 }]}
              >
                {metricTypes.map((type, index) => {
                  const currentMetric = multipleMetrics.find(m => m.id === currentMetricId);
                  const isSelected = currentMetric?.type === type.value;
                  
                  return (
                    <TouchableOpacity
                      key={type.value}
                      onPress={() => {
                        updateMetricEntry(currentMetricId, 'type', type.value);
                        setShowMetricTypeDropdown(false);
                        triggerHaptic('light');
                      }}
                      style={{
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        backgroundColor: isSelected 
                          ? currentTheme.accent + '20' 
                          : 'transparent',
                        marginBottom: index < metricTypes.length - 1 ? 10 : 0,
                        borderWidth: 1,
                        borderColor: isSelected 
                          ? currentTheme.accent 
                          : getCardBorderColor(),
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ fontSize: 24, marginRight: 12 }}>
                        {type.icon}
                      </Text>
                      <DynamicText type="card" style={{ 
                        fontSize: 16, 
                        fontFamily: 'Inter_600SemiBold',
                        color: isSelected 
                          ? currentTheme.accent 
                          : getCardTextColor()
                      }}>
                        {type.label}
                      </DynamicText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                onPress={() => setShowMetricTypeDropdown(false)}
                style={{
                  marginTop: 16,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  backgroundColor: getCardBackgroundColor(),
                  borderWidth: 1.5,
                  borderColor: currentTheme.accent,
                  alignItems: 'center'
                }}
              >
                <DynamicText type="card" style={{ 
                  fontSize: 15, 
                  fontFamily: 'Inter_600SemiBold'
                }}>
                  {t("healthAnalytics.cancel") || uiI18n.t("healthAnalytics.cancel")}
                </DynamicText>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal
        visible={showCustomAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomAlert(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCustomAlert(false)}
        >
          <View style={[styles.customAlertContainer, { 
            backgroundColor: getCardBackgroundColor(), 
            borderColor: getCardBorderColor() 
          }]}>
            <View style={styles.customAlertContent}>
              <View style={[styles.customAlertIcon, { 
                backgroundColor: customAlertMessage.type === 'success' ? '#22c55e' : '#ef4444' 
              }]}>
                <DynamicText type="card" style={styles.customAlertIconText}>
                  {customAlertMessage.type === uiI18n.t("adminProfile.success") ? '✓' : '✕'}
                </DynamicText>
              </View>
              <DynamicText type="primary" style={styles.customAlertTitle}>
                {customAlertMessage.title}
              </DynamicText>
              <DynamicText type="secondary" style={styles.customAlertMessage}>
                {customAlertMessage.message}
              </DynamicText>
              <TouchableOpacity
                style={[styles.customAlertButton, { 
                  backgroundColor: getCardBorderColor() 
                }]}
                onPress={() => setShowCustomAlert(false)}
              >
                <DynamicText type="card" style={styles.customAlertButtonText}>{uiI18n.t("adminProfile.ok")}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View></KeyboardForm>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customAlertContainer: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
  },
  customAlertContent: {
    padding: 24,
    alignItems: 'center',
  },
  customAlertIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  customAlertIconText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  customAlertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  customAlertMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  customAlertButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    minWidth: 120,
  },
  customAlertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  severityOptions: {
    width: '100%',
    marginVertical: 20,
  },
  severityOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 6,
    alignItems: 'center',
  },
  severityOptionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
