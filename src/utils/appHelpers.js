import uiI18n from "../i18n";
// Keep helper closures tied to the render that created them.
export function creategetInitialAIMessage(getScope) {
  return (selectedDoctor) => {
    const { S } = getScope();

  const introductions = {
    'alfred': S.drAlfredIntro || uiI18n.t("ai.drAlfredIntro"),
    'mimi': S.drMimiIntro || uiI18n.t("ai.drMimiIntro"),
    'pawlmer': S.pawlmerIntro || uiI18n.t("ai.pawlmerIntro")
  };
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
      'Alfred': uiI18n.t("ai.drAlfredIntro"),
      'Mimi': uiI18n.t("ai.drMimiIntro"),
      'Pawlmer': uiI18n.t("ai.pawlmerIntro")
    };
    return greetings[doctor] || greetings[uiI18n.t("ai.drAlfred")];
  };
}
