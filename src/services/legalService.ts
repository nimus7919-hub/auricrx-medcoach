// Import legal text from the generated module
import * as legalTexts from '../legal/legalTexts';

const FALLBACK_LANGUAGE = 'en';
const PRIVACY_ANCHOR = '\n# AURICRX MEDCOACH — PRIVACY POLICY';

// Map language codes to the exported constants
const LEGAL_TEXTS: Record<string, string> = {
  en: legalTexts.termsEN,
  es: legalTexts.termsES,
  pt: legalTexts.termsPT,
  fr: legalTexts.termsFR,
  de: legalTexts.termsDE,
  zh: legalTexts.termsZH,
};

function loadLegalFile(language: string): string {
  const targetLang = LEGAL_TEXTS[language] ? language : FALLBACK_LANGUAGE;
  return LEGAL_TEXTS[targetLang];
}

export async function loadTermsText(language: string): Promise<string> {
  const content = loadLegalFile(language);
  if (content.includes(PRIVACY_ANCHOR)) {
    const [termsContent] = content.split(PRIVACY_ANCHOR);
    return termsContent.trim();
  }
  return content.trim();
}

export async function loadPrivacyText(language: string): Promise<string> {
  const content = loadLegalFile(language);
  if (content.includes(PRIVACY_ANCHOR)) {
    const [, privacyContent] = content.split(PRIVACY_ANCHOR);
    return `# AURICRX MEDCOACH — PRIVACY POLICY${privacyContent}`.trim();
  }
  return content.trim();
}
