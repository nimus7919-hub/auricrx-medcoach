/**
 * Doctor professional verification — registry lookup + identity check + admin review.
 *
 * NEVER auto-approves. Submit always ends in pending_review (invalid input → rejected).
 * Only an admin (Firebase custom claim admin=true + MFA) can set verified.
 *
 * Mock registry is available only when DOCTOR_ALLOW_MOCK_VERIFICATION=true and
 * NODE_ENV is not production/prod.
 */

const path = require('path');
const { lookupRegistry, computeExpiryFromVerifiedAt, isExpired, isDueForRecheck } = require('./verification/registry');
const { startIdentityCheck } = require('./verification/identityProviders');

const EVIDENCE_COLLECTION = 'doctorVerificationEvidence';
const REVIEW_STATUSES = new Set(['pending_review']);

function getDoctorFirestore() {
  return require('./doctor-firestore').getDoctorFirestore();
}

function verifyDoctorAuth(req, res, next) {
  return require('./doctor-mfa').verifyDoctorAuth(req, res, next);
}

function nowIso() {
  return new Date().toISOString();
}

function auditId(prefix, uid) {
  return `${prefix}_${Date.now()}_${uid}`;
}

async function writeAudit(db, entry) {
  const id = entry.id || auditId('audit', entry.doctorId || entry.actorId || 'x');
  await db.collection('doctorAuditLogs').doc(id).set({
    ...entry,
    id,
    createdAt: entry.createdAt || nowIso(),
  });
}

/** Email notification stub — wire SES/SendGrid later. */
function notifyDoctorDecisionStub({ doctorId, email, status, reason }) {
  console.log(
    `[doctor-verification:email-stub] doctor=${doctorId} email=${email || 'unknown'} status=${status} reason=${reason || ''}`
  );
  return { ok: true, stub: true };
}

function isAdminToken(decoded) {
  return decoded?.admin === true || decoded?.admin === 'true';
}

async function verifyAdminAuth(req, res, next) {
  return verifyDoctorAuth(req, res, () => {
    if (!isAdminToken(req.decodedToken)) {
      return res.status(403).json({ ok: false, error: 'admin_required' });
    }
    next();
  });
}

function normalizeCountry(value) {
  const c = String(value || '')
    .trim()
    .toUpperCase();
  if (c === 'US' || c === 'USA' || c === 'UNITED STATES') return 'US';
  if (c === 'MX' || c === 'MEX' || c === 'MEXICO' || c === 'MÉXICO') return 'MX';
  return null;
}

function validateSubmission(profile, body = {}) {
  const country = normalizeCountry(body.country || profile.country) || 'MX';
  const legalFullName = String(body.legalFullName || profile.legalFullName || profile.displayName || '').trim();
  const specialty = String(body.specialty || profile.specialty || '').trim();
  const errors = [];
  if (!legalFullName) errors.push('legalFullName_required');
  if (!specialty) errors.push('specialty_required');

  const payload = {
    country,
    legalFullName,
    specialty,
    cedulaNumber: String(body.cedulaNumber || profile.cedulaNumber || '').trim(),
    specialtyCedulaNumber: String(body.specialtyCedulaNumber || profile.specialtyCedulaNumber || '').trim() || undefined,
    npiNumber: String(body.npiNumber || profile.npiNumber || '').replace(/\D/g, '') || undefined,
    licenseNumber: String(body.licenseNumber || profile.licenseNumber || '').trim() || undefined,
    licenseState: String(body.licenseState || profile.licenseState || '')
      .trim()
      .toUpperCase() || undefined,
  };

  if (country === 'MX') {
    if (!payload.cedulaNumber || payload.cedulaNumber.length < 4) errors.push('cedula_required');
  } else if (country === 'US') {
    if (!payload.npiNumber || !/^\d{10}$/.test(payload.npiNumber)) errors.push('npi_required');
    if (!payload.licenseNumber) errors.push('license_number_required');
    if (!payload.licenseState || payload.licenseState.length !== 2) errors.push('license_state_required');
  } else {
    errors.push('country_required');
  }

  return { ok: errors.length === 0, errors, payload };
}

function publicProfileView(data) {
  if (!data) return null;
  // Never leak evidence blobs on doctor-facing responses
  const {
    // eslint-disable-next-line no-unused-vars
    verificationEvidence: _drop,
    ...rest
  } = data;
  return rest;
}

function mountDoctorVerificationRoutes(app) {
  // Minimal admin review UI (navy/gold). Protected API still requires admin claim.
  app.get('/doctor-admin', (_req, res) => {
    res.sendFile(path.join(__dirname, 'doctor-admin.html'));
  });
  app.get('/doctor-admin.html', (_req, res) => {
    res.sendFile(path.join(__dirname, 'doctor-admin.html'));
  });

  /**
   * Submit verification. Runs registry lookup + identity start, stores evidence,
   * sets status to pending_review. Never sets verified.
   */
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
      const { ok, errors, payload } = validateSubmission(profile, req.body || {});
      if (!ok) {
        return res.status(400).json({ ok: false, error: 'invalid_submission', errors });
      }

      const registry = await lookupRegistry({
        country: payload.country,
        legalFullName: payload.legalFullName,
        cedulaNumber: payload.cedulaNumber,
        specialtyCedulaNumber: payload.specialtyCedulaNumber,
        specialty: payload.specialty,
        npiNumber: payload.npiNumber,
        licenseNumber: payload.licenseNumber,
        licenseState: payload.licenseState,
      });

      const identity = await startIdentityCheck({
        doctorUid: uid,
        country: payload.country,
        legalFullName: payload.legalFullName,
        email: req.decodedToken?.email,
      });

      const updatedAt = nowIso();
      const status = 'pending_review';
      const message =
        registry.outcome === 'lookup_unavailable'
          ? 'Registry lookup unavailable — queued for manual review'
          : `Queued for manual review (registry=${registry.outcome}, identity=${identity.status})`;

      const evidence = {
        doctorId: uid,
        country: payload.country,
        legalFullName: payload.legalFullName,
        specialty: payload.specialty,
        cedulaNumber: payload.cedulaNumber || null,
        specialtyCedulaNumber: payload.specialtyCedulaNumber || null,
        npiNumber: payload.npiNumber || null,
        licenseNumber: payload.licenseNumber || null,
        licenseState: payload.licenseState || null,
        registry,
        identity: {
          provider: identity.provider,
          status: identity.status,
          sessionId: identity.sessionId || null,
          launchUrl: identity.launchUrl || null,
          message: identity.message || null,
          checkedAt: identity.checkedAt,
        },
        submittedAt: updatedAt,
        updatedAt,
      };

      await db.collection(EVIDENCE_COLLECTION).doc(uid).set(evidence, { merge: true });

      await ref.set(
        {
          country: payload.country,
          legalFullName: payload.legalFullName,
          specialty: payload.specialty,
          cedulaNumber: payload.country === 'MX' ? payload.cedulaNumber : profile.cedulaNumber || '',
          specialtyCedulaNumber: payload.specialtyCedulaNumber || null,
          npiNumber: payload.npiNumber || null,
          licenseNumber: payload.licenseNumber || null,
          licenseState: payload.licenseState || null,
          displayName: profile.displayName || payload.legalFullName,
          verificationStatus: status,
          verificationUpdatedAt: updatedAt,
          verificationMessage: message,
          verificationRejectionReason: null,
          identityProvider: identity.provider,
          identitySessionId: identity.sessionId || null,
          identityStatus: identity.status,
          // Clear prior approval timestamps while under review
          verifiedAt: null,
          expiresAt: null,
          updatedAt,
        },
        { merge: true }
      );

      await writeAudit(db, {
        id: auditId('verif_submit', uid),
        actorId: uid,
        actorRole: 'doctor',
        action: 'verification_submitted',
        doctorId: uid,
        detail: `${status}:${registry.provider}:${registry.outcome}:${identity.status}`,
        createdAt: updatedAt,
      });

      const fresh = await ref.get();
      return res.json({
        ok: true,
        profile: publicProfileView(fresh.data()),
        result: {
          status,
          registry: {
            provider: registry.provider,
            outcome: registry.outcome,
            referenceId: registry.referenceId,
            nameMatch: registry.nameMatch || null,
            medicalTitleOk: registry.medicalTitleOk ?? null,
            stateBoardLookupUrl: registry.stateBoardLookupUrl || null,
            message: registry.message,
          },
          identity: {
            provider: identity.provider,
            status: identity.status,
            sessionId: identity.sessionId || null,
            launchUrl: identity.launchUrl || null,
            message: identity.message,
          },
          message,
        },
      });
    } catch (error) {
      console.error('doctor verification error:', error.message);
      return res.status(500).json({ ok: false, error: 'verification_failed' });
    }
  });

  /** Flag expired / due-for-recheck profiles (best-effort; call from cron or admin). */
  app.post('/api/doctor/verification/expire-due', verifyAdminAuth, async (req, res) => {
    try {
      const db = getDoctorFirestore();
      const snap = await db.collection('doctorProfiles').where('verificationStatus', '==', 'verified').get();
      const now = new Date();
      const expired = [];
      const due = [];
      for (const doc of snap.docs) {
        const data = doc.data() || {};
        if (isExpired(data, now)) {
          const updatedAt = nowIso();
          await doc.ref.set(
            {
              verificationStatus: 'expired',
              verificationUpdatedAt: updatedAt,
              verificationMessage: 'Verification expired — re-submit for review',
              updatedAt,
            },
            { merge: true }
          );
          await writeAudit(db, {
            id: auditId('verif_exp', doc.id),
            actorId: req.userId,
            actorRole: 'admin',
            action: 'verification_expired',
            doctorId: doc.id,
            detail: `expiresAt:${data.expiresAt || ''}`,
            createdAt: updatedAt,
          });
          expired.push(doc.id);
        } else if (isDueForRecheck(data, Number(req.body?.withinDays) || 30, now)) {
          due.push(doc.id);
        }
      }
      return res.json({ ok: true, expired, due });
    } catch (error) {
      console.error('expire-due error:', error.message);
      return res.status(500).json({ ok: false, error: 'expire_failed' });
    }
  });

  // ─── Admin review queue ─────────────────────────────────────────────

  app.get('/api/doctor/admin/verification/queue', verifyAdminAuth, async (req, res) => {
    try {
      const db = getDoctorFirestore();
      const status = String(req.query.status || 'pending_review');
      const snap = await db.collection('doctorProfiles').where('verificationStatus', '==', status).limit(100).get();
      const items = [];
      for (const doc of snap.docs) {
        const profile = doc.data() || {};
        const evidenceSnap = await db.collection(EVIDENCE_COLLECTION).doc(doc.id).get();
        items.push({
          doctorId: doc.id,
          profile: publicProfileView(profile),
          evidence: evidenceSnap.exists ? evidenceSnap.data() : null,
          dueForRecheck: isDueForRecheck(profile),
          expired: isExpired(profile),
        });
      }
      items.sort((a, b) =>
        String(a.profile?.verificationUpdatedAt || '').localeCompare(String(b.profile?.verificationUpdatedAt || ''))
      );
      return res.json({ ok: true, items });
    } catch (error) {
      console.error('admin queue error:', error.message);
      return res.status(500).json({ ok: false, error: 'queue_failed' });
    }
  });

  app.get('/api/doctor/admin/verification/:uid', verifyAdminAuth, async (req, res) => {
    try {
      const db = getDoctorFirestore();
      const uid = req.params.uid;
      const snap = await db.collection('doctorProfiles').doc(uid).get();
      if (!snap.exists) return res.status(404).json({ ok: false, error: 'not_found' });
      const evidenceSnap = await db.collection(EVIDENCE_COLLECTION).doc(uid).get();
      const profile = snap.data();
      return res.json({
        ok: true,
        doctorId: uid,
        profile: publicProfileView(profile),
        evidence: evidenceSnap.exists ? evidenceSnap.data() : null,
        dueForRecheck: isDueForRecheck(profile),
        expired: isExpired(profile),
      });
    } catch (error) {
      console.error('admin detail error:', error.message);
      return res.status(500).json({ ok: false, error: 'detail_failed' });
    }
  });

  app.post('/api/doctor/admin/verification/:uid/approve', verifyAdminAuth, async (req, res) => {
    try {
      const db = getDoctorFirestore();
      const uid = req.params.uid;
      const reason = String(req.body?.reason || 'Approved after manual review').trim();
      const ref = db.collection('doctorProfiles').doc(uid);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ ok: false, error: 'not_found' });
      const verifiedAt = nowIso();
      const expiresAt = computeExpiryFromVerifiedAt(verifiedAt);
      await ref.set(
        {
          verificationStatus: 'verified',
          verificationUpdatedAt: verifiedAt,
          verificationMessage: reason,
          verificationRejectionReason: null,
          verifiedAt,
          expiresAt,
          updatedAt: verifiedAt,
        },
        { merge: true }
      );
      await writeAudit(db, {
        id: auditId('verif_ok', uid),
        actorId: req.userId,
        actorRole: 'admin',
        action: 'verification_approved',
        doctorId: uid,
        detail: `verified:${expiresAt}`,
        reason,
        createdAt: verifiedAt,
      });
      notifyDoctorDecisionStub({
        doctorId: uid,
        email: snap.data()?.email,
        status: 'verified',
        reason,
      });
      const fresh = await ref.get();
      return res.json({ ok: true, profile: publicProfileView(fresh.data()) });
    } catch (error) {
      console.error('admin approve error:', error.message);
      return res.status(500).json({ ok: false, error: 'approve_failed' });
    }
  });

  app.post('/api/doctor/admin/verification/:uid/reject', verifyAdminAuth, async (req, res) => {
    try {
      const db = getDoctorFirestore();
      const uid = req.params.uid;
      const reason = String(req.body?.reason || '').trim();
      if (!reason) return res.status(400).json({ ok: false, error: 'reason_required' });
      const ref = db.collection('doctorProfiles').doc(uid);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ ok: false, error: 'not_found' });
      const updatedAt = nowIso();
      await ref.set(
        {
          verificationStatus: 'rejected',
          verificationUpdatedAt: updatedAt,
          verificationMessage: reason,
          verificationRejectionReason: reason,
          verifiedAt: null,
          expiresAt: null,
          updatedAt,
        },
        { merge: true }
      );
      await writeAudit(db, {
        id: auditId('verif_no', uid),
        actorId: req.userId,
        actorRole: 'admin',
        action: 'verification_rejected',
        doctorId: uid,
        detail: 'rejected',
        reason,
        createdAt: updatedAt,
      });
      notifyDoctorDecisionStub({ doctorId: uid, status: 'rejected', reason });
      const fresh = await ref.get();
      return res.json({ ok: true, profile: publicProfileView(fresh.data()) });
    } catch (error) {
      console.error('admin reject error:', error.message);
      return res.status(500).json({ ok: false, error: 'reject_failed' });
    }
  });

  app.post('/api/doctor/admin/verification/:uid/suspend', verifyAdminAuth, async (req, res) => {
    try {
      const db = getDoctorFirestore();
      const uid = req.params.uid;
      const reason = String(req.body?.reason || '').trim();
      if (!reason) return res.status(400).json({ ok: false, error: 'reason_required' });
      const ref = db.collection('doctorProfiles').doc(uid);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ ok: false, error: 'not_found' });
      const updatedAt = nowIso();
      await ref.set(
        {
          verificationStatus: 'suspended',
          verificationUpdatedAt: updatedAt,
          verificationMessage: reason,
          verificationRejectionReason: reason,
          updatedAt,
        },
        { merge: true }
      );
      await writeAudit(db, {
        id: auditId('verif_sus', uid),
        actorId: req.userId,
        actorRole: 'admin',
        action: 'verification_suspended',
        doctorId: uid,
        detail: 'suspended',
        reason,
        createdAt: updatedAt,
      });
      notifyDoctorDecisionStub({ doctorId: uid, status: 'suspended', reason });
      const fresh = await ref.get();
      return res.json({ ok: true, profile: publicProfileView(fresh.data()) });
    } catch (error) {
      console.error('admin suspend error:', error.message);
      return res.status(500).json({ ok: false, error: 'suspend_failed' });
    }
  });

  app.post('/api/doctor/admin/verification/:uid/revoke', verifyAdminAuth, async (req, res) => {
    try {
      const db = getDoctorFirestore();
      const uid = req.params.uid;
      const reason = String(req.body?.reason || '').trim();
      if (!reason) return res.status(400).json({ ok: false, error: 'reason_required' });
      const ref = db.collection('doctorProfiles').doc(uid);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ ok: false, error: 'not_found' });
      const updatedAt = nowIso();
      await ref.set(
        {
          verificationStatus: 'unverified',
          verificationUpdatedAt: updatedAt,
          verificationMessage: reason,
          verificationRejectionReason: reason,
          verifiedAt: null,
          expiresAt: null,
          updatedAt,
        },
        { merge: true }
      );
      await writeAudit(db, {
        id: auditId('verif_rev', uid),
        actorId: req.userId,
        actorRole: 'admin',
        action: 'verification_revoked',
        doctorId: uid,
        detail: 'revoked',
        reason,
        createdAt: updatedAt,
      });
      notifyDoctorDecisionStub({ doctorId: uid, status: 'unverified', reason });
      const fresh = await ref.get();
      return res.json({ ok: true, profile: publicProfileView(fresh.data()) });
    } catch (error) {
      console.error('admin revoke error:', error.message);
      return res.status(500).json({ ok: false, error: 'revoke_failed' });
    }
  });

  // Keep mock plan grant (dev only) — unchanged behavior, gated by DOCTOR_MOCK_GRANTS
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
      const updatedAt = nowIso();
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
      await writeAudit(db, {
        id: auditId('plan', uid),
        actorId: 'system',
        actorRole: 'system',
        action: 'doctor_plan_updated',
        doctorId: uid,
        detail: `${enabled}:mock`,
        createdAt: updatedAt,
      });
      const fresh = await ref.get();
      return res.json({ ok: true, profile: publicProfileView(fresh.data()) });
    } catch (error) {
      console.error('doctor mock plan error:', error.message);
      return res.status(500).json({ ok: false, error: 'plan_update_failed' });
    }
  });
}

module.exports = {
  mountDoctorVerificationRoutes,
  verifyAdminAuth,
  validateSubmission,
  notifyDoctorDecisionStub,
  isAdminToken,
  REVIEW_STATUSES,
  verifyDoctorAuth,
};
