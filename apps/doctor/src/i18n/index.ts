import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import enCore from '../../../../packages/doctor-core/i18n/en.json';
import esCore from '../../../../packages/doctor-core/i18n/es.json';
import frCore from '../../../../packages/doctor-core/i18n/fr.json';
import deCore from '../../../../packages/doctor-core/i18n/de.json';
import ptCore from '../../../../packages/doctor-core/i18n/pt.json';
import zhCore from '../../../../packages/doctor-core/i18n/zh.json';

import enApp from './en.json';
import esApp from './es.json';
import frApp from './fr.json';
import deApp from './de.json';
import ptApp from './pt.json';
import zhApp from './zh.json';

const resources = {
  en: { translation: { ...enCore, ...enApp } },
  es: { translation: { ...esCore, ...esApp } },
  fr: { translation: { ...frCore, ...frApp } },
  de: { translation: { ...deCore, ...deApp } },
  pt: { translation: { ...ptCore, ...ptApp } },
  zh: { translation: { ...zhCore, ...zhApp } },
};

const deviceLang = (Localization.getLocales?.()[0]?.languageCode || 'es').split('-')[0];
const supported = ['en', 'es', 'fr', 'de', 'pt', 'zh'];
const lng = supported.includes(deviceLang) ? deviceLang : 'es';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: ['es', 'en'],
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
}

export default i18n;
