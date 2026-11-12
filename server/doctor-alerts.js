/**
 * Doctor Mode threshold alerts (Phase 1).
 *
 * Why Render (not Cloud Functions):
 * - This repo already runs Express on Render with Firebase Admin initialized.
 * - There is no functions/ directory or Functions deploy pipeline.
 * - Alert evaluation needs Admin SDK to read limits + send Expo push.
 *
 * Flow: client writes a bitácora entry → POST /api/doctor/alerts/evaluate
 * → server loads entry + doctors' limits → if crossed, sends generic push
 * (no patient names or values on the lock screen).
 */

/** Pure comparator — kept in sync with src/doctor/thresholds.ts */
function compareValue(observed, comparator, limit) {
  switch (comparator) {
    case 'gt':
      return observed > limit;
    case 'gte':
      return observed >= limit;
    case 'lt':
      return observed < limit;
    case 'lte':
      return observed <= limit;
    default:
      return false;
  }
}

function extractReadings(entry) {
  const out = {};
  if (entry.type === 'blood_pressure') {
    if (typeof entry.systolic === 'number') out.systolic = entry.systolic;
    if (typeof entry.diastolic === 'number') out.diastolic = entry.diastolic;
    if (typeof entry.pulse === 'number') out.pulse = entry.pulse;
  }
  if (entry.type === 'glucose' && typeof entry.glucoseMgDl === 'number') {
    out.glucose = entry.glucoseMgDl;
  }
  if (entry.type === 'weight' && typeof entry.weightKg === 'number') {
    out.weight = entry.weightKg;
  }
  return out;
}

function evaluateThresholdCrossings(entry, limits) {
  const readings = extractReadings(entry);
  const crossings = [];
  for (const limit of limits) {
    if (!limit.enabled) continue;
    if (limit.patientId !== entry.patientId) continue;
    const observed = readings[limit.readingType];
    if (typeof observed !== 'number' || Number.isNaN(observed)) continue;
    if (compareValue(observed, limit.comparator, limit.value)) {
      crossings.push({ limit, readingType: limit.readingType, observedValue: observed });
    }
  }
  return crossings;
}

/** Generic lock-screen copy — NEVER include patient names or values. */
function genericPushCopy(language = 'es') {
  const es = language === 'es' || language === 'es-MX';
  if (language === 'zh') {
    return { title: 'AuricRX 医生模式', body: '有一条读数超过了您设置的限值。打开应用查看详情。' };
  }
  if (language === 'pt') {
    return { title: 'AuricRX Modo Médico', body: 'Uma leitura cruzou um limite que você definiu. Abra o app para ver os detalhes.' };
  }
  if (language === 'fr') {
    return { title: 'AuricRX Mode médecin', body: 'Une mesure a dépassé une limite que vous avez définie. Ouvrez l’app pour les détails.' };
  }
  if (language === 'de') {
    return { title: 'AuricRX Arztmodus', body: 'Ein Messwert hat ein von Ihnen gesetztes Limit überschritten. Öffnen Sie die App für Details.' };
  }
  if (es) {
    return { title: 'AuricRX Modo médico', body: 'Una lectura cruzó un límite que usted configuró. Abra la app para ver el detalle.' };
  }
  return { title: 'AuricRX Doctor Mode', body: 'A reading crossed a limit you set. Open the app for details.' };
}

async function sendExpoPush(expoPushToken, { title, body, data }) {
  if (!expoPushToken || !String(expoPushToken).startsWith('ExponentPushToken')) {
    return { skipped: true, reason: 'invalid_token' };
  }
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      to: expoPushToken,
      title,
      body,
      sound: 'default',
      data: data || {},
    }),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

/**
 * Load bitácora entry + active doctor limits for that patient, evaluate, push.
 */
async function evaluateDoctorAlertsForEntry({ patientId, entryId, language, sendPush = sendExpoPush }) {
  // Lazy-load so pure unit tests do not need firebase-admin installed locally
  const admin = require('./firebase-admin');
  if (!admin.apps.length) {
    return { ok: false, error: 'firebase_admin_unavailable' };
  }
  const db = admin.firestore();
  const entryRef = db.collection('bitacora').doc(patientId).collection('entries').doc(entryId);
  const entrySnap = await entryRef.get();
  if (!entrySnap.exists) return { ok: false, error: 'entry_not_found' };
  const entry = entrySnap.data();

  // Active links for this patient
  const linksSnap = await db
    .collection('doctorLinks')
    .where('patientId', '==', patientId)
    .where('status', '==', 'active')
    .get();

  let pushed = 0;
  const notifiedDoctors = [];

  for (const linkDoc of linksSnap.docs) {
    const link = linkDoc.data();
    const doctorId = link.doctorId;

    const profileSnap = await db.collection('doctorProfiles').doc(doctorId).get();
    const profile = profileSnap.exists ? profileSnap.data() : null;
    if (!profile || !profile.doctorPlan || profile.verificationStatus !== 'verified') continue;

    const limitsSnap = await db
      .collection('doctorAlertLimits')
      .where('doctorId', '==', doctorId)
      .where('patientId', '==', patientId)
      .where('enabled', '==', true)
      .get();
    const limits = limitsSnap.docs.map((d) => d.data());
    const crossings = evaluateThresholdCrossings(entry, limits);
    if (!crossings.length) continue;

    // Consent: only alert if the related category is consented
    const consentOk = crossings.some((c) => {
      const t = c.readingType;
      if (t === 'systolic' || t === 'diastolic' || t === 'pulse') return link.consent?.bloodPressure;
      if (t === 'glucose') return link.consent?.glucose;
      if (t === 'weight') return link.consent?.weight;
      return false;
    });
    if (!consentOk) continue;

    const tokenSnap = await db.collection('doctorPushTokens').doc(doctorId).get();
    const token = tokenSnap.exists ? tokenSnap.data()?.expoPushToken : null;
    const copy = genericPushCopy(language);

    if (token) {
      await sendPush(token, {
        title: copy.title,
        body: copy.body,
        data: {
          type: 'doctor_threshold',
          linkId: link.id || linkDoc.id,
          // Values stay in-app after auth — not in push payload display fields
        },
      });
      pushed += 1;
    }

    await db.collection('doctorAuditLogs').doc(`alert_${Date.now()}_${doctorId}`).set({
      id: `alert_${Date.now()}_${doctorId}`,
      actorId: 'system',
      actorRole: 'system',
      action: 'alert_triggered',
      patientId,
      doctorId,
      linkId: link.id || linkDoc.id,
      detail: crossings.map((c) => c.readingType).join(','),
      createdAt: new Date().toISOString(),
    });

    notifiedDoctors.push(doctorId);
  }

  return { ok: true, pushed, notifiedDoctors };
}

function mountDoctorAlertRoutes(app, { verifyUser }) {
  app.post('/api/doctor/alerts/evaluate', verifyUser, async (req, res) => {
    try {
      const { entryId, patientId, language } = req.body || {};
      if (!entryId || !patientId) {
        return res.status(400).json({ ok: false, error: 'entryId_and_patientId_required' });
      }
      // Only the patient who owns the entry may trigger evaluation
      const uid = req.userId || req.user?.uid;
      if (uid && uid !== patientId) {
        return res.status(403).json({ ok: false, error: 'forbidden' });
      }
      const result = await evaluateDoctorAlertsForEntry({
        patientId,
        entryId,
        language: language || req.headers['x-auric-lang'] || 'es',
      });
      return res.json(result);
    } catch (err) {
      console.error('doctor alerts evaluate error:', err);
      return res.status(500).json({ ok: false, error: 'evaluate_failed' });
    }
  });
}

module.exports = {
  compareValue,
  extractReadings,
  evaluateThresholdCrossings,
  genericPushCopy,
  evaluateDoctorAlertsForEntry,
  mountDoctorAlertRoutes,
};
