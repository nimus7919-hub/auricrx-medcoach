/**
 * Descriptive pre-visit one-pager. Raw counts, dates, verbatim questions/symptoms.
 * No "worsening" or clinical judgment language.
 */

import type { BitacoraEntry } from '../types';

export interface PreVisitDoseLog {
  name: string;
  logged: number;
  expected: number;
}

export interface PreVisitDocument {
  name: string;
  addedAt: string;
}

export interface PreVisitInput {
  patientLabel?: string;
  entries: BitacoraEntry[];
  doseLogs?: PreVisitDoseLog[];
  patientQuestions?: string[];
  documents?: PreVisitDocument[];
  sinceIso?: string;
}

export interface PreVisitOnePager {
  patientLabel?: string;
  generatedAt: string;
  sinceIso?: string;
  readings: Array<{
    type: BitacoraEntry['type'];
    count: number;
    lastAt?: string;
    lastDisplay?: string;
  }>;
  doseLogs: PreVisitDoseLog[];
  patientQuestions: string[];
  documents: PreVisitDocument[];
  symptomTexts: string[];
}

function displayEntry(e: BitacoraEntry): string {
  if (e.type === 'blood_pressure') {
    return `${e.systolic ?? '—'}/${e.diastolic ?? '—'}${e.pulse != null ? ` · ${e.pulse}` : ''}`;
  }
  if (e.type === 'glucose') return `${e.glucoseMgDl ?? '—'} mg/dL`;
  if (e.type === 'weight') return `${e.weightKg ?? '—'} kg`;
  return e.symptomsText || '';
}

export function buildPreVisitOnePager(input: PreVisitInput): PreVisitOnePager {
  const since = input.sinceIso ? Date.parse(input.sinceIso) : NaN;
  const entries = (input.entries || []).filter((e) => {
    if (!Number.isFinite(since)) return true;
    return Date.parse(e.timestamp) >= since;
  });

  const types: BitacoraEntry['type'][] = ['blood_pressure', 'glucose', 'weight', 'symptoms'];
  const readings = types.map((type) => {
    const subset = entries
      .filter((e) => e.type === type)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const last = subset[0];
    return {
      type,
      count: subset.length,
      lastAt: last?.timestamp,
      lastDisplay: last ? displayEntry(last) : undefined,
    };
  });

  const symptomTexts = entries
    .filter((e) => e.type === 'symptoms' && e.symptomsText)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .map((e) => e.symptomsText as string)
    .slice(0, 20);

  return {
    patientLabel: input.patientLabel,
    generatedAt: new Date().toISOString(),
    sinceIso: input.sinceIso,
    readings,
    doseLogs: input.doseLogs || [],
    patientQuestions: (input.patientQuestions || []).filter(Boolean).slice(0, 20),
    documents: (input.documents || [])
      .slice()
      .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
      .slice(0, 20),
    symptomTexts,
  };
}
