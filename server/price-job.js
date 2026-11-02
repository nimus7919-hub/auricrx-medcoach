// External scheduler: run monthly. All files are retained for audit/retries.
const fs = require('fs/promises');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { importProfeco } = require('./import-profeco');
const { enabled } = require('./price-core');
async function findCsv(dir) {
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await findCsv(p));
    else if (/\.csv$/i.test(entry.name)) result.push(p);
  }
  return result;
}
async function run(sql) {
  if (!enabled('PRICE_SYSTEM_ENABLED') || !enabled('PROFECO_IMPORT_ENABLED')) return { disabled: true };
  const month = new Date().toISOString().slice(0, 7);
  const done = await sql`SELECT month FROM price_import_runs WHERE month=${month}`;
  if (done.length) return { skipped: true };
  if (process.env.PROFECO_CSV_FILE) return importProfeco(sql, process.env.PROFECO_CSV_FILE, month);
  const url = new URL(process.env.PROFECO_DATA_URL || `https://datos.profeco.gob.mx/docs/qqp/QQP_${month.slice(0, 4)}.rar`);
  if (url.protocol !== 'https:' || url.hostname !== 'datos.profeco.gob.mx') throw new Error('Only official PROFECO data URLs allowed');
  const dir = path.resolve(process.env.PROFECO_IMPORT_DIR || path.join(__dirname, 'price-imports'), month + '-' + Date.now());
  await fs.mkdir(dir, { recursive: true });
  const response = await fetch(url, { signal: AbortSignal.timeout(300000), redirect: 'error' });
  if (!response.ok || !response.body) throw new Error('Official QQP download failed');
  const archive = path.join(dir, 'qqp.rar');
  const handle = await fs.open(archive, 'wx');
  try { for await (const chunk of response.body) await handle.write(chunk); } finally { await handle.close(); }
  await promisify(execFile)(process.env.PROFECO_7Z_PATH || '7z', ['x', archive, '-o' + dir, '-y'], { timeout: 300000 });
  const files = await findCsv(dir);
  // No guessing which file is the dataset when an archive contains multiple CSVs.
  const file = process.env.PROFECO_CSV_BASENAME ? files.find(f => path.basename(f) === process.env.PROFECO_CSV_BASENAME) : files.length === 1 ? files[0] : null;
  if (!file) throw new Error('Set PROFECO_CSV_BASENAME to the extracted QQP dataset filename');
  return importProfeco(sql, file, month);
}
if (require.main === module) {
  if (!enabled('PRICE_SYSTEM_ENABLED') || !enabled('PROFECO_IMPORT_ENABLED')) console.log('PROFECO import disabled');
  else run(require('@neondatabase/serverless').neon(process.env.DATABASE_URL))
    .then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { run };
