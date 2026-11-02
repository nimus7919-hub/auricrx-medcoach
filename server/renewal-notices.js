const DAY = 86400000;

// Run daily with a durable delivery ledger and configured email/push adapters.
// No subscription/account data is logged. Each adapter must support idempotencyKey.
async function sendRenewalNotices({ subscriptions, sendEmail, sendPush, ledger, now = new Date() }) {
  if (!sendEmail || !sendPush || !ledger) throw new Error('Renewal delivery adapters and durable ledger are required');
  let delivered = 0;
  for (const sub of subscriptions) {
    if (sub.cancelled || sub.status !== 'active') continue;
    const renewal = new Date(sub.renewsAt);
    const remaining = renewal.getTime() - now.getTime();
    // Daily execution must catch the renewal between six and five full days ahead.
    if (!Number.isFinite(remaining) || remaining < 5 * DAY || remaining >= 6 * DAY) continue;
    if (!sub.email || !sub.pushToken || !sub.cancelUrl || !/^https:\/\//.test(sub.cancelUrl)) {
      throw new Error('Missing renewal contact, push token, or secure cancellation link');
    }
    if (!Number.isFinite(sub.amount) || !sub.currency) throw new Error('Missing verified billing amount');
    const es = sub.language === 'es';
    const amount = new Intl.NumberFormat(es ? 'es-MX' : 'en-US', { style: 'currency', currency: sub.currency }).format(sub.amount / 100);
    const date = renewal.toISOString().slice(0, 10);
    const body = es
      ? `Tu renovación Pro será el ${date} por ${amount}, IVA incluido. Cancela sin penalización: ${sub.cancelUrl}`
      : `Your Pro renewal is on ${date} for ${amount}, VAT included. Cancel without penalty: ${sub.cancelUrl}`;
    for (const [channel, send, destination] of [['email', sendEmail, sub.email], ['push', sendPush, sub.pushToken]]) {
      const key = `${sub.id}:${renewal.toISOString()}:${channel}`;
      if (await ledger.has(key)) continue;
      await send({ destination, body, cancelUrl: sub.cancelUrl, idempotencyKey: key });
      await ledger.mark(key, now.toISOString());
      delivered++;
    }
  }
  return delivered;
}
module.exports = { sendRenewalNotices };
