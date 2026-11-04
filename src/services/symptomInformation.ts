import { getRegion } from './region';
import usNotices from '../legal/usDisclaimers.json';
import uiI18n from "../i18n";
export function symptomInformation(symptoms: string[], language = 'en', additionalInfo = '') {
  const text = [...symptoms, additionalInfo].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const emergency = ['chest pain', 'difficulty breathing', 'cannot breathe', "can't breathe", 'loss of consciousness',
    'severe bleeding', 'seizure', 'paralysis', 'facial droop', 'dolor de pecho', 'dolor en el pecho',
    'no puedo respirar', 'dificultad para respirar', 'desmayo', 'convulsion', 'sangrado abundante',
    'paralisis', 'cara caida'].some(keyword => text.includes(keyword)) || (getRegion() === 'US' && /poison|overdose/.test(text));
  const selfHarm = ['quiero morir', 'suicidio', 'suicida', 'suicide', 'suicidal', 'want to die', 'kill myself', 'self-harm'].some(keyword => text.includes(keyword));
  const es = language.startsWith('es');
  const general = uiI18n.t("localized.symptomInformation.general.text9", { lng: language });
  const whenToSeekCare = emergency || selfHarm
    ? [uiI18n.t("localized.symptomInformation.whenToSeekCare.item0.text13", { lng: language }),
      ...(selfHarm ? [uiI18n.t("localized.symptomInformation.whenToSeekCare.item1.item0.text14", { lng: language })] : [])]
    : [uiI18n.t("localized.symptomInformation.whenToSeekCare.item0.text15", { lng: language })];
  return { id: `symptom_${Date.now()}`, symptoms, generalInformation: general,
    recommendations: [general], followUpActions: getRegion() === 'US' && (emergency || selfHarm) ? [usNotices.crisis] : whenToSeekCare, createdAt: new Date().toISOString() };
}
