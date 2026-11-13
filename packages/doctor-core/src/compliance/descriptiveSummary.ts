/**
 * Non-AI descriptive summary templates (fallback when AI is filtered).
 */

export type SummaryLocale = 'en' | 'es';

export interface DescriptiveSummaryFacts {
  patientLabel?: string;
  entryCount: number;
  symptomCount: number;
  missedDoseCount: number;
  limitCrossedCount: number;
  documentCount: number;
  /** Optional numeric series stats */
  series?: Array<{
    label: string;
    count: number;
    min?: number;
    max?: number;
    firstAt?: string;
    lastAt?: string;
  }>;
  /** Verbatim patient symptom strings (already consented). */
  symptomTexts?: string[];
  sinceIso?: string;
  untilIso?: string;
}

export function buildDescriptiveTemplateSummary(
  facts: DescriptiveSummaryFacts,
  locale: SummaryLocale = 'es'
): string {
  const lines: string[] = [];
  const who = facts.patientLabel ? ` ${facts.patientLabel}` : '';

  if (locale === 'es') {
    lines.push(`Resumen descriptivo${who}:`);
    if (facts.sinceIso || facts.untilIso) {
      lines.push(
        `Periodo: ${facts.sinceIso || '—'} → ${facts.untilIso || '—'}.`
      );
    }
    lines.push(`Registros: ${facts.entryCount}.`);
    lines.push(`Síntomas registrados: ${facts.symptomCount}.`);
    lines.push(`Dosis no registradas (según log): ${facts.missedDoseCount}.`);
    lines.push(`Cruces de límite configurado por usted: ${facts.limitCrossedCount}.`);
    lines.push(`Documentos nuevos: ${facts.documentCount}.`);
  } else {
    lines.push(`Descriptive summary${who}:`);
    if (facts.sinceIso || facts.untilIso) {
      lines.push(`Period: ${facts.sinceIso || '—'} → ${facts.untilIso || '—'}.`);
    }
    lines.push(`Entries: ${facts.entryCount}.`);
    lines.push(`Symptoms logged: ${facts.symptomCount}.`);
    lines.push(`Missed doses (from log): ${facts.missedDoseCount}.`);
    lines.push(`Crossings of limits you configured: ${facts.limitCrossedCount}.`);
    lines.push(`New documents: ${facts.documentCount}.`);
  }

  for (const s of facts.series || []) {
    if (locale === 'es') {
      lines.push(
        `${s.label}: n=${s.count}` +
          (typeof s.min === 'number' && typeof s.max === 'number' ? `, mín=${s.min}, máx=${s.max}` : '') +
          (s.firstAt && s.lastAt ? `, del ${s.firstAt} al ${s.lastAt}` : '') +
          '.'
      );
    } else {
      lines.push(
        `${s.label}: n=${s.count}` +
          (typeof s.min === 'number' && typeof s.max === 'number' ? `, min=${s.min}, max=${s.max}` : '') +
          (s.firstAt && s.lastAt ? `, from ${s.firstAt} to ${s.lastAt}` : '') +
          '.'
      );
    }
  }

  const symptoms = (facts.symptomTexts || []).filter(Boolean).slice(0, 10);
  if (symptoms.length) {
    lines.push(locale === 'es' ? 'Síntomas (texto del paciente):' : 'Symptoms (patient text):');
    for (const s of symptoms) lines.push(`- ${s}`);
  }

  return lines.join('\n');
}
