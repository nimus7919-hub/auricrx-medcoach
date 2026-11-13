/**
 * Server/client helpers for descriptive-only AI summaries.
 * If model output contains banned clinical-judgment terms, callers must
 * fall back to a non-AI template.
 */

import { containsBannedClinicalTerms, findBannedClinicalTerms } from './bannedTerms';
import {
  buildDescriptiveTemplateSummary,
  type DescriptiveSummaryFacts,
  type SummaryLocale,
} from './descriptiveSummary';

export const DOCTOR_AI_SYSTEM_PROMPT = `You are a descriptive summarizer for AuricRX Médicos.
You may ONLY report counts, min/max numeric values, dates/times, and symptom text logged by the patient verbatim.
You MUST NOT diagnose, triage, risk-score, predict, or recommend treatment or doses.
You MUST NOT use words such as: diagnosis, deteriorating, worsening, critical, urgent, abnormal, triage, risk, predict, prognosis (or Spanish equivalents: diagnóstico, deterioro, empeorando, crítico, urgente, anormal, triaje, predicción).
If you cannot summarize descriptively, reply with only factual counts and dates.
Output plain text in the user's language. No markdown headings.`;

export interface AiFilterResult {
  ok: boolean;
  text: string;
  source: 'ai' | 'template';
  bannedMatches: string[];
}

export function filterDoctorAiOutput(
  rawText: string,
  facts: DescriptiveSummaryFacts,
  locale: SummaryLocale = 'es'
): AiFilterResult {
  const text = String(rawText || '').trim();
  const bannedMatches = findBannedClinicalTerms(text, ['en', 'es']);
  if (!text || bannedMatches.length > 0 || containsBannedClinicalTerms(text)) {
    return {
      ok: false,
      text: buildDescriptiveTemplateSummary(facts, locale),
      source: 'template',
      bannedMatches,
    };
  }
  return { ok: true, text, source: 'ai', bannedMatches: [] };
}
