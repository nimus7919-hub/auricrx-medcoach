import {
  containsBannedClinicalTerms,
  findBannedClinicalTerms,
  formatDescriptiveAlertMessage,
  filterDoctorAiOutput,
  buildDescriptiveTemplateSummary,
  DOCTOR_AI_SYSTEM_PROMPT,
} from '../../doctor';

describe('doctor compliance guardrails', () => {
  it('flags banned clinical-judgment terms in EN and ES', () => {
    expect(containsBannedClinicalTerms('Patient is deteriorating')).toBe(true);
    expect(containsBannedClinicalTerms('El paciente está empeorando')).toBe(true);
    expect(containsBannedClinicalTerms('abnormal reading')).toBe(true);
    expect(containsBannedClinicalTerms('triage this case')).toBe(true);
    expect(findBannedClinicalTerms('possible diagnosis of X')).toEqual(
      expect.arrayContaining(['diagnosis'])
    );
  });

  it('allows descriptive organizing language', () => {
    expect(
      containsBannedClinicalTerms('Reading 162 above the limit of 150 that you configured')
    ).toBe(false);
    expect(
      containsBannedClinicalTerms('Lectura 162/95 por encima del límite de 150 que usted configuró')
    ).toBe(false);
    expect(containsBannedClinicalTerms('3 symptoms logged; min=110 max=140')).toBe(false);
  });

  it('formats in-app alerts that name the doctor rule', () => {
    const es = formatDescriptiveAlertMessage({
      readingType: 'systolic',
      observedValue: 162,
      observedSecondary: 95,
      limit: { readingType: 'systolic', comparator: 'gt', value: 150 },
      locale: 'es',
    });
    expect(es).toBe('Lectura 162/95 por encima del límite de 150 que usted configuró');

    const en = formatDescriptiveAlertMessage({
      readingType: 'systolic',
      observedValue: 162,
      observedSecondary: 95,
      limit: { readingType: 'systolic', comparator: 'gt', value: 150 },
      locale: 'en',
    });
    expect(en).toBe('Reading 162/95 above the limit of 150 that you configured');
  });

  it('falls back to non-AI template when model uses banned terms', () => {
    const facts = {
      entryCount: 2,
      symptomCount: 1,
      missedDoseCount: 0,
      limitCrossedCount: 1,
      documentCount: 0,
      symptomTexts: ['dolor de cabeza'],
    };
    const filtered = filterDoctorAiOutput(
      'The patient is deteriorating and needs urgent care',
      facts,
      'en'
    );
    expect(filtered.source).toBe('template');
    expect(filtered.ok).toBe(false);
    expect(filtered.bannedMatches.length).toBeGreaterThan(0);
    expect(filtered.text).toContain('Entries: 2');
    expect(containsBannedClinicalTerms(filtered.text)).toBe(false);
  });

  it('keeps clean AI output when descriptive', () => {
    const facts = {
      entryCount: 1,
      symptomCount: 0,
      missedDoseCount: 0,
      limitCrossedCount: 0,
      documentCount: 0,
    };
    const filtered = filterDoctorAiOutput('Entries: 1. No symptoms logged.', facts, 'en');
    expect(filtered.source).toBe('ai');
    expect(filtered.ok).toBe(true);
  });

  it('template summary stays descriptive', () => {
    const text = buildDescriptiveTemplateSummary(
      {
        entryCount: 4,
        symptomCount: 2,
        missedDoseCount: 1,
        limitCrossedCount: 1,
        documentCount: 0,
        symptomTexts: ['cansancio'],
      },
      'es'
    );
    expect(text).toContain('Registros: 4');
    expect(text).toContain('cansancio');
    expect(containsBannedClinicalTerms(text)).toBe(false);
  });

  it('system prompt forbids clinical judgment', () => {
    expect(DOCTOR_AI_SYSTEM_PROMPT).toMatch(/MUST NOT diagnose/i);
    expect(DOCTOR_AI_SYSTEM_PROMPT).toMatch(/descriptive/i);
  });
});
