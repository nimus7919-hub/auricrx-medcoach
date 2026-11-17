/**
 * Language helpers shared by the doctor/patient routes.
 * The doctor app supports exactly two languages: English ("en") and Mexican Spanish ("es").
 * Anything else is mapped to "es" (the app default). Nothing here logs user content.
 */

const SUPPORTED_LANGUAGES = ['en', 'es'];
const DEFAULT_LANGUAGE = 'es';

/** @returns {'en'|'es'|null} null when the value is empty / not a string. */
function normalizeLanguage(raw) {
  if (typeof raw !== 'string') return null;
  const tag = raw.trim().toLowerCase().split(/[;,\s]/)[0];
  if (!tag) return null;
  const base = tag.split(/[-_]/)[0];
  if (!/^[a-z]{2,3}$/.test(base)) return null; // "*", garbage
  if (base === 'en') return 'en';
  if (base === 'es') return 'es';
  return DEFAULT_LANGUAGE;
}

/** Parse the first language tag of an Accept-Language header. */
function languageFromAcceptHeader(header) {
  if (typeof header !== 'string' || !header.trim()) return null;
  const first = header.split(',')[0] || '';
  return normalizeLanguage(first);
}

/**
 * Language requested by the caller: ?lang= wins, then Accept-Language, then x-auric-lang.
 * @returns {'en'|'es'|null}
 */
function languageFromRequest(req) {
  const fromQuery = normalizeLanguage(req && req.query && req.query.lang);
  if (fromQuery) return fromQuery;
  const headers = (req && req.headers) || {};
  return languageFromAcceptHeader(headers['accept-language']) || normalizeLanguage(headers['x-auric-lang']);
}

/** Same as normalizeLanguage but never null. */
function languageOrDefault(raw, fallback = DEFAULT_LANGUAGE) {
  return normalizeLanguage(raw) || fallback;
}

/**
 * Intake / body-map locale. One default for both (es), so a session and its body map never disagree.
 * @returns {'en'|'es'}
 */
function normalizeIntakeLocale(raw, fallback = DEFAULT_LANGUAGE) {
  return normalizeLanguage(raw) || fallback;
}

/**
 * The language a notification must use is the RECIPIENT's language, never the sender's.
 * Doctors: doctorLanguagePrefs/{uid} (written by POST /api/doctor/language), then doctorPushTokens/{uid}.language.
 * Patients: patientPushTokens/{uid}.language. Unknown recipient language -> "es".
 */
async function resolveRecipientLanguage(db, role, uid) {
  if (!db || !uid) return DEFAULT_LANGUAGE;
  try {
    const sources =
      role === 'doctor'
        ? [
            ['doctorLanguagePrefs', uid],
            ['doctorPushTokens', uid],
          ]
        : [['patientPushTokens', uid]];
    for (const [collection, id] of sources) {
      const snap = await db.collection(collection).doc(id).get();
      const lang = snap && snap.exists ? normalizeLanguage(snap.data() && snap.data().language) : null;
      if (lang) return lang;
    }
  } catch (err) {
    console.error('resolveRecipientLanguage failed:', err && err.message);
  }
  return DEFAULT_LANGUAGE;
}

function mountDoctorLanguageRoutes(app, { verifyDoctorAuth } = {}) {
  /** Doctor app tells the server which language the doctor is using (best-effort, called on sign-in and when it changes). */
  app.post('/api/doctor/language', verifyDoctorAuth, async (req, res) => {
    try {
      const uid = req.userId || (req.user && req.user.uid);
      if (!uid) return res.status(401).json({ ok: false, error: 'unauthorized' });
      const language = normalizeLanguage(req.body && req.body.language);
      if (!language) return res.status(400).json({ ok: false, error: 'language_required' });
      const { getDoctorFirestore } = require('./doctor-firestore');
      const db = getDoctorFirestore();
      await db
        .collection('doctorLanguagePrefs')
        .doc(uid)
        .set({ uid, language, updatedAt: new Date().toISOString() }, { merge: true });
      return res.json({ ok: true, language });
    } catch (err) {
      console.error('doctor language save error:', err && err.message);
      return res.status(500).json({ ok: false, error: 'language_save_failed' });
    }
  });
}

module.exports = {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  normalizeLanguage,
  languageFromAcceptHeader,
  languageFromRequest,
  languageOrDefault,
  normalizeIntakeLocale,
  resolveRecipientLanguage,
  mountDoctorLanguageRoutes,
};
