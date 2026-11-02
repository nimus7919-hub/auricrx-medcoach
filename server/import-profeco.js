// Run monthly with a freshly downloaded/extracted official QQP CSV; no storefront scraping.
const fs = require('fs');
const readline = require('readline');
const { normalize, enabled, matchProduct, checkedDate, parseCsv, digest } = require('./price-core');
async function importProfeco(sql, file, month) {
  if (!enabled('PRICE_SYSTEM_ENABLED') || !enabled('PROFECO_IMPORT_ENABLED')) throw new Error('PROFECO import disabled');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Use YYYY-MM month');
  const done = await sql`SELECT month FROM price_import_runs WHERE month=${month}`;
  if (done.length) return { skipped: true };
  const products = await sql`SELECT * FROM price_products`;
  // The QQP dictionary lacks standardized composition fields. Owner-reviewed mapping
  // keys are exact producto|presentacion|marca values, never fuzzy medicine guesses.
  const mappings = JSON.parse(fs.readFileSync(process.env.PROFECO_PRODUCT_MAP_FILE, 'utf8'));
  let header, buffer = '', imported = 0, unmatched = 0, filtered = 0;
  const lines = readline.createInterface({ input: fs.createReadStream(file, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of lines) {
    if (!header) { header = line; continue; }
    buffer += (buffer ? '\n' : '') + line;
    let row;
    try { [row] = parseCsv(header + '\n' + buffer); }
    catch (error) { if (error.message === 'Unclosed CSV quote') continue; throw error; }
    buffer = '';
    if (!row) continue;
    if (!normalize(row.categoria || row.familia).includes('medicamento')) { filtered++; continue; }
    const key = [row.producto, row.presentacion, row.marca].map(normalize).join('|');
    const product = matchProduct(mappings[key] || {}, products);
    if (!product) { unmatched++; continue; }
    const amount = Number(row.precio);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid PROFECO price');
    const rawDate = row.fecharegistro || row.fecha_registro || row.observed_at;
    // Explicit day/month/year support; ISO dates remain unchanged.
    const date = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(rawDate || '');
    const observed = checkedDate(date ? `${date[3]}-${date[2]}-${date[1]}T00:00:00Z` : rawDate);
    const chain = row.cadenacomercial || row.cadena_comercial;
    const address = row.direccion;
    if (!chain || !address) { unmatched++; continue; }
    const store = 'profeco-' + digest([chain, address, row.estado, row.municipio].map(normalize).join('|')).slice(0, 24);
    await sql`INSERT INTO price_stores(id,chain) VALUES(${store},${chain}) ON CONFLICT(id) DO NOTHING`;
    await sql`INSERT INTO prices(product_id,chain,store_id,price_mxn,source,observed_at,confidence)
      VALUES(${product.id},${chain},${store},${amount},'profeco',${observed},1)
      ON CONFLICT(product_id,store_id,source,observed_at) DO UPDATE SET price_mxn=excluded.price_mxn,fetched_at=now()`;
    imported++;
  }
  if (buffer) throw new Error('Incomplete CSV record');
  if (!header) throw new Error('Empty QQP dataset');
  await sql`INSERT INTO price_import_runs(month,imported) VALUES(${month},${imported}) ON CONFLICT(month) DO NOTHING`;
  return { imported, unmatched, filtered };
}
if (require.main === module) {
  const { neon } = require('@neondatabase/serverless');
  importProfeco(neon(process.env.DATABASE_URL), process.argv[2], process.argv[3] || new Date().toISOString().slice(0, 7))
    .then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { importProfeco };
