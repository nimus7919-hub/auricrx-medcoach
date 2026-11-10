import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export interface HabitEntry {
  id: string;
  date: string;
  sleep?: number;
  water?: number;
  steps?: number;
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  sweetDrinks?: number;
  notes?: string;
}

export interface HabitReminder {
  id: string;
  habitType: 'water' | 'sleep' | 'general';
  time: string;
  enabled: boolean;
  notificationId?: string;
  message: string;
}

export interface HealthConnectConsent {
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
}

const STORAGE_KEYS = {
  ENTRIES: 'dailyHabits:entries',
  REMINDERS: 'dailyHabits:reminders',
  HC_CONSENT: 'dailyHabits:healthConnectConsent',
};

class DailyHabitsService {
  private static instance: DailyHabitsService;

  static getInstance() {
    if (!this.instance) {
      this.instance = new DailyHabitsService();
    }
    return this.instance;
  }

  async getEntries(startDate?: Date, endDate?: Date): Promise<HabitEntry[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      let entries: HabitEntry[] = data ? JSON.parse(data) : [];
      
      if (startDate) {
        entries = entries.filter(e => new Date(e.date) >= startDate);
      }
      if (endDate) {
        entries = entries.filter(e => new Date(e.date) <= endDate);
      }
      
      return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error loading habit entries:', error);
      return [];
    }
  }

  async getTodayEntry(): Promise<HabitEntry | null> {
    const today = new Date().toISOString().split('T')[0];
    const entries = await this.getEntries();
    return entries.find(e => e.date.startsWith(today)) || null;
  }

  async saveEntry(entry: Omit<HabitEntry, 'id'>): Promise<HabitEntry> {
    const entries = await this.getEntries();
    const dateKey = entry.date.split('T')[0];
    
    const existingIndex = entries.findIndex(e => e.date.startsWith(dateKey));
    
    if (existingIndex !== -1) {
      entries[existingIndex] = { ...entries[existingIndex], ...entry };
      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      return entries[existingIndex];
    } else {
      const newEntry: HabitEntry = {
        ...entry,
        id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      entries.push(newEntry);
      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      return newEntry;
    }
  }

  async getReminders(): Promise<HabitReminder[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading habit reminders:', error);
      return [];
    }
  }

  async addReminder(reminder: Omit<HabitReminder, 'id' | 'notificationId'>): Promise<HabitReminder> {
    const reminders = await this.getReminders();
    const newReminder: HabitReminder = {
      ...reminder,
      id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    if (reminder.enabled) {
      try {
        const [hours, minutes] = reminder.time.split(':').map(Number);
        const now = new Date();
        const scheduledDate = new Date();
        scheduledDate.setHours(hours, minutes, 0, 0);
        
        if (scheduledDate <= now) {
          scheduledDate.setDate(scheduledDate.getDate() + 1);
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🌟 Recordatorio de Hábito',
            body: reminder.message,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.DEFAULT,
          },
          trigger: {
            type: 'daily',
            hour: hours,
            minute: minutes,
          } as Notifications.NotificationTriggerInput,
        });
        newReminder.notificationId = notificationId;
      } catch (error) {
        console.error('Error scheduling habit reminder:', error);
      }
    }

    reminders.push(newReminder);
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    return newReminder;
  }

  async updateReminder(id: string, updates: Partial<HabitReminder>): Promise<void> {
    const reminders = await this.getReminders();
    const index = reminders.findIndex(r => r.id === id);
    
    if (index !== -1) {
      const existing = reminders[index];
      
      if (existing.notificationId && (updates.enabled === false || updates.time)) {
        try {
          await Notifications.cancelScheduledNotificationAsync(existing.notificationId);
        } catch (error) {
          console.error('Error canceling notification:', error);
        }
      }

      reminders[index] = { ...existing, ...updates };

      if (updates.enabled && updates.time) {
        try {
          const [hours, minutes] = updates.time.split(':').map(Number);
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: '🌟 Recordatorio de Hábito',
              body: reminders[index].message,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.DEFAULT,
            },
            trigger: {
              type: 'daily',
              hour: hours,
              minute: minutes,
            } as Notifications.NotificationTriggerInput,
          });
          reminders[index].notificationId = notificationId;
        } catch (error) {
          console.error('Error rescheduling notification:', error);
        }
      }

      await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    }
  }

  async deleteReminder(id: string): Promise<void> {
    const reminders = await this.getReminders();
    const reminder = reminders.find(r => r.id === id);
    
    if (reminder?.notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
      } catch (error) {
        console.error('Error canceling notification:', error);
      }
    }

    const filtered = reminders.filter(r => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(filtered));
  }

  async getHealthConnectConsent(): Promise<HealthConnectConsent> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.HC_CONSENT);
      return data ? JSON.parse(data) : { granted: false };
    } catch (error) {
      console.error('Error loading Health Connect consent:', error);
      return { granted: false };
    }
  }

  async grantHealthConnectConsent(): Promise<void> {
    const consent: HealthConnectConsent = {
      granted: true,
      grantedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.HC_CONSENT, JSON.stringify(consent));
  }

  async revokeHealthConnectConsent(): Promise<void> {
    const consent: HealthConnectConsent = {
      granted: false,
      revokedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.HC_CONSENT, JSON.stringify(consent));
  }
}

export default DailyHabitsService;
