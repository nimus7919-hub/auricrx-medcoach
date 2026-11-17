import { getDateTimePickerLocale } from '../dateTimeLocale';

describe('getDateTimePickerLocale', () => {
  it('uses es-MX for Spanish', () => {
    expect(getDateTimePickerLocale('es')).toBe('es-MX');
    expect(getDateTimePickerLocale('es-MX')).toBe('es-MX');
  });

  it('maps other supported languages', () => {
    expect(getDateTimePickerLocale('en')).toBe('en-US');
    expect(getDateTimePickerLocale('fr')).toBe('fr-FR');
    expect(getDateTimePickerLocale('de')).toBe('de-DE');
    expect(getDateTimePickerLocale('pt')).toBe('pt-BR');
    expect(getDateTimePickerLocale('zh')).toBe('zh-CN');
  });
});
