const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const api = require('./us-data');
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
function jsonResponse(body, status = 200) { return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => body }; }
test('US drug normalization uses public prescribable subset and source release date', async () => {
  const calls = [];
  global.fetch = async url => { calls.push(url); return jsonResponse(url.includes('version') ? { version: '02-Nov-2026', apiVersion: '3.1' } : { drugGroup: { conceptGroup: [{ conceptProperties: [{ name: 'Example tablet', rxcui: '123' }] }] } }); };
  const result = await api.searchDrugs('example');
  assert.match(calls[0], /REST\/Prescribe\/drugs.json/);
  assert.equal(result.dataDate, '02-Nov-2026');
  assert.equal(result.results[0].rxcui, '123');
  assert.match(result.attribution, /does not endorse/);
});
test('DailyMed source text has dates and no inferred severity or compatibility', async () => {
  global.fetch = async () => jsonResponse('<document><effectiveTime value="20261029"/><section><code code="48721-0"/><title>Drug interactions</title><text><paragraph>Original &amp; complete label sentence.</paragraph></text></section></document>');
  const result = await api.label('12345678-1234-1234-1234-123456789abc');
  assert.equal(result.updatedAt, '2026-10-29');
  assert.equal(result.sections[0].text, 'Original & complete label sentence.');
  assert.equal('severity' in result.sections[0], false);
  assert.match(result.disclaimer, /No result does not mean a combination is safe/);
  assert.match(result.sourceUrl, /dailymed.nlm.nih.gov/);
});
test('NADAC preserves acquisition cost and unit/date with exact mandatory text', async () => {
  global.fetch = async url => { assert.match(url, /ndc/); return jsonResponse({ results: [{ ndc_description: 'Example', ndc: '00000000001', nadac_per_unit: '0.12', pricing_unit: 'EA', effective_date: '2026-10-28', as_of_date: '2026-10-29' }] }); };
  const result = await api.nadac('00000000001');
  assert.equal(result.results[0].costPerUnit, '0.12');
  assert.equal(result.results[0].unit, 'EA');
  assert.equal(result.disclaimer, require('../src/legal/usDisclaimers.json').nadac.replace('[date]', '2026-10-29'));
  assert.match(result.title, /pharmacy acquisition cost, not your price/);
  assert.equal('retailPrice' in result.results[0], false);
});
test('NPPES queries community/retail and general pharmacies and filters non-pharmacy taxonomy', async () => {
  const calls = [];
  global.fetch = async url => { calls.push(url); return jsonResponse({ results: [{ number: '1', basic: { organization_name: 'Test pharmacy' }, taxonomies: [{ code: '3336C0003X' }], addresses: [] }, { number: '2', basic: {}, taxonomies: [{ code: '207Q00000X' }] }] }); };
  const result = await api.pharmacies({ city: 'Austin', state: 'TX' });
  assert.equal(calls.length, 2);
  assert.match(calls[0], /Community%2FRetail%20Pharmacy/);
  assert.match(calls[0], /city=Austin&state=TX/);
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].taxonomies[0], '3336C0003X');
});
test('FDA empty results and upstream failure remain distinct', async () => {
  global.fetch = async () => jsonResponse({}, 404);
  assert.deepEqual((await api.fda('recalls', 'example')).results, []);
  global.fetch = async () => jsonResponse({}, 503);
  await assert.rejects(() => api.fda('recalls', 'example'), /SOURCE_UNAVAILABLE/);
});
test('US reference route rejects missing consent and invalid NDC without fetching', async () => {
  let handler;
  api.registerUSData({ post: (_path, fn) => { handler = fn; } });
  const response = () => ({ statusCode: 200, set() {}, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } });
  global.fetch = async () => { throw new Error('must not fetch'); };
  const noConsent = response();
  await handler({ params: { kind: 'nadac' }, body: { ndc: 'bad' } }, noConsent);
  assert.equal(noConsent.statusCode, 403);
  const invalid = response();
  await handler({ auricRegion: 'US', params: { kind: 'nadac' }, body: { ndc: 'bad' } }, invalid);
  assert.equal(invalid.statusCode, 400);
});
