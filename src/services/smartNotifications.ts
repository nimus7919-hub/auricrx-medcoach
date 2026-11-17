// Compatibility facade for older analytics integrations. No mock predictions.
import { readSmart, updateSmart, reconcileSmart, recordDose, daysRemaining, suggestions } from './smartNotificationEngine';
export interface LocationReminder { id: string; name: string; latitude: number; longitude: number; radius: number; message: string; enabled: boolean; medicationId?: string; reminderId?: string; event?: string; }
export interface WeatherAlert { id: string; medicationId?: string; weatherCondition?: string; condition?: string; threshold: number; message: string; enabled: boolean; }
export interface UsagePattern { medicationId: string; lastTaken: string; }
class SmartNotificationService {
  private static instance: SmartNotificationService;
  private state: any = { places: [], alerts: [], logs: [], meds: [], reminders: [] };
  static getInstance() { if (!this.instance) this.instance = new SmartNotificationService(); return this.instance; }
  async initialize() { this.state = await readSmart(); }
  async addLocationReminder(reminder: Omit<LocationReminder, 'id'>) {
    const p = { ...reminder, id: `place:${Date.now()}` };
    this.state = await updateSmart((s: any) => ({ ...s, places: [...s.places, p] }));
    await reconcileSmart(this.state.meds, this.state.reminders);
    return p;
  }
  async deleteLocationReminder(id: string) {
    this.state = await updateSmart((s: any) => ({
      ...s,
      places: s.places.filter((p: any) => p.id !== id),
      inside: s.inside.filter((p: any) => p !== id),
    }));
    await reconcileSmart(this.state.meds, this.state.reminders);
  }
  async addWeatherAlert(alert: Omit<WeatherAlert, 'id'>) {
    const a = {
      ...alert,
      condition: alert.condition || ({ temperature: 'heat', humidity: 'humidity' } as Record<string, string>)[alert.weatherCondition || ''] || 'heat',
      id: `weather:${Date.now()}`,
    };
    this.state = await updateSmart((s: any) => ({ ...s, alerts: [...s.alerts, a], weatherChecked: null }));
    return a;
  }
  async deleteWeatherAlert(id: string) {
    this.state = await updateSmart((s: any) => ({ ...s, alerts: s.alerts.filter((a: any) => a.id !== id) }));
  }
  async updateUsagePattern(medicationId: string, takenAt: string) {
    const s = await readSmart();
    const med = s.meds.find((m: any) => String(m.id) === String(medicationId));
    if (med) await recordDose(med, s.reminders, new Date(takenAt));
  }
  async getSmartRefillPrediction(medicationId: string) {
    const s = await readSmart();
    const med = s.meds.find((m: any) => String(m.id) === String(medicationId));
    const days = med ? daysRemaining(med, s.reminders) : null;
    return days == null ? null : {
      daysUntilEmpty: days,
      confidence: 1,
      recommendedRefillDate: new Date(Date.now() + Math.max(0, days - s.lead) * 86400000).toISOString(),
    };
  }
  async getIntelligentReminderTime(medicationId: string) {
    const s = await readSmart();
    return suggestions(s, s.reminders).find((x: any) => String(x.reminder.medicationId) === String(medicationId))?.time || null;
  }
  getLocationReminders(): LocationReminder[] { return this.state.places; }
  getWeatherAlerts(): WeatherAlert[] { return this.state.alerts; }
  getUsagePatterns(): Map<string, UsagePattern> { return new Map(); }
  getCurrentLocation(): { lat: number; lon: number } | null { return null; }
}
export default SmartNotificationService;
