/**
 * Banned clinical-judgment terms for AuricRX Médicos / Doctor Mode.
 * Used by the AI output filter and scripts/check-compliance-terms.
 * Descriptive words (limit, crossed, logged, count, min, max) are allowed.
 */

export type BannedTermLocale = 'en' | 'es';

/** Whole-word / phrase patterns (case-insensitive). Keep in sync with the CI scanner. */
export const BANNED_CLINICAL_TERMS: Record<BannedTermLocale, string[]> = {
  en: [
    'diagnosis',
    'diagnose',
    'diagnosed',
    'diagnostic',
    'deteriorating',
    'deteriorate',
    'deterioration',
    'worsening',
    'worsen',
    'worsened',
    'critical',
    'urgent',
    'urgency',
    'abnormal',
    'abnormally',
    'triage',
    'triaged',
    'risk score',
    'high risk',
    'low risk',
    'at risk',
    'prediction',
    'predict',
    'predicted',
    'prognosis',
    'recommend treatment',
    'treatment recommendation',
    'recommend dose',
    'dose recommendation',
    'prescribed dose',
    'should take',
    'seek emergency',
    'hypertensive emergency',
    'medical emergency',
    'life-threatening',
    'life threatening',
  ],
  es: [
    'diagnóstico',
    'diagnostico',
    'diagnosticar',
    'diagnosticado',
    'diagnóstica',
    'diagnostica',
    'deterioro',
    'deteriorando',
    'deteriorándose',
    'deteriorandose',
    'empeorando',
    'empeoramiento',
    'empeorar',
    'crítico',
    'critico',
    'crítica',
    'critica',
    'urgente',
    'urgencia',
    'anormal',
    'anómalo',
    'anomalo',
    'anómala',
    'anomala',
    'triaje',
    'triage',
    'puntuación de riesgo',
    'puntuacion de riesgo',
    'alto riesgo',
    'bajo riesgo',
    'en riesgo',
    'predicción',
    'prediccion',
    'predecir',
    'pronóstico',
    'pronostico',
    'recomendar tratamiento',
    'recomendación de tratamiento',
    'recomendacion de tratamiento',
    'recomendar dosis',
    'recomendación de dosis',
    'recomendacion de dosis',
    'debe tomar',
    'busque emergencia',
    'urgencia hipertensiva',
    'emergencia médica',
    'emergencia medica',
    'peligro de muerte',
    'amenaza la vida',
  ],
};

/** Paths / substrings that are allowed to contain otherwise-banned words (docs only). */
export const BANNED_TERM_ALLOWLIST_PATH_MARKERS = [
  'COMPLIANCE_GUARDRAILS',
  'bannedTerms',
  'check-compliance-terms',
  'aiFilter',
  'doctor-ai-summary',
];

export function normalizeForBanCheck(text: string): string {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Returns matched banned terms found in text for the given locales.
 * Multi-word phrases are checked first; then single tokens as whole words.
 */
export function findBannedClinicalTerms(
  text: string,
  locales: BannedTermLocale[] = ['en', 'es']
): string[] {
  const normalized = normalizeForBanCheck(text);
  if (!normalized.trim()) return [];
  const found = new Set<string>();

  for (const locale of locales) {
    const terms = BANNED_CLINICAL_TERMS[locale] || [];
    const sorted = [...terms].sort((a, b) => b.length - a.length);
    for (const term of sorted) {
      const needle = normalizeForBanCheck(term);
      if (!needle) continue;
      if (needle.includes(' ')) {
        if (normalized.includes(needle)) found.add(term);
      } else {
        const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(needle)}(?:[^a-z0-9]|$)`, 'i');
        if (re.test(normalized)) found.add(term);
      }
    }
  }

  return [...found];
}

export function containsBannedClinicalTerms(
  text: string,
  locales: BannedTermLocale[] = ['en', 'es']
): boolean {
  return findBannedClinicalTerms(text, locales).length > 0;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
