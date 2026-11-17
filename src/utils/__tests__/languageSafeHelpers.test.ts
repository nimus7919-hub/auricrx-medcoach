import { doctorModeErrorMessage } from '../doctorModeErrors';

const en = require('../../i18n/en.json');
const es = require('../../i18n/es.json');
const lookup = (dict: any) => (key: string) => key.split('.').reduce((a: any, k) => a?.[k], dict) ?? key;

describe('doctorModeErrorMessage', () => {
  it('translates machine error codes and never exposes the raw code', () => {
    for (const [dict, name] of [[en, 'en'], [es, 'es']] as const) {
      const t = lookup(dict);
      for (const code of Object.keys(en.doctorMode.errors)) {
        const message = doctorModeErrorMessage(new Error(code), t, 'doctorMode.errors.verification_failed');
        expect(message).toBe(t(`doctorMode.errors.${code}`));
        expect(message).not.toContain('_');
        expect(message.length).toBeGreaterThan(5);
        expect(name).toBeTruthy();
      }
    }
  });

  it('uses the fallback for unknown codes and free text', () => {
    const t = lookup(es);
    const fallback = 'doctorMode.errors.verification_failed';
    expect(doctorModeErrorMessage(new Error('totally_unknown_code'), t, fallback)).toBe(t(fallback));
    expect(doctorModeErrorMessage(new Error('Server said: boom'), t, fallback)).toBe(t(fallback));
    expect(doctorModeErrorMessage(undefined, t, fallback)).toBe(t(fallback));
  });
});

describe('locale keys introduced for language consistency exist in en and es', () => {
  const required = [
    'cloudBackup.deleteCloudMessage', 'regionConfirm.confirm', 'smartNotif.edit', 'aiHealth.errors.timeout',
    'aiHealth.errors.unreachable', 'appointments.reminderBody', 'secureSharing.emailSubject', 'googleAuth.error',
  ];
  it.each(required)('%s', key => {
    const t = (dict: any) => key.split('.').reduce((a: any, k) => a?.[k], dict);
    expect(typeof t(en)).toBe('string');
    expect(typeof t(es)).toBe('string');
    expect(t(en)).not.toBe(t(es));
  });
});
