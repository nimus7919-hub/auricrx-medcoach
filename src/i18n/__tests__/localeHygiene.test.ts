/** Fails when locale files mix languages (bilingual "A / B" values, Spanish in English, garbled accents) or en/es drift apart. */
const { checkLocaleHygiene } = require('../../../scripts/check-locale-hygiene.cjs');

describe('locale hygiene', () => {
  it('en and es have identical keys and no locale mixes languages', () => {
    expect(checkLocaleHygiene()).toEqual([]);
  });

  it('detects a bilingual pair and Spanish in English (self-check)', () => {
    const fs = require('fs');
    const original = fs.readFileSync;
    const en = JSON.parse(original(require.resolve('../en.json'), 'utf8'));
    en.__probe = { pair: 'Save / Guardar', es: 'Cancelación' };
    jest.spyOn(fs, 'readFileSync').mockImplementation(((file: any, ...rest: any[]) =>
      String(file).endsWith('/en.json') ? JSON.stringify(en) : original(file, ...rest)) as any);
    const problems: string[] = checkLocaleHygiene();
    jest.restoreAllMocks();
    expect(problems.some(p => p.startsWith('bilingual-pair[en]: __probe.pair'))).toBe(true);
    expect(problems.some(p => p.startsWith('spanish-in-en: __probe.es'))).toBe(true);
    expect(problems.some(p => p.startsWith('key-missing-in-es: __probe.pair'))).toBe(true);
  });
});
