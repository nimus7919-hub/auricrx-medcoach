import { getRegion } from '../services/region';
import usNotices from '../legal/usDisclaimers.json';
import uiI18n from "../i18n";
// Keep helper closures tied to the render that created them.
export function creategetInitialAIMessage(getScope) {
  return (selectedDoctor) => {
    const { S } = getScope();

  const introductions = {
    'alfred': S.alfredIntro || uiI18n.t("ai.alfredIntro"),
    'mimi': S.mimiIntro || uiI18n.t("ai.mimiIntro"),
    'pawlmer': S.pawlmerIntro || uiI18n.t("ai.pawlmerIntro")
  };
  if (getRegion() === 'US') return `${usNotices.ai}\n\n${selectedDoctor === 'mimi' ? 'I am Mimi, an AI wellness guide.' : selectedDoctor === 'pawlmer' ? 'I am Pawlmer, an AI reminder buddy.' : 'I am Alfred, an AI information assistant.'}`;
  return introductions[selectedDoctor] || introductions['alfred'];
};
}

export function createaddCatExpressions(getScope) {
  return (response, selectedDoctor, lang) => {
    const {  } = getScope();

  if (selectedDoctor !== 'pawlmer') {
    return response;
  }

  // Cat expressions based on language
  const catExpressions = { get en() { return uiI18n.t("localized.appHelpers.catExpressions", { lng: 'en', returnObjects: true }); }, get es() { return uiI18n.t("localized.appHelpers.catExpressions", { lng: 'es', returnObjects: true }); }, get zh() { return uiI18n.t("localized.appHelpers.catExpressions", { lng: 'zh', returnObjects: true }); } };

  const expressions = catExpressions[lang] || catExpressions['en'];
  
  // Randomly add cat expressions to responses
  const shouldAddExpression = Math.random() > 0.7; // 30% chance
  
  if (shouldAddExpression) {
    const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
    
    // Add expression at the beginning or end
    if (Math.random() > 0.5) {
      return `${randomExpression} ${response}`;
    } else {
      return `${response} ${randomExpression}`;
    }
  }
  
  return response;
};
}

export function creategetDoctorGreeting(getScope) {
  return (doctor) => {
    const {  } = getScope();

    const greetings = {
      'Alfred': uiI18n.t("ai.alfredIntro"),
      'Mimi': uiI18n.t("ai.mimiIntro"),
      'Pawlmer': uiI18n.t("ai.pawlmerIntro")
    };
    return greetings[doctor] || greetings[uiI18n.t("ai.alfred")];
  };
}
