/**
 * Doctor mandatory MFA helpers + recovery-code routes.
 *
 * Recovery codes are generated server-side, shown once to the client, and stored
 * only as salted SHA-256 hashes in Firestore (Admin SDK). Redeeming a code
 * clears Firebase MFA factors so the doctor can re-enroll.
 *
 * Does not change Firebase project MFA settings — enabling Identity Platform
 * TOTP/SMS remains a manual console step (see docs/DOCTOR_MFA_SETUP.md).
 */

const crypto = require('crypto');

function verifyToken(token) {
  return require('./auth-utils').verifyToken(token);
}

function getDoctorFirestore() {
  return require('./doctor-firestore').getDoctorFirestore();
}

const RECOVERY_COLLECTION = 'doctorMfaRecovery';
const RECOVERY_CODE_COUNT = 10;

function hasSignInSecondFactor(decoded) {
  const factor = decoded?.firebase?.sign_in_second_factor;
  return typeof factor === 'string' && factor.length > 0;
}

function normalizeRecoveryCode(code) {
  return String(code || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function generateRecoveryCodes(count = RECOVERY_CODE_COUNT) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase();
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`);
  }
  return codes;
}

function hashRecoveryCode(code, salt) {
  return crypto.createHash('sha256').update(`${salt}:${normalizeRecoveryCode(code)}`).digest('hex');
}

async function verifyDoctorAuth(req, res, next) {
  try {
    const token = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '')?.[1];
    const decoded = await verifyToken(token);
    if (typeof decoded.uid !== 'string' || !decoded.uid) {
      throw new Error('Invalid token identity');
    }
    if (!hasSignInSecondFactor(decoded)) {
      return res.status(401).json({ ok: false, error: 'MFA_REQUIRED' });
    }
    req.userId = decoded.uid;
    req.decodedToken = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, error: 'INVALID_TOKEN' });
  }
}

/** Valid ID token + enrolled MFA factor(s). Used right after enrollment before a fresh MFA sign-in. */
async function verifyDoctorAuthEnrolled(req, res, next) {
  try {
    const token = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '')?.[1];
    const decoded = await verifyToken(token);
    if (typeof decoded.uid !== 'string' || !decoded.uid) {
      throw new Error('Invalid token identity');
    }
    const admin = require('./firebase-admin');
    const user = await admin.auth().getUser(decoded.uid);
    const enrolled = user.multiFactor?.enrolledFactors || [];
    if (!enrolled.length && !hasSignInSecondFactor(decoded)) {
      return res.status(401).json({ ok: false, error: 'MFA_NOT_ENROLLED' });
    }
    req.userId = decoded.uid;
    req.decodedToken = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, error: 'INVALID_TOKEN' });
  }
}

async function provePassword(email, password) {
  const apiKey = process.env.FIREBASE_WEB_API_KEY || process.env.FIREBASE_API_KEY;
  if (!apiKey) {
    const err = new Error('missing_firebase_web_api_key');
    err.code = 'missing_firebase_web_api_key';
    throw err;
  }
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (data.mfaPendingCredential || data.mfaInfo) {
    return { ok: true, mfaPending: true };
  }
  if (data.idToken && data.localId) {
    return { ok: true, mfaPending: false, localId: data.localId };
  }
  const message = data?.error?.message || 'invalid_credentials';
  const err = new Error(message);
  err.code = 'invalid_credentials';
  throw err;
}

async function clearUserMfaFactors(uid) {
  const admin = require('./firebase-admin');
  await admin.auth().updateUser(uid, {
    multiFactor: { enrolledFactors: [] },
  });
}

function mountDoctorMfaRoutes(app) {
  app.post('/api/doctor/mfa/recovery/generate', verifyDoctorAuthEnrolled, async (req, res) => {
    try {
      const uid = req.userId;
      const codes = generateRecoveryCodes();
      const salt = crypto.randomBytes(16).toString('hex');
      const hashes = codes.map((code) => ({
        hash: hashRecoveryCode(code, salt),
        usedAt: null,
      }));
      const db = getDoctorFirestore();
      const updatedAt = new Date().toISOString();
      await db.collection(RECOVERY_COLLECTION).doc(uid).set({
        uid,
        salt,
        codes: hashes,
        updatedAt,
        createdAt: updatedAt,
      });
      await db.collection('doctorAuditLogs').doc(`mfa_recovery_gen_${Date.now()}_${uid}`).set({
        id: `mfa_recovery_gen_${Date.now()}_${uid}`,
        actorId: uid,
        actorRole: 'doctor',
        action: 'mfa_recovery_generated',
        doctorId: uid,
        detail: `count:${codes.length}`,
        createdAt: updatedAt,
      });
      return res.json({ ok: true, codes });
    } catch (error) {
      console.error('doctor mfa recovery generate error:', error.message);
      return res.status(500).json({ ok: false, error: 'recovery_generate_failed' });
    }
  });

  app.post('/api/doctor/mfa/recovery/redeem', async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      const code = String(req.body?.code || '');
      if (!email || !password || !code) {
        return res.status(400).json({ ok: false, error: 'email_password_code_required' });
      }

      const admin = require('./firebase-admin');
      let user;
      try {
        user = await admin.auth().getUserByEmail(email);
      } catch {
        return res.status(401).json({ ok: false, error: 'invalid_credentials' });
      }

      try {
        await provePassword(email, password);
      } catch (err) {
        if (err.code === 'missing_firebase_web_api_key') {
          return res.status(503).json({ ok: false, error: 'recovery_not_configured' });
        }
        return res.status(401).json({ ok: false, error: 'invalid_credentials' });
      }

      const db = getDoctorFirestore();
      const ref = db.collection(RECOVERY_COLLECTION).doc(user.uid);
      const snap = await ref.get();
      if (!snap.exists) {
        return res.status(401).json({ ok: false, error: 'invalid_recovery_code' });
      }
      const data = snap.data() || {};
      const salt = data.salt;
      const codes = Array.isArray(data.codes) ? data.codes : [];
      const target = hashRecoveryCode(code, salt);
      const idx = codes.findIndex((row) => row && row.hash === target && !row.usedAt);
      if (idx < 0) {
        return res.status(401).json({ ok: false, error: 'invalid_recovery_code' });
      }

      const updatedAt = new Date().toISOString();
      codes[idx] = { ...codes[idx], usedAt: updatedAt };
      await ref.set({ ...data, codes, updatedAt }, { merge: true });
      await clearUserMfaFactors(user.uid);
      await db.collection('doctorAuditLogs').doc(`mfa_recovery_redeem_${Date.now()}_${user.uid}`).set({
        id: `mfa_recovery_redeem_${Date.now()}_${user.uid}`,
        actorId: user.uid,
        actorRole: 'doctor',
        action: 'mfa_recovery_redeemed',
        doctorId: user.uid,
        detail: `index:${idx}`,
        createdAt: updatedAt,
      });

      return res.json({ ok: true, mustReenroll: true });
    } catch (error) {
      console.error('doctor mfa recovery redeem error:', error.message);
      return res.status(500).json({ ok: false, error: 'recovery_redeem_failed' });
    }
  });
}

module.exports = {
  hasSignInSecondFactor,
  verifyDoctorAuth,
  verifyDoctorAuthEnrolled,
  generateRecoveryCodes,
  hashRecoveryCode,
  normalizeRecoveryCode,
  mountDoctorMfaRoutes,
  clearUserMfaFactors,
  provePassword,
  RECOVERY_CODE_COUNT,
};
