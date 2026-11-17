import { readDeviceLocales, resolveInitialLanguage } from './language';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './en.json';
import es from './es.json';
import zh from './zh.json';
import pt from './pt.json';
import fr from './fr.json';
import de from './de.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  zh: { translation: zh },
  pt: { translation: pt },
  fr: { translation: fr },
  de: { translation: de },
};

const LANGUAGE_DETECTOR = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // The saved language always wins; otherwise use the device locale. Region is NOT consulted.
      const savedLanguage = await AsyncStorage.getItem('AURIC_LANG');
      callback(resolveInitialLanguage(savedLanguage, readDeviceLocales()));
    } catch (error) {
      console.error('LANGUAGE_DETECTOR: Language detection error:', error);
      callback(resolveInitialLanguage(null, readDeviceLocales()));
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('AURIC_LANG', lng);
    } catch (error) {
      console.error('LANGUAGE_DETECTOR: Error saving language:', error);
    }
  },
};

// Initialize i18n with error handling
try {
  i18n
    .use(LANGUAGE_DETECTOR)
    .use(initReactI18next)
    .init({
      resources,
      // A missing key in any locale falls back to English only (never to another UI language by region).
      fallbackLng: 'en',
      // Don't set lng here - let LANGUAGE_DETECTOR determine it
      debug: false, // Enable debug mode to see what's happening
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
  
} catch (error) {
  console.error('Failed to initialize i18n:', error);
  // Fallback initialization
  i18n.init({
    resources,
    fallbackLng: 'en',
    // Don't set lng in fallback either - let LANGUAGE_DETECTOR handle it
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

export default i18n;
