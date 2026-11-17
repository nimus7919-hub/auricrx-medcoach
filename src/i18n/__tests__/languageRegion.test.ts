/**
 * Language and region are independent settings:
 *  - language = saved AURIC_LANG, else the device locale (es* -> es, otherwise en)
 *  - region (MX/US) only drives pharmacies, units, currency and region-specific compliance copy
 */
import {
  languageFromDeviceLocales,
  normalizeLanguage,
  resolveInitialLanguage,
} from '../language';

let AsyncStorage: any;

describe('language helpers', () => {
  it('derives the first-launch language from the device locale only', () => {
    expect(languageFromDeviceLocales([{ languageCode: 'es' }])).toBe('es');
    expect(languageFromDeviceLocales([{ languageTag: 'es-MX' }])).toBe('es');
    expect(languageFromDeviceLocales(['es_US'])).toBe('es');
    expect(languageFromDeviceLocales([{ languageCode: 'en' }])).toBe('en');
    expect(languageFromDeviceLocales([{ languageCode: 'fr' }])).toBe('en');
    expect(languageFromDeviceLocales([])).toBe('en');
    expect(languageFromDeviceLocales(null)).toBe('en');
  });

  it('keeps an existing saved language over the device locale', () => {
    expect(resolveInitialLanguage('en', [{ languageCode: 'es' }])).toBe('en');
    expect(resolveInitialLanguage('es', [{ languageCode: 'en' }])).toBe('es');
    expect(resolveInitialLanguage('pt-BR', [{ languageCode: 'es' }])).toBe('pt');
  });

  it('falls back to the device locale when nothing valid is saved', () => {
    expect(resolveInitialLanguage(null, [{ languageCode: 'es' }])).toBe('es');
    expect(resolveInitialLanguage('xx', [{ languageCode: 'en' }])).toBe('en');
    expect(normalizeLanguage('EN-us')).toBe('en');
    expect(normalizeLanguage(undefined)).toBeNull();
  });
});

describe('region does not change language', () => {
  beforeEach(() => {
    jest.resetModules();
    // resetModules re-creates the mocked module, so fetch the instance the code under test will see.
    AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockReset();
    AsyncStorage.setItem.mockReset();
    AsyncStorage.setItem.mockResolvedValue(undefined);
  });

  it('setRegion writes only AURIC_REGION', async () => {
    const { setRegion, getRegion } = require('../../services/region');
    await setRegion('US');
    await setRegion('MX');
    const keys = AsyncStorage.setItem.mock.calls.map((c: unknown[]) => c[0]);
    expect(keys).toEqual(['AURIC_REGION', 'AURIC_REGION']);
    expect(keys).not.toContain('AURIC_LANG');
    expect(getRegion()).toBe('MX');
  });

  it('rejects an invalid region', async () => {
    const { setRegion } = require('../../services/region');
    await expect(setRegion('FR')).rejects.toThrow('INVALID_REGION');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  async function bootLanguage(saved: string | null, deviceLanguage: string, savedRegion: string | null) {
    jest.resetModules();
    AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockImplementation(async (key: string) =>
      key === 'AURIC_LANG' ? saved : key === 'AURIC_REGION' ? savedRegion : null);
    jest.doMock('expo-localization', () => ({
      getLocales: () => [{ languageCode: deviceLanguage, languageTag: `${deviceLanguage}-XX`, regionCode: 'MX' }],
      getCalendars: () => [],
    }));
    const i18n = require('../index').default;
    for (let i = 0; i < 50 && !i18n.language; i++) await new Promise(r => setTimeout(r, 10));
    return i18n.language as string;
  }

  it('first launch follows the device locale, ignoring a Mexico region', async () => {
    expect(await bootLanguage(null, 'en', 'MX')).toBe('en');
  });

  it('first launch on a Spanish device is Spanish, ignoring a US region', async () => {
    expect(await bootLanguage(null, 'es', 'US')).toBe('es');
  });

  it('a stored language is kept regardless of region or device locale', async () => {
    expect(await bootLanguage('en', 'es', 'MX')).toBe('en');
    expect(await bootLanguage('es', 'en', 'US')).toBe('es');
  });
});
