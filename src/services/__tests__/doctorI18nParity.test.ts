import en from '../../../packages/doctor-core/i18n/en.json';
import es from '../../../packages/doctor-core/i18n/es.json';
import enApp from '../../../apps/doctor/src/i18n/en.json';
import esApp from '../../../apps/doctor/src/i18n/es.json';

function keys(obj: unknown, prefix = ''): string[] {
  if (obj == null || typeof obj !== 'object') return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) return keys(v, next);
    return [next];
  });
}

describe('doctor i18n en / es-MX (es) parity', () => {
  it('doctor-core doctorMode keys match between en and es', () => {
    const enKeys = keys(en.doctorMode, 'doctorMode').sort();
    const esKeys = keys(es.doctorMode, 'doctorMode').sort();
    expect(esKeys).toEqual(enKeys);
  });

  it('doctor app chrome keys match between en and es', () => {
    const enKeys = keys(enApp).sort();
    const esKeys = keys(esApp).sort();
    expect(esKeys).toEqual(enKeys);
  });

  it('compliance disclaimers exist in both languages', () => {
    expect(en.doctorMode.compliance.disclaimer).toMatch(/clinical judgment/i);
    expect(es.doctorMode.compliance.disclaimer).toMatch(/criterio clínico/i);
  });
});
