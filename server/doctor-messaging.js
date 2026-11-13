/**
 * Doctor↔patient messaging notifications.
 * Push only for Phase 1; channel layer allows WhatsApp later.
 * Lock-screen copy stays generic (no health content).
 */

function genericMessagePushCopy(language = 'es') {
  const es = language === 'es' || language === 'es-MX';
  if (es) {
    return { title: 'AuricRX', body: 'Tiene un mensaje nuevo. Abra la app para ver el detalle.' };
  }
  return { title: 'AuricRX', body: 'You have a new message. Open the app for details.' };
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
 * Pluggable channel registry — push now; whatsapp/email stubs return skipped.
 */
function createChannelLayer({ sendPush = sendExpoPush } = {}) {
  return {
    async push({ token, title, body, data }) {
      return sendPush(token, { title, body, data });
    },
    async whatsapp() {
      return { skipped: true, reason: 'whatsapp_not_enabled' };
    },
    async email() {
      return { skipped: true, reason: 'email_not_enabled' };
    },
  };
}

async function notifyMessageRecipient({
  toUserId,
  role, // 'doctor' | 'patient'
  language,
  messageId,
  channel = 'push',
  sendPush = sendExpoPush,
}) {
  const admin = require('./firebase-admin');
  if (!admin.apps.length) return { ok: false, error: 'firebase_admin_unavailable' };
  const { getDoctorFirestore } = require('./doctor-firestore');
  const db = getDoctorFirestore();
  const channels = createChannelLayer({ sendPush });
  const copy = genericMessagePushCopy(language);

  if (channel !== 'push') {
    const stub = await channels[channel]?.();
    return { ok: true, channel, result: stub || { skipped: true, reason: 'unknown_channel' } };
  }

  const tokenDoc =
    role === 'doctor'
      ? await db.collection('doctorPushTokens').doc(toUserId).get()
      : await db.collection('patientPushTokens').doc(toUserId).get();
  const token = tokenDoc.exists ? tokenDoc.data()?.expoPushToken : null;
  if (!token) return { ok: true, skipped: true, reason: 'no_token' };

  const result = await channels.push({
    token,
    title: copy.title,
    body: copy.body,
    data: { type: 'doctor_patient_message', messageId: messageId || '' },
  });
  return { ok: true, channel: 'push', result };
}

function mountDoctorMessagingRoutes(app, { verifyUser }) {
  app.post('/api/doctor/messages/notify', verifyUser, async (req, res) => {
    try {
      const uid = req.userId || req.user?.uid;
      const { toUserId, role, language, messageId, channel } = req.body || {};
      if (!toUserId || !role) {
        return res.status(400).json({ ok: false, error: 'toUserId_and_role_required' });
      }
      if (!uid) return res.status(401).json({ ok: false, error: 'unauthorized' });
      // Caller must be the other party (best-effort; Admin path still used for token read)
      if (uid === toUserId) {
        return res.status(400).json({ ok: false, error: 'cannot_notify_self' });
      }
      const result = await notifyMessageRecipient({
        toUserId,
        role,
        language: language || req.headers['x-auric-lang'] || 'es',
        messageId,
        channel: channel || 'push',
      });
      return res.json(result);
    } catch (err) {
      console.error('doctor messaging notify error:', err);
      return res.status(500).json({ ok: false, error: 'notify_failed' });
    }
  });
}

module.exports = {
  genericMessagePushCopy,
  createChannelLayer,
  notifyMessageRecipient,
  mountDoctorMessagingRoutes,
  sendExpoPush,
};
