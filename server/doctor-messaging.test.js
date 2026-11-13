const assert = require('assert');
const { genericMessagePushCopy, createChannelLayer } = require('./doctor-messaging');

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    throw err;
  }
}

test('generic message push has no health values or placeholders', () => {
  for (const lang of ['es', 'en', 'es-MX']) {
    const copy = genericMessagePushCopy(lang);
    assert.ok(copy.title);
    assert.ok(copy.body);
    assert.ok(!/\{\{/.test(copy.body));
    assert.ok(!/\b\d{2,3}\/\d{2,3}\b/.test(copy.body));
    assert.ok(!/refill|glucosa|presión|symptom/i.test(copy.body));
  }
});

(async () => {
  const channels = createChannelLayer({ sendPush: async () => ({ ok: true }) });
  const wa = await channels.whatsapp();
  const email = await channels.email();
  assert.strictEqual(wa.skipped, true);
  assert.strictEqual(email.skipped, true);
  console.log('✓ channel layer stubs non-push channels');
  console.log('doctor-messaging tests passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
