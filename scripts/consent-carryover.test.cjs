const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function harness() {
  const data = new Map(); const posts = []; let online = false;
  const user = { uid: 'account-a', getIdToken: async () => 'test-token' };
  const auth = { currentUser: user };
  const startup = { terms: true, collect: true, share: true, adult: true, version: 'US-2026-11-03', recordedAt: '2026-11-03T12:00:00.000Z' };
  const storage = { getItem: async k => data.get(k) || null, setItem: async (k,v) => data.set(k,v), multiSet: async rows => rows.forEach(([k,v]) => data.set(k,v)) };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/services/consentService.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText, {
    exports, setTimeout, clearTimeout, AbortController,
    fetch: async (_url, options) => { if (!online) throw new Error('offline'); if (options.method === 'POST') posts.push(JSON.parse(options.body)); return { ok: true, json: async () => options.method === 'POST' ? { ok:true } : { ...posts.at(-1), notice_version: startup.version } }; },
    require: name => {
      if (name === './region') return { getRegion: () => 'US', US_CONSENT_VERSION: startup.version, getStartupConsent: () => startup, hasUSStartupConsent: () => true };
      if (name === '../i18n') return { default: { language:'en', t: k => k } };
      if (name === '../config/firebase') return { auth };
      if (name === '../config/api') return { API_BASE:'https://example.invalid' };
      if (name === '@react-native-async-storage/async-storage') return { default:storage };
      throw new Error(name);
    }
  });
  return { api:exports, data, posts, auth, online: () => { online=true; } };
}
test('onboarding carries once, queues offline, and syncs original versions/time', async () => {
  const h=harness(); const current=await h.api.consentRequest();
  assert.equal(h.api.hasCurrentConsent(current),true);
  await h.api.consentRequest(); h.online(); await h.api.consentRequest();
  assert.equal(h.posts.length,1); assert.equal(h.posts[0].recordedAt,'2026-11-03T12:00:00.000Z');
  assert.equal(h.posts[0].noticeVersion,'US-2026-11-03');
});
test('offline withdrawal survives signout and syncs after grant in order', async () => {
  const h=harness(); await h.api.consentRequest();
  await h.api.consentRequest('POST',{ terms:true, privacy:true, health:false, share:false });
  await h.api.clearConsentCache('account-a');
  assert.equal(await h.api.readCachedConsent('account-a'),false);
  h.online(); const current=await h.api.consentRequest();
  assert.equal(current.health,false); assert.deepEqual(h.posts.map(p=>p.health),[true,false]);
});
test('device onboarding is never granted to another account', async () => {
  const h=harness(); await h.api.consentRequest();
  h.auth.currentUser={ uid:'account-b', getIdToken:async ()=>'test-token' };
  await assert.rejects(h.api.consentRequest(), /CONSENT_SYNC_PENDING/);
  assert.equal(await h.api.readCachedConsent('account-b'),false);
});
