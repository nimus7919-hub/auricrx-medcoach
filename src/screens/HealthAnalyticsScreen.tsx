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
  Platform,
  Vibration,
  Dimensions,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
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
  const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
  
  // Create translation function from S object
  const t = (key: string) => {
    if (S && typeof S === 'object' && S[key]) {
      return S[key];
    }
    return key; // fallback to key if translation not found
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
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
    },
    sectionDescription: {
      fontSize: 14,
      marginBottom: 16,
      lineHeight: 20,
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
      fontSize: 14,
      fontWeight: '500',
    },
    metricValue: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    metricDate: {
      fontSize: 12,
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
  const [selectedMetricType, setSelectedMetricType] = useState<MetricType>('blood_pressure');
  const [metricValue, setMetricValue] = useState('');
  const [metricNotes, setMetricNotes] = useState('');
  const [sideEffectSymptom, setSideEffectSymptom] = useState('');
  const [sideEffectSeverity, setSideEffectSeverity] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [sideEffectNotes, setSideEffectNotes] = useState('');
  
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

  const metricTypes: { value: MetricType; label: string; unit: string; icon: string }[] = [
    { value: 'blood_pressure', label: t('bloodPressure'), unit: 'mmHg', icon: '🩸' },
    { value: 'weight', label: t('weight'), unit: 'kg', icon: '⚖️' },
    { value: 'blood_sugar', label: t('bloodSugar'), unit: 'mg/dL', icon: '🍯' },
    { value: 'heart_rate', label: t('heartRate'), unit: 'bpm', icon: '❤️' },
    { value: 'temperature', label: t('temperature'), unit: '°C', icon: '🌡️' },
    { value: 'oxygen_saturation', label: t('oxygenSaturation'), unit: '%', icon: '🫁' },
    { value: 'pain_level', label: t('painLevel'), unit: '/10', icon: '😣' },
    { value: 'mood', label: t('mood'), unit: '/5', icon: '😊' },
    { value: 'energy_level', label: t('energyLevel'), unit: '/5', icon: '⚡' },
    { value: 'sleep_hours', label: t('sleepHours'), unit: 'hours', icon: '😴' },
    { value: 'steps', label: t('steps'), unit: 'steps', icon: '👟' },
  ];

  useEffect(() => {
    // Simplified initialization - no external service
    console.log('📊 Health Analytics Screen initialized');
    
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

  const addMetric = async () => {
    if (!metricValue) {
      Alert.alert(`❌ ${t('error')}`, t('pleaseEnterValue'));
      return;
    }

    try {
      const value = parseFloat(metricValue);
      if (isNaN(value)) {
        Alert.alert(`❌ ${t('error')}`, t('pleaseEnterValidNumber'));
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
      Alert.alert('✅ Success', 'Health metric added!');
    } catch (error) {
      console.error('Failed to add metric:', error);
      Alert.alert('❌ Error', 'Failed to add health metric');
    }
  };

  const addSideEffect = async () => {
    if (!sideEffectSymptom) {
      Alert.alert(`❌ ${t('error')}`, t('pleaseEnterSymptom'));
      return;
    }

    try {
      // Simplified side effect addition - create mock data
      const newSideEffect: SideEffect = {
        id: `side_effect_${Date.now()}`,
        medicationId: 'general',
        medicationName: 'General',
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
      Alert.alert(`✅ ${t('success')}`, t('sideEffectRecorded'));
    } catch (error) {
      console.error('Failed to add side effect:', error);
      Alert.alert('❌ Error', 'Failed to record side effect');
    }
  };

  const generateHealthReport = async () => {
    try {
      // Simplified report generation - create mock data
      const report = {
        summary: {
          totalMetrics: metrics.length,
          adherenceRate: 85, // Mock adherence rate
          sideEffects: sideEffects.length,
          keyInsights: [
            t('yourHealthMetricsNormal'),
            t('considerMaintainingSchedule'),
            t('monitorNewSideEffects')
          ]
        }
      };
      
      Alert.alert(
        `📊 ${t('healthReportGenerated')}`,
        `${t('summary')}:\n• ${report.summary.totalMetrics} ${t('metricsRecorded').toLowerCase()}\n• ${report.summary.adherenceRate.toFixed(1)}% ${t('adherenceRate').toLowerCase()}\n• ${report.summary.sideEffects} ${t('sideEffects').toLowerCase()}\n\n${t('keyInsights')}:\n${report.summary.keyInsights.slice(0, 3).join('\n')}`,
        [{ text: t('ok') }]
      );
    } catch (error) {
      console.error('Failed to generate report:', error);
      Alert.alert('❌ Error', 'Failed to generate health report');
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1: return '#10b981'; // green
      case 2: return '#f59e0b'; // yellow
      case 3: return '#f97316'; // orange
      case 4: return '#ef4444'; // red
      case 5: return '#dc2626'; // dark red
      default: return '#6b7280'; // gray
    }
  };

  const getSeverityLabel = (severity: number) => {
    switch (severity) {
      case 1: return t('mild');
      case 2: return t('moderate');
      case 3: return t('moderateSevere');
      case 4: return t('severe');
      case 5: return t('verySevere');
      default: return t('unknown');
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
      <DynamicText type="primary" style={dynamicStyles.sectionTitle}>📊 {t('healthOverview')}</DynamicText>
      
      <View style={dynamicStyles.statsGrid}>
        <View style={dynamicStyles.statCard}>
          <DynamicText type="card" style={dynamicStyles.statValue}>{metrics.length}</DynamicText>
          <DynamicText type="card" style={dynamicStyles.statLabel}>{t('metricsRecorded')}</DynamicText>
        </View>
        <View style={dynamicStyles.statCard}>
          <DynamicText type="card" style={dynamicStyles.statValue}>{overallAdherence.toFixed(0)}%</DynamicText>
          <DynamicText type="card" style={dynamicStyles.statLabel}>{t('adherenceRate')}</DynamicText>
        </View>
        <View style={dynamicStyles.statCard}>
          <DynamicText type="card" style={dynamicStyles.statValue}>{sideEffects.length}</DynamicText>
          <DynamicText type="card" style={dynamicStyles.statLabel}>{t('sideEffects')}</DynamicText>
        </View>
        <View style={dynamicStyles.statCard}>
          <DynamicText type="card" style={dynamicStyles.statValue}>{adherence.length}</DynamicText>
          <DynamicText type="card" style={dynamicStyles.statLabel}>{t('medications')}</DynamicText>
        </View>
      </View>

      <TouchableOpacity
        style={dynamicStyles.addButton}
        onPress={generateHealthReport}
      >
        <DynamicText type="card" style={dynamicStyles.addButtonText}>📋 {t('generateHealthReport')}</DynamicText>
      </TouchableOpacity>
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
      <DynamicText type="primary" style={dynamicStyles.sectionTitle}>📈 {t('recentHealthMetrics')}</DynamicText>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {t('trackVitalSigns')}
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
                {metric.value} {metric.unit}
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
          {t('noHealthMetrics')}
        </DynamicText>
      )}
      
      <TouchableOpacity
        style={dynamicStyles.addButton}
        onPress={() => setShowAddMetricModal(true)}
      >
        <DynamicText type="card" style={dynamicStyles.addButtonText}>+ {t('addHealthMetric')}</DynamicText>
      </TouchableOpacity>
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
      <DynamicText type="primary" style={dynamicStyles.sectionTitle}>💊 {t('medicationAdherence')}</DynamicText>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {t('trackMedicationSchedule')}
      </DynamicText>
      
      {adherence.map(med => (
        <View key={med.medicationId} style={dynamicStyles.adherenceCard}>
          <View style={dynamicStyles.adherenceHeader}>
            <DynamicText type="card" style={dynamicStyles.adherenceName}>{med.medicationName}</DynamicText>
            <DynamicText type="card" style={dynamicStyles.adherenceRate}>{med.adherenceRate.toFixed(0)}%</DynamicText>
          </View>
          <DynamicText type="card" style={dynamicStyles.adherenceDetails}>
            {med.takenDoses} taken • {med.missedDoses} missed • {med.streak} day streak
          </DynamicText>
        </View>
      ))}
      
      {adherence.length === 0 && (
        <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          {t('noAdherenceData')}
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
      <DynamicText type="primary" style={dynamicStyles.sectionTitle}>⚠️ {t('sideEffectsMonitoring')}</DynamicText>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {t('trackSideEffects')}
      </DynamicText>
      
      {sideEffects.slice(0, 5).map(sideEffect => (
        <View key={sideEffect.id} style={dynamicStyles.sideEffectCard}>
          <View style={dynamicStyles.sideEffectHeader}>
            <DynamicText type="card" style={dynamicStyles.sideEffectSymptom}>{sideEffect.symptom}</DynamicText>
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
            {sideEffect.medicationName} • Started {new Date(sideEffect.startDate).toLocaleDateString()}
            {sideEffect.notes && ` • ${sideEffect.notes}`}
          </DynamicText>
        </View>
      ))}
      
      {sideEffects.length === 0 && (
        <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          {t('noSideEffectsRecorded')}
        </DynamicText>
      )}
      
      <TouchableOpacity
        style={dynamicStyles.addButton}
        onPress={() => setShowAddSideEffectModal(true)}
      >
        <DynamicText type="card" style={dynamicStyles.addButtonText}>+ {t('recordSideEffect')}</DynamicText>
      </TouchableOpacity>
    </Animated.View>
  );

  // Simplified Health Analytics - no external service needed

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
            <DynamicText type="primary" style={styles.title}>
              📊 {t('healthAnalytics')}
            </DynamicText>
            <DynamicText type="secondary" style={styles.subtitle}>
              {t('trackHealthMetrics')}
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
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>📈 {t('addHealthMetric')}</DynamicText>
            
            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('metricType')}</DynamicText>
              <TouchableOpacity
                style={dynamicStyles.pickerButton}
                onPress={() => {
                  Alert.alert(
                    t('selectMetricType'),
                    '',
                    metricTypes.map(type => ({
                      text: `${type.icon} ${type.label}`,
                      onPress: () => setSelectedMetricType(type.value)
                    }))
                  );
                }}
              >
                <DynamicText type="card" style={dynamicStyles.pickerText}>
                  {metricTypes.find(t => t.value === selectedMetricType)?.icon} {metricTypes.find(t => t.value === selectedMetricType)?.label}
                </DynamicText>
                <DynamicText type="card" style={dynamicStyles.pickerText}>▼</DynamicText>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('value')}</DynamicText>
              <TextInput
                style={dynamicStyles.textInput}
                placeholder={t('enterValue')}
                placeholderTextColor="#ffffff80"
                value={metricValue}
                onChangeText={setMetricValue}
                keyboardType="numeric"
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('notesOptional')}</DynamicText>
              <TextInput
                style={[dynamicStyles.textInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder={t('addAnyNotes')}
                placeholderTextColor="#ffffff80"
                value={metricNotes}
                onChangeText={setMetricNotes}
                multiline
              />
            </View>

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => setShowAddMetricModal(false)}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{t('cancel')}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={addMetric}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>{t('addMetric')}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Side Effect Modal */}
      <Modal
        visible={showAddSideEffectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddSideEffectModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>⚠️ {t('recordSideEffect')}</DynamicText>
            
            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('symptom')}</DynamicText>
              <TextInput
                style={dynamicStyles.textInput}
                placeholder={t('symptomPlaceholder')}
                placeholderTextColor="#ffffff80"
                value={sideEffectSymptom}
                onChangeText={setSideEffectSymptom}
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('severity')}</DynamicText>
              <TouchableOpacity
                style={dynamicStyles.pickerButton}
                onPress={() => {
                  Alert.alert(
                    t('severity'),
                    '',
                    [
                      { text: `1 - ${t('mild')}`, onPress: () => setSideEffectSeverity(1) },
                      { text: `2 - ${t('moderate')}`, onPress: () => setSideEffectSeverity(2) },
                      { text: `3 - ${t('moderateSevere')}`, onPress: () => setSideEffectSeverity(3) },
                      { text: `4 - ${t('severe')}`, onPress: () => setSideEffectSeverity(4) },
                      { text: `5 - ${t('verySevere')}`, onPress: () => setSideEffectSeverity(5) },
                    ]
                  );
                }}
              >
                <DynamicText type="card" style={dynamicStyles.pickerText}>
                  {sideEffectSeverity} - {getSeverityLabel(sideEffectSeverity)}
                </DynamicText>
                <DynamicText type="card" style={dynamicStyles.pickerText}>▼</DynamicText>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('notesOptional')}</DynamicText>
              <TextInput
                style={[dynamicStyles.textInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder={t('addAnyNotes')}
                placeholderTextColor="#ffffff80"
                value={sideEffectNotes}
                onChangeText={setSideEffectNotes}
                multiline
              />
            </View>

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => setShowAddSideEffectModal(false)}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{t('cancel')}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={addSideEffect}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>{t('recordSideEffect')}</DynamicText>
              </TouchableOpacity>
            </View>
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
});
