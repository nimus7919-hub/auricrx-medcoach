// Keep helper closures tied to the render that created them.
export function creategetInitialAIMessage(getScope) {
  return (selectedDoctor) => {
    const { S } = getScope();

  const introductions = {
    'alfred': S.drAlfredIntro || "I'm Alfred, an AI health-information assistant. I'm not a doctor. I can explain general health and medication topics.",
    'mimi': S.drMimiIntro || "I'm Mimi, an AI wellness assistant. I share general information, not medical advice.",
    'pawlmer': S.pawlmerIntro || "I'm Pawlmer, an AI cat assistant. I make health information friendlier, but I'm not a doctor."
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
  const catExpressions = {
    'en': ['Purr...', 'Meow!', '🐱', 'Purr-fect!', 'Feline-ly speaking...', 'Cat-egorically speaking...'],
    'es': ['Ronroneo...', '¡Miau!', '🐱', '¡Purr-fecto!', 'Felino-hablando...', 'Categoría-mente hablando...'],
    'zh': ['呼噜...', '喵！', '🐱', '完美！', '猫科医生说...', '从猫的角度...']
  };

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
      'Alfred': "I'm Alfred, an AI health-information assistant. I'm not a doctor. I can explain general health and medication topics.",
      'Mimi': "I'm Mimi, an AI wellness assistant. I share general information, not medical advice.",
      'Pawlmer': "I'm Pawlmer, an AI cat assistant. I make health information friendlier, but I'm not a doctor."
    };
    return greetings[doctor] || greetings['Alfred'];
  };
}
