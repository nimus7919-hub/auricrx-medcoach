import { Platform, NativeModules } from 'react-native';

const { HealthConnectModule } = NativeModules;

export const HEALTH_CONNECT_ENABLED = Platform.OS === 'android' && Platform.Version >= 26;

export interface HealthConnectData {
  steps?: number;
  sleepHours?: number;
  heartRate?: number;
  restingHeartRate?: number;
}

class HealthConnectService {
  private static instance: HealthConnectService;

  static getInstance() {
    if (!this.instance) {
      this.instance = new HealthConnectService();
    }
    return this.instance;
  }

  isAvailable(): boolean {
    return HEALTH_CONNECT_ENABLED && !!HealthConnectModule;
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const granted = await HealthConnectModule.requestPermissions();
      return granted === true;
    } catch (error) {
      console.error('Error requesting Health Connect permissions:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const granted = await HealthConnectModule.checkPermissions();
      return granted === true;
    } catch (error) {
      console.error('Error checking Health Connect permissions:', error);
      return false;
    }
  }

  async readSteps(startDate: Date, endDate: Date): Promise<number | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const steps = await HealthConnectModule.readSteps(
        startDate.toISOString(),
        endDate.toISOString()
      );
      return typeof steps === 'number' ? steps : null;
    } catch (error) {
      console.error('Error reading steps from Health Connect:', error);
      return null;
    }
  }

  async readSleep(startDate: Date, endDate: Date): Promise<number | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const sleepMinutes = await HealthConnectModule.readSleep(
        startDate.toISOString(),
        endDate.toISOString()
      );
      return typeof sleepMinutes === 'number' ? sleepMinutes / 60 : null;
    } catch (error) {
      console.error('Error reading sleep from Health Connect:', error);
      return null;
    }
  }

  async readHeartRate(date: Date): Promise<number | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const hr = await HealthConnectModule.readHeartRate(date.toISOString());
      return typeof hr === 'number' ? hr : null;
    } catch (error) {
      console.error('Error reading heart rate from Health Connect:', error);
      return null;
    }
  }

  async syncTodayData(): Promise<HealthConnectData> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    const [steps, sleepHours, heartRate] = await Promise.all([
      this.readSteps(today, now),
      this.readSleep(today, now),
      this.readHeartRate(now),
    ]);

    return {
      steps: steps !== null ? steps : undefined,
      sleepHours: sleepHours !== null ? sleepHours : undefined,
      heartRate: heartRate !== null ? heartRate : undefined,
    };
  }
}

export default HealthConnectService;
