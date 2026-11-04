import { getRegion } from './region';
import uiI18n from "../i18n";
import { symptomInformation } from './symptomInformation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SmartNotificationService from './smartNotifications';
import HealthMetricsService from './healthMetrics';
import AppointmentService from './appointmentService';

export interface DrugInteraction {
  createdAt?: string;
  id: string;
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  clinicalEffects: string[];
  management: string;
  references: string[];
}

export type SymptomAnalysis = ReturnType<typeof symptomInformation>;

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
      drug2: "Aspirin",
      severity: 'major',
      get description() { return uiI18n.t("ui.increasedRiskOfBleedingWhenTakenTogether"); },
      get clinicalEffects() { return [uiI18n.t("ui.increasedBleedingRisk"), uiI18n.t("ui.prolongedBleedingTime"), uiI18n.t("ui.bruising")]; },
      get management() { return uiI18n.t("ui.possibleInteractionDonTChangeOrStopAnyMedicineWithoutTalkingToYourDoctorOrPharmacistPosibl"); },
      get references() { return [uiI18n.t("ai.drugInteractionDatabase"), uiI18n.t("ui.clinicalPharmacology")]; }
    },
    {
      id: 'metformin_contrast',
      drug1: "Metformin",
      drug2: "Contrast Dye",
      severity: 'major',
      get description() { return uiI18n.t("ui.riskOfLacticAcidosisWithContrastMedia"); },
      get clinicalEffects() { return [uiI18n.t("ui.lacticAcidosis"), uiI18n.t("ui.kidneyDamage"), uiI18n.t("ui.metabolicAcidosis")]; },
      get management() { return uiI18n.t("ui.possibleInteractionDonTChangeOrStopAnyMedicineWithoutTalkingToYourDoctorOrPharmacistPosibl"); },
      get references() { return [uiI18n.t("ui.radiologyGuidelines"), uiI18n.t("ui.diabetesManagement")]; }
    },
    {
      id: 'statin_grapefruit',
      drug1: "Statins",
      drug2: "Grapefruit Juice",
      severity: 'moderate',
      get description() { return uiI18n.t("ui.grapefruitJuiceIncreasesStatinLevels"); },
      get clinicalEffects() { return [uiI18n.t("ui.increasedStatinLevels"), uiI18n.t("ui.musclePain"), uiI18n.t("ui.liverToxicity")]; },
      get management() { return uiI18n.t("ui.possibleInteractionDonTChangeOrStopAnyMedicineWithoutTalkingToYourDoctorOrPharmacistPosibl"); },
      get references() { return [uiI18n.t("ui.foodDrugInteractions"), uiI18n.t("ui.cardiologyGuidelines")]; }
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
        this.symptomAnalyses = JSON.parse(symptomsData).map((entry: any) => symptomInformation(entry.symptoms || [], 'en'));
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
    if (getRegion() === 'US') throw new Error('US interactions require a DailyMed label lookup with source and date.');
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

  // General information only; never generate diagnoses or probability scores.
  async analyzeSymptoms(symptoms: string[], additionalInfo?: string, language = 'en'): Promise<SymptomAnalysis> {
    const information = symptomInformation(symptoms, language, additionalInfo);
    this.symptomAnalyses.push(information);
    await this.saveData();
    return information;
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
          frequency: uiI18n.t("ui.onceDaily"),
          duration: uiI18n.t("ui.longTerm"),
          reasoning: uiI18n.t("ui.aceInhibitorFirstLineTreatmentForHypertension"),
          sideEffects: [uiI18n.t("ui.dryCough"), uiI18n.t("ui.dizziness"), uiI18n.t("ui.fatigue")],
          interactions: [uiI18n.t("ui.potassiumSupplements"), 'NSAIDs']
        }
      ],
      'diabetes': [
        {
          name: uiI18n.t("ai.metformin"),
          dosage: '500mg',
          frequency: uiI18n.t("ui.twiceDaily"),
          duration: uiI18n.t("ui.longTerm"),
          reasoning: uiI18n.t("ui.firstLineTreatmentForType2Diabetes"),
          sideEffects: [uiI18n.t("ui.nausea"), uiI18n.t("ai.diarrhea"), uiI18n.t("ui.metallicTaste")],
          interactions: [uiI18n.t("ui.contrastDye_99c59b"), uiI18n.t("ui.alcohol")]
        }
      ],
      'pain': [
        {
          name: 'Ibuprofen',
          dosage: '400mg',
          frequency: uiI18n.t("ui.every68Hours"),
          duration: uiI18n.t("ui.shortTerm"),
          reasoning: uiI18n.t("ui.nsaidForPainAndInflammation"),
          sideEffects: [uiI18n.t("ai.stomachUpset"), uiI18n.t("ui.dizziness"), uiI18n.t("ui.headache")],
          interactions: ['Warfarin', uiI18n.t("ui.aceInhibitors")]
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
      name: uiI18n.t("ui.consultHealthcareProvider"),
      dosage: uiI18n.t("ui.asPrescribed"),
      frequency: uiI18n.t("ui.asDirected"),
      duration: uiI18n.t("ui.asNeeded"),
      reasoning: uiI18n.t("ui.professionalMedicalEvaluationRequired"),
      sideEffects: [uiI18n.t("ui.variesByMedication")],
      interactions: [uiI18n.t("ui.variesByMedication")]
    }];
  }

  private getAlternativeMedications(condition: string): MedicationRecommendation['alternativeOptions'] {
    return [
      {
        name: uiI18n.t("ui.naturalRemedies"),
        reasoning: uiI18n.t("ui.mayProvideReliefWithFewerSideEffects"),
        pros: [uiI18n.t("ui.fewerSideEffects"), uiI18n.t("ui.naturalApproach"), uiI18n.t("ui.costEffective")],
        cons: [uiI18n.t("ui.limitedEvidence"), uiI18n.t("ui.mayNotBeAsEffective"), uiI18n.t("ui.interactionsPossible")]
      },
      {
        name: uiI18n.t("ui.lifestyleModifications"),
        reasoning: uiI18n.t("ui.addressUnderlyingCausesThroughBehaviorChanges"),
        pros: [uiI18n.t("ui.noSideEffects"), uiI18n.t("ui.longTermBenefits"), uiI18n.t("ui.costEffective")],
        cons: [uiI18n.t("ui.requiresCommitment"), uiI18n.t("ui.mayTakeTimeToSeeResults"), uiI18n.t("ui.notAlwaysSufficient")]
      }
    ];
  }

  private getLifestyleRecommendations(condition: string): string[] {
    const recommendations: string[] = [];
    
    if (condition.toLowerCase().includes('hypertension')) {
      recommendations.push(uiI18n.t("ui.reduceSodiumIntakeToLessThan2gPerDay"));
      recommendations.push(uiI18n.t("ui.engageInRegularAerobicExercise"));
      recommendations.push(uiI18n.t("ui.maintainHealthyWeight"));
      recommendations.push(uiI18n.t("ui.limitAlcoholConsumption"));
    }
    
    if (condition.toLowerCase().includes('diabetes')) {
      recommendations.push(uiI18n.t("ui.followCarbohydrateControlledDiet"));
      recommendations.push(uiI18n.t("ui.monitorBloodGlucoseRegularly"));
      recommendations.push(uiI18n.t("ui.engageInRegularPhysicalActivity"));
      recommendations.push(uiI18n.t("ui.maintainConsistentMealTiming"));
    }
    
    recommendations.push(uiI18n.t("ui.getAdequateSleep79Hours"));
    recommendations.push(uiI18n.t("ui.manageStressThroughRelaxationTechniques"));
    recommendations.push(uiI18n.t("ui.stayHydratedWithWater"));
    
    return recommendations;
  }

  private getMonitoringRequirements(condition: string): string[] {
    const requirements: string[] = [];
    
    if (condition.toLowerCase().includes('hypertension')) {
      requirements.push(uiI18n.t("ui.monitorBloodPressureDaily"));
      requirements.push(uiI18n.t("ui.regularKidneyFunctionTests"));
      requirements.push(uiI18n.t("ui.annualEyeExamination"));
    }
    
    if (condition.toLowerCase().includes('diabetes')) {
      requirements.push(uiI18n.t("ui.dailyBloodGlucoseMonitoring"));
      requirements.push(uiI18n.t("ui.quarterlyHba1cTesting"));
      requirements.push(uiI18n.t("ui.annualComprehensiveEyeExam"));
      requirements.push(uiI18n.t("ui.regularFootExaminations"));
    }
    
    requirements.push(uiI18n.t("ui.regularFollowUpWithHealthcareProvider"));
    requirements.push(uiI18n.t("ui.monitorForMedicationSideEffects"));
    
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
        title: uiI18n.t("ui.medicationAdherenceAlert"),
        description: uiI18n.t("ui.yourMedicationAdherenceRateIsValueWhichIsBelowTheRecommended80", { value1: adherence.toFixed(1) }),
        severity: 'warning',
        actionable: true,
        actionItems: [uiI18n.t("ui.setUpMedicationReminders"), uiI18n.t("ui.usePillOrganizer"), uiI18n.t("ui.discussWithHealthcareProvider")],
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
        title: uiI18n.t("ui.scheduleRegularCheckup"),
        description: uiI18n.t("ui.youHaveNoUpcomingAppointmentsScheduledConsiderSchedulingARoutineCheckup"),
        severity: 'info',
        actionable: true,
        actionItems: [uiI18n.t("ui.scheduleAnnualPhysical"), uiI18n.t("ui.bookRoutineLabWork"), uiI18n.t("ui.updateVaccinationRecords")],
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
      title: uiI18n.t("ui.highPrioritySymptomAnalysis"),
      description: uiI18n.t("ui.yourSymptomsRequireImmediateAttentionValue", { value1: analysis.symptoms.join(', ') }),
      severity: 'warning',
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
    if (voiceNote.extractedEntities && voiceNote.extractedEntities.symptoms.length > 0) {
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
