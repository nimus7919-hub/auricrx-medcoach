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
 * 6. Family Circle FREE tier: 1 family member (besides user), shared log, basic reminders, device-only storage
 * 
 * PREMIUM (behind 14-day trial):
 * - AI Health assistant
 * - Family Circle PRO: unlimited members, caregiver alerts, multiple caregivers, summaries, cloud sync
 * - Find a Pharmacy (paid API: Google Places/Maps, INEGI DENUE/PROFECO)
 * - Find a Lab (paid API: Google Places/Maps)
 * - Medicine Lookup (if uses paid backend APIs)
 * - Wearable sync (Health Connect/HealthKit)
 * - Summary sharing (WhatsApp family summaries, share sheet summaries)
 * - Cloud backup for documents (opt-in: uploads documents to backend for sync/backup)
 * - Premium color themes (if implemented)
 * 
 * ALWAYS ACCESSIBLE (no paywall):
 * - Settings
 * - Privacy notice
 * - Account deletion / delete-my-data
 * - Data export (user's own data export as JSON/PDF)
 * - Read-only access to existing data (view documents/data already created)
 */

export const PREMIUM_TRIAL_DAYS = 14;

// Family Circle limits
export const FAMILY_CIRCLE_FREE_MEMBER_LIMIT = 1; // Max family members on free tier (besides the user)

// Single source of truth for premium features
export const PREMIUM_FEATURES = {
  // AI features
  AI_HEALTH_ASSISTANT: true,
  
  // Family Circle PRO (beyond free limits)
  FAMILY_CIRCLE_UNLIMITED_MEMBERS: true, // Beyond FREE_MEMBER_LIMIT
  FAMILY_CIRCLE_CAREGIVER_ALERTS: true, // Missed-dose alerts to other caregivers
  FAMILY_CIRCLE_MULTIPLE_CAREGIVERS: true, // Multiple caregivers sharing one member
  FAMILY_CIRCLE_SHARE_SUMMARY: true, // WhatsApp/share-sheet summaries
  FAMILY_CIRCLE_CLOUD_SYNC: true, // Cloud sync across devices
  FAMILY_DOCUMENTS: true, // Per-member document folders (read-only after trial expires)
  
  // Location-based searches (paid APIs)
  PHARMACY_SEARCH: true,
  LAB_SEARCH: true,
  MEDICINE_LOOKUP: true, // If uses paid backend
  
  // Cloud features for documents
  DOCUMENT_CLOUD_BACKUP: true, // Opt-in cloud backup/sync to backend
  
  // Wearable integration
  HEALTH_CONNECT_SYNC: true,
  HEALTHKIT_SYNC: true,
  
  // Summary sharing (WhatsApp family summaries)
  SUMMARY_SHARING: true,
  
  // Premium themes
  PREMIUM_THEMES: true,

  // Doctor Mode (separate doctorPlan entitlement — not the consumer Pro plan)
  DOCTOR_MODE: true,
  DOCTOR_MODE_ALERTS: true,
  DOCTOR_MODE_PATIENT_VIEW: true,
};

// Free features (core essentials)
export const FREE_FEATURES = {
  // Health reminders (core free feature)
  MEDICATION_REMINDERS: true,
  SUPPLEMENT_REMINDERS: true,
  CHECKUP_REMINDERS: true,
  SCREENING_REMINDERS: true,
  PREVENTION_PLANNER: true, // Reminder creation is free
  
  // Family Circle FREE tier (limited)
  FAMILY_CIRCLE_BASIC: true, // 1 member, shared log, basic reminders, device-only
  FAMILY_CIRCLE_ADD_FIRST_MEMBER: true, // Add up to FREE_MEMBER_LIMIT members
  FAMILY_CIRCLE_LOG_DOSE: true, // Shared 'taken' log for free member(s)
  
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
  DATA_EXPORT: true, // User's own data export (JSON/PDF)
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
