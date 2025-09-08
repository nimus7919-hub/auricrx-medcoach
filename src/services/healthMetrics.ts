import AsyncStorage from '@react-native-async-storage/async-storage';
import { SmartNotificationService } from './smartNotifications';

export interface HealthMetric {
  id: string;
  type: 'blood_pressure' | 'weight' | 'blood_sugar' | 'heart_rate' | 'temperature' | 'oxygen_saturation' | 'pain_level' | 'mood' | 'energy_level' | 'sleep_hours' | 'steps' | 'custom';
  value: number;
  unit: string;
  timestamp: string;
  notes?: string;
  medicationId?: string; // If related to medication
  tags?: string[]; // For categorization
}

export interface MedicationAdherence {
  medicationId: string;
  medicationName: string;
  scheduledDoses: number;
  takenDoses: number;
  missedDoses: number;
  adherenceRate: number; // 0-100%
  lastTaken: string;
  nextScheduled: string;
  streak: number; // Consecutive days taken
  averageDelay: number; // Minutes late on average
  consistency: number; // 0-1, how consistent timing is
}

export interface HealthTrend {
  metricType: string;
  period: '7d' | '30d' | '90d' | '1y';
  trend: 'improving' | 'stable' | 'declining' | 'volatile';
  change: number; // Percentage change
  average: number;
  min: number;
  max: number;
  dataPoints: HealthMetric[];
  insights: string[];
}

export interface SideEffect {
  id: string;
  medicationId: string;
  medicationName: string;
  symptom: string;
  severity: 1 | 2 | 3 | 4 | 5; // 1=mild, 5=severe
  startDate: string;
  endDate?: string;
  duration: number; // in days
  frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
  notes?: string;
  reported: boolean; // Whether reported to doctor
}

export interface HealthReport {
  id: string;
  title: string;
  period: string;
  generatedAt: string;
  summary: {
    totalMetrics: number;
    adherenceRate: number;
    sideEffects: number;
    keyInsights: string[];
  };
  metrics: {
    [key: string]: {
      current: number;
      average: number;
      trend: string;
      recommendation: string;
    };
  };
  adherence: MedicationAdherence[];
  sideEffects: SideEffect[];
  recommendations: string[];
}

class HealthMetricsService {
  private static instance: HealthMetricsService;
  private metrics: HealthMetric[] = [];
  private adherence: Map<string, MedicationAdherence> = new Map();
  private sideEffects: SideEffect[] = [];
  private smartNotifications: SmartNotificationService;

  static getInstance(): HealthMetricsService {
    if (!HealthMetricsService.instance) {
      HealthMetricsService.instance = new HealthMetricsService();
    }
    return HealthMetricsService.instance;
  }

  constructor() {
    this.smartNotifications = SmartNotificationService.getInstance();
  }

  async initialize() {
    try {
      await this.loadSavedData();
      console.log('✅ Health Metrics Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Health Metrics Service:', error);
    }
  }

  private async loadSavedData() {
    try {
      const [metricsData, adherenceData, sideEffectsData] = await Promise.all([
        AsyncStorage.getItem('health_metrics'),
        AsyncStorage.getItem('medication_adherence'),
        AsyncStorage.getItem('side_effects')
      ]);

      if (metricsData) {
        this.metrics = JSON.parse(metricsData);
      }
      if (adherenceData) {
        const adherence = JSON.parse(adherenceData);
        this.adherence = new Map(Object.entries(adherence));
      }
      if (sideEffectsData) {
        this.sideEffects = JSON.parse(sideEffectsData);
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  }

  private async saveData() {
    try {
      await Promise.all([
        AsyncStorage.setItem('health_metrics', JSON.stringify(this.metrics)),
        AsyncStorage.setItem('medication_adherence', JSON.stringify(Object.fromEntries(this.adherence))),
        AsyncStorage.setItem('side_effects', JSON.stringify(this.sideEffects))
      ]);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  // Health Metrics Management
  async addMetric(metric: Omit<HealthMetric, 'id' | 'timestamp'>) {
    const newMetric: HealthMetric = {
      ...metric,
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.metrics.push(newMetric);
    await this.saveData();

    // Update smart notifications with usage pattern
    if (metric.medicationId) {
      await this.smartNotifications.updateUsagePattern(metric.medicationId, newMetric.timestamp);
    }

    return newMetric;
  }

  async getMetrics(type?: string, days?: number): Promise<HealthMetric[]> {
    let filtered = this.metrics;

    if (type) {
      filtered = filtered.filter(m => m.type === type);
    }

    if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter(m => new Date(m.timestamp) >= cutoff);
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getLatestMetric(type: string): Promise<HealthMetric | null> {
    const metrics = await this.getMetrics(type, 30); // Last 30 days
    return metrics.length > 0 ? metrics[0] : null;
  }

  // Medication Adherence Tracking
  async updateAdherence(medicationId: string, medicationName: string, taken: boolean, scheduledTime?: string) {
    const existing = this.adherence.get(medicationId);
    const now = new Date().toISOString();

    if (existing) {
      if (taken) {
        existing.takenDoses++;
        existing.lastTaken = now;
        
        // Calculate delay if scheduled time provided
        if (scheduledTime) {
          const delay = (new Date(now).getTime() - new Date(scheduledTime).getTime()) / (1000 * 60); // minutes
          existing.averageDelay = (existing.averageDelay + delay) / 2;
        }

        // Update streak
        const lastTakenDate = new Date(existing.lastTaken);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - lastTakenDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 1) {
          existing.streak++;
        } else {
          existing.streak = 1;
        }
      } else {
        existing.missedDoses++;
        existing.streak = 0;
      }

      existing.adherenceRate = (existing.takenDoses / (existing.takenDoses + existing.missedDoses)) * 100;
    } else {
      // Create new adherence record
      this.adherence.set(medicationId, {
        medicationId,
        medicationName,
        scheduledDoses: 1,
        takenDoses: taken ? 1 : 0,
        missedDoses: taken ? 0 : 1,
        adherenceRate: taken ? 100 : 0,
        lastTaken: taken ? now : '',
        nextScheduled: scheduledTime || now,
        streak: taken ? 1 : 0,
        averageDelay: 0,
        consistency: 1
      });
    }

    await this.saveData();
    return this.adherence.get(medicationId);
  }

  async getAdherence(medicationId?: string): Promise<MedicationAdherence[]> {
    const adherence = Array.from(this.adherence.values());
    return medicationId ? adherence.filter(a => a.medicationId === medicationId) : adherence;
  }

  async getOverallAdherence(): Promise<number> {
    const allAdherence = await this.getAdherence();
    if (allAdherence.length === 0) return 0;

    const totalAdherence = allAdherence.reduce((sum, a) => sum + a.adherenceRate, 0);
    return totalAdherence / allAdherence.length;
  }

  // Side Effect Monitoring
  async addSideEffect(sideEffect: Omit<SideEffect, 'id'>) {
    const newSideEffect: SideEffect = {
      ...sideEffect,
      id: `side_effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.sideEffects.push(newSideEffect);
    await this.saveData();
    return newSideEffect;
  }

  async updateSideEffect(id: string, updates: Partial<SideEffect>) {
    const index = this.sideEffects.findIndex(se => se.id === id);
    if (index !== -1) {
      this.sideEffects[index] = { ...this.sideEffects[index], ...updates };
      await this.saveData();
      return this.sideEffects[index];
    }
    return null;
  }

  async getSideEffects(medicationId?: string): Promise<SideEffect[]> {
    return medicationId ? 
      this.sideEffects.filter(se => se.medicationId === medicationId) : 
      this.sideEffects;
  }

  async getActiveSideEffects(): Promise<SideEffect[]> {
    return this.sideEffects.filter(se => !se.endDate);
  }

  // Trend Analysis
  async analyzeTrends(metricType: string, period: '7d' | '30d' | '90d' | '1y'): Promise<HealthTrend> {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const metrics = await this.getMetrics(metricType, days);
    
    if (metrics.length === 0) {
      return {
        metricType,
        period,
        trend: 'stable',
        change: 0,
        average: 0,
        min: 0,
        max: 0,
        dataPoints: [],
        insights: ['No data available for analysis']
      };
    }

    const values = metrics.map(m => m.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate trend
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    let trend: 'improving' | 'stable' | 'declining' | 'volatile';
    
    if (Math.abs(change) < 5) {
      trend = 'stable';
    } else if (change > 0) {
      trend = 'improving';
    } else {
      trend = 'declining';
    }

    // Check for volatility
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / average;
    
    if (coefficientOfVariation > 0.2) {
      trend = 'volatile';
    }

    // Generate insights
    const insights = this.generateInsights(metricType, trend, change, average, min, max);

    return {
      metricType,
      period,
      trend,
      change,
      average,
      min,
      max,
      dataPoints: metrics,
      insights
    };
  }

  private generateInsights(metricType: string, trend: string, change: number, average: number, min: number, max: number): string[] {
    const insights: string[] = [];

    switch (metricType) {
      case 'blood_pressure':
        if (average > 140) {
          insights.push('⚠️ Blood pressure is elevated. Consider consulting your doctor.');
        } else if (average < 90) {
          insights.push('📉 Blood pressure is low. Monitor for symptoms.');
        } else {
          insights.push('✅ Blood pressure is within normal range.');
        }
        break;

      case 'weight':
        if (trend === 'improving' && change > 5) {
          insights.push('📈 Weight is trending upward. Monitor dietary habits.');
        } else if (trend === 'declining' && change < -5) {
          insights.push('📉 Weight is trending downward. Ensure adequate nutrition.');
        } else {
          insights.push('⚖️ Weight is stable. Maintain current habits.');
        }
        break;

      case 'blood_sugar':
        if (average > 180) {
          insights.push('🍯 Blood sugar is high. Check medication timing and diet.');
        } else if (average < 70) {
          insights.push('🍯 Blood sugar is low. Have a snack and monitor.');
        } else {
          insights.push('✅ Blood sugar is well controlled.');
        }
        break;

      case 'mood':
        if (average < 3) {
          insights.push('😔 Mood scores are low. Consider discussing with your doctor.');
        } else if (average > 4) {
          insights.push('😊 Mood scores are positive. Keep up the good work!');
        } else {
          insights.push('😐 Mood is stable. Continue monitoring.');
        }
        break;

      default:
        insights.push(`📊 ${metricType} trend: ${trend} (${change.toFixed(1)}% change)`);
    }

    return insights;
  }

  // Health Reports
  async generateHealthReport(period: string): Promise<HealthReport> {
    const reportId = `report_${Date.now()}`;
    const generatedAt = new Date().toISOString();
    
    // Get overall adherence
    const overallAdherence = await this.getOverallAdherence();
    
    // Get recent metrics (last 30 days)
    const recentMetrics = await this.getMetrics(undefined, 30);
    
    // Get active side effects
    const activeSideEffects = await this.getActiveSideEffects();
    
    // Analyze key metrics
    const keyMetrics = ['blood_pressure', 'weight', 'blood_sugar', 'mood'];
    const metrics: { [key: string]: any } = {};
    
    for (const metricType of keyMetrics) {
      const trend = await this.analyzeTrends(metricType, '30d');
      const latest = await this.getLatestMetric(metricType);
      
      if (latest) {
        metrics[metricType] = {
          current: latest.value,
          average: trend.average,
          trend: trend.trend,
          recommendation: trend.insights[0] || 'Continue monitoring'
        };
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(overallAdherence, activeSideEffects, metrics);

    const report: HealthReport = {
      id: reportId,
      title: `Health Report - ${period}`,
      period,
      generatedAt,
      summary: {
        totalMetrics: recentMetrics.length,
        adherenceRate: overallAdherence,
        sideEffects: activeSideEffects.length,
        keyInsights: Object.values(metrics).map(m => m.recommendation).filter(Boolean)
      },
      metrics,
      adherence: await this.getAdherence(),
      sideEffects: activeSideEffects,
      recommendations
    };

    return report;
  }

  private generateRecommendations(adherence: number, sideEffects: SideEffect[], metrics: any): string[] {
    const recommendations: string[] = [];

    if (adherence < 80) {
      recommendations.push('💊 Medication adherence is below 80%. Consider setting more reminders.');
    }

    if (sideEffects.length > 0) {
      const severeSideEffects = sideEffects.filter(se => se.severity >= 4);
      if (severeSideEffects.length > 0) {
        recommendations.push('⚠️ You have severe side effects. Please consult your doctor immediately.');
      } else {
        recommendations.push('📝 Monitor side effects and discuss with your doctor at next visit.');
      }
    }

    if (metrics.blood_pressure && metrics.blood_pressure.trend === 'declining') {
      recommendations.push('📈 Blood pressure is improving. Continue current treatment plan.');
    }

    if (metrics.weight && metrics.weight.trend === 'volatile') {
      recommendations.push('⚖️ Weight is fluctuating. Consider dietary consistency.');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Overall health metrics look good. Keep up the great work!');
    }

    return recommendations;
  }

  // Utility methods
  async deleteMetric(id: string) {
    this.metrics = this.metrics.filter(m => m.id !== id);
    await this.saveData();
  }

  async deleteSideEffect(id: string) {
    this.sideEffects = this.sideEffects.filter(se => se.id !== id);
    await this.saveData();
  }

  // Getter methods
  getMetricsCount(): number {
    return this.metrics.length;
  }

  getSideEffectsCount(): number {
    return this.sideEffects.length;
  }

  getActiveSideEffectsCount(): number {
    return this.sideEffects.filter(se => !se.endDate).length;
  }
}

export default HealthMetricsService;
