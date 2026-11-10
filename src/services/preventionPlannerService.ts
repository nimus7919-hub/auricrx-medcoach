import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export interface CheckupTemplate {
  id: string;
  nameKey: string;
  descriptionKey: string;
  recommendedFrequency: 'yearly' | 'every6months' | 'custom';
  category: 'screening' | 'checkup' | 'vaccine';
  ageRecommendation?: { min?: number; max?: number };
  gender?: 'male' | 'female' | 'any';
  region?: 'MX' | 'US' | 'any';
  guidelineUrl?: string;
}

export interface ScheduledCheckup {
  id: string;
  templateId?: string;
  name: string;
  description: string;
  category: 'screening' | 'checkup' | 'vaccine';
  scheduledDate: string;
  completed: boolean;
  completedDate?: string;
  notes?: string;
  notificationId?: string;
  guidelineUrl?: string;
}

const STORAGE_KEY = 'preventionPlanner:checkups';

class PreventionPlannerService {
  private static instance: PreventionPlannerService;

  static getInstance() {
    if (!this.instance) {
      this.instance = new PreventionPlannerService();
    }
    return this.instance;
  }

  getTemplates(region: 'MX' | 'US' = 'MX'): CheckupTemplate[] {
    return [
      {
        id: 'glucose_screening',
        nameKey: 'prevention.templates.glucoseScreening',
        descriptionKey: 'prevention.templates.glucoseScreeningDesc',
        recommendedFrequency: 'yearly',
        category: 'screening',
        region: 'any',
        guidelineUrl: 'https://www.who.int/news-room/fact-sheets/detail/diabetes',
      },
      {
        id: 'blood_pressure',
        nameKey: 'prevention.templates.bloodPressure',
        descriptionKey: 'prevention.templates.bloodPressureDesc',
        recommendedFrequency: 'yearly',
        category: 'screening',
        region: 'any',
        guidelineUrl: 'https://www.who.int/news-room/fact-sheets/detail/hypertension',
      },
      {
        id: 'pap_test',
        nameKey: 'prevention.templates.papTest',
        descriptionKey: 'prevention.templates.papTestDesc',
        recommendedFrequency: 'yearly',
        category: 'screening',
        gender: 'female',
        ageRecommendation: { min: 21, max: 65 },
        region: 'any',
        guidelineUrl: region === 'US' 
          ? 'https://medlineplus.gov/lab-tests/pap-smear/'
          : 'https://www.gob.mx/salud/articulos/cancer-cervicouterino',
      },
      {
        id: 'general_checkup',
        nameKey: 'prevention.templates.generalCheckup',
        descriptionKey: 'prevention.templates.generalCheckupDesc',
        recommendedFrequency: 'yearly',
        category: 'checkup',
        region: 'any',
      },
      {
        id: 'flu_vaccine',
        nameKey: 'prevention.templates.fluVaccine',
        descriptionKey: 'prevention.templates.fluVaccineDesc',
        recommendedFrequency: 'yearly',
        category: 'vaccine',
        region: 'any',
        guidelineUrl: region === 'US'
          ? 'https://www.cdc.gov/flu/prevent/vaccinations.htm'
          : 'https://www.gob.mx/salud/articulos/campana-de-vacunacion',
      },
      {
        id: 'cholesterol',
        nameKey: 'prevention.templates.cholesterol',
        descriptionKey: 'prevention.templates.cholesterolDesc',
        recommendedFrequency: 'yearly',
        category: 'screening',
        ageRecommendation: { min: 20 },
        region: 'any',
        guidelineUrl: 'https://medlineplus.gov/cholesterollevelswhatyouneedtoknow.html',
      },
      {
        id: 'dental_checkup',
        nameKey: 'prevention.templates.dentalCheckup',
        descriptionKey: 'prevention.templates.dentalCheckupDesc',
        recommendedFrequency: 'every6months',
        category: 'checkup',
        region: 'any',
      },
      {
        id: 'eye_exam',
        nameKey: 'prevention.templates.eyeExam',
        descriptionKey: 'prevention.templates.eyeExamDesc',
        recommendedFrequency: 'yearly',
        category: 'checkup',
        region: 'any',
      },
    ];
  }

  async getScheduledCheckups(): Promise<ScheduledCheckup[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const checkups: ScheduledCheckup[] = data ? JSON.parse(data) : [];
      return checkups.sort((a, b) => 
        new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      );
    } catch (error) {
      console.error('Error loading scheduled checkups:', error);
      return [];
    }
  }

  async addCheckup(checkup: Omit<ScheduledCheckup, 'id'>): Promise<ScheduledCheckup> {
    const checkups = await this.getScheduledCheckups();
    const newCheckup: ScheduledCheckup = {
      ...checkup,
      id: `checkup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const scheduledDate = new Date(checkup.scheduledDate);
    if (scheduledDate > new Date()) {
      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🩺 Recordatorio de Prevención',
            body: `${checkup.name} - Es hora de tu cita o revisión preventiva`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            date: scheduledDate,
          },
        });
        newCheckup.notificationId = notificationId;
      } catch (error) {
        console.error('Error scheduling notification:', error);
      }
    }

    checkups.push(newCheckup);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checkups));
    return newCheckup;
  }

  async updateCheckup(id: string, updates: Partial<ScheduledCheckup>): Promise<void> {
    const checkups = await this.getScheduledCheckups();
    const index = checkups.findIndex(c => c.id === id);
    
    if (index !== -1) {
      const existing = checkups[index];
      
      if (existing.notificationId && updates.scheduledDate) {
        try {
          await Notifications.cancelScheduledNotificationAsync(existing.notificationId);
        } catch (error) {
          console.error('Error canceling notification:', error);
        }
      }

      checkups[index] = { ...existing, ...updates };

      if (updates.scheduledDate && !updates.completed) {
        const scheduledDate = new Date(updates.scheduledDate);
        if (scheduledDate > new Date()) {
          try {
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title: '🩺 Recordatorio de Prevención',
                body: `${checkups[index].name} - Es hora de tu cita o revisión preventiva`,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: {
                date: scheduledDate,
              },
            });
            checkups[index].notificationId = notificationId;
          } catch (error) {
            console.error('Error rescheduling notification:', error);
          }
        }
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checkups));
    }
  }

  async deleteCheckup(id: string): Promise<void> {
    const checkups = await this.getScheduledCheckups();
    const checkup = checkups.find(c => c.id === id);
    
    if (checkup?.notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(checkup.notificationId);
      } catch (error) {
        console.error('Error canceling notification:', error);
      }
    }

    const filtered = checkups.filter(c => c.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  async markCompleted(id: string, notes?: string): Promise<void> {
    await this.updateCheckup(id, {
      completed: true,
      completedDate: new Date().toISOString(),
      notes,
    });
  }
}

export default PreventionPlannerService;
