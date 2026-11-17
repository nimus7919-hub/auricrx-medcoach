import uiI18n from '../i18n';
import english from './usDisclaimers.json';

// US compliance notices in the user's chosen app language (en/es; other languages fall back to English).
// usDisclaimers.json stays the English source of truth; the `usNotices.*` locale keys must keep its meaning.
type UsNotices = typeof english;
const notices = {} as UsNotices;
for (const key of Object.keys(english) as (keyof UsNotices)[]) {
  Object.defineProperty(notices, key, {
    enumerable: true,
    get: () => uiI18n.t(`usNotices.${key}`, { defaultValue: english[key] }),
  });
}
export default notices;
