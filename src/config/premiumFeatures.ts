/**
 * Premium Features Configuration - Final Split
 * 
 * Centralized config for premium vs free features.
 * Change feature flags here to adjust what requires premium access.
 * 
 * FREE FOREVER (core essentials):
 * 1. Health reminders (medication, supplements, checkup/screening reminders)
 * 2. Health tracker (daily habits manual logging, vitals/lab value logging)
 * 3. Creating/storing personal medication reminders
 * 4. Plant library (herbal safety notes, evidence badges, interaction info)
 * 5. Document scanning and LOCAL storage (organizer, tags, glossary, lab value trends)
 * 
 * PREMIUM (behind 14-day trial):
 * - AI Health assistant
 * - Family Circle (family profiles, shared logs, caregiver alerts, summaries)
 * - Find a Pharmacy (paid API: Google Places/Maps, INEGI DENUE/PROFECO)
 * - Find a Lab (paid API: Google Places/Maps)
 * - Medicine Lookup (if uses paid backend APIs)
 * - Wearable sync (Health Connect/HealthKit)
 * - Data export/summaries sharing
 * - Cloud backup for documents (opt-in: uploads documents to backend for sync/backup)
 * - Premium color themes (if implemented)
 * 
 * ALWAYS ACCESSIBLE (no paywall):
 * - Settings
 * - Privacy notice
 * - Account deletion / delete-my-data
 * - Read-only access to existing data (view documents/data already created)
 */

export const PREMIUM_TRIAL_DAYS = 14;

// Single source of truth for premium features
export const PREMIUM_FEATURES = {
  // AI features
  AI_HEALTH_ASSISTANT: true,
  
  // Family management
  FAMILY_CIRCLE: true,
  FAMILY_CIRCLE_ADD_MEMBER: true,
  FAMILY_CIRCLE_LOG_DOSE: true,
  FAMILY_CIRCLE_SHARE_SUMMARY: true,
  
  // Location-based searches (paid APIs)
  PHARMACY_SEARCH: true,
  LAB_SEARCH: true,
  MEDICINE_LOOKUP: true, // If uses paid backend
  
  // Cloud features for documents
  DOCUMENT_CLOUD_BACKUP: true, // Opt-in cloud backup/sync to backend
  
  // Wearable integration
  HEALTH_CONNECT_SYNC: true,
  HEALTHKIT_SYNC: true,
  
  // Data export and sharing
  DATA_EXPORT: true,
  SUMMARY_SHARING: true,
  
  // Premium themes
  PREMIUM_THEMES: true,
};

// Free features (core essentials)
export const FREE_FEATURES = {
  // Health reminders (core free feature)
  MEDICATION_REMINDERS: true,
  SUPPLEMENT_REMINDERS: true,
  CHECKUP_REMINDERS: true,
  SCREENING_REMINDERS: true,
  PREVENTION_PLANNER: true, // Reminder creation is free
  
  // Health tracker (manual entry)
  DAILY_HABITS_MANUAL: true,
  VITALS_TRACKING: true,
  LAB_VALUE_MANUAL_ENTRY: true,
  
  // Basic medication management
  MEDICATIONS_LIST: true,
  SUPPLEMENTS_LIST: true,
  
  // Plant/herb library (free)
  HERBS_LIBRARY: true,
  HERBAL_SAFETY_NOTES: true,
  EVIDENCE_BADGES: true,
  
  // Document features (local storage is free)
  DOCUMENT_SCANNING: true,
  DOCUMENT_LOCAL_STORAGE: true,
  DOCUMENT_ORGANIZER: true,
  DOCUMENT_TAGS: true,
  LAB_GLOSSARY: true,
  LAB_VALUE_TRENDS: true,
  
  // Always accessible
  SETTINGS: true,
  PRIVACY_NOTICE: true,
  ACCOUNT_DELETION: true,
  VIEW_EXISTING_DATA: true, // Read-only access to data already created
};

// Helper functions
export function isPremiumFeature(feature: keyof typeof PREMIUM_FEATURES): boolean {
  return PREMIUM_FEATURES[feature] === true;
}

export function isFreeFeature(feature: keyof typeof FREE_FEATURES): boolean {
  return FREE_FEATURES[feature] === true;
}

// Check if user can access a feature (respecting read-only access to existing data)
export function canAccessFeature(
  feature: keyof typeof PREMIUM_FEATURES | keyof typeof FREE_FEATURES,
  hasPremiumAccess: boolean,
  isReadOnlyExistingData: boolean = false
): boolean {
  // Always accessible features
  if (feature in FREE_FEATURES && FREE_FEATURES[feature as keyof typeof FREE_FEATURES]) {
    return true;
  }
  
  // Read-only access to existing data is always allowed
  if (isReadOnlyExistingData && feature === 'VIEW_EXISTING_DATA') {
    return true;
  }
  
  // Premium features require premium access
  if (feature in PREMIUM_FEATURES && PREMIUM_FEATURES[feature as keyof typeof PREMIUM_FEATURES]) {
    return hasPremiumAccess;
  }
  
  // Default to requiring premium if not explicitly free
  return hasPremiumAccess;
}
