import type { IntakeSession } from '@auricrx/doctor-core';
import { markerLabels, resolveIntakeText, speakerKey, hasTranslation } from '../intakeDisplay';
import { resources } from '../../i18n/resources';

function makeT(lang: 'en' | 'es') {
  const tree = resources[lang].translation as any;
  return (key: string, opts?: Record<string, unknown>) => {
    const v = key.split('.').reduce((o: any, k) => (o ? o[k] : undefined), tree);
    return typeof v === 'string' ? v : ((opts && (opts.defaultValue as string)) ?? key);
  };
}

const base: IntakeSession = {
  id: 'i1', appointmentId: 'a', appointmentStartIso: '2026-11-20T10:00:00.000Z', patientId: 'p', doctorId: 'd',
  doctorDisplayName: 'Dr', locale: 'es', status: 'confirmed',
  consent: { acceptedAt: '', noticeVersion: '1', emergencyDisclaimerVersion: '1' },
  turns: [{ id: 't1', role: 'patient', text: 'Me duele la cabeza', createdAt: '' }],
  followUpsAsked: 0,
  summary: { mainConcern: 'Dolor de cabeza', location: 'frente', duration: 'tres días', severityReported: 4, alsoMentioned: ['cansancio'], questionsForDoctor: ['¿Puedo hacer ejercicio?'], locale: 'es', generatedAt: '' },
  patientComment: 'Gracias',
  createdAt: '', updatedAt: '', sharedAt: '', rawChatDeleteAt: '', rawChatDeletedAt: null,
  bodyPainMap: { version: 1, locale: 'es', reportedAt: '', markers: [{ layer: 'skin', view: 'front', regionId: 'head', regionLabel: 'Cabeza', layerLabel: 'Piel', position: { x: 0.5, y: 0.1 }, intensity: 3, feels: [], onset: null, note: 'punzante a ratos' }] },
};

const withDisplay = (status: 'translated' | 'original' | 'unavailable', lang: 'en' | 'es' = 'en'): IntakeSession => ({
  ...base,
  display: {
    lang, sourceLang: 'es', status,
    summary: { mainConcern: 'Headache', location: 'forehead', duration: 'three days', alsoMentioned: ['tiredness'], questionsForDoctor: ['Can I exercise?'] },
    patientComment: 'Thanks', turns: [{ id: 't1', text: 'My head hurts' }], markerNotes: ['on and off'],
  },
});

describe('intake display (patient-written text in the doctor language)', () => {
  it('uses the translation when the server produced one for the doctor language', () => {
    const r = resolveIntakeText(withDisplay('translated'), 'en', false);
    expect(r.summary?.mainConcern).toBe('Headache');
    expect(r.patientComment).toBe('Thanks');
    expect(r.turnText('t1', 'Me duele la cabeza')).toBe('My head hurts');
    expect(r.markerNote(0, 'punzante a ratos')).toBe('on and off');
    expect(r.showTranslatedTag).toBe(true);
    expect(r.showOriginalLanguageTag).toBe(false);
    expect(hasTranslation(withDisplay('translated'), 'en')).toBe(true);
  });

  it('shows the stored original, tagged, when the doctor toggles "show original"', () => {
    const r = resolveIntakeText(withDisplay('translated'), 'en', true);
    expect(r.summary?.mainConcern).toBe('Dolor de cabeza');
    expect(r.turnText('t1', 'Me duele la cabeza')).toBe('Me duele la cabeza');
    expect(r.showOriginalLanguageTag).toBe(true);
    expect(r.sourceLang).toBe('es');
  });

  it('falls back to the original with a language tag when translation is unavailable', () => {
    const r = resolveIntakeText(withDisplay('unavailable'), 'en', false);
    expect(r.summary?.mainConcern).toBe('Dolor de cabeza');
    expect(r.status).toBe('unavailable');
    expect(r.showOriginalLanguageTag).toBe(true);
  });

  it('tags the original when talking to an old server that sends no display block', () => {
    const r = resolveIntakeText(base, 'en', false);
    expect(r.summary?.mainConcern).toBe('Dolor de cabeza');
    expect(r.showOriginalLanguageTag).toBe(true);
    expect(r.showTranslatedTag).toBe(false);
  });

  it('ignores a display block produced for a different language than the current one', () => {
    const r = resolveIntakeText(withDisplay('translated', 'es'), 'en', false);
    expect(r.summary?.mainConcern).toBe('Dolor de cabeza');
    expect(r.showTranslatedTag).toBe(false);
  });

  it('shows no tag when the patient wrote in the doctor language', () => {
    const r = resolveIntakeText(base, 'es', false);
    expect(r.showOriginalLanguageTag).toBe(false);
    expect(r.showTranslatedTag).toBe(false);
  });

  it('never prints raw role ids as speaker labels', () => {
    for (const lang of ['en', 'es'] as const) {
      const t = makeT(lang);
      for (const role of ['patient', 'assistant', 'system', 'weird']) {
        const label = t(speakerKey(role));
        expect(label).not.toMatch(/^(patient|assistant|system|weird)$/);
        expect(label).not.toContain('doctorMode.');
      }
    }
    expect(makeT('es')(speakerKey('patient'))).toBe('Paciente');
    expect(makeT('en')(speakerKey('assistant'))).toBe('Assistant');
  });

  it('renders body-map region and layer names from ids in the doctor language', () => {
    const m = base.bodyPainMap!.markers[0];
    const en = markerLabels(m, makeT('en'));
    expect(en).toMatchObject({ region: 'Head', layer: 'Skin', regionFromPatientLanguage: false });
    const es = markerLabels(m, makeT('es'));
    expect(es).toMatchObject({ region: 'Cabeza', layer: 'Piel' });
  });

  it('falls back to the stored label for an unknown future region id', () => {
    const out = markerLabels({ layer: 'skin', regionId: 'new_region_x', regionLabel: 'Zona nueva', layerLabel: 'Piel' } as any, makeT('en'));
    expect(out.region).toBe('Zona nueva');
    expect(out.regionFromPatientLanguage).toBe(true);
  });
});
