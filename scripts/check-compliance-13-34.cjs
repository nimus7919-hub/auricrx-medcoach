const assert = require('node:assert/strict');
const { sendRenewalNotices } = require('../server/renewal-notices');
const { fastingAdvice } = require('../server/fasting-safety');
(async () => {
  for (const key of ['diabetes', 'pregnancy', 'breastfeeding', 'eatingDisorders', 'eating_disorders']) {
    assert.equal(fastingAdvice({ [key]: true }, 'es').restricted, true);
    assert.equal(fastingAdvice({ [key]: true }).schedule, null);
  }
  const keys = new Set(); const sent = [];
  const sub = { id: 'test', status: 'active', renewsAt: '2026-11-08T12:00:00Z', email: 'test@example.invalid', pushToken: 'test', cancelUrl: 'https://example.invalid/cancel', amount: 5000, currency: 'MXN', language: 'es' };
  const options = { subscriptions: [sub], now: new Date('2026-11-03T00:00:00Z'), sendEmail: async m => sent.push(m), sendPush: async m => sent.push(m), ledger: { has: async k => keys.has(k), mark: async k => keys.add(k) } };
  assert.equal(await sendRenewalNotices(options), 2);
  assert.equal(await sendRenewalNotices(options), 0);
  assert.match(sent[0].body, /2026-11-08/);
  assert.equal(await sendRenewalNotices({ ...options, subscriptions: [{ ...sub, cancelled: true }] }), 0);
  assert.equal(await sendRenewalNotices({ ...options, now: new Date('2026-11-04T00:00:00Z') }), 0);
  console.log('Compliance behavior checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
