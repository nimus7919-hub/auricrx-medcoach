import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (!ALLOWED.length || ALLOWED.includes('*') || ALLOWED.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());

// simple request logger
app.use((req, res, next) => {
  const t0 = Date.now();
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now()-t0}ms)`));
  next();
});

// welcome + health
app.get('/', (_req, res) => res.type('text/plain').send('sanpablo-proxy running'));
app.get('/health', (_req, res) => res.json({ ok: true }));

// --- headers that make responses look like real browser traffic from MX/ES ---
const SP_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
  'Referer': 'https://www.farmaciasanpablo.com.mx/',
  'Origin':  'https://www.farmaciasanpablo.com.mx',
};

// parse "$119.00" or "119,00" to 119
function parseMoney(x) {
  if (x == null) return null;
  if (typeof x === 'number') return x;
  if (typeof x === 'string') {
    const s = x.replace(/[^\d,.-]/g, '')
               .replace(/\.(?=.*\.)/g, '')    // drop thousand dots
               .replace(',', '.');            // decimal comma -> dot
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// make multiple query variants (brand + generic + pack phrasing)
function buildVariants(q) {
  const raw = (q || '').toLowerCase().trim().replace(/\s+/g,' ');
  // pull out strength & qty if present
  const mg = (raw.match(/(\d+)\s*mg/) || [])[1];
  const qty = (raw.match(/\b(\d{1,3})\b(?!\s*mg)/) || [])[1];

  const drug = raw.replace(/\bprotect\b/g,'').replace(/\b\d+\s*mg\b/,'').replace(/\b\d{1,3}\b(?!\s*mg)/,'').trim();

  const candidates = [
    raw,
    `${drug} ${mg ?? ''} mg`.trim(),
    `${drug} ${mg ?? ''} mg ${qty ?? ''}`.trim(),
    `${drug} ${mg ?? ''} mg ${qty ?? ''} tabletas`.trim(),
    `${drug} ${mg ?? ''} mg caja ${qty ?? ''}`.trim(),
    // brand / generic synonyms commonly used
    raw.replace('aspirina','aspirina protect'),
    raw.replace('aspirina','ácido acetilsalicílico'),
    'aspirina',
    'aspirina protect',
    'ácido acetilsalicílico',
  ];

  // dedupe & clean blanks
  return Array.from(new Set(candidates.map(s => s.trim()).filter(Boolean)));
}

async function spSearchPage(q, currentPage = 0, pageSize = 20) {
  const url = new URL('https://api.farmaciasanpablo.com.mx/rest/v2/fsp/products/search');
  url.searchParams.set('q', q);
  url.searchParams.set('currentPage', String(currentPage));
  url.searchParams.set('pageSize', String(pageSize));
  url.searchParams.set('fields', 'products(code,name,price(FULL),basePrice(FULL),packaging,unit,measure,images(FULL));pagination');
  url.searchParams.set('format', 'json');
  url.searchParams.set('lang', 'es_MX');
  url.searchParams.set('curr', 'MXN');

  const r = await fetch(url, { headers: SP_HEADERS });
  if (!r.ok) throw new Error(`SanPablo ${r.status}`);
  return r.json();
}

function mapProducts(products = []) {
  return products.map(p => {
    const value = parseMoney(p?.price?.value) ?? parseMoney(p?.price?.formattedValue)
               ?? parseMoney(p?.basePrice?.value) ?? parseMoney(p?.basePrice?.formattedValue);
    if (value == null) return null;
    const currency = p?.price?.currencyIso ?? p?.basePrice?.currencyIso ?? 'MXN';
    return {
      source: 'san-pablo',
      chain: 'San Pablo',
      productCode: p.code,
      name: p.name,
      pack: p.packaging || [p?.measure, p?.unit].filter(Boolean).join(' '),
      price: value,
      currency,
      image: p?.images?.[0]?.url || null
    };
  }).filter(Boolean);
}

async function sanPabloSmart(q) {
  const variants = buildVariants(q);
  const out = new Map(); // key by productCode

  for (const v of variants) {
    // fetch first page; if it has results, optionally grab page 1 too
    const first = await spSearchPage(v, 0, 24);
    const items0 = mapProducts(first?.products);
    if (items0.length) {
      for (const it of items0) {
        const prev = out.get(it.productCode);
        if (!prev || it.price < prev.price) out.set(it.productCode, it);
      }
      // fetch next page if pagination suggests more
      const totalPages = Number(first?.pagination?.totalPages ?? 1);
      if (totalPages > 1) {
        const second = await spSearchPage(v, 1, 24);
        const items1 = mapProducts(second?.products);
        for (const it of items1) {
          const prev = out.get(it.productCode);
          if (!prev || it.price < prev.price) out.set(it.productCode, it);
        }
      }
      // we have matches; we can stop early
      break;
    } else {
      console.log(`[SanPablo] 0 results for "${v}"`);
    }
  }

  const prices = Array.from(out.values()).sort((a,b) => a.price - b.price);
  return { prices };
}

// GET (browser test): /api/mx/sanpablo/search?q=aspirina%20100%20mg%2028
app.get('/api/mx/sanpablo/search', async (req, res) => {
  const q = String(req.query.q || '');
  if (!q) return res.status(400).json({ error: 'q (query) is required' });
  try { res.json(await sanPabloSmart(q)); }
  catch (e) { res.status(500).json({ error: String(e?.message || e) }); }
});

// POST (app usage): { q: "aspirina 100 mg 28" }
app.post('/api/mx/sanpablo/search', async (req, res) => {
  const q = String(req.body?.q || '');
  if (!q) return res.status(400).json({ error: 'q (query) is required' });
  try { res.json(await sanPabloSmart(q)); }
  catch (e) { res.status(500).json({ error: String(e?.message || e) }); }
});

// friendly 404 with hints
const KNOWN = [
  'GET  /',
  'GET  /health',
  'GET  /api/mx/sanpablo/search?q=aspirina%20100%20mg%2028',
  'POST /api/mx/sanpablo/search   { q: "aspirina 100 mg 28" }',
];
app.use((req, res) => res.status(404).json({ error: 'Not Found', method: req.method, path: req.originalUrl, try: KNOWN }));

app.listen(PORT, () => console.log(`San Pablo proxy listening on :${PORT}`));