import i18next from 'i18next';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import { initialBodyMapState, bodyMapReducer, type BodyMapAction } from '../bodyMap/markersReducer';
import { describeBodyPainMap, describeBodyPainMarker, parseBodyPainMapPayload, toBodyPainMapPayload } from '../bodyMap/payload';

async function tFor(lng: 'en' | 'es') {
  const inst = i18next.createInstance();
  await inst.init({ lng, fallbackLng: 'en', resources: { en: { translation: en }, es: { translation: es } }, interpolation: { escapeValue: false } });
  return (k: string, o?: Record<string, unknown>) => String(inst.t(k, o as any));
}

const NOW = () => new Date('2026-11-14T16:00:00.000Z');

function sampleMarkers() {
  const actions: BodyMapAction[] = [
    { type: 'SET_LAYER', layer: 'muscles' },
    { type: 'SET_VIEW', view: 'back' },
    { type: 'PLACE', regionId: 'lower_back_left', x: 82, y: 182 },
    { type: 'UPDATE', id: 'm1', patch: { intensity: 6, feels: ['aching'] } },
    { type: 'SET_LAYER', layer: 'organs' },
    { type: 'SET_VIEW', view: 'front' },
    { type: 'PLACE', regionId: 'upper_abdomen_right', x: 80, y: 140 },
    { type: 'UPDATE', id: 'm2', patch: { feels: ['burning', 'sharp'], onset: 'days', note: 'after meals' } },
  ];
  return actions.reduce(bodyMapReducer, initialBodyMapState()).markers;
}

describe('body pain map payload', () => {
  it('serializes markers into a versioned, normalized, label-carrying payload', async () => {
    const t = await tFor('en');
    const payload = toBodyPainMapPayload(sampleMarkers(), { locale: 'en', t, now: NOW });
    expect(payload).toEqual({
      version: 1,
      locale: 'en',
      reportedAt: '2026-11-14T16:00:00.000Z',
      markers: [
        {
          layer: 'muscles',
          view: 'back',
          regionId: 'lower_back_left',
          regionLabel: 'Lower back, left side',
          layerLabel: 'Muscles',
          position: { x: 0.41, y: 0.414 },
          intensity: 6,
          feels: ['aching'],
          onset: null,
          note: null,
        },
        {
          layer: 'organs',
          view: 'front',
          regionId: 'upper_abdomen_right',
          regionLabel: 'Upper right abdomen area',
          layerLabel: 'Organs',
          position: { x: 0.4, y: 0.318 },
          intensity: null,
          feels: ['sharp', 'burning'],
          onset: 'days',
          note: 'after meals',
        },
      ],
    });
    // Round-trips through JSON (what goes over the wire).
    expect(parseBodyPainMapPayload(JSON.parse(JSON.stringify(payload)))).toEqual(payload);
  });

  it('returns null when nothing was marked (server field stays null)', async () => {
    const t = await tFor('en');
    expect(toBodyPainMapPayload([], { locale: 'en', t })).toBeNull();
    expect(parseBodyPainMapPayload(null)).toBeNull();
    expect(parseBodyPainMapPayload({ version: 2, markers: [] })).toBeNull();
    expect(parseBodyPainMapPayload('junk')).toBeNull();
  });

  it('describes each marker plainly for the doctor (en)', async () => {
    const t = await tFor('en');
    const payload = toBodyPainMapPayload(sampleMarkers(), { locale: 'en', t, now: NOW })!;
    expect(describeBodyPainMarker(payload.markers[0], t)).toBe('Patient marked: Muscles layer, Lower back, left side, intensity 6/10, “aching”');
    expect(describeBodyPainMarker(payload.markers[1], t)).toBe(
      'Patient marked: Organs layer, Upper right abdomen area, “sharp”, “burning”, started: a few days ago, note: “after meals”'
    );
  });

  it('describes each marker plainly for the doctor (es-MX)', async () => {
    const t = await tFor('es');
    const payload = toBodyPainMapPayload(sampleMarkers(), { locale: 'es', t, now: NOW })!;
    expect(payload.markers[0].regionLabel).toBe('Parte baja de la espalda, lado izquierdo');
    expect(describeBodyPainMap(payload, t)).toEqual([
      'Marcado por el paciente: Capa de músculos, Parte baja de la espalda, lado izquierdo, intensidad 6/10, “molestia constante”',
      'Marcado por el paciente: Capa de órganos, Zona alta derecha del abdomen, “punzante”, “ardor”, inicio: hace unos días, nota: “after meals”',
    ]);
  });

  it('description never adds meaning beyond what the patient picked', async () => {
    for (const lng of ['en', 'es'] as const) {
      const t = await tFor(lng);
      const lines = describeBodyPainMap(toBodyPainMapPayload(sampleMarkers(), { locale: lng, t, now: NOW }), t);
      for (const line of lines) {
        expect(line).not.toMatch(/may|might|could|likely|suggest|consistent|indica|posible|probable|sugiere|diagnos|urgen|triage|risk|riesgo/i);
      }
    }
  });
});
