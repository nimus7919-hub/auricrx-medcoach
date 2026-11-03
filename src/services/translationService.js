import uiI18n from "../i18n";
// Simple translation service for missing keys
// This can be enhanced with actual translation APIs like Google Translate, DeepL, etc.

const TRANSLATION_MAP = { get en() { return uiI18n.t("localized.translationService.TRANSLATION_MAP", { lng: 'en', returnObjects: true }); }, get es() { return uiI18n.t("localized.translationService.TRANSLATION_MAP", { lng: 'es', returnObjects: true }); }, get zh() { return uiI18n.t("localized.translationService.TRANSLATION_MAP", { lng: 'zh', returnObjects: true }); }, get pt() { return uiI18n.t("localized.translationService.TRANSLATION_MAP", { lng: 'pt', returnObjects: true }); }, get fr() { return uiI18n.t("localized.translationService.TRANSLATION_MAP", { lng: 'fr', returnObjects: true }); }, get de() { return uiI18n.t("localized.translationService.TRANSLATION_MAP", { lng: 'de', returnObjects: true }); } };

export const getTranslation = (key, language = 'en') => {
  return TRANSLATION_MAP[language]?.[key] || TRANSLATION_MAP['en']?.[key] || key;
};

export const translateKey = (key, fromLang = 'en', toLang = 'es') => {
  // This is a simple fallback - in production, you'd use a real translation API
  const englishValue = TRANSLATION_MAP['en'][key];
  if (!englishValue) return key;
  
  return TRANSLATION_MAP[toLang]?.[key] || englishValue;
};

export default {
  getTranslation,
  translateKey
};
