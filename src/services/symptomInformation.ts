export function symptomInformation(symptoms: string[], language = 'en', additionalInfo = '') {
  const text = [...symptoms, additionalInfo].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const emergency = ['chest pain', 'difficulty breathing', 'cannot breathe', "can't breathe", 'loss of consciousness',
    'severe bleeding', 'seizure', 'paralysis', 'facial droop', 'dolor de pecho', 'dolor en el pecho',
    'no puedo respirar', 'dificultad para respirar', 'desmayo', 'convulsion', 'sangrado abundante',
    'paralisis', 'cara caida'].some(keyword => text.includes(keyword));
  const selfHarm = ['quiero morir', 'suicidio', 'suicida', 'suicide', 'suicidal', 'want to die', 'kill myself', 'self-harm'].some(keyword => text.includes(keyword));
  const es = language.startsWith('es');
  const general = es
    ? 'Los síntomas pueden tener distintas causas. Esta información general no identifica padecimientos ni sustituye una valoración médica.'
    : 'Symptoms can have different causes. This general information does not identify conditions or replace a medical assessment.';
  const whenToSeekCare = emergency || selfHarm
    ? [es ? 'Si es una emergencia llama al 911 ahora.' : 'If this is an emergency, call 911 now.',
      ...(selfHarm ? [es ? 'También puedes llamar a Línea de la Vida: 800 911 2000 (México).' : 'You can also call Línea de la Vida: 800 911 2000 (Mexico).'] : [])]
    : [es ? 'Consulta a un médico si los síntomas persisten, empeoran o te preocupan. Si es una emergencia llama al 911 ahora.' : 'See a doctor if symptoms persist, worsen or concern you. If this is an emergency, call 911 now.'];
  return { id: `symptom_${Date.now()}`, symptoms, generalInformation: general,
    recommendations: [general], followUpActions: whenToSeekCare, createdAt: new Date().toISOString() };
}
