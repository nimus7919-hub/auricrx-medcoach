// Shared by the chat UI and server; deterministic notices do not depend on the model.
const locales = {
  en: require('../src/i18n/en.json'), es: require('../src/i18n/es.json'),
  de: require('../src/i18n/de.json'), fr: require('../src/i18n/fr.json'),
  pt: require('../src/i18n/pt.json'), zh: require('../src/i18n/zh.json'),
};
const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’‘]/g, "'");
function detectUrgency(text) {
  const value = normalize(text);
  const selfHarm = /suicid|self[- ]?harm|kill myself|hurt myself|end my life|want to die|matarme|me (quiero|voy a) matar|hacerme dano|autolesion|quitarme la vida|quiero morir/.test(value);
  return { selfHarm, emergency: selfHarm || /chest pain|pain in (my |the )?chest|can(?:not|'t) breathe|can not breathe|trouble breathing|difficulty breathing|shortness of breath|overdos|unconscious|severe bleeding|stroke|heart attack|seizure|dolor (en el |de )?pecho|no puedo respirar|dificultad para respirar|falta de aire|sobredosis|inconsciente|sangrado (grave|abundante)|derrame cerebral|infarto|convulsion/.test(value) };
}
function medicationRelated(text) {
  return /medic|farmac|\bdrug|\bdos[ei]|\bpill|prescri|tablet|insulin|ibuprofen|paracetamol|acetaminophen|aspirin|antibiotic|anticoagul|metformin|arznei|comprime|remedio|药|藥|服用|剂量|劑量/i.test(normalize(text));
}
function safetyText(language) {
  return (locales[String(language || 'en').split(/[-_]/)[0]] || locales.en).ai;
}
function appendSafety(reply, question, language) {
  const labels = safetyText(language);
  const urgency = detectUrgency(question);
  const notices = [];
  if (urgency.emergency) notices.push(labels.emergencyBanner);
  if (urgency.selfHarm) notices.push(labels.selfHarmBanner);
  let result = [...notices, String(reply || '').trim()].filter(Boolean).join('\n\n');
  if (medicationRelated(`${question} ${reply}`) && !result.includes(labels.medicationWarning)) result += `\n\n${labels.medicationWarning}`;
  return result;
}
module.exports = { detectUrgency, medicationRelated, safetyText, appendSafety };
