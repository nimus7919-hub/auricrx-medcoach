import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import { resources } from './resources';
import { resolveInitialLanguage } from '../lib/language';

const lng = resolveInitialLanguage(Localization.getLocales?.()[0]?.languageCode);

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng,
    supportedLngs: ['en', 'es'],
    // Never mix languages: a missing key falls back only to the *active* language, never across.
    fallbackLng: { en: ['en'], es: ['es'], default: ['es'] },
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
}

export default i18n;
