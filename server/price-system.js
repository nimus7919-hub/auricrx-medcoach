const express = require('express');
const { timingSafeEqual } = require('crypto');
const { enabled, matchProduct, checkedDate, presentPrice, parseCsv, digest } = require('./price-core');

function equal(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length > 0 && x.length === y.length && timingSafeEqual(x, y);
}
function partnerAuth(sql) {
  return async (req, res, next) => {
    try {
      // Provision keys outside the database; raw partner keys are never stored or logged.
      const keys = JSON.parse(process.env.PRICE_PARTNER_KEYS_JSON || '{}');
      const token = (req.headers.authorization || '').replace(/^Bearer /, '');
      const admin = equal(token, process.env.PRICE_ADMIN_TOKEN);
      const partnerId = admin ? req.headers['x-partner-id'] : Object.keys(keys).find(id => equal(digest(token), keys[id]));
      if (!partnerId) return res.status(401).json({ error: 'partner_auth_required' });
      const [partner] = await sql`SELECT * FROM price_partners WHERE id=${partnerId} AND enabled=true`;
      if (!partner) return res.status(403).json({ error: 'partner_disabled' });
      req.pricePartner = partner;
      next();
    } catch { res.status(503).json({ error: 'partner_auth_unavailable' }); }
  };
}
async function uploadFeed(sql, partner, csv) {
  const rows = parseCsv(csv);
  if (!rows.length || rows.length > 5000) throw new Error('Feed must contain 1 to 5000 rows');
  const products = await sql`SELECT * FROM price_products`;
  const stores = await sql`SELECT id FROM price_stores WHERE partner_id=${partner.id}`;
  const writes = rows.map(row => {
    const product = matchProduct(row, products);
    if (!product || !stores.some(s => s.id === row.store_id)) throw new Error('Unmatched product or unauthorized store');
    const amount = Number(row.price_mxn);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 9999999999) throw new Error('Invalid price_mxn');
    const observed = checkedDate(row.observed_at);
    return sql`INSERT INTO prices(product_id,chain,store_id,price_mxn,source,observed_at,confidence)
      VALUES(${product.id},${partner.chain},${row.store_id},${amount},'partner_feed',${observed},1)
      ON CONFLICT(product_id,store_id,source,observed_at) DO UPDATE
      SET price_mxn=excluded.price_mxn,fetched_at=now(),confidence=1`;
  });
  await sql.transaction(writes);
  return rows.length;
}

function install(app, sql) {
  const gate = (name) => (req, res, next) => enabled('PRICE_SYSTEM_ENABLED') && enabled(name) ? next() : res.status(404).end();
  const auth = partnerAuth(sql);
  app.get('/partner/prices', gate('PARTNER_PORTAL_ENABLED'), (_req, res) => {
    res.set('Cache-Control', 'no-store').sendFile(require('path').join(__dirname, 'price-portal.html'));
  });
  const router = express.Router();
  router.use(gate('PARTNER_PRICES_ENABLED'), auth, (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.post('/feed', express.text({ type: ['text/csv', 'text/plain'], limit: '2mb' }), async (req, res) => {
    try { res.json({ ok: true, imported: await uploadFeed(sql, req.pricePartner, req.body) }); }
    catch (e) { res.status(400).json({ error: e.message }); }
  });
  router.get('/feed', async (req, res) => {
    try {
      const prices = await sql`SELECT p.* FROM prices p JOIN price_stores s ON s.id=p.store_id
        WHERE s.partner_id=${req.pricePartner.id} AND p.source='partner_feed' ORDER BY p.observed_at DESC LIMIT 500`;
      const stores = await sql`SELECT id,chain FROM price_stores WHERE partner_id=${req.pricePartner.id}`;
      const products = await sql`SELECT * FROM price_products ORDER BY id LIMIT 1000`;
      const placements = await sql`SELECT * FROM price_placements WHERE partner_id=${req.pricePartner.id} ORDER BY id DESC LIMIT 100`;
      res.json({ prices, stores, products, placements });
    } catch { res.status(503).json({ error: 'feed_unavailable' }); }
  });
  router.post('/placements', gate('PARTNER_PORTAL_ENABLED'), async (req, res) => {
    try {
      const { product_id, title, starts_at, ends_at } = req.body || {};
      const start = new Date(starts_at), end = new Date(ends_at);
      if (typeof title !== 'string' || !title.trim() || title.length > 160 ||
          !Number.isFinite(+start) || !Number.isFinite(+end) || end <= start) throw new Error('Invalid placement');
      const rows = await sql`INSERT INTO price_placements(partner_id,product_id,title,starts_at,ends_at)
        SELECT ${req.pricePartner.id},id,${title.trim()},${start.toISOString()},${end.toISOString()}
        FROM price_products WHERE id=${product_id} AND prescription_status='otc' RETURNING id`;
      if (!rows.length) return res.status(400).json({ error: 'Only approved OTC products may be sponsored' });
      res.json({ ok: true, id: rows[0].id });
    } catch { res.status(400).json({ error: 'invalid_or_non_otc_placement' }); }
  });
  router.post('/placements/:id/stop', gate('PARTNER_PORTAL_ENABLED'), async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(400).end();
    try {
      const rows = await sql`UPDATE price_placements SET active=false WHERE id=${req.params.id}
        AND partner_id=${req.pricePartner.id} RETURNING id`;
      res.status(rows.length ? 200 : 404).json({ ok: !!rows.length });
    } catch { res.status(503).end(); }
  });
  app.use('/api/partner/prices', router);
  app.get('/api/prices/placements', gate('PARTNER_PORTAL_ENABLED'), async (_req, res) => {
    try {
      const rows = await sql`SELECT a.id,a.product_id,a.title,p.chain FROM price_placements a
        JOIN price_products c ON c.id=a.product_id JOIN price_partners p ON p.id=a.partner_id
        WHERE a.active AND p.enabled AND c.prescription_status='otc' AND now() BETWEEN a.starts_at AND a.ends_at LIMIT 20`;
      res.json({ placements: rows.map(row => ({ ...row, label: 'Patrocinado', disclaimer: 'Consulte a su medico' })) });
    } catch { res.status(503).json({ placements: [] }); }
  });
  app.post('/pharmacies/prices', async (req, res) => {
    const { medication, pharmacies } = req.body || {};
    if (!medication || !Array.isArray(pharmacies) || pharmacies.length > 100 || pharmacies.some(p => !p || typeof p.id !== 'string')) {
      return res.status(400).json({ error: 'invalid_price_request' });
    }
    const empty = pharmacies.map(p => ({ ...p, price: null, priceNotAvailable: true }));
    if (!enabled('PRICE_SYSTEM_ENABLED')) return res.json({ ok: true, prices: empty, meta: { currency: 'MXN', rate: 1 } });
    try {
      const products = await sql`SELECT * FROM price_products`;
      const product = matchProduct(medication, products);
      if (!product) return res.json({ ok: true, prices: empty, meta: { currency: 'MXN', rate: 1 } });
      const rows = await sql`SELECT DISTINCT ON (p.store_id) p.*,s.external_place_id FROM prices p
        JOIN price_stores s ON s.id=p.store_id LEFT JOIN price_partners partner ON partner.id=s.partner_id
        WHERE p.product_id=${product.id} AND (p.source!='partner_feed' OR partner.enabled=true)
        AND (p.source!='partner_feed' OR ${enabled('PARTNER_PRICES_ENABLED')})
        AND (p.source!='ml_api' OR ${enabled('ML_PRICES_ENABLED')})
        ORDER BY p.store_id,p.observed_at DESC,p.confidence DESC`;
      const prices = pharmacies.map(p => {
        const row = rows.find(r => r.store_id === p.id || r.external_place_id === p.id);
        return row ? { ...p, ...presentPrice(row), id: p.id } : { ...p, price: null, priceNotAvailable: true };
      });
      const marketplace = rows.find(r => r.source === 'ml_api' && r.store_id === 'mercadolibre');
      if (marketplace) prices.push({ ...presentPrice(marketplace), id: 'mercadolibre', name: 'Mercado Libre',
        address: 'En línea', online: true, lat: 0, lon: 0 });
      res.json({ ok: true, prices, meta: { currency: 'MXN', rate: 1 } });
    } catch { res.status(503).json({ ok: false, prices: empty, error: 'prices_unavailable' }); }
  });
}
module.exports = { install, uploadFeed, partnerAuth };
