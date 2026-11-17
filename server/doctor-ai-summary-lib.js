/**
 * Plain-JS twin of packages/doctor-core compliance helpers for the Render server.
 * Keep banned terms aligned with packages/doctor-core/src/compliance/bannedTerms.ts.
 */

const BANNED = {
  en: [
    'diagnosis', 'diagnose', 'diagnosed', 'diagnostic',
    'deteriorating', 'deteriorate', 'deterioration',
    'worsening', 'worsen', 'worsened',
    'critical', 'urgent', 'urgency',
    'abnormal', 'abnormally',
    'triage', 'triaged',
    'risk score', 'high risk', 'low risk', 'at risk',
    'prediction', 'predict', 'predicted', 'prognosis',
    'recommend treatment', 'treatment recommendation',
    'recommend dose', 'dose recommendation', 'prescribed dose',
    'should take', 'seek emergency', 'hypertensive emergency',
    'medical emergency', 'life-threatening', 'life threatening',
  ],
  es: [
    'diagnóstico', 'diagnostico', 'diagnosticar', 'diagnosticado', 'diagnóstica', 'diagnostica',
    'deterioro', 'deteriorando', 'deteriorándose', 'deteriorandose',
    'empeorando', 'empeoramiento', 'empeorar',
    'crítico', 'critico', 'crítica', 'critica',
    'urgente', 'urgencia',
    'anormal', 'anómalo', 'anomalo', 'anómala', 'anomala',
    'triaje', 'triage',
    'puntuación de riesgo', 'puntuacion de riesgo',
    'alto riesgo', 'bajo riesgo', 'en riesgo',
    'predicción', 'prediccion', 'predecir', 'pronóstico', 'pronostico',
    'recomendar tratamiento', 'recomendación de tratamiento', 'recomendacion de tratamiento',
    'recomendar dosis', 'recomendación de dosis', 'recomendacion de dosis',
    'debe tomar', 'busque emergencia', 'urgencia hipertensiva',
    'emergencia médica', 'emergencia medica', 'peligro de muerte', 'amenaza la vida',
  ],
};

function normalizeForBanCheck(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findBannedClinicalTerms(text) {
  const normalized = normalizeForBanCheck(text);
  if (!normalized.trim()) return [];
  const found = new Set();
  const terms = [...BANNED.en, ...BANNED.es].sort((a, b) => b.length - a.length);
  for (const term of terms) {
    const needle = normalizeForBanCheck(term);
    if (!needle) continue;
    if (needle.includes(' ')) {
      if (normalized.includes(needle)) found.add(term);
    } else {
      const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(needle)}(?:[^a-z0-9]|$)`, 'i');
      if (re.test(normalized)) found.add(term);
    }
  }
  return [...found];
}

function containsBannedClinicalTerms(text) {
  return findBannedClinicalTerms(text).length > 0;
}

function buildDescriptiveTemplateSummary(facts, locale = 'es') {
  const lines = [];
  const who = facts.patientLabel ? ` ${facts.patientLabel}` : '';
  if (locale === 'es') {
    lines.push(`Resumen descriptivo${who}:`);
    if (facts.sinceIso || facts.untilIso) lines.push(`Periodo: ${facts.sinceIso || '—'} → ${facts.untilIso || '—'}.`);
    lines.push(`Registros: ${facts.entryCount || 0}.`);
    lines.push(`Síntomas registrados: ${facts.symptomCount || 0}.`);
    lines.push(`Dosis no registradas (según log): ${facts.missedDoseCount || 0}.`);
    lines.push(`Cruces de límite configurado por usted: ${facts.limitCrossedCount || 0}.`);
    lines.push(`Documentos nuevos: ${facts.documentCount || 0}.`);
  } else {
    lines.push(`Descriptive summary${who}:`);
    if (facts.sinceIso || facts.untilIso) lines.push(`Period: ${facts.sinceIso || '—'} → ${facts.untilIso || '—'}.`);
    lines.push(`Entries: ${facts.entryCount || 0}.`);
    lines.push(`Symptoms logged: ${facts.symptomCount || 0}.`);
    lines.push(`Missed doses (from log): ${facts.missedDoseCount || 0}.`);
    lines.push(`Crossings of limits you configured: ${facts.limitCrossedCount || 0}.`);
    lines.push(`New documents: ${facts.documentCount || 0}.`);
  }
  for (const s of facts.series || []) {
    lines.push(
      `${s.label}: n=${s.count}` +
        (typeof s.min === 'number' && typeof s.max === 'number'
          ? locale === 'es'
            ? `, mín=${s.min}, máx=${s.max}`
            : `, min=${s.min}, max=${s.max}`
          : '') +
        '.'
    );
  }
  const symptoms = (facts.symptomTexts || []).filter(Boolean).slice(0, 10);
  if (symptoms.length) {
    lines.push(locale === 'es' ? 'Síntomas (texto del paciente):' : 'Symptoms (patient text):');
    for (const s of symptoms) lines.push(`- ${s}`);
  }
  return lines.join('\n');
}

const DOCTOR_AI_SYSTEM_PROMPT = `You are a descriptive summarizer for AuricRX Médicos.
You may ONLY report counts, min/max numeric values, dates/times, and symptom text logged by the patient verbatim.
You MUST NOT diagnose, triage, risk-score, predict, or recommend treatment or doses.
You MUST NOT use words such as: diagnosis, deteriorating, worsening, critical, urgent, abnormal, triage, risk, predict, prognosis (or Spanish equivalents: diagnóstico, deterioro, empeorando, crítico, urgente, anormal, triaje, predicción).
If you cannot summarize descriptively, reply with only factual counts and dates.
Output plain text in the user's language. No markdown headings.`;

function filterDoctorAiOutput(rawText, facts, locale = 'es') {
  const text = String(rawText || '').trim();
  const bannedMatches = findBannedClinicalTerms(text);
  if (!text || bannedMatches.length > 0) {
    return {
      ok: false,
      text: buildDescriptiveTemplateSummary(facts, locale === 'en' ? 'en' : 'es'),
      source: 'template',
      bannedMatches,
    };
  }
  return { ok: true, text, source: 'ai', bannedMatches: [] };
}

module.exports = {
  DOCTOR_AI_SYSTEM_PROMPT,
  filterDoctorAiOutput,
  buildDescriptiveTemplateSummary,
  containsBannedClinicalTerms,
  findBannedClinicalTerms,
  BANNED,
};
