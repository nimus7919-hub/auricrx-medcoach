const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('../node_modules/typescript');

function setup({ health = true, version = '2026-11-02', billingFails = false, firebaseFails = false } = {}) {
  const routes = new Map();
  const events = [];
  let healthGate;
  const app = {
    get: (path, ...handlers) => routes.set(`GET ${path}`, handlers),
    post: (path, ...handlers) => routes.set(`POST ${path}`, handlers),
    delete: (path, ...handlers) => routes.set(`DELETE ${path}`, handlers),
    use: handler => { healthGate = handler; },
  };
  const sql = (strings, ...values) => {
    const query = strings.join('?');
    if (query.includes('stripe_customer_id')) return Promise.resolve([{ stripe_customer_id: 'cus_test' }]);
    if (query.includes('information_schema.columns')) return Promise.resolve([
      { table_name: 'user_profiles', column_name: 'user_id' }, { table_name: 'chats', column_name: 'user_id' },
      { table_name: 'consents', column_name: 'user_id' }, { table_name: 'health_profiles', column_name: 'user_id' },
    ]);
    if (query.includes('pg_constraint')) return Promise.resolve([{ child: 'chats', parent: 'user_profiles' }]);
    if (query.includes('INSERT INTO consents')) { events.push({ insert: values }); return Promise.resolve([]); }
    return Promise.resolve([{ terms: true, privacy: true, health, notice_version: version }]);
  };
  sql.query = (query, values) => ({ query, values });
  sql.transaction = async statements => { events.push({ transaction: statements }); };
  const stripe = { subscriptions: {
    list: () => ({ async *[Symbol.asyncIterator]() { yield { id: 'sub_test', status: 'active' }; } }),
    cancel: async id => { events.push({ cancel: id }); if (billingFails) throw new Error('stripe failed'); },
  } };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('./compliance'), 'utf8'), {
    module, __dirname, console: { error() {} }, require: name => {
      if (name === './firebase-admin') return { auth: () => ({ verifyIdToken: async token => {
        if (token !== 'valid') throw new Error('invalid');
        return { uid: 'verified-user', firebase: { sign_in_provider: 'google.com' } };
      }, deleteUser: async uid => {
        events.push({ firebaseDelete: uid }); if (firebaseFails) throw new Error('firebase failed');
      } }) };
      return require(name);
    },
  });
  module.exports(app, sql, () => stripe);
  async function request(key, body = {}, token = 'valid') {
    const req = { body, headers: { authorization: `Bearer ${token}` }, query: {}, path: key.split(' ')[1] };
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
    const handlers = routes.get(key) || [healthGate];
    const dispatch = async index => { if (handlers[index]) await handlers[index](req, res, () => dispatch(index + 1)); };
    await dispatch(0);
    return res;
  }
  return { request, events };
}

test('consent and deletion reject missing/invalid identity and cross-user input', async () => {
  const { request } = setup();
  assert.equal((await request('DELETE /api/account', {}, 'invalid')).statusCode, 401);
  assert.equal((await request('POST /api/consents', { user_id: 'someone-else' })).statusCode, 403);
});
test('records verified uid, current version and server-derived Google method, including withdrawal', async () => {
  const { request, events } = setup();
  const response = await request('POST /api/consents', { terms: true, privacy: true, health: false, noticeVersion: '2026-11-02', method: 'email' });
  assert.equal(response.statusCode, 200);
  assert.equal(events[0].insert[0], 'verified-user');
  assert.equal(events[0].insert[2], 'google');
  assert.equal(events[0].insert[5], false);
  assert.equal((await request('POST /api/consents', { terms: 'true' })).statusCode, 400);
});
test('withdrawn and stale consent prevent health processing', async () => {
  assert.equal((await setup({ health: false }).request('POST /api/ai/stream')).statusCode, 403);
  assert.equal((await setup({ version: 'old' }).request('POST /ask')).statusCode, 403);
});
test('deletion cancels billing, deletes per-user rows in child-first transaction, then Firebase', async () => {
  const { request, events } = setup();
  const result = await request('DELETE /api/account');
  assert.equal(result.data.ok, true);
  assert.equal(events[0].cancel, 'sub_test');
  const deletes = events[1].transaction;
  assert.ok(deletes.findIndex(row => row.query.includes('"chats"')) < deletes.findIndex(row => row.query.includes('"user_profiles"')));
  assert.ok(deletes.every(row => row.values[0] === 'verified-user' && row.query.includes('$1')));
  assert.equal(events[2].firebaseDelete, 'verified-user');
});
test('billing failure preserves database and Firebase; Firebase failure never reports success', async () => {
  const billing = setup({ billingFails: true });
  assert.equal((await billing.request('DELETE /api/account')).statusCode, 503);
  assert.equal(billing.events.length, 1);
  assert.equal((await setup({ firebaseFails: true }).request('DELETE /api/account')).statusCode, 503);
});

const symptomModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../src/services/symptomInformation.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: symptomModule.exports });
const { symptomInformation } = symptomModule.exports;
test('every Spanish emergency phrase, accent/case variants and free text show immediate 911 guidance', () => {
  for (const phrase of ['dolor de pecho', 'dolor en el pecho', 'no puedo respirar', 'dificultad para respirar', 'desmayo', 'CONVULSIÓN', 'sangrado abundante', 'quiero morir', 'suicidio', 'parálisis', 'cara caída']) {
    assert.equal(symptomInformation([], 'es', phrase).followUpActions[0], 'Si es una emergencia llama al 911 ahora.');
  }
});
test('self-harm includes Línea de la Vida and outputs contain no conditions/probabilities/urgency', () => {
  const result = symptomInformation(['quiero morir'], 'es');
  assert.match(result.followUpActions.join(' '), /800 911 2000/);
  for (const key of ['possibleConditions', 'probability', 'urgency', 'severity']) assert.equal(key in result, false);
  assert.match(symptomInformation(['chest pain'], 'en').followUpActions[0], /call 911 now/);
});
