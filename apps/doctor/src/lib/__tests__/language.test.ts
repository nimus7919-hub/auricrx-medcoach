import {
  APP_LANGUAGES,
  normalizeAppLanguage,
  parseAppLanguage,
  resolveInitialLanguage,
  uiLocale,
} from '../language';
import { setCurrentLanguage, getCurrentLanguage } from '../currentLanguage';

describe('doctor app languages', () => {
  it('supports exactly Spanish and English', () => {
    expect([...APP_LANGUAGES].sort()).toEqual(['en', 'es']);
  });

  it('parses regional tags and rejects dropped locales', () => {
    expect(parseAppLanguage('en-US')).toBe('en');
    expect(parseAppLanguage('ES_mx')).toBe('es');
    for (const dropped of ['fr', 'de', 'pt', 'pt-BR', 'zh', 'zh-Hans', 'ja', '', null, undefined, 42]) {
      expect(parseAppLanguage(dropped as any)).toBeNull();
    }
  });

  it('falls back to Spanish (never to a third language) for unsupported device languages', () => {
    expect(resolveInitialLanguage('fr')).toBe('es');
    expect(resolveInitialLanguage('zh')).toBe('es');
    expect(resolveInitialLanguage('en')).toBe('en');
    expect(resolveInitialLanguage(undefined)).toBe('es');
  });

  it('maps to the Intl locale of the in-app language', () => {
    expect(uiLocale('en')).toBe('en-US');
    expect(uiLocale('es')).toBe('es-MX');
    expect(uiLocale('fr')).toBe('es-MX');
  });

  it('keeps the non-React language holder in sync', () => {
    expect(setCurrentLanguage('en-GB')).toBe('en');
    expect(getCurrentLanguage()).toBe('en');
    expect(setCurrentLanguage('de')).toBe('es');
    expect(getCurrentLanguage()).toBe('es');
    expect(normalizeAppLanguage('EN')).toBe('en');
  });
});
