import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  
  const changeLanguage = async (language) => {
    try {
      await i18n.changeLanguage(language);
      console.log('Language changed to:', language);
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
