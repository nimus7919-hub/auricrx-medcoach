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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
// Simplified AI Health - no external service dependencies

const { width: screenWidth } = Dimensions.get('window');

interface AIHealthScreenProps {
  onClose: () => void;
  theme?: any;
  S?: any;
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


export default function AIHealthScreen({ onClose, theme, S }: AIHealthScreenProps) {
  console.log('AI Health Screen rendering...');
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
  
  // Use S object for translations, fallback to key if not available
  const t = (key: string) => S?.[key] || key;
  
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
      fontSize: 16,
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
      Alert.alert('❌ ' + t('error'), t('enterSymptoms'));
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
          condition: 'General Symptoms',
          probability: 0.7,
          description: 'Multiple symptoms that may indicate various conditions',
          recommendations: ['Monitor symptoms closely', 'Consider consulting healthcare provider', 'Maintain good hydration and rest']
        }],
        urgency: symptoms.some(s => s.toLowerCase().includes('severe')) ? 'high' : 'low',
        recommendations: ['Get adequate rest', 'Stay hydrated', 'Monitor symptoms'],
        followUpActions: ['Schedule appointment if symptoms persist', 'Keep symptom diary'],
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
        `Severity: ${analysis.severity}\nUrgency: ${analysis.urgency}\n\nPossible Conditions:\n${analysis.possibleConditions.map(c => `• ${c.condition} (${(c.probability * 100).toFixed(0)}%)`).join('\n')}\n\nRecommendations:\n${analysis.recommendations.slice(0, 3).map(r => `• ${r}`).join('\n')}`,
        [{ text: t('ok') }]
      );
    } catch (error) {
      console.error('Failed to analyze symptoms:', error);
      Alert.alert('❌ Error', 'Failed to analyze symptoms');
    }
  };

  const checkDrugInteractions = async () => {
    if (!medicationList.trim()) {
      Alert.alert('❌ ' + t('error'), t('enterMedications'));
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
          description: 'Potential mild interaction - monitor for side effects',
          clinicalEffects: ['Mild side effects possible'],
          management: 'Monitor for any unusual symptoms',
          references: ['Drug Interaction Database']
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
          '⚠️ ' + t('drugInteractionsDetected'),
          `${t('foundInteractions')} ${interactions.length}:\n\n${interactionText}`,
          [{ text: t('ok') }]
        );
      }
    } catch (error) {
      console.error('Failed to check drug interactions:', error);
      Alert.alert('❌ Error', 'Failed to check drug interactions');
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
      case 'info': return 'Info';
      case 'warning': return 'Warning';
      case 'critical': return 'Critical';
      default: return 'Unknown';
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
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>🤒 {t('symptomAnalysis')}</DynamicText>
            
            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('describeSymptoms')}</DynamicText>
              <TextInput
                style={dynamicStyles.multilineInput}
                placeholder={t('enterSymptomsPlaceholder')}
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
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{t('cancel')}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={analyzeSymptoms}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>{t('analyze')}</DynamicText>
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
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>💊 {t('drugInteractionCheck')}</DynamicText>
            
            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('listMedications')}</DynamicText>
              <TextInput
                style={dynamicStyles.multilineInput}
                placeholder={t('enterMedicationsPlaceholder')}
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
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{t('cancel')}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={checkDrugInteractions}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>{t('check')}</DynamicText>
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
