import {
  SUPPORT_EMAIL_DEFAULT,
  SUPPORT_EMAIL_ES,
  SUPPORT_EMAIL_ZH,
  applySupportEmail,
  getSupportEmail,
} from '../supportEmail';

describe('getSupportEmail', () => {
  it('returns soporte@ for Spanish locales', () => {
    expect(getSupportEmail('es')).toBe(SUPPORT_EMAIL_ES);
    expect(getSupportEmail('es-MX')).toBe(SUPPORT_EMAIL_ES);
  });

  it('returns zhichi@ for Chinese locales', () => {
    expect(getSupportEmail('zh')).toBe(SUPPORT_EMAIL_ZH);
    expect(getSupportEmail('zh-Hans')).toBe(SUPPORT_EMAIL_ZH);
  });

  it('returns support@ for English and other languages', () => {
    expect(getSupportEmail('en')).toBe(SUPPORT_EMAIL_DEFAULT);
    expect(getSupportEmail('en-US')).toBe(SUPPORT_EMAIL_DEFAULT);
    expect(getSupportEmail('pt')).toBe(SUPPORT_EMAIL_DEFAULT);
    expect(getSupportEmail('fr')).toBe(SUPPORT_EMAIL_DEFAULT);
    expect(getSupportEmail('de')).toBe(SUPPORT_EMAIL_DEFAULT);
    expect(getSupportEmail(undefined)).toBe(SUPPORT_EMAIL_DEFAULT);
    expect(getSupportEmail('')).toBe(SUPPORT_EMAIL_DEFAULT);
  });
});

describe('applySupportEmail', () => {
  it('replaces the old Gmail contact and the other locale addresses', () => {
    const source = 'Write to Auricrx.ltd@gmail.com or support@auricrx.com.mx';
    expect(applySupportEmail(source, 'es')).toBe(
      `Write to ${SUPPORT_EMAIL_ES} or ${SUPPORT_EMAIL_ES}`,
    );
    expect(applySupportEmail(source, 'zh')).toBe(
      `Write to ${SUPPORT_EMAIL_ZH} or ${SUPPORT_EMAIL_ZH}`,
    );
  });
});
