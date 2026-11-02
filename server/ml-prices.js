const { enabled, matchProduct, checkedDate } = require('./price-core');
const { randomBytes, createCipheriv, createDecipheriv } = require('crypto');
let tokenCache;
function tokenKey() {
  const key = Buffer.from(process.env.ML_TOKEN_ENCRYPTION_KEY || '', 'hex');
  if (key.length !== 32) throw new Error('ML_TOKEN_ENCRYPTION_KEY must be a 32-byte hex key');
  return key;
}
function seal(value) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', tokenKey(), iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map(b => b.toString('base64')).join('.');
}
function unseal(value) {
  const [iv, tag, data] = value.split('.').map(s => Buffer.from(s, 'base64'));
  const cipher = createDecipheriv('aes-256-gcm', tokenKey(), iv);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString('utf8');
}
async function accessToken(sql, fetcher = fetch) {
  if (!enabled('ML_PRICES_ENABLED')) throw new Error('ML prices disabled');
  if (tokenCache && tokenCache.expires > Date.now()) return tokenCache.token;
  const { ML_CLIENT_ID, ML_CLIENT_SECRET, ML_REFRESH_TOKEN } = process.env;
  tokenKey();
  const [stored] = await sql`SELECT encrypted_refresh_token FROM price_oauth_tokens WHERE provider='ml'`;
  const refreshToken = stored ? unseal(stored.encrypted_refresh_token) : ML_REFRESH_TOKEN;
  if (!ML_CLIENT_ID || !ML_CLIENT_SECRET || !refreshToken) throw new Error('ML OAuth account setup required');
  const response = await fetcher('https://api.mercadolibre.com/oauth/token', {
    method: 'POST', signal: AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', client_id: ML_CLIENT_ID, client_secret: ML_CLIENT_SECRET, refresh_token: refreshToken })
  });
  if (!response.ok) throw new Error('ML OAuth failed');
  const data = await response.json();
  if (!data.access_token) throw new Error('ML missing access token');
  if (data.refresh_token) {
    const encrypted = seal(data.refresh_token);
    await sql`INSERT INTO price_oauth_tokens(provider,encrypted_refresh_token) VALUES('ml',${encrypted})
      ON CONFLICT(provider) DO UPDATE SET encrypted_refresh_token=excluded.encrypted_refresh_token,updated_at=now()`;
  }
  tokenCache = { token: data.access_token, expires: Date.now() + Math.max(0, Number(data.expires_in || 0) - 60) * 1000 };
  return data.access_token;
}
function affiliateLink(permalink) {
  const url = new URL(permalink);
  if (url.protocol !== 'https:' || !/(^|\.)mercadolibre\.com\.mx$/.test(url.hostname)) throw new Error('Invalid ML purchase link');
  if (process.env.ML_AFFILIATE_TAG) url.searchParams.set('matt_tool', process.env.ML_AFFILIATE_TAG);
  return url.toString();
}
async function importItem(sql, itemId, mapping, fetcher = fetch) {
  if (!enabled('PRICE_SYSTEM_ENABLED') || !enabled('ML_PRICES_ENABLED')) throw new Error('ML prices disabled');
  if (!/^MLM\d+$/.test(itemId)) throw new Error('Invalid ML item');
  const token = await accessToken(sql, fetcher);
  const response = await fetcher(`https://api.mercadolibre.com/items/${itemId}`, {
    headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error('ML item lookup failed');
  const item = await response.json();
  if (item.status !== 'active' || item.currency_id !== 'MXN' || !Number.isFinite(item.price) || item.price <= 0) throw new Error('ML item unavailable');
  const ean = item.attributes?.find(a => a.id === 'GTIN' || a.id === 'EAN')?.value_name;
  // Owner-reviewed item mapping supplies composition; never infer it from listing titles.
  if (!ean || ean !== mapping.ean) throw new Error('ML EAN does not match reviewed mapping');
  const products = await sql`SELECT * FROM price_products`;
  const product = matchProduct({ ...mapping, ean }, products);
  if (!product) throw new Error('ML product is ambiguous or unmatched');
  const observed = checkedDate(new Date().toISOString());
  const url = affiliateLink(item.permalink);
  await sql`INSERT INTO price_stores(id,chain) VALUES('mercadolibre','Mercado Libre') ON CONFLICT(id) DO NOTHING`;
  await sql`INSERT INTO prices(product_id,chain,store_id,price_mxn,source,observed_at,confidence,purchase_url)
    VALUES(${product.id},'Mercado Libre','mercadolibre',${item.price},'ml_api',${observed},1,${url})
    ON CONFLICT(product_id,store_id,source,observed_at) DO NOTHING`;
  return { product_id: product.id, price_mxn: item.price, purchase_url: url };
}
module.exports = { accessToken, affiliateLink, importItem };
if (require.main === module) {
  const fs = require('fs');
  const { neon } = require('@neondatabase/serverless');
  Promise.resolve().then(async () => {
    const mappings = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    const sql = neon(process.env.DATABASE_URL);
    for (const mapping of mappings) await importItem(sql, mapping.item_id, mapping);
    console.log(JSON.stringify({ imported: mappings.length }));
  }).catch(error => { console.error(error.message); process.exitCode = 1; });
}
