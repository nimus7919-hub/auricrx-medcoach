import React from 'react';
import { render, screen } from '@testing-library/react-native';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import OpenSourceLicensesScreen from '../../screens/OpenSourceLicensesScreen';
import { THIRD_PARTY_ART_CREDITS } from '../../legal/thirdPartyArtCredits';

jest.mock('../../contexts/WallpaperContext', () => ({
  useWallpaper: () => ({ getCardBackgroundColor: () => '#172235', getCardBorderColor: () => '#756340', getCardTextColor: () => '#FFF5E4' }),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

async function makeI18n(lng: 'en' | 'es') {
  const inst = i18next.createInstance();
  await inst.use(initReactI18next).init({ lng, fallbackLng: 'en', resources: { en: { translation: en }, es: { translation: es } }, interpolation: { escapeValue: false } });
  return inst;
}

describe('OpenSourceLicensesScreen', () => {
  it('lists every art credit with author, license and source', async () => {
    const i18n = await makeI18n('en');
    await render(
      <I18nextProvider i18n={i18n}>
        <OpenSourceLicensesScreen onClose={() => {}} />
      </I18nextProvider>
    );
    expect(screen.getByText('Open-source licenses')).toBeTruthy();
    for (const c of THIRD_PARTY_ART_CREDITS) {
      expect(screen.getByText(c.title)).toBeTruthy();
      expect(screen.getByText(c.sourceUrl)).toBeTruthy();
    }
    expect(screen.getAllByText('CC BY-SA 4.0').length).toBe(1);
  });

  it('uses the es-MX title', async () => {
    const i18n = await makeI18n('es');
    await render(
      <I18nextProvider i18n={i18n}>
        <OpenSourceLicensesScreen onClose={() => {}} />
      </I18nextProvider>
    );
    expect(screen.getByText('Licencias de código abierto')).toBeTruthy();
  });
});
