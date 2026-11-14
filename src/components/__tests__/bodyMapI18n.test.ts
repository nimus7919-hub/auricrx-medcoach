import * as fs from 'fs';
import * as path from 'path';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import { getAllRegionIds } from '../bodyMap/regions';
import { BODY_LAYERS, PAIN_FEELS, PAIN_ONSETS } from '../bodyMap/types';
import { findBannedClinicalTerms } from '../../../packages/doctor-core/src/compliance/bannedTerms';

const flat = (o: any, p = ''): [string, string][] =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [[`${p}${k}`, String(v)] as [string, string]]));
const get = (o: any, key: string) => key.split('.').reduce((a, k) => (a == null ? a : a[k]), o);

/** Keys built dynamically in code (not visible to the static i18n scripts). */
function dynamicKeys(): string[] {
  return [
    ...getAllRegionIds().map((id) => `bodyMap.regions.${id}`),
    ...BODY_LAYERS.flatMap((l) => [`bodyMap.layers.${l}`, `bodyMap.layerPhrase.${l}`]),
    ...PAIN_FEELS.map((f) => `bodyMap.feels.${f}`),
    ...PAIN_ONSETS.map((o) => `bodyMap.onsets.${o}`),
    ...['front', 'back'].map((v) => `bodyMap.views.${v}`),
    ...['full', 'upper', 'lower'].flatMap((z) => [`bodyMap.zoom.${z}`, `bodyMap.zoomA11y.${z}`]),
  ];
}

/** Literal t('bodyMap.…') keys used in the body map sources. */
function literalKeys(): string[] {
  const files = [
    '../bodyMap/BodyMap.tsx',
    '../bodyMap/PainDescriptorSheet.tsx',
    '../bodyMap/RegionListSheet.tsx',
    '../bodyMap/payload.ts',
    '../../screens/preVisitIntake/BodyMapStep.tsx',
    '../../screens/preVisitIntake/SummaryView.tsx',
  ];
  const keys = new Set<string>();
  for (const f of files) {
    const src = fs.readFileSync(path.join(__dirname, f), 'utf8');
    for (const m of src.matchAll(/t\(\s*'(bodyMap\.[A-Za-z0-9_.]+)'/g)) keys.add(m[1]);
  }
  return Array.from(keys);
}

describe('body map i18n coverage', () => {
  it('every dynamic and literal key exists as a string in en and es', () => {
    const keys = [...dynamicKeys(), ...literalKeys()];
    expect(keys.length).toBeGreaterThan(90);
    for (const key of keys) {
      expect({ key, en: typeof get(en, key) }).toEqual({ key, en: 'string' });
      expect({ key, es: typeof get(es, key) }).toEqual({ key, es: 'string' });
    }
  });

  it('en and es have identical bodyMap key sets; es is actually translated', () => {
    const e = flat((en as any).bodyMap);
    const s = flat((es as any).bodyMap);
    expect(s.map(([k]) => k).sort()).toEqual(e.map(([k]) => k).sort());
    const same = s.filter(([k, v]) => e.find(([ek]) => ek === k)?.[1] === v && /[a-z]{4,}/i.test(v));
    expect(same.map(([k]) => k)).toEqual([]);
  });

  it('every locale file carries the bodyMap subtree (fr/de/pt/zh English placeholders)', () => {
    const base = flat((en as any).bodyMap).map(([k]) => k).sort();
    for (const lng of ['fr', 'de', 'pt', 'zh']) {
      const json = JSON.parse(fs.readFileSync(path.join(__dirname, `../../i18n/${lng}.json`), 'utf8'));
      expect(flat(json.bodyMap).map(([k]) => k).sort()).toEqual(base);
    }
  });

  it('copy is descriptive only: no banned clinical terms, no interpretation, no organ-disease wording', () => {
    const extra = /red flag|warning sign|datos de alarma|\blikely\b|consistent with|could be|may have|might be|puede ser|podría|posible|probable|differential|diagnos|triage|urgen|appendi|apéndi|liver|hígado|kidney|riñ[oó]n|heart|corazón|stomach|estómago|lung|pulm[oó]n/i;
    for (const [key, value] of [...flat((en as any).bodyMap), ...flat((es as any).bodyMap)]) {
      expect({ key, hits: findBannedClinicalTerms(value) }).toEqual({ key, hits: [] });
      expect({ key, extra: extra.test(value) }).toEqual({ key, extra: false });
    }
  });
});
