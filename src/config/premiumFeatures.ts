/**
 * Premium Features Configuration
 * 
 * Centralized config for premium vs free features.
 * Change feature flags here to adjust what requires premium access.
 * 
 * Premium features use paid APIs or backend resources:
 * - Google Places/Maps API (distance calculations, directions)
 * - INEGI DENUE/PROFECO server lookups
 * - Backend storage and processing
 * 
 * Free features are on-device only:
 * - Personal reminders and medication tracking
 * - Documents stored locally on device
 * - Manual habit entry
 * - Plant/herb library viewing
 */

export const PREMIUM_TRIAL_DAYS = 14;

export const PREMIUM_FEATURES = {
  // Family management features
  FAMILY_CIRCLE: true,
  
  // Location-based searches that use paid APIs
  PHARMACY_SEARCH: true,
  LAB_SEARCH: true,
  
  // Features that may use backend APIs in the future
  PREVENTION_PLANNER_LAB_BOOKING: true, // "Find a Lab" button from Prevention Planner
  
  // AI features that hit backend (if any use paid APIs per request)
  // AI_HEALTH_ASSISTANT: false, // Currently free, change to true if gated
};

export const FREE_FEATURES = {
  // On-device medication tracking
  PERSONAL_REMINDERS: true,
  MEDICATIONS: true,
  SUPPLEMENTS: true,
  
  // Local document storage
  DOCUMENTS: true,
  
  // Manual habit tracking (no wearable sync)
  DAILY_HABITS_MANUAL: true,
  
  // Herb/plant library viewing
  HERBS: true,
  
  // Health analytics on local data
  HEALTH_ANALYTICS: true,
  
  // Appointment tracking
  APPOINTMENTS: true,
  
  // Prevention planner (without Find a Lab integration)
  PREVENTION_PLANNER_REMINDERS: true,
  
  // Smart notifications (local only)
  SMART_NOTIFICATIONS: true,
  
  // Lab document organizer and glossary
  LAB_ORGANIZER: true,
};

export function isPremiumFeature(feature: keyof typeof PREMIUM_FEATURES): boolean {
  return PREMIUM_FEATURES[feature] === true;
}

export function isFreeFeature(feature: keyof typeof FREE_FEATURES): boolean {
  return FREE_FEATURES[feature] === true;
}
