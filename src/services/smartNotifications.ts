import uiI18n from "../i18n";
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import with fallback for development
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('expo-notifications not available:', error);
}

export interface SmartNotification {
  id: string;
  type: 'location' | 'weather' | 'refill' | 'intelligent' | 'context';
  title: string;
  message: string;
  trigger: {
    type: 'location' | 'time' | 'weather' | 'usage';
    conditions: any;
  };
  medicationId?: string;
  enabled: boolean;
  createdAt: string;
  lastTriggered?: string;
}

export interface LocationReminder {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  medicationId?: string;
  message: string;
  enabled: boolean;
}

export interface WeatherAlert {
  id: string;
  medicationId: string;
  weatherCondition: 'pollen' | 'temperature' | 'humidity' | 'air_quality';
  threshold: number;
  message: string;
  enabled: boolean;
}

export interface UsagePattern {
  medicationId: string;
  averageInterval: number; // hours between doses
  lastTaken: string;
  consistency: number; // 0-1, how consistent the user is
  predictedNextDose: string;
}

class SmartNotificationService {
  private static instance: SmartNotificationService;
  private notifications: SmartNotification[] = [];
  private locationReminders: LocationReminder[] = [];
  private weatherAlerts: WeatherAlert[] = [];
  private usagePatterns: Map<string, UsagePattern> = new Map();
  private isLocationTracking = false;
  private currentLocation: { lat: number; lon: number } | null = null;

  static getInstance(): SmartNotificationService {
    if (!SmartNotificationService.instance) {
      SmartNotificationService.instance = new SmartNotificationService();
    }
    return SmartNotificationService.instance;
  }

  async initialize() {
    try {
      // Load saved data first (this should always work)
      await this.loadSavedData();
      
      // Request permissions (don't fail if this doesn't work)
      try {
        await this.requestPermissions();
      } catch (error) {
        console.warn('⚠️ Permission request failed, continuing without permissions:', error);
      }
      
      // Proximity tracking disabled; location is only requested for foreground search.
      // Start weather monitoring (don't fail if this doesn't work)
      try {
        await this.startWeatherMonitoring();
      } catch (error) {
        console.warn('⚠️ Weather monitoring failed, continuing without weather:', error);
      }
      
      console.log('✅ Smart Notifications initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Smart Notifications:', error);
      // Don't throw the error, just log it and continue
    }
  }

  private async requestPermissions() {
    try {
      // Request notification permissions
      if (Notifications) {
        const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
        if (notificationStatus !== 'granted') {
          console.warn('Notification permission not granted');
        }
      } else {
        console.warn('expo-notifications not available, skipping permission request');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  }

  private async loadSavedData() {
    try {
      const [notificationsData, locationData, weatherData, usageData] = await Promise.all([
        AsyncStorage.getItem('smart_notifications'),
        AsyncStorage.getItem('location_reminders'),
        AsyncStorage.getItem('weather_alerts'),
        AsyncStorage.getItem('usage_patterns')
      ]);

      if (notificationsData) {
        this.notifications = JSON.parse(notificationsData);
      }
      if (locationData) {
        this.locationReminders = JSON.parse(locationData);
      }
      if (weatherData) {
        this.weatherAlerts = JSON.parse(weatherData);
      }
      if (usageData) {
        const patterns = JSON.parse(usageData);
        this.usagePatterns = new Map(Object.entries(patterns));
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  }

  private async saveData() {
    try {
      await Promise.all([
        AsyncStorage.setItem('smart_notifications', JSON.stringify(this.notifications)),
        AsyncStorage.setItem('location_reminders', JSON.stringify(this.locationReminders)),
        AsyncStorage.setItem('weather_alerts', JSON.stringify(this.weatherAlerts)),
        AsyncStorage.setItem('usage_patterns', JSON.stringify(Object.fromEntries(this.usagePatterns)))
      ]);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  private async startLocationTracking() {}
  private async watchLocation() {}
  private async checkLocationReminders() {}

  private async startWeatherMonitoring() {
    try {
      // Check weather every hour
      setInterval(async () => {
        await this.checkWeatherAlerts();
      }, 3600000);

      // Initial check
      await this.checkWeatherAlerts();
      
      console.log('🌤️ Weather monitoring started');
    } catch (error) {
      console.error('Failed to start weather monitoring:', error);
    }
  }

  private async checkWeatherAlerts() {
    if (!this.currentLocation) return;

    try {
      // Get weather data (using OpenWeatherMap API)
      const weatherData = await this.getWeatherData();
      
      for (const alert of this.weatherAlerts) {
        if (!alert.enabled) continue;

        let shouldTrigger = false;
        let message = alert.message;

        switch (alert.weatherCondition) {
          case 'pollen':
            // High pollen count
            if (weatherData.pollen > alert.threshold) {
              shouldTrigger = true;
              message = uiI18n.t("ui.highPollenAlertValue", { value1: message });
            }
            break;
          case 'temperature':
            // Extreme temperatures
            if (weatherData.temperature > alert.threshold || weatherData.temperature < -alert.threshold) {
              shouldTrigger = true;
              message = uiI18n.t("ui.temperatureAlertValue", { value1: message });
            }
            break;
          case 'humidity':
            // High humidity
            if (weatherData.humidity > alert.threshold) {
              shouldTrigger = true;
              message = uiI18n.t("ui.highHumidityAlertValue", { value1: message });
            }
            break;
          case 'air_quality':
            // Poor air quality
            if (weatherData.airQuality > alert.threshold) {
              shouldTrigger = true;
              message = uiI18n.t("ui.airQualityAlertValue", { value1: message });
            }
            break;
        }

        if (shouldTrigger) {
          await this.sendNotification({
            title: uiI18n.t("ui.weatherAlert"),
            message,
            data: { type: 'weather_alert', alertId: alert.id, medicationId: alert.medicationId }
          });
        }
      }
    } catch (error) {
      console.error('Weather check failed:', error);
    }
  }

  private async getWeatherData() {
    if (!this.currentLocation) {
      throw new Error(uiI18n.t("ui.noLocationAvailable"));
    }

    // Mock weather data for now - replace with real API
    return {
      temperature: 25, // Celsius
      humidity: 60, // Percentage
      pollen: 3, // Scale 1-5
      airQuality: 2, // Scale 1-5
      description: uiI18n.t("ui.partlyCloudy")
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  private async sendNotification(notification: {
    title: string;
    message: string;
    data?: any;
  }) {
    try {
      if (!Notifications) {
        console.warn('expo-notifications not available, cannot schedule notification');
        return;
      }
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message,
          data: notification.data,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Public methods for managing notifications

  async addLocationReminder(reminder: Omit<LocationReminder, 'id'>): Promise<LocationReminder> {
    throw new Error(uiI18n.t("ui.proximityRemindersAreUnavailableLosRecordatoriosPorProximidadNoEstanDisponibles"));
  }

  async deleteLocationReminder(id: string) {
    this.locationReminders = this.locationReminders.filter(reminder => reminder.id !== id);
    await this.saveData();
  }

  async addWeatherAlert(alert: Omit<WeatherAlert, 'id'>) {
    const newAlert: WeatherAlert = {
      ...alert,
      id: `weather_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.weatherAlerts.push(newAlert);
    await this.saveData();
    return newAlert;
  }

  async deleteWeatherAlert(id: string) {
    this.weatherAlerts = this.weatherAlerts.filter(alert => alert.id !== id);
    await this.saveData();
  }

  async updateUsagePattern(medicationId: string, takenAt: string) {
    const existing = this.usagePatterns.get(medicationId);
    const now = new Date();
    const takenTime = new Date(takenAt);

    if (existing) {
      // Update existing pattern
      const timeDiff = (now.getTime() - new Date(existing.lastTaken).getTime()) / (1000 * 60 * 60); // hours
      const newInterval = (existing.averageInterval + timeDiff) / 2; // Running average
      
      existing.averageInterval = newInterval;
      existing.lastTaken = takenAt;
      existing.predictedNextDose = new Date(now.getTime() + newInterval * 60 * 60 * 1000).toISOString();
      
      // Calculate consistency (simplified)
      const expectedTime = new Date(new Date(existing.lastTaken).getTime() + existing.averageInterval * 60 * 60 * 1000);
      const timeDiffFromExpected = Math.abs(now.getTime() - expectedTime.getTime()) / (1000 * 60 * 60);
      existing.consistency = Math.max(0, 1 - (timeDiffFromExpected / existing.averageInterval));
    } else {
      // Create new pattern
      this.usagePatterns.set(medicationId, {
        medicationId,
        averageInterval: 24, // Default 24 hours
        lastTaken: takenAt,
        consistency: 1,
        predictedNextDose: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
      });
    }

    await this.saveData();
  }

  async getSmartRefillPrediction(medicationId: string): Promise<{
    daysUntilEmpty: number;
    confidence: number;
    recommendedRefillDate: string;
  } | null> {
    const pattern = this.usagePatterns.get(medicationId);
    if (!pattern) return null;

    // This would need medication quantity and dosage info
    // For now, return a mock prediction
    const daysUntilEmpty = Math.max(1, Math.floor(pattern.averageInterval / 24));
    const confidence = pattern.consistency;
    const recommendedRefillDate = new Date(Date.now() + (daysUntilEmpty - 1) * 24 * 60 * 60 * 1000).toISOString();

    return {
      daysUntilEmpty,
      confidence,
      recommendedRefillDate
    };
  }

  async getIntelligentReminderTime(medicationId: string): Promise<string | null> {
    const pattern = this.usagePatterns.get(medicationId);
    if (!pattern) return null;

    // Analyze user's typical medication times
    // For now, return the predicted next dose time
    return pattern.predictedNextDose;
  }

  // Getter methods
  getLocationReminders(): LocationReminder[] {
    return this.locationReminders;
  }

  getWeatherAlerts(): WeatherAlert[] {
    return this.weatherAlerts;
  }

  getUsagePatterns(): Map<string, UsagePattern> {
    return this.usagePatterns;
  }

  getCurrentLocation(): { lat: number; lon: number } | null {
    return this.currentLocation;
  }
}

export default SmartNotificationService;
