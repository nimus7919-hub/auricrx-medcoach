import { getRegion } from './region';
import { US_POLICIES } from '../legal/usPolicies';
// Import legal text from the generated module
import * as legalTexts from '../legal/legalTexts';

const FALLBACK_LANGUAGE = 'en';
const PRIVACY_ANCHOR = '\n# AURICRX MEDCOACH — PRIVACY POLICY';

// Map language codes to the exported constants
const LEGAL_TEXTS: Record<string, string> = {
  en: legalTexts.termsEN,
  es: legalTexts.termsES,
  pt: legalTexts.termsEN,
  fr: legalTexts.termsEN,
  de: legalTexts.termsEN,
  zh: legalTexts.termsEN,
};

function loadLegalFile(language: string): string {
  const targetLang = LEGAL_TEXTS[language] ? language : FALLBACK_LANGUAGE;
  return LEGAL_TEXTS[targetLang];
}

export async function loadTermsText(language: string): Promise<string> {
  if (getRegion() === 'US') return US_POLICIES['Terms'];
  const content = loadLegalFile(language);
  if (content.includes(PRIVACY_ANCHOR)) {
    const [termsContent] = content.split(PRIVACY_ANCHOR);
    return termsContent.trim();
  }
  return content.trim();
}

export async function loadPrivacyText(language: string): Promise<string> {
  if (getRegion() === 'US') return US_POLICIES['Privacy Policy'];
  const content = loadLegalFile(language);
  if (content.includes(PRIVACY_ANCHOR)) {
    const [, privacyContent] = content.split(PRIVACY_ANCHOR);
    return `# AURICRX MEDCOACH — PRIVACY POLICY${privacyContent}`.trim();
  }
  return content.trim();
}
