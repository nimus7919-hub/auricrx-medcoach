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
import AIHealthService, { HealthInsight, SymptomAnalysis, DrugInteraction, VoiceNote } from '../services/aiHealthService';

const { width: screenWidth } = Dimensions.get('window');

interface AIHealthScreenProps {
  onClose: () => void;
  theme?: any;
}

type VoiceNoteType = 'symptom' | 'medication_side_effect' | 'appointment_note' | 'general_health';

export default function AIHealthScreen({ onClose, theme }: AIHealthScreenProps) {
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
    insightCard: {
      backgroundColor: currentTheme.chip,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderLeftWidth: 4,
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
      color: currentTheme.text,
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
      color: currentTheme.text,
      marginBottom: 8,
      lineHeight: 20,
    },
    actionItems: {
      marginTop: 8,
    },
    actionItem: {
      fontSize: 12,
      color: currentTheme.sub,
      marginBottom: 4,
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
    featureCard: {
      backgroundColor: currentTheme.chip,
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
      alignItems: 'center',
    },
    featureIcon: {
      fontSize: 32,
      marginBottom: 8,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.text,
      marginBottom: 4,
    },
    featureDescription: {
      fontSize: 12,
      color: currentTheme.sub,
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
    multilineInput: {
      backgroundColor: currentTheme.chip,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      color: currentTheme.text,
      fontSize: 14,
      height: 80,
      textAlignVertical: 'top',
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
    quickActions: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    quickActionButton: {
      backgroundColor: currentTheme.chip,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      flex: 1,
      alignItems: 'center',
    },
    quickActionText: {
      fontSize: 12,
      color: currentTheme.text,
      fontWeight: '500',
    },
  });
  
  const dynamicStyles = getDynamicStyles();
  const [aiService] = useState(() => AIHealthService.getInstance());
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [symptomAnalyses, setSymptomAnalyses] = useState<SymptomAnalysis[]>([]);
  const [drugInteractions, setDrugInteractions] = useState<DrugInteraction[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [showDrugCheckModal, setShowDrugCheckModal] = useState(false);
  const [showVoiceNoteModal, setShowVoiceNoteModal] = useState(false);
  const [symptomText, setSymptomText] = useState('');
  const [medicationList, setMedicationList] = useState('');
  const [voiceNoteText, setVoiceNoteText] = useState('');
  const [selectedVoiceType, setSelectedVoiceType] = useState<VoiceNoteType>('symptom');
  
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

  const voiceNoteTypes: { value: VoiceNoteType; label: string; icon: string }[] = [
    { value: 'symptom', label: 'Symptom', icon: '🤒' },
    { value: 'medication_side_effect', label: 'Side Effect', icon: '⚠️' },
    { value: 'appointment_note', label: 'Appointment', icon: '📅' },
    { value: 'general_health', label: 'General Health', icon: '💭' },
  ];

  useEffect(() => {
    initializeAIHealth();
    
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

  const initializeAIHealth = async () => {
    try {
      await aiService.initialize();
      loadData();
    } catch (error) {
      console.error('Failed to initialize AI Health:', error);
    }
  };

  const loadData = async () => {
    try {
      const [insightsData, symptomsData, interactionsData, voiceData] = await Promise.all([
        aiService.getHealthInsights(),
        aiService.getSymptomAnalyses(),
        aiService.getDrugInteractionHistory(),
        aiService.getVoiceNotes()
      ]);

      setInsights(insightsData);
      setSymptomAnalyses(symptomsData);
      setDrugInteractions(interactionsData);
      setVoiceNotes(voiceData);
    } catch (error) {
      console.error('Failed to load AI health data:', error);
    }
  };

  const analyzeSymptoms = async () => {
    if (!symptomText.trim()) {
      Alert.alert('❌ Error', 'Please enter your symptoms');
      return;
    }

    try {
      const symptoms = symptomText.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const analysis = await aiService.analyzeSymptoms(symptoms);
      
      setSymptomAnalyses(prev => [analysis, ...prev]);
      setSymptomText('');
      setShowSymptomModal(false);
      
      triggerHaptic('medium');
      
      // Show analysis results
      const urgencyEmoji = analysis.urgency === 'emergency' ? '🚨' : 
                          analysis.urgency === 'high' ? '⚠️' : 
                          analysis.urgency === 'medium' ? '⚡' : 'ℹ️';
      
      Alert.alert(
        `${urgencyEmoji} Symptom Analysis Complete`,
        `Severity: ${analysis.severity}\nUrgency: ${analysis.urgency}\n\nPossible Conditions:\n${analysis.possibleConditions.map(c => `• ${c.condition} (${(c.probability * 100).toFixed(0)}%)`).join('\n')}\n\nRecommendations:\n${analysis.recommendations.slice(0, 3).map(r => `• ${r}`).join('\n')}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to analyze symptoms:', error);
      Alert.alert('❌ Error', 'Failed to analyze symptoms');
    }
  };

  const checkDrugInteractions = async () => {
    if (!medicationList.trim()) {
      Alert.alert('❌ Error', 'Please enter your medications');
      return;
    }

    try {
      const medications = medicationList.split(',').map(m => m.trim()).filter(m => m.length > 0);
      const interactions = await aiService.checkDrugInteractions(medications);
      
      setDrugInteractions(prev => [...interactions, ...prev]);
      setMedicationList('');
      setShowDrugCheckModal(false);
      
      triggerHaptic('medium');
      
      if (interactions.length === 0) {
        Alert.alert('✅ No Interactions Found', 'No known drug interactions were detected between your medications.');
      } else {
        const interactionText = interactions.map(i => 
          `• ${i.drug1} + ${i.drug2}: ${i.severity.toUpperCase()}\n  ${i.description}`
        ).join('\n\n');
        
        Alert.alert(
          '⚠️ Drug Interactions Detected',
          `Found ${interactions.length} interaction(s):\n\n${interactionText}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to check drug interactions:', error);
      Alert.alert('❌ Error', 'Failed to check drug interactions');
    }
  };

  const addVoiceNote = async () => {
    if (!voiceNoteText.trim()) {
      Alert.alert('❌ Error', 'Please enter your voice note');
      return;
    }

    try {
      const voiceNote = await aiService.addVoiceNote(voiceNoteText, selectedVoiceType);
      
      setVoiceNotes(prev => [voiceNote, ...prev]);
      setVoiceNoteText('');
      setShowVoiceNoteModal(false);
      
      triggerHaptic('medium');
      Alert.alert('✅ Success', 'Voice note added and processed!');
    } catch (error) {
      console.error('Failed to add voice note:', error);
      Alert.alert('❌ Error', 'Failed to add voice note');
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
      <Text style={dynamicStyles.sectionTitle}>🤖 AI Health Features</Text>
      <Text style={dynamicStyles.sectionDescription}>
        Intelligent healthcare features powered by AI to help you make informed health decisions.
      </Text>
      
      <View style={dynamicStyles.statsGrid}>
        <View style={dynamicStyles.statCard}>
          <Text style={dynamicStyles.statValue}>{insights.length}</Text>
          <Text style={dynamicStyles.statLabel}>Health Insights</Text>
        </View>
        <View style={dynamicStyles.statCard}>
          <Text style={dynamicStyles.statValue}>{symptomAnalyses.length}</Text>
          <Text style={dynamicStyles.statLabel}>Symptom Analyses</Text>
        </View>
        <View style={dynamicStyles.statCard}>
          <Text style={dynamicStyles.statValue}>{drugInteractions.length}</Text>
          <Text style={dynamicStyles.statLabel}>Drug Checks</Text>
        </View>
        <View style={dynamicStyles.statCard}>
          <Text style={dynamicStyles.statValue}>{voiceNotes.length}</Text>
          <Text style={dynamicStyles.statLabel}>Voice Notes</Text>
        </View>
      </View>

      <View style={dynamicStyles.quickActions}>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={() => setShowSymptomModal(true)}
        >
          <Text style={dynamicStyles.quickActionText}>🤒 Analyze Symptoms</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={() => setShowDrugCheckModal(true)}
        >
          <Text style={dynamicStyles.quickActionText}>💊 Check Interactions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={() => setShowVoiceNoteModal(true)}
        >
          <Text style={dynamicStyles.quickActionText}>🎤 Voice Note</Text>
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
      <Text style={dynamicStyles.sectionTitle}>💡 Health Insights</Text>
      <Text style={dynamicStyles.sectionDescription}>
        AI-generated insights based on your health data and patterns.
      </Text>
      
      {insights.slice(0, 5).map(insight => (
        <View key={insight.id} style={[
          dynamicStyles.insightCard,
          { borderLeftColor: getSeverityColor(insight.severity) }
        ]}>
          <View style={dynamicStyles.insightHeader}>
            <Text style={dynamicStyles.insightTitle}>{insight.title}</Text>
            <View style={[
              dynamicStyles.insightSeverity,
              { backgroundColor: getSeverityColor(insight.severity) }
            ]}>
              <Text style={dynamicStyles.severityText}>
                {getSeverityLabel(insight.severity)}
              </Text>
            </View>
          </View>
          
          <Text style={dynamicStyles.insightDescription}>
            {insight.description}
          </Text>
          
          {insight.actionable && insight.actionItems.length > 0 && (
            <View style={dynamicStyles.actionItems}>
              <Text style={[dynamicStyles.actionItem, { fontWeight: '600', marginBottom: 4 }]}>
                Action Items:
              </Text>
              {insight.actionItems.slice(0, 3).map((item, index) => (
                <Text key={index} style={dynamicStyles.actionItem}>
                  • {item}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
      
      {insights.length === 0 && (
        <Text style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          No health insights available yet. Use the AI features to generate insights.
        </Text>
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
      <Text style={dynamicStyles.sectionTitle}>📊 Recent Analyses</Text>
      <Text style={dynamicStyles.sectionDescription}>
        Your recent symptom analyses and health assessments.
      </Text>
      
      {symptomAnalyses.slice(0, 3).map(analysis => (
        <View key={analysis.id} style={dynamicStyles.insightCard}>
          <View style={dynamicStyles.insightHeader}>
            <Text style={dynamicStyles.insightTitle}>
              {analysis.symptoms.join(', ')}
            </Text>
            <View style={[
              dynamicStyles.insightSeverity,
              { backgroundColor: getSeverityColor(analysis.urgency === 'emergency' ? 'critical' : analysis.urgency === 'high' ? 'warning' : 'info') }
            ]}>
              <Text style={dynamicStyles.severityText}>
                {analysis.urgency.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={dynamicStyles.insightDescription}>
            {analysis.possibleConditions[0]?.condition} ({(analysis.possibleConditions[0]?.probability * 100).toFixed(0)}% probability)
          </Text>
          
          <Text style={dynamicStyles.actionItem}>
            {new Date(analysis.createdAt).toLocaleDateString()}
          </Text>
        </View>
      ))}
      
      {symptomAnalyses.length === 0 && (
        <Text style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          No symptom analyses yet. Try analyzing your symptoms.
        </Text>
      )}
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
              🤖 AI Health Assistant
            </Text>
            <Text style={[styles.subtitle, { color: currentTheme.sub }]}>
              Intelligent healthcare features powered by AI for better health decisions
            </Text>
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
            <Text style={dynamicStyles.modalTitle}>🤒 Symptom Analysis</Text>
            
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Describe your symptoms</Text>
              <TextInput
                style={dynamicStyles.multilineInput}
                placeholder="Enter your symptoms separated by commas (e.g., fever, headache, fatigue)"
                placeholderTextColor={currentTheme.sub}
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
                <Text style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={analyzeSymptoms}
              >
                <Text style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>Analyze</Text>
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
            <Text style={dynamicStyles.modalTitle}>💊 Drug Interaction Check</Text>
            
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>List your medications</Text>
              <TextInput
                style={dynamicStyles.multilineInput}
                placeholder="Enter your medications separated by commas (e.g., Aspirin, Metformin, Lisinopril)"
                placeholderTextColor={currentTheme.sub}
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
                <Text style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={checkDrugInteractions}
              >
                <Text style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>Check</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Voice Note Modal */}
      <Modal
        visible={showVoiceNoteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVoiceNoteModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>🎤 Voice Note</Text>
            
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Note Type</Text>
              <TouchableOpacity
                style={dynamicStyles.pickerButton}
                onPress={() => {
                  Alert.alert(
                    'Select Note Type',
                    '',
                    voiceNoteTypes.map(type => ({
                      text: `${type.icon} ${type.label}`,
                      onPress: () => setSelectedVoiceType(type.value)
                    }))
                  );
                }}
              >
                <Text style={dynamicStyles.pickerText}>
                  {voiceNoteTypes.find(t => t.value === selectedVoiceType)?.icon} {voiceNoteTypes.find(t => t.value === selectedVoiceType)?.label}
                </Text>
                <Text style={dynamicStyles.pickerText}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Transcription</Text>
              <TextInput
                style={dynamicStyles.multilineInput}
                placeholder="Enter your voice note transcription..."
                placeholderTextColor={currentTheme.sub}
                value={voiceNoteText}
                onChangeText={setVoiceNoteText}
                multiline
              />
            </View>

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => setShowVoiceNoteModal(false)}
              >
                <Text style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={addVoiceNote}
              >
                <Text style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>Add Note</Text>
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
