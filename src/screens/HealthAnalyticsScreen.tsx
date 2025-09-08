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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import HealthMetricsService, { HealthMetric, MedicationAdherence, SideEffect, HealthReport } from '../services/healthMetrics';

const { width: screenWidth } = Dimensions.get('window');

interface HealthAnalyticsScreenProps {
  onClose: () => void;
  theme?: any;
}

type MetricType = 'blood_pressure' | 'weight' | 'blood_sugar' | 'heart_rate' | 'temperature' | 'oxygen_saturation' | 'pain_level' | 'mood' | 'energy_level' | 'sleep_hours' | 'steps';

export default function HealthAnalyticsScreen({ onClose, theme }: HealthAnalyticsScreenProps) {
  const { t } = useTranslation();
  
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
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: currentTheme.chip,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: currentTheme.text,
      marginBottom: 12,
    },
    sectionDescription: {
      fontSize: 14,
      color: currentTheme.sub,
      marginBottom: 16,
      lineHeight: 20,
    },
    metricCard: {
      backgroundColor: currentTheme.chip,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    metricInfo: {
      flex: 1,
    },
    metricName: {
      fontSize: 14,
      fontWeight: '500',
      color: currentTheme.text,
    },
    metricValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme.accent,
    },
    metricDate: {
      fontSize: 12,
      color: currentTheme.sub,
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
      backgroundColor: currentTheme.accent,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    addButtonText: {
      color: currentTheme.text,
      fontSize: 14,
      fontWeight: '600',
    },
    adherenceCard: {
      backgroundColor: currentTheme.chip,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
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
      color: currentTheme.text,
      flex: 1,
    },
    adherenceRate: {
      fontSize: 16,
      fontWeight: 'bold',
      color: currentTheme.accent,
    },
    adherenceDetails: {
      fontSize: 12,
      color: currentTheme.sub,
    },
    sideEffectCard: {
      backgroundColor: currentTheme.chip,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderLeftWidth: 4,
      borderLeftColor: currentTheme.accent,
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
      color: currentTheme.text,
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
      color: currentTheme.sub,
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
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      padding: 24,
      width: '90%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: currentTheme.text,
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: currentTheme.chip,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      color: currentTheme.text,
      fontSize: 14,
    },
    pickerButton: {
      backgroundColor: currentTheme.chip,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pickerText: {
      color: currentTheme.text,
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
      backgroundColor: currentTheme.accent,
    },
    modalButtonSecondary: {
      backgroundColor: currentTheme.chip,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    modalButtonTextPrimary: {
      color: currentTheme.text,
    },
    modalButtonTextSecondary: {
      color: currentTheme.sub,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      backgroundColor: currentTheme.chip,
      padding: 12,
      borderRadius: 8,
      flex: 1,
      minWidth: (screenWidth - 48) / 2,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.accent,
    },
    statLabel: {
      fontSize: 12,
      color: currentTheme.sub,
      marginTop: 4,
    },
  });
  
  const dynamicStyles = getDynamicStyles();
  const [healthService] = useState(() => HealthMetricsService.getInstance());
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
    { value: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', icon: '🩸' },
    { value: 'weight', label: 'Weight', unit: 'kg', icon: '⚖️' },
    { value: 'blood_sugar', label: 'Blood Sugar', unit: 'mg/dL', icon: '🍯' },
    { value: 'heart_rate', label: 'Heart Rate', unit: 'bpm', icon: '❤️' },
    { value: 'temperature', label: 'Temperature', unit: '°C', icon: '🌡️' },
    { value: 'oxygen_saturation', label: 'Oxygen Saturation', unit: '%', icon: '🫁' },
    { value: 'pain_level', label: 'Pain Level', unit: '/10', icon: '😣' },
    { value: 'mood', label: 'Mood', unit: '/5', icon: '😊' },
    { value: 'energy_level', label: 'Energy Level', unit: '/5', icon: '⚡' },
    { value: 'sleep_hours', label: 'Sleep Hours', unit: 'hours', icon: '😴' },
    { value: 'steps', label: 'Steps', unit: 'steps', icon: '👟' },
  ];

  useEffect(() => {
    initializeHealthAnalytics();
    
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

  const initializeHealthAnalytics = async () => {
    try {
      await healthService.initialize();
      loadData();
    } catch (error) {
      console.error('Failed to initialize health analytics:', error);
    }
  };

  const loadData = async () => {
    try {
      const [metricsData, adherenceData, sideEffectsData, overallAdherenceData] = await Promise.all([
        healthService.getMetrics(undefined, 30), // Last 30 days
        healthService.getAdherence(),
        healthService.getSideEffects(),
        healthService.getOverallAdherence()
      ]);

      setMetrics(metricsData);
      setAdherence(adherenceData);
      setSideEffects(sideEffectsData);
      setOverallAdherence(overallAdherenceData);
    } catch (error) {
      console.error('Failed to load health data:', error);
    }
  };

  const addMetric = async () => {
    if (!metricValue) {
      Alert.alert('❌ Error', 'Please enter a value');
      return;
    }

    try {
      const value = parseFloat(metricValue);
      if (isNaN(value)) {
        Alert.alert('❌ Error', 'Please enter a valid number');
        return;
      }

      const selectedType = metricTypes.find(t => t.value === selectedMetricType);
      await healthService.addMetric({
        type: selectedMetricType,
        value,
        unit: selectedType?.unit || '',
        notes: metricNotes || undefined
      });

      setMetricValue('');
      setMetricNotes('');
      setShowAddMetricModal(false);
      loadData();
      triggerHaptic('medium');
      Alert.alert('✅ Success', 'Health metric added!');
    } catch (error) {
      console.error('Failed to add metric:', error);
      Alert.alert('❌ Error', 'Failed to add health metric');
    }
  };

  const addSideEffect = async () => {
    if (!sideEffectSymptom) {
      Alert.alert('❌ Error', 'Please enter a symptom');
      return;
    }

    try {
      await healthService.addSideEffect({
        medicationId: 'general', // For now, general side effects
        medicationName: 'General',
        symptom: sideEffectSymptom,
        severity: sideEffectSeverity,
        startDate: new Date().toISOString(),
        duration: 0,
        frequency: 'occasional',
        notes: sideEffectNotes || undefined
      });

      setSideEffectSymptom('');
      setSideEffectNotes('');
      setSideEffectSeverity(1);
      setShowAddSideEffectModal(false);
      loadData();
      triggerHaptic('medium');
      Alert.alert('✅ Success', 'Side effect recorded!');
    } catch (error) {
      console.error('Failed to add side effect:', error);
      Alert.alert('❌ Error', 'Failed to record side effect');
    }
  };

  const generateHealthReport = async () => {
    try {
      const report = await healthService.generateHealthReport('Last 30 Days');
      
      Alert.alert(
        '📊 Health Report Generated',
        `Summary:\n• ${report.summary.totalMetrics} metrics recorded\n• ${report.summary.adherenceRate.toFixed(1)}% medication adherence\n• ${report.summary.sideEffects} active side effects\n\nKey Insights:\n${report.summary.keyInsights.slice(0, 3).join('\n')}`,
        [{ text: 'OK' }]
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
      case 1: return 'Mild';
      case 2: return 'Moderate';
      case 3: return 'Moderate-Severe';
      case 4: return 'Severe';
      case 5: return 'Very Severe';
      default: return 'Unknown';
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
      <Text style={dynamicStyles.sectionTitle}>📊 Health Overview</Text>
      
      <View style={dynamicStyles.statsGrid}>
        <View style={dynamicStyles.statCard}>
          <Text style={dynamicStyles.statValue}>{metrics.length}</Text>
          <Text style={dynamicStyles.statLabel}>Metrics Recorded</Text>
        </View>
        <View style={dynamicStyles.statCard}>
          <Text style={dynamicStyles.statValue}>{overallAdherence.toFixed(0)}%</Text>
          <Text style={dynamicStyles.statLabel}>Adherence Rate</Text>
        </View>
        <View style={dynamicStyles.statCard}>
          <Text style={dynamicStyles.statValue}>{sideEffects.length}</Text>
          <Text style={dynamicStyles.statLabel}>Side Effects</Text>
        </View>
        <View style={dynamicStyles.statCard}>
          <Text style={dynamicStyles.statValue}>{adherence.length}</Text>
          <Text style={dynamicStyles.statLabel}>Medications</Text>
        </View>
      </View>

      <TouchableOpacity
        style={dynamicStyles.addButton}
        onPress={generateHealthReport}
      >
        <Text style={dynamicStyles.addButtonText}>📋 Generate Health Report</Text>
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
      <Text style={dynamicStyles.sectionTitle}>📈 Recent Health Metrics</Text>
      <Text style={dynamicStyles.sectionDescription}>
        Track your vital signs and health indicators over time.
      </Text>
      
      {metrics.slice(0, 5).map(metric => {
        const metricType = metricTypes.find(t => t.value === metric.type);
        return (
          <View key={metric.id} style={dynamicStyles.metricCard}>
            <View style={dynamicStyles.metricInfo}>
              <Text style={dynamicStyles.metricName}>
                {metricType?.icon} {metricType?.label}
              </Text>
              <Text style={dynamicStyles.metricValue}>
                {metric.value} {metric.unit}
              </Text>
              <Text style={dynamicStyles.metricDate}>
                {new Date(metric.timestamp).toLocaleDateString()}
              </Text>
            </View>
          </View>
        );
      })}
      
      {metrics.length === 0 && (
        <Text style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          No health metrics recorded yet
        </Text>
      )}
      
      <TouchableOpacity
        style={dynamicStyles.addButton}
        onPress={() => setShowAddMetricModal(true)}
      >
        <Text style={dynamicStyles.addButtonText}>+ Add Health Metric</Text>
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
      <Text style={dynamicStyles.sectionTitle}>💊 Medication Adherence</Text>
      <Text style={dynamicStyles.sectionDescription}>
        Track how well you're following your medication schedule.
      </Text>
      
      {adherence.map(med => (
        <View key={med.medicationId} style={dynamicStyles.adherenceCard}>
          <View style={dynamicStyles.adherenceHeader}>
            <Text style={dynamicStyles.adherenceName}>{med.medicationName}</Text>
            <Text style={dynamicStyles.adherenceRate}>{med.adherenceRate.toFixed(0)}%</Text>
          </View>
          <Text style={dynamicStyles.adherenceDetails}>
            {med.takenDoses} taken • {med.missedDoses} missed • {med.streak} day streak
          </Text>
        </View>
      ))}
      
      {adherence.length === 0 && (
        <Text style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          No medication adherence data yet
        </Text>
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
      <Text style={dynamicStyles.sectionTitle}>⚠️ Side Effects Monitoring</Text>
      <Text style={dynamicStyles.sectionDescription}>
        Track any side effects you experience from medications.
      </Text>
      
      {sideEffects.slice(0, 5).map(sideEffect => (
        <View key={sideEffect.id} style={dynamicStyles.sideEffectCard}>
          <View style={dynamicStyles.sideEffectHeader}>
            <Text style={dynamicStyles.sideEffectSymptom}>{sideEffect.symptom}</Text>
            <View style={[
              dynamicStyles.severityBadge,
              { backgroundColor: getSeverityColor(sideEffect.severity) }
            ]}>
              <Text style={dynamicStyles.severityText}>
                {getSeverityLabel(sideEffect.severity)}
              </Text>
            </View>
          </View>
          <Text style={dynamicStyles.sideEffectDetails}>
            {sideEffect.medicationName} • Started {new Date(sideEffect.startDate).toLocaleDateString()}
            {sideEffect.notes && ` • ${sideEffect.notes}`}
          </Text>
        </View>
      ))}
      
      {sideEffects.length === 0 && (
        <Text style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          No side effects recorded yet
        </Text>
      )}
      
      <TouchableOpacity
        style={dynamicStyles.addButton}
        onPress={() => setShowAddSideEffectModal(true)}
      >
        <Text style={dynamicStyles.addButtonText}>+ Record Side Effect</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <LinearGradient colors={[currentTheme.bgStart, currentTheme.bgEnd, '#f0ede8']} style={styles.container}>
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
                source={require('../../assets/AuricRX_home_button.png')} 
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
            <Text style={[styles.title, { color: currentTheme.text }]}>
              📊 Health Analytics
            </Text>
            <Text style={[styles.subtitle, { color: currentTheme.sub }]}>
              Track your health metrics, medication adherence, and side effects
            </Text>
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
            <Text style={dynamicStyles.modalTitle}>📈 Add Health Metric</Text>
            
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Metric Type</Text>
              <TouchableOpacity
                style={dynamicStyles.pickerButton}
                onPress={() => {
                  Alert.alert(
                    'Select Metric Type',
                    '',
                    metricTypes.map(type => ({
                      text: `${type.icon} ${type.label}`,
                      onPress: () => setSelectedMetricType(type.value)
                    }))
                  );
                }}
              >
                <Text style={dynamicStyles.pickerText}>
                  {metricTypes.find(t => t.value === selectedMetricType)?.icon} {metricTypes.find(t => t.value === selectedMetricType)?.label}
                </Text>
                <Text style={dynamicStyles.pickerText}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Value</Text>
              <TextInput
                style={dynamicStyles.textInput}
                placeholder="Enter value"
                placeholderTextColor={currentTheme.sub}
                value={metricValue}
                onChangeText={setMetricValue}
                keyboardType="numeric"
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[dynamicStyles.textInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Add any notes..."
                placeholderTextColor={currentTheme.sub}
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
                <Text style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={addMetric}
              >
                <Text style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>Add Metric</Text>
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
            <Text style={dynamicStyles.modalTitle}>⚠️ Record Side Effect</Text>
            
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Symptom</Text>
              <TextInput
                style={dynamicStyles.textInput}
                placeholder="e.g., headache, nausea, dizziness"
                placeholderTextColor={currentTheme.sub}
                value={sideEffectSymptom}
                onChangeText={setSideEffectSymptom}
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Severity</Text>
              <TouchableOpacity
                style={dynamicStyles.pickerButton}
                onPress={() => {
                  Alert.alert(
                    'Select Severity',
                    '',
                    [
                      { text: '1 - Mild', onPress: () => setSideEffectSeverity(1) },
                      { text: '2 - Moderate', onPress: () => setSideEffectSeverity(2) },
                      { text: '3 - Moderate-Severe', onPress: () => setSideEffectSeverity(3) },
                      { text: '4 - Severe', onPress: () => setSideEffectSeverity(4) },
                      { text: '5 - Very Severe', onPress: () => setSideEffectSeverity(5) },
                    ]
                  );
                }}
              >
                <Text style={dynamicStyles.pickerText}>
                  {sideEffectSeverity} - {getSeverityLabel(sideEffectSeverity)}
                </Text>
                <Text style={dynamicStyles.pickerText}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[dynamicStyles.textInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Add any additional details..."
                placeholderTextColor={currentTheme.sub}
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
                <Text style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={addSideEffect}
              >
                <Text style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
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
