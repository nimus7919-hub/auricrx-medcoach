import { useTranslation as useI18nTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  
  const changeLanguage = async (language) => {
    try {
      await i18n.changeLanguage(language);
      await AsyncStorage.setItem('AURIC_LANG', language);
      console.log('Language changed to:', language);
      console.log('Language preference saved to AsyncStorage');
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return {
    t,
    changeLanguage,
    currentLanguage: i18n.language,
    isReady: i18n.isInitialized
  };
};

export default useTranslation;
