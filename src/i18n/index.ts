import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// import * as Localization from 'expo-localization'; // Temporarily commented out until new APK is installed
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
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      console.log('🔍 LANGUAGE_DETECTOR: Starting language detection...');
      const savedLanguage = await AsyncStorage.getItem('AURIC_LANG');
      console.log('🔍 LANGUAGE_DETECTOR: Retrieved from storage:', savedLanguage);
      if (savedLanguage) {
        console.log('✅ LANGUAGE_DETECTOR: Using saved language:', savedLanguage);
        callback(savedLanguage);
        return;
      }
      
      // Fallback to device locale (temporarily disabled)
      // const deviceLanguage = Localization.locale.split('-')[0];
      // const supportedLanguage = Object.keys(resources).includes(deviceLanguage) 
      //   ? deviceLanguage 
      //   : 'en';
      
      // For now, just use Spanish as fallback
      console.log('⚠️ LANGUAGE_DETECTOR: No saved language found, using fallback: es');
      callback('es');
    } catch (error) {
      console.error('❌ LANGUAGE_DETECTOR: Language detection error:', error);
      callback('es');
    }
  },
  init: () => {
    console.log('🔧 LANGUAGE_DETECTOR: Initialized');
  },
  cacheUserLanguage: async (lng: string) => {
    try {
      console.log('💾 LANGUAGE_DETECTOR: Caching user language:', lng);
      await AsyncStorage.setItem('AURIC_LANG', lng);
      console.log('✅ LANGUAGE_DETECTOR: Language cached successfully');
    } catch (error) {
      console.error('❌ LANGUAGE_DETECTOR: Error saving language:', error);
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
      fallbackLng: 'es',
      // Don't set lng here - let LANGUAGE_DETECTOR determine it
      debug: true, // Enable debug mode to see what's happening
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
  
  console.log('i18n initialized successfully');
  console.log('Available languages:', i18n.languages);
  console.log('Current language:', i18n.language);
} catch (error) {
  console.error('Failed to initialize i18n:', error);
  // Fallback initialization
  i18n.init({
    resources,
    fallbackLng: 'es',
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
