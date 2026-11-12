/**
 * Server-only doctor verification and (optional) mock plan grants.
 *
 * Cédula / verified flags and doctorPlan must never be writable by clients.
 * These routes use the Firebase Admin SDK and a Firebase ID token only
 * (they do not go through the patient-app Neon subscription middleware).
 *
 * Mock plan grants stay off unless DOCTOR_MOCK_GRANTS=true is set on Render
 * for testing. That flag must be off once real doctor billing exists.
 */

const { verifyToken } = require('./auth-utils');
const { getDoctorFirestore } = require('./doctor-firestore');

function now verifyDoctorAuth(req, res, next) {
  try {
    const token = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '')?.[1];
    const decoded = await verifyToken(token);
    if (typeof decoded.uid !== 'string' || !decoded.uid) {
      throw new Error('Invalid token identity');
    }
    req.userId = decoded.uid;
    req.decodedToken = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, error: 'INVALID_TOKEN' });
  }
}

/**
 * Deterministic Phase 1 mock — keep in sync with
 * packages/doctor-core/src/verification/MockCedulaProvider.ts
 */
function mockCedulaResult(cedulaNumber) {
  const normalized = String(cedulaNumber || '').trim().toUpperCase();
  const checkedAt = new Date().toISOString();
  const referenceId = `mock_${Date.now()}_${normalized.slice(0, 8) || 'empty'}`;
  if (!normalized || normalized.length < 4) {
    return { status: 'rejected', message: 'Mock: cédula number too short', referenceId, checkedAt };
  }
  if (normalized.includes('FAIL')) {
    return { status: 'rejected', message: 'Mock: verification rejected', referenceId, checkedAt };
  }
  if (normalized.includes('PEND')) {
    return { status: 'pending', message: 'Mock: awaiting manual review', referenceId, checkedAt };
  }
  return { status: 'verified', message: 'Mock verification accepted', referenceId, checkedAt };
}

function mountDoctorVerificationRoutes(app) {
  app.post('/api/doctor/verification/submit', verifyDoctorAuth, async (req, res) => {
    try {
      const uid = req.userId;
      const db = getDoctorFirestore();
      const ref = db.collection('doctorProfiles').doc(uid);
      const snap = await ref.get();
      if (!snap.exists) {
        return res.status(400).json({ ok: false, error: 'doctor_profile_required' });
      }
      const profile = snap.data() || {};
      const result = mockCedulaResult(profile.cedulaNumber);
      const updatedAt = new Date().toISOString();
      await ref.set(
        {
          verificationStatus: result.status,
          verificationUpdatedAt: result.checkedAt,
          verificationMessage: result.message,
          updatedAt,
        },
        { merge: true }
      );
      await db.collection('doctorAuditLogs').doc(`verif_${Date.now()}_${uid}`).set({
        id: `verif_${Date.now()}_${uid}`,
        actorId: 'system',
        actorRole: 'system',
        action: 'verification_updated',
        doctorId: uid,
        detail: `${result.status}:${result.referenceId}`,
        createdAt: updatedAt,
      });
      const fresh = await ref.get();
      return res.json({ ok: true, profile: fresh.data(), result });
    } catch (error) {
      console.error('doctor verification error:', error.message);
      return res.status(500).json({ ok: false, error: 'verification_failed' });
    }
  });

  app.post('/api/doctor/plan/mock-grant', verifyDoctorAuth, async (req, res) => {
    if (process.env.DOCTOR_MOCK_GRANTS !== 'true') {
      return res.status(403).json({
        ok: false,
        error: 'mock_grants_disabled',
        message: 'Mock doctor-plan grants are disabled. Set DOCTOR_MOCK_GRANTS=true on Render only for testing.',
      });
    }
    try {
      const uid = req.userId;
      const enabled = req.body?.enabled !== false;
      const db = getDoctorFirestore();
      const ref = db.collection('doctorProfiles').doc(uid);
      const updatedAt = new Date().toISOString();
      const snap = await ref.get();
      const stub = snap.exists
        ? {}
        : {
            uid,
            displayName: '',
            specialty: '',
            cedulaNumber: '',
            verificationStatus: 'unverified',
            createdAt: updatedAt,
          };
      await ref.set(
        {
          ...stub,
          doctorPlan: enabled,
          doctorPlanSource: 'mock',
          doctorPlanUpdatedAt: updatedAt,
          updatedAt,
        },
        { merge: true }
      );
      await db.collection('doctorAuditLogs').doc(`plan_${Date.now()}_${uid}`).set({
        id: `plan_${Date.now()}_${uid}`,
        actorId: 'system',
        actorRole: 'system',
        action: 'doctor_plan_updated',
        doctorId: uid,
        detail: `${enabled}:mock`,
        createdAt: updatedAt,
      });
      const fresh = await ref.get();
      return res.json({ ok: true, profile: fresh.data() });
    } catch (error) {
      console.error('doctor mock plan error:', error.message);
      return res.status(500).json({ ok: false, error: 'plan_update_failed' });
    }
  });
}

module.exports = { mountDoctorVerificationRoutes, mockCedulaResult, verifyDoctorAuth };
