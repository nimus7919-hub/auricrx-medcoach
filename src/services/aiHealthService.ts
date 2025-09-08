import AsyncStorage from '@react-native-async-storage/async-storage';
import { SmartNotificationService } from './smartNotifications';
import { HealthMetricsService } from './healthMetrics';
import { AppointmentService } from './appointmentService';

export interface DrugInteraction {
  id: string;
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  clinicalEffects: string[];
  management: string;
  references: string[];
}

export interface SymptomAnalysis {
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

export interface MedicationRecommendation {
  id: string;
  condition: string;
  recommendedMedications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    reasoning: string;
    sideEffects: string[];
    interactions: string[];
  }[];
  alternativeOptions: {
    name: string;
    reasoning: string;
    pros: string[];
    cons: string[];
  }[];
  lifestyleRecommendations: string[];
  monitoringRequirements: string[];
  createdAt: string;
}

export interface HealthInsight {
  id: string;
  type: 'medication_adherence' | 'symptom_pattern' | 'health_trend' | 'risk_assessment' | 'lifestyle' | 'appointment_reminder';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  actionable: boolean;
  actionItems: string[];
  relatedData: any;
  confidence: number; // 0-1
  createdAt: string;
}

export interface VoiceNote {
  id: string;
  type: 'symptom' | 'medication_side_effect' | 'appointment_note' | 'general_health';
  transcription: string;
  audioUri?: string;
  duration: number; // seconds
  createdAt: string;
  processed: boolean;
  extractedEntities?: {
    medications: string[];
    symptoms: string[];
    dates: string[];
    severity: string;
  };
}

class AIHealthService {
  private static instance: AIHealthService;
  private drugInteractions: DrugInteraction[] = [];
  private symptomAnalyses: SymptomAnalysis[] = [];
  private medicationRecommendations: MedicationRecommendation[] = [];
  private healthInsights: HealthInsight[] = [];
  private voiceNotes: VoiceNote[] = [];
  private smartNotifications: SmartNotificationService;
  private healthMetrics: HealthMetricsService;
  private appointmentService: AppointmentService;

  // Drug interaction database (simplified - in production, use a comprehensive medical database)
  private drugInteractionDatabase: DrugInteraction[] = [
    {
      id: 'warfarin_aspirin',
      drug1: 'Warfarin',
      drug2: 'Aspirin',
      severity: 'major',
      description: 'Increased risk of bleeding when taken together',
      clinicalEffects: ['Increased bleeding risk', 'Prolonged bleeding time', 'Bruising'],
      management: 'Monitor INR closely, consider alternative pain relief',
      references: ['Drug Interaction Database', 'Clinical Pharmacology']
    },
    {
      id: 'metformin_contrast',
      drug1: 'Metformin',
      drug2: 'Contrast Dye',
      severity: 'major',
      description: 'Risk of lactic acidosis with contrast media',
      clinicalEffects: ['Lactic acidosis', 'Kidney damage', 'Metabolic acidosis'],
      management: 'Discontinue metformin 48 hours before and after contrast',
      references: ['Radiology Guidelines', 'Diabetes Management']
    },
    {
      id: 'statin_grapefruit',
      drug1: 'Statins',
      drug2: 'Grapefruit Juice',
      severity: 'moderate',
      description: 'Grapefruit juice increases statin levels',
      clinicalEffects: ['Increased statin levels', 'Muscle pain', 'Liver toxicity'],
      management: 'Avoid grapefruit juice or reduce statin dose',
      references: ['Food-Drug Interactions', 'Cardiology Guidelines']
    }
  ];

  static getInstance(): AIHealthService {
    if (!AIHealthService.instance) {
      AIHealthService.instance = new AIHealthService();
    }
    return AIHealthService.instance;
  }

  constructor() {
    this.smartNotifications = SmartNotificationService.getInstance();
    this.healthMetrics = HealthMetricsService.getInstance();
    this.appointmentService = AppointmentService.getInstance();
  }

  async initialize() {
    try {
      await this.loadSavedData();
      await this.generateInitialInsights();
      console.log('✅ AI Health Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize AI Health Service:', error);
    }
  }

  private async loadSavedData() {
    try {
      const [interactionsData, symptomsData, recommendationsData, insightsData, voiceData] = await Promise.all([
        AsyncStorage.getItem('drug_interactions'),
        AsyncStorage.getItem('symptom_analyses'),
        AsyncStorage.getItem('medication_recommendations'),
        AsyncStorage.getItem('health_insights'),
        AsyncStorage.getItem('voice_notes')
      ]);

      if (interactionsData) {
        this.drugInteractions = JSON.parse(interactionsData);
      }
      if (symptomsData) {
        this.symptomAnalyses = JSON.parse(symptomsData);
      }
      if (recommendationsData) {
        this.medicationRecommendations = JSON.parse(recommendationsData);
      }
      if (insightsData) {
        this.healthInsights = JSON.parse(insightsData);
      }
      if (voiceData) {
        this.voiceNotes = JSON.parse(voiceData);
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  }

  private async saveData() {
    try {
      await Promise.all([
        AsyncStorage.setItem('drug_interactions', JSON.stringify(this.drugInteractions)),
        AsyncStorage.setItem('symptom_analyses', JSON.stringify(this.symptomAnalyses)),
        AsyncStorage.setItem('medication_recommendations', JSON.stringify(this.medicationRecommendations)),
        AsyncStorage.setItem('health_insights', JSON.stringify(this.healthInsights)),
        AsyncStorage.setItem('voice_notes', JSON.stringify(this.voiceNotes))
      ]);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  // Drug Interaction Checking
  async checkDrugInteractions(medications: string[]): Promise<DrugInteraction[]> {
    const interactions: DrugInteraction[] = [];
    
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const drug1 = medications[i].toLowerCase();
        const drug2 = medications[j].toLowerCase();
        
        // Check against database
        const interaction = this.drugInteractionDatabase.find(interaction => 
          (interaction.drug1.toLowerCase().includes(drug1) || drug1.includes(interaction.drug1.toLowerCase())) &&
          (interaction.drug2.toLowerCase().includes(drug2) || drug2.includes(interaction.drug2.toLowerCase()))
        );
        
        if (interaction) {
          interactions.push({
            ...interaction,
            id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            drug1: medications[i],
            drug2: medications[j]
          });
        }
      }
    }

    // Store interactions for history
    this.drugInteractions.push(...interactions);
    await this.saveData();

    return interactions;
  }

  async getDrugInteractionHistory(): Promise<DrugInteraction[]> {
    return this.drugInteractions.sort((a, b) => 
      new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime()
    );
  }

  // Symptom Analysis
  async analyzeSymptoms(symptoms: string[], additionalInfo?: string): Promise<SymptomAnalysis> {
    const analysis: SymptomAnalysis = {
      id: `symptom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symptoms,
      severity: this.assessSymptomSeverity(symptoms),
      possibleConditions: this.generatePossibleConditions(symptoms),
      urgency: this.assessUrgency(symptoms),
      recommendations: this.generateSymptomRecommendations(symptoms),
      followUpActions: this.generateFollowUpActions(symptoms),
      createdAt: new Date().toISOString()
    };

    this.symptomAnalyses.push(analysis);
    await this.saveData();

    // Generate insight if high urgency
    if (analysis.urgency === 'emergency' || analysis.urgency === 'high') {
      await this.generateUrgencyInsight(analysis);
    }

    return analysis;
  }

  private assessSymptomSeverity(symptoms: string[]): 'mild' | 'moderate' | 'severe' | 'emergency' {
    const emergencySymptoms = ['chest pain', 'difficulty breathing', 'severe headache', 'loss of consciousness', 'severe bleeding'];
    const severeSymptoms = ['high fever', 'severe pain', 'nausea', 'vomiting', 'dizziness'];
    
    if (symptoms.some(s => emergencySymptoms.some(es => s.toLowerCase().includes(es)))) {
      return 'emergency';
    }
    if (symptoms.some(s => severeSymptoms.some(ss => s.toLowerCase().includes(ss)))) {
      return 'severe';
    }
    if (symptoms.length > 3) {
      return 'moderate';
    }
    return 'mild';
  }

  private generatePossibleConditions(symptoms: string[]): SymptomAnalysis['possibleConditions'] {
    // Simplified condition matching - in production, use comprehensive medical database
    const conditionMap: { [key: string]: { condition: string; probability: number; description: string; recommendations: string[] } } = {
      'fever': {
        condition: 'Viral Infection',
        probability: 0.7,
        description: 'Common viral infection causing fever and general malaise',
        recommendations: ['Rest and hydration', 'Over-the-counter fever reducers', 'Monitor temperature']
      },
      'headache': {
        condition: 'Tension Headache',
        probability: 0.6,
        description: 'Stress-related headache affecting the head and neck',
        recommendations: ['Rest in quiet environment', 'Apply cold compress', 'Consider pain relief medication']
      },
      'cough': {
        condition: 'Upper Respiratory Infection',
        probability: 0.8,
        description: 'Infection of the upper respiratory tract',
        recommendations: ['Stay hydrated', 'Use cough suppressants if needed', 'Rest and avoid irritants']
      }
    };

    const conditions: SymptomAnalysis['possibleConditions'] = [];
    
    symptoms.forEach(symptom => {
      const lowerSymptom = symptom.toLowerCase();
      Object.keys(conditionMap).forEach(key => {
        if (lowerSymptom.includes(key)) {
          conditions.push(conditionMap[key]);
        }
      });
    });

    // If no specific conditions found, provide general guidance
    if (conditions.length === 0) {
      conditions.push({
        condition: 'General Symptoms',
        probability: 0.5,
        description: 'Multiple symptoms that may indicate various conditions',
        recommendations: ['Monitor symptoms closely', 'Consider consulting healthcare provider', 'Maintain good hydration and rest']
      });
    }

    return conditions.sort((a, b) => b.probability - a.probability);
  }

  private assessUrgency(symptoms: string[]): 'low' | 'medium' | 'high' | 'emergency' {
    const emergencyKeywords = ['chest pain', 'difficulty breathing', 'severe', 'emergency', 'unconscious'];
    const highUrgencyKeywords = ['severe pain', 'high fever', 'bleeding', 'dizziness', 'confusion'];
    
    if (symptoms.some(s => emergencyKeywords.some(ek => s.toLowerCase().includes(ek)))) {
      return 'emergency';
    }
    if (symptoms.some(s => highUrgencyKeywords.some(hk => s.toLowerCase().includes(hk)))) {
      return 'high';
    }
    if (symptoms.length > 2) {
      return 'medium';
    }
    return 'low';
  }

  private generateSymptomRecommendations(symptoms: string[]): string[] {
    const recommendations: string[] = [];
    
    if (symptoms.some(s => s.toLowerCase().includes('fever'))) {
      recommendations.push('Monitor temperature regularly');
      recommendations.push('Stay hydrated with water and electrolyte drinks');
    }
    
    if (symptoms.some(s => s.toLowerCase().includes('pain'))) {
      recommendations.push('Apply cold or warm compress as appropriate');
      recommendations.push('Consider over-the-counter pain relief');
    }
    
    if (symptoms.some(s => s.toLowerCase().includes('cough'))) {
      recommendations.push('Use humidifier to moisten air');
      recommendations.push('Avoid irritants like smoke and dust');
    }
    
    recommendations.push('Get adequate rest and sleep');
    recommendations.push('Maintain good nutrition');
    
    return recommendations;
  }

  private generateFollowUpActions(symptoms: string[]): string[] {
    const actions: string[] = [];
    
    if (symptoms.length > 2) {
      actions.push('Schedule appointment with primary care physician');
    }
    
    if (symptoms.some(s => s.toLowerCase().includes('severe'))) {
      actions.push('Consider urgent care or emergency room visit');
    }
    
    actions.push('Monitor symptoms for 24-48 hours');
    actions.push('Keep symptom diary for healthcare provider');
    
    return actions;
  }

  // Medication Recommendations
  async generateMedicationRecommendations(condition: string, patientProfile?: any): Promise<MedicationRecommendation> {
    const recommendation: MedicationRecommendation = {
      id: `recommendation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      condition,
      recommendedMedications: this.getRecommendedMedications(condition),
      alternativeOptions: this.getAlternativeMedications(condition),
      lifestyleRecommendations: this.getLifestyleRecommendations(condition),
      monitoringRequirements: this.getMonitoringRequirements(condition),
      createdAt: new Date().toISOString()
    };

    this.medicationRecommendations.push(recommendation);
    await this.saveData();

    return recommendation;
  }

  private getRecommendedMedications(condition: string): MedicationRecommendation['recommendedMedications'] {
    // Simplified medication recommendations - in production, use comprehensive medical database
    const medicationMap: { [key: string]: MedicationRecommendation['recommendedMedications'] } = {
      'hypertension': [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          duration: 'Long-term',
          reasoning: 'ACE inhibitor, first-line treatment for hypertension',
          sideEffects: ['Dry cough', 'Dizziness', 'Fatigue'],
          interactions: ['Potassium supplements', 'NSAIDs']
        }
      ],
      'diabetes': [
        {
          name: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
          duration: 'Long-term',
          reasoning: 'First-line treatment for type 2 diabetes',
          sideEffects: ['Nausea', 'Diarrhea', 'Metallic taste'],
          interactions: ['Contrast dye', 'Alcohol']
        }
      ],
      'pain': [
        {
          name: 'Ibuprofen',
          dosage: '400mg',
          frequency: 'Every 6-8 hours',
          duration: 'Short-term',
          reasoning: 'NSAID for pain and inflammation',
          sideEffects: ['Stomach upset', 'Dizziness', 'Headache'],
          interactions: ['Warfarin', 'ACE inhibitors']
        }
      ]
    };

    const lowerCondition = condition.toLowerCase();
    for (const key in medicationMap) {
      if (lowerCondition.includes(key)) {
        return medicationMap[key];
      }
    }

    return [{
      name: 'Consult Healthcare Provider',
      dosage: 'As prescribed',
      frequency: 'As directed',
      duration: 'As needed',
      reasoning: 'Professional medical evaluation required',
      sideEffects: ['Varies by medication'],
      interactions: ['Varies by medication']
    }];
  }

  private getAlternativeMedications(condition: string): MedicationRecommendation['alternativeOptions'] {
    return [
      {
        name: 'Natural Remedies',
        reasoning: 'May provide relief with fewer side effects',
        pros: ['Fewer side effects', 'Natural approach', 'Cost-effective'],
        cons: ['Limited evidence', 'May not be as effective', 'Interactions possible']
      },
      {
        name: 'Lifestyle Modifications',
        reasoning: 'Address underlying causes through behavior changes',
        pros: ['No side effects', 'Long-term benefits', 'Cost-effective'],
        cons: ['Requires commitment', 'May take time to see results', 'Not always sufficient']
      }
    ];
  }

  private getLifestyleRecommendations(condition: string): string[] {
    const recommendations: string[] = [];
    
    if (condition.toLowerCase().includes('hypertension')) {
      recommendations.push('Reduce sodium intake to less than 2g per day');
      recommendations.push('Engage in regular aerobic exercise');
      recommendations.push('Maintain healthy weight');
      recommendations.push('Limit alcohol consumption');
    }
    
    if (condition.toLowerCase().includes('diabetes')) {
      recommendations.push('Follow carbohydrate-controlled diet');
      recommendations.push('Monitor blood glucose regularly');
      recommendations.push('Engage in regular physical activity');
      recommendations.push('Maintain consistent meal timing');
    }
    
    recommendations.push('Get adequate sleep (7-9 hours)');
    recommendations.push('Manage stress through relaxation techniques');
    recommendations.push('Stay hydrated with water');
    
    return recommendations;
  }

  private getMonitoringRequirements(condition: string): string[] {
    const requirements: string[] = [];
    
    if (condition.toLowerCase().includes('hypertension')) {
      requirements.push('Monitor blood pressure daily');
      requirements.push('Regular kidney function tests');
      requirements.push('Annual eye examination');
    }
    
    if (condition.toLowerCase().includes('diabetes')) {
      requirements.push('Daily blood glucose monitoring');
      requirements.push('Quarterly HbA1c testing');
      requirements.push('Annual comprehensive eye exam');
      requirements.push('Regular foot examinations');
    }
    
    requirements.push('Regular follow-up with healthcare provider');
    requirements.push('Monitor for medication side effects');
    
    return requirements;
  }

  // Health Insights Generation
  async generateInitialInsights(): Promise<void> {
    try {
      // Generate insights based on existing data
      const insights = await this.analyzeHealthPatterns();
      this.healthInsights.push(...insights);
      await this.saveData();
    } catch (error) {
      console.error('Failed to generate initial insights:', error);
    }
  }

  private async analyzeHealthPatterns(): Promise<HealthInsight[]> {
    const insights: HealthInsight[] = [];
    
    // Analyze medication adherence
    const adherence = await this.healthMetrics.getOverallAdherence();
    if (adherence < 80) {
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'medication_adherence',
        title: 'Medication Adherence Alert',
        description: `Your medication adherence rate is ${adherence.toFixed(1)}%, which is below the recommended 80%.`,
        severity: 'warning',
        actionable: true,
        actionItems: ['Set up medication reminders', 'Use pill organizer', 'Discuss with healthcare provider'],
        relatedData: { adherenceRate: adherence },
        confidence: 0.9,
        createdAt: new Date().toISOString()
      });
    }

    // Analyze appointment patterns
    const stats = await this.appointmentService.getAppointmentStats();
    if (stats.upcomingAppointments === 0) {
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'appointment_reminder',
        title: 'Schedule Regular Checkup',
        description: 'You have no upcoming appointments scheduled. Consider scheduling a routine checkup.',
        severity: 'info',
        actionable: true,
        actionItems: ['Schedule annual physical', 'Book routine lab work', 'Update vaccination records'],
        relatedData: { appointmentStats: stats },
        confidence: 0.8,
        createdAt: new Date().toISOString()
      });
    }

    return insights;
  }

  private async generateUrgencyInsight(analysis: SymptomAnalysis): Promise<void> {
    const insight: HealthInsight = {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'symptom_pattern',
      title: 'High Priority Symptom Analysis',
      description: `Your symptoms require immediate attention: ${analysis.symptoms.join(', ')}`,
      severity: analysis.urgency === 'emergency' ? 'critical' : 'warning',
      actionable: true,
      actionItems: analysis.followUpActions,
      relatedData: { symptomAnalysis: analysis },
      confidence: 0.9,
      createdAt: new Date().toISOString()
    };

    this.healthInsights.push(insight);
    await this.saveData();
  }

  // Voice Notes
  async addVoiceNote(transcription: string, type: VoiceNote['type'], audioUri?: string, duration?: number): Promise<VoiceNote> {
    const voiceNote: VoiceNote = {
      id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      transcription,
      audioUri,
      duration: duration || 0,
      createdAt: new Date().toISOString(),
      processed: false,
      extractedEntities: this.extractEntitiesFromText(transcription)
    };

    this.voiceNotes.push(voiceNote);
    await this.saveData();

    // Process the voice note
    await this.processVoiceNote(voiceNote);

    return voiceNote;
  }

  private extractEntitiesFromText(text: string): VoiceNote['extractedEntities'] {
    const lowerText = text.toLowerCase();
    
    // Simple entity extraction - in production, use NLP libraries
    const medications = ['aspirin', 'ibuprofen', 'metformin', 'lisinopril', 'warfarin'];
    const symptoms = ['pain', 'fever', 'headache', 'nausea', 'dizziness', 'fatigue'];
    const severityKeywords = ['mild', 'moderate', 'severe', 'intense', 'unbearable'];
    
    const extractedMedications = medications.filter(med => lowerText.includes(med));
    const extractedSymptoms = symptoms.filter(symptom => lowerText.includes(symptom));
    const extractedSeverity = severityKeywords.find(severity => lowerText.includes(severity)) || 'mild';
    
    return {
      medications: extractedMedications,
      symptoms: extractedSymptoms,
      dates: [], // Would extract dates in production
      severity: extractedSeverity
    };
  }

  private async processVoiceNote(voiceNote: VoiceNote): Promise<void> {
    // Process the voice note and generate insights
    if (voiceNote.extractedEntities?.symptoms.length > 0) {
      const analysis = await this.analyzeSymptoms(voiceNote.extractedEntities.symptoms);
      // Could generate insights based on voice note analysis
    }
    
    voiceNote.processed = true;
    await this.saveData();
  }

  // Getter methods
  async getHealthInsights(): Promise<HealthInsight[]> {
    return this.healthInsights.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getSymptomAnalyses(): Promise<SymptomAnalysis[]> {
    return this.symptomAnalyses.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getVoiceNotes(): Promise<VoiceNote[]> {
    return this.voiceNotes.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getMedicationRecommendations(): Promise<MedicationRecommendation[]> {
    return this.medicationRecommendations.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Utility methods
  async clearInsights(): Promise<void> {
    this.healthInsights = [];
    await this.saveData();
  }

  async deleteInsight(id: string): Promise<boolean> {
    const index = this.healthInsights.findIndex(insight => insight.id === id);
    if (index !== -1) {
      this.healthInsights.splice(index, 1);
      await this.saveData();
      return true;
    }
    return false;
  }
}

export default AIHealthService;
