import fs from 'fs';
import path from 'path';
import { deepMerge, resources } from '../resources';
import { VERIFICATION_MESSAGE_CODES } from '../../lib/verificationText';

const ROOT = path.resolve(__dirname, '../../../../..');
const APP = path.join(ROOT, 'apps/doctor');
const en: any = resources.en.translation;
const es: any = resources.es.translation;

function flat(o: any, p = ''): Record<string, string> {
  return Object.entries(o).reduce((acc: Record<string, string>, [k, v]) => {
    const key = p ? `${p}.${k}` : k;
    return typeof v === 'object' && v ? { ...acc, ...flat(v, key) } : { ...acc, [key]: String(v) };
  }, {});
}
const enFlat = flat(en);
const esFlat = flat(es);

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const f of fs.readdirSync(dir)) {
    if (f === 'node_modules' || f === '__tests__') continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) sourceFiles(p, out);
    else if (/\.(tsx?|ts)$/.test(f)) out.push(p);
  }
  return out;
}
const files = [path.join(APP, 'App.tsx'), ...sourceFiles(path.join(APP, 'src'))];
const source = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
function leaks(re: RegExp): string[] {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  return Array.from(source.matchAll(g)).map((m) => m[0]);
}

describe('doctor app i18n: EN and ES only', () => {
  it('ships only en and es resources and locale files', () => {
    expect(Object.keys(resources).sort()).toEqual(['en', 'es']);
    for (const l of ['fr', 'de', 'pt', 'zh']) {
      expect(fs.existsSync(path.join(APP, `src/i18n/${l}.json`))).toBe(false);
      expect(fs.existsSync(path.join(ROOT, `packages/doctor-core/i18n/${l}.json`))).toBe(false);
    }
  });

  it('has no fr/de/pt/zh left in the picker, detection or fallback chain', () => {
    const idx = fs.readFileSync(path.join(APP, 'src/i18n/index.ts'), 'utf8');
    expect(idx).not.toMatch(/['"](fr|de|pt|zh)['"]/);
    expect(leaks(/\[\s*'es'\s*,\s*'en'\s*,\s*'pt'/)).toEqual([]);
  });

  it('EN and ES have the same keys (merged doctor-core + app)', () => {
    expect(Object.keys(esFlat).sort()).toEqual(Object.keys(enFlat).sort());
  });

  it('deepMerge overrides single keys without dropping siblings', () => {
    const m: any = deepMerge({ a: { b: 1, c: 2 }, x: 1 }, { a: { c: 3 } });
    expect(m).toEqual({ a: { b: 1, c: 3 }, x: 1 });
  });

  const usedKeys = Array.from(source.matchAll(/\bt\(\s*['"`]([A-Za-z0-9_.]+)['"`]/g)).map((m) => m[1]);
  it('every statically used t() key exists in both languages', () => {
    const missing = [...new Set(usedKeys)].filter((k) => !(k in enFlat) || !(k in esFlat));
    expect(missing).toEqual([]);
  });

  it('English never shows "bitácora", "cédula" or the Spanish product name', () => {
    const bad = /bit[aá]cora|c[eé]dula|M[eé]dicos/i;
    const offenders = [...new Set(usedKeys)].filter((k) => bad.test(enFlat[k] || ''));
    expect(offenders).toEqual([]);
    expect(enFlat['appName']).toBe('AuricRX for Doctors');
    expect(esFlat['appName']).toBe('AuricRX Médicos');
    // dynamic key families used by the app
    for (const [k, v] of Object.entries(enFlat)) {
      if (/^(mfa|admin|errors|language)\./.test(k)) expect(v).not.toMatch(bad);
    }
    expect(enFlat['doctorMode.onboarding.cedula']).toBe('Professional license number');
    expect(enFlat['doctorMode.doctor.tapToOpen']).toBe('Open shared log');
  });

  it('Spanish values contain no English product name', () => {
    expect(Object.entries(esFlat).filter(([, v]) => /for Doctors/.test(v))).toEqual([]);
  });

  it('every verification status code and body-map region id has text in both languages', () => {
    for (const c of VERIFICATION_MESSAGE_CODES) {
      expect(typeof enFlat[`doctorMode.verification.messages.${c}`]).toBe('string');
      expect(typeof esFlat[`doctorMode.verification.messages.${c}`]).toBe('string');
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ALL_REGION_IDS } = require(path.join(ROOT, 'server/previsit-intake-bodymap.js'));
    for (const id of ALL_REGION_IDS) {
      expect(enFlat[`doctorMode.preVisitIntake.bodyMap.regions.${id}`]).toBeTruthy();
      expect(esFlat[`doctorMode.preVisitIntake.bodyMap.regions.${id}`]).toBeTruthy();
    }
    for (const layer of ['skin', 'muscles', 'vessels', 'bones', 'organs']) {
      expect(enFlat[`doctorMode.preVisitIntake.bodyMap.layers.${layer}`]).toBeTruthy();
      expect(esFlat[`doctorMode.preVisitIntake.bodyMap.layers.${layer}`]).toBeTruthy();
    }
  });
});

describe('doctor app code: no language leaks', () => {
  it('never shows e.message / error.message to the user', () => {
    expect(leaks(/Alert\.alert\([^)]*\.message/)).toEqual([]);
    expect(leaks(/\be\?\.message\b/)).toEqual([]);
  });

  it('never formats dates with the device locale or prints raw ISO/status enums', () => {
    expect(leaks(/\.toLocale(Date|Time)?String\(\s*\)/)).toEqual([]);
    expect(leaks(/>\s*\{apptDraft\.status\}/)).toEqual([]);
    expect(leaks(/\{preVisit\.generatedAt\}/)).toEqual([]);
    expect(leaks(/\.slice\(0,\s*10\)\s*,?\s*\n?\s*\}\)/)).toEqual([]);
  });

  it('never hardcodes a language where the in-app language is available', () => {
    expect(leaks(/locale:\s*'es'/)).toEqual([]);
    expect(leaks(/i18n\.language\?\.startsWith/)).toEqual([]);
    expect(leaks(/\{turn\.role\}/)).toEqual([]);
    expect(leaks(/\{[^}]*\.verificationMessage\}/)).toEqual([]);
    expect(leaks(/\.(regionLabel|layerLabel)\}/)).toEqual([]);
  });

  it('declares localized app metadata for Face ID and the app name', () => {
    const app = JSON.parse(fs.readFileSync(path.join(APP, 'app.json'), 'utf8')).expo;
    expect(Object.keys(app.locales).sort()).toEqual(['en', 'es']);
    for (const l of ['en', 'es']) {
      const f = JSON.parse(fs.readFileSync(path.join(APP, app.locales[l]), 'utf8'));
      expect(f.ios.NSFaceIDUsageDescription).toBeTruthy();
      expect(f.ios.CFBundleDisplayName).toBeTruthy();
      expect(f.android.app_name).toBeTruthy();
    }
    const en = JSON.parse(fs.readFileSync(path.join(APP, app.locales.en), 'utf8'));
    const es = JSON.parse(fs.readFileSync(path.join(APP, app.locales.es), 'utf8'));
    expect(en.ios.NSFaceIDUsageDescription).not.toBe(es.ios.NSFaceIDUsageDescription);
    expect(en.ios.CFBundleDisplayName).toBe('AuricRX for Doctors');
    expect(es.ios.CFBundleDisplayName).toBe('AuricRX Médicos');
    expect(app.ios.infoPlist.CFBundleLocalizations.sort()).toEqual(['en', 'es']);
    expect(app.ios.infoPlist.CFBundleAllowMixedLocalizations).toBe(true);
    // default (fallback) Face ID text is Spanish = the default app language, not English
    expect(app.ios.infoPlist.NSFaceIDUsageDescription).toBe(es.ios.NSFaceIDUsageDescription);
  });
});
