import { compareNames, namesMatchStrict, normalizeNamePart, nameTokens } from '../nameMatch';

describe('nameMatch', () => {
  it('normalizes accents and case', () => {
    expect(normalizeNamePart('José María')).toBe('jose maria');
    expect(normalizeNamePart('  PEÑA-NIETO ')).toBe('pena nieto');
  });

  it('matches all name parts regardless of order', () => {
    expect(namesMatchStrict('María José López García', 'López García María José')).toBe(true);
    expect(compareNames('Ana Pérez', 'Ana Perez').matched).toBe(true);
  });

  it('fails when any part is missing', () => {
    expect(namesMatchStrict('Juan Carlos Pérez', 'Juan Pérez')).toBe(false);
    const r = compareNames('Juan Carlos Pérez', 'Juan Pérez');
    expect(r.matched).toBe(false);
    expect(r.missingFromRegistry).toContain('carlos');
  });

  it('fails on empty names', () => {
    expect(namesMatchStrict('', 'Ana')).toBe(false);
    expect(nameTokens('')).toEqual([]);
  });
});
