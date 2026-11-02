const { test } = require('node:test');
const assert = require('node:assert/strict');
const { matchProduct, presentPrice, parseCsv, checkedDate, digest } = require('./price-core');
const { uploadFeed } = require('./price-system');
const express = require('express');
const { install } = require('./price-system');
const products = [{ id: 'p', active_ingredient: 'Paracetamol', strength: '500 mg', form: 'tableta', ean: '123' }];
test('matching requires complete composition, rejects ambiguity and EAN conflicts', () => {
  const input = { activeIngredient: 'paracetamol', dosage: '500mg', form: 'tableta' };
  assert.equal(matchProduct(input, products).id, 'p');
  assert.equal(matchProduct({ ...input, ean: '999' }, products), null);
  assert.equal(matchProduct({ name: 'Paracetamol', dosage: '500mg' }, products), null);
  assert.equal(matchProduct(input, [...products, { ...products[0], id: 'other' }]), null);
});
test('60 day boundary and future/invalid dates never become current prices', () => {
  const now = Date.parse('2026-11-02T00:00:00Z');
  const base = { price_mxn: '100.50', source: 'partner_feed' };
  assert.equal(presentPrice({ ...base, observed_at: new Date(now - 60 * 86400000).toISOString() }, now).price, 100.5);
  for (const date of [new Date(now - 61 * 86400000).toISOString(), 'invalid', '2027-01-01']) {
    const p = presentPrice({ ...base, observed_at: date }, now);
    assert.equal(p.price, null); assert.equal(p.price_mxn, null); assert.equal(p.stale, true);
  }
  assert.throws(() => checkedDate('2099-01-01'));
});
test('CSV supports quotes, embedded newline and BOM; malformed input fails', () => {
  assert.deepEqual(parseCsv('\uFEFFa,b\r\n"one,two","three\n""four"""'), [{ a: 'one,two', b: 'three\n"four"' }]);
  assert.throws(() => parseCsv('a,b\n"unclosed,b'));
  assert.throws(() => parseCsv('a,b\nx,y,z'));
});
test('partner feed rejects cross-tenant stores before any transaction', async () => {
  let wrote = false;
  const sql = strings => strings.join('').includes('price_products') ? products : [{ id: 'own' }];
  sql.transaction = async () => { wrote = true; };
  const csv = 'active_ingredient,strength,form,ean,store_id,price_mxn,observed_at\nParacetamol,500mg,tableta,123,other,10,2026-01-01';
  await assert.rejects(uploadFeed(sql, { id: 'partner', chain: 'Chain' }, csv), /unauthorized/);
  assert.equal(wrote, false);
  assert.equal(digest('secret').length, 64);
});
test('HTTP flags, partner authorization, OTC ad rejection and public labels', async () => {
  const flags = ['PRICE_SYSTEM_ENABLED', 'PARTNER_PRICES_ENABLED', 'PARTNER_PORTAL_ENABLED', 'PRICE_PARTNER_KEYS_JSON'];
  const previous = Object.fromEntries(flags.map(k => [k, process.env[k]]));
  let otc = false;
  const sql = async (strings) => {
    const query = strings.join('?');
    if (query.includes('FROM price_partners')) return [{ id: 'partner', chain: 'Farmacia', enabled: true }];
    if (query.includes('INSERT INTO price_placements')) return otc ? [{ id: '1' }] : [];
    if (query.includes('FROM price_placements')) return [{ id: '1', title: 'Promoción', chain: 'Farmacia' }];
    return [];
  };
  const app = express(); app.use(express.json()); install(app, sql);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    process.env.PRICE_SYSTEM_ENABLED = 'false';
    const result = await fetch(base + '/pharmacies/prices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ medication: {}, pharmacies: [{ id: 'store' }] }) });
    assert.equal((await result.json()).prices[0].price, null);
    assert.equal((await fetch(base + '/partner/prices')).status, 404);
    for (const f of flags.slice(0, 3)) process.env[f] = 'true';
    process.env.PRICE_PARTNER_KEYS_JSON = JSON.stringify({ partner: digest('partner-secret') });
    assert.equal((await fetch(base + '/api/partner/prices/feed')).status, 401);
    const options = { method: 'POST', headers: { Authorization: 'Bearer partner-secret', 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: 'rx', title: 'Promo', starts_at: '2026-01-01', ends_at: '2026-12-01' }) };
    assert.equal((await fetch(base + '/api/partner/prices/placements', options)).status, 400);
    otc = true;
    assert.equal((await fetch(base + '/api/partner/prices/placements', options)).status, 200);
    const ads = await (await fetch(base + '/api/prices/placements')).json();
    assert.equal(ads.placements[0].label, 'Patrocinado');
    assert.equal(ads.placements[0].disclaimer, 'Consulte a su medico');
  } finally {
    await new Promise(resolve => server.close(resolve));
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
test('ML validates affiliate destination and refuses disabled OAuth', async () => {
  const { affiliateLink, accessToken } = require('./ml-prices');
  assert.throws(() => affiliateLink('https://evil.example/buy'));
  assert.throws(() => affiliateLink('javascript:alert(1)'));
  assert.match(affiliateLink('https://articulo.mercadolibre.com.mx/MLM-123'), /^https:\/\/articulo.mercadolibre.com.mx\//);
  const old = process.env.ML_PRICES_ENABLED;
  process.env.ML_PRICES_ENABLED = 'false';
  try { await assert.rejects(accessToken(() => { throw Error('DB should not be called'); }), /disabled/); }
  finally { if (old === undefined) delete process.env.ML_PRICES_ENABLED; else process.env.ML_PRICES_ENABLED = old; }
});
