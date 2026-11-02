const { createHash } = require('crypto');
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const enabled = name => process.env[name] === 'true';
function matchProduct(input, products) {
  const ingredient = normalize(input.active_ingredient || input.activeIngredient);
  const strength = normalize(input.strength || input.dosage).replace(/\s/g, '');
  const form = normalize(input.form);
  if (!ingredient || !strength || !form) return null;
  const matches = products.filter(p => normalize(p.active_ingredient) === ingredient &&
    normalize(p.strength).replace(/\s/g, '') === strength && normalize(p.form) === form &&
    (!input.ean || p.ean === String(input.ean)));
  return matches.length === 1 ? matches[0] : null;
}
function checkedDate(value) {
  const date = new Date(value);
  if (!value || !Number.isFinite(date.getTime()) || date > new Date()) throw new Error('Invalid observation date');
  return date.toISOString();
}
function presentPrice(row, now = Date.now()) {
  const observed = Date.parse(row.observed_at);
  const stale = !Number.isFinite(observed) || observed > now || now - observed > 60 * 86400000;
  return { ...row, price: stale ? null : Number(row.price_mxn), price_mxn: stale ? null : Number(row.price_mxn),
    priceNotAvailable: stale, stale, verified: row.source === 'partner_feed', currency: 'MXN' };
}
// RFC 4180 records, including escaped quotes, commas and embedded newlines.
function parseCsv(text) {
  const rows = []; let row = [], field = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted;
    } else if (!quoted && (c === ',' || c === '\n')) {
      row.push(field.replace(/\r$/, '')); field = '';
      if (c === '\n') { rows.push(row); row = []; }
    } else field += c;
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  const headers = (rows.shift() || []).map(normalize);
  if (new Set(headers).size !== headers.length) throw new Error('Duplicate CSV headers');
  return rows.filter(r => r.some(Boolean)).map(r => {
    if (r.length !== headers.length) throw new Error('CSV column count mismatch');
    return Object.fromEntries(headers.map((h, i) => [h, r[i]]));
  });
}
const digest = value => createHash('sha256').update(value).digest('hex');
module.exports = { normalize, enabled, matchProduct, checkedDate, presentPrice, parseCsv, digest };
