/**
 * Compliance Features Configuration - COFEPRIS (Mexico)
 * 
 * These are HARD BUILD-TIME feature flags for compliance with Mexican
 * medical device regulations (COFEPRIS / NOM-241-SSA1-2025 / NOM-137-SSA1-2025).
 * 
 * These flags are OFF by default in ALL regions to ensure AuricRX MedCoach
 * does not count as a medical device (SaMD - Software as Medical Device).
 * 
 * IMPORTANT: These are NOT user settings. They are compile-time constants.
 * Changing these flags requires a new build and legal review.
 */

/**
 * AUTOMATIC_MEDICATION_PAIRING_NOTICES
 * 
 * When OFF (default): No automatic pairing notices are shown.
 * 
 * When ON: Shows neutral pairing notices when two of the user's listed
 * medications appear together in a sourced reference entry. The notice is:
 * - Non-clinical (no severity, colors, danger icons, or recommendations)
 * - Sourced (shows source name and date)
 * - On-screen only (no push notifications, badges, sounds, or Family Circle alerts)
 * - Never passed to AI
 * - Includes a settings toggle for users to disable
 * 
 * DEFAULT: false (OFF in all regions including US mode)
 */
export const AUTOMATIC_MEDICATION_PAIRING_NOTICES = false;

/**
 * List of prohibited words that MUST NOT appear in the medication reference feature.
 * 
 * These words are prohibited to ensure compliance with medical device regulations.
 * Using these words could classify the app as a medical device requiring registration.
 */
export const PROHIBITED_INTERACTION_WORDS = [
  // Spanish prohibited terms
  'interacción peligrosa',
  'interacción grave',
  'interacción leve',
  'riesgo',
  'alerta',
  'advertencia',
  'urgente',
  'evita',
  'suspende',
  'no tomes',
  'ajusta la dosis',
  'separa las tomas',
  'compatible',
  'seguro',
  'sin problemas',
  
  // English prohibited terms
  'dangerous interaction',
  'severe interaction',
  'mild interaction',
  'risk',
  'alert',
  'warning',
  'urgent',
  'avoid',
  'discontinue',
  'do not take',
  'adjust dose',
  'separate doses',
  'compatible',
  'safe',
  'no problems',
] as const;

/**
 * Check if text contains prohibited words
 */
export function containsProhibitedWords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return PROHIBITED_INTERACTION_WORDS.some(word => 
    lowerText.includes(word.toLowerCase())
  );
}

/**
 * Validate that a string does not contain prohibited words.
 * Throws an error if prohibited words are found (development only).
 */
export function validateComplianceText(text: string, context: string): void {
  if (__DEV__ && containsProhibitedWords(text)) {
    console.error(`⚠️ COMPLIANCE VIOLATION in ${context}: Text contains prohibited words`);
    console.error(`Text: ${text}`);
  }
}
