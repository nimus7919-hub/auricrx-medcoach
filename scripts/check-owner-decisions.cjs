const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const parser = require('@babel/parser');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

for (const file of ['App.js', 'src/components/StripeCheckoutModal.js', 'src/legal/legalTexts.ts']) {
  parser.parse(read(file), { sourceType: 'module', plugins: ['jsx', 'typescript'] });
}
for (const lang of ['en', 'es', 'de', 'fr', 'pt', 'zh']) {
  const locale = JSON.parse(read(`src/i18n/${lang}.json`));
  assert.equal(locale.ai.pawlmer, 'Pawlmer');
  assert.ok(locale.subscriptionPlans.month.includes('79'));
  assert.ok(locale.subscriptionPlans.year.includes('699'));
  assert.ok(read(`src/legal/TermsOfService-${lang}.md`).includes('699'));
}

const server = read('server/index.js');
const start = server.indexOf("app.post('/api/stripe/create-checkout'");
const end = server.indexOf("app.post('/api/stripe/webhook'", start);
assert.ok(start > 0 && end > start);
let handler;
let failFirst = false;
let sessions = [];
const stripe = {
  customers: { retrieve: async () => ({}), create: async () => ({ id: 'cus_new' }) },
  checkout: { sessions: { create: async data => {
    sessions.push(data);
    if (failFirst && sessions.length === 1) throw new Error('No such customer');
    return { id: 'session', url: 'https://checkout.stripe.com/test' };
  } } },
};
vm.runInNewContext(server.slice(start, end), {
  app: { post: (_route, fn) => { handler = fn; } },
  stripe,
  verifyToken: async () => ({ uid: 'test', email: 'test@example.com' }),
  neonClient: async () => [{ stripe_customer_id: 'cus_existing' }],
  process: { env: { RENEWAL_NOTICES_READY: 'true' } },
  console: { log() {}, error() {} },
});
async function run(body) {
  let status = 200;
  let result;
  await handler({ body, headers: { authorization: 'Bearer test' } }, {
    status(code) { status = code; return this; },
    json(data) { result = data; },
  });
  return { status, result };
}
(async () => {
  for (const interval of ['month', 'year']) {
    for (const retry of [false, true]) {
      sessions = [];
      failFirst = retry;
      const response = await run({ platform: 'web', country: 'MX', billingInterval: interval });
      assert.equal(response.status, 200);
      assert.equal(response.result.ok, true);
      assert.equal(sessions.length, retry ? 2 : 1);
      for (const session of sessions) {
        const price = session.line_items[0].price_data;
        assert.equal(price.currency, 'mxn');
        assert.equal(price.unit_amount, interval === 'year' ? 69900 : 7900);
        assert.equal(price.recurring.interval, interval);
      }
    }
  }
  failFirst = false;
  sessions = [];
  assert.equal((await run({ platform: 'web' })).status, 200);
  assert.equal(sessions[0].line_items[0].price_data.unit_amount, 7900);
  sessions = [];
  assert.equal((await run({ platform: 'web', billingInterval: 'week' })).status, 400);
  assert.equal((await run({ platform: 'ios', billingInterval: 'year' })).status, 409);
  assert.equal(sessions.length, 0);
  console.log('PASS: app syntax, six locales and legal plans, monthly/yearly checkout, retry, default, invalid interval and native guard.');
})().catch(error => { console.error(error); process.exitCode = 1; });
