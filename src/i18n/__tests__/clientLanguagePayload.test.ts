/**
 * Client payloads that must send a normalized app language so server PR #49
 * can localize checkout success and AI answers. Harmless before that deploy.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');

function read(rel: string) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

describe('client language payloads for server PR #49', () => {
  it('sends a normalized language on Stripe checkout create', () => {
    const src = read('components/StripeCheckoutModal.js');
    expect(src).toMatch(/import \{ normalizeLanguage \} from '\.\.\/i18n\/language'/);
    expect(src).toMatch(
      /JSON\.stringify\(\{ country, platform: Platform\.OS, billingInterval, language: normalizeLanguage\(i18n\.language\) \|\| 'en' \}\)/
    );
  });

  it('normalizes the /ask language instead of sending the raw i18n value', () => {
    const src = read('api/api.medical-ai.js');
    expect(src).toMatch(/import \{ normalizeLanguage \} from ["']\.\.\/i18n\/language["']/);
    expect(src).toMatch(
      /language: normalizeLanguage\(uiI18n\.resolvedLanguage \|\| uiI18n\.language\) \|\| 'en'/
    );
    expect(src).not.toMatch(/language: uiI18n\.resolvedLanguage \|\| uiI18n\.language \}/);
  });
});
