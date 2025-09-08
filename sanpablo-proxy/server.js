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

// shared fetcher
async function sanPablo(q, pageSize = 10, currentPage = 0) {
  const url = new URL('https://api.farmaciasanpablo.com.mx/rest/v2/fsp/products/search');
  url.searchParams.set('q', q);
  url.searchParams.set('pageSize', String(pageSize));
  url.searchParams.set('currentPage', String(currentPage));
  url.searchParams.set('fields',
    'products(code,name,basePrice(FULL),price(FULL),packaging,unit,measure,images(FULL));pagination'
  );
  url.searchParams.set('format', 'json');
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  const data = await r.json();
  const prices = (data?.products || []).map(p => {
    const price = p?.price?.value ?? p?.basePrice?.value;
    const currency = p?.price?.currencyIso ?? p?.basePrice?.currencyIso ?? 'MXN';
    if (price == null) return null;
    return {
      source: 'san-pablo',
      chain: 'San Pablo',
      productCode: p.code,
      name: p.name,
      pack: p.packaging || [p?.measure, p?.unit].filter(Boolean).join(' '),
      price,
      currency,
      image: p?.images?.[0]?.url || null
    };
  }).filter(Boolean);
  return { prices };
}

// GET (browser test): /api/mx/sanpablo/search?q=aspirina%20100%20mg%2028
app.get('/api/mx/sanpablo/search', async (req, res) => {
  const q = String(req.query.q || '');
  if (!q) return res.status(400).json({ error: 'q (query) is required' });
  try { res.json(await sanPablo(q)); }
  catch (e) { res.status(500).json({ error: String(e?.message || e) }); }
});

// POST (app usage): { q: "aspirina 100 mg 28" }
app.post('/api/mx/sanpablo/search', async (req, res) => {
  const q = String(req.body?.q || '');
  if (!q) return res.status(400).json({ error: 'q (query) is required' });
  try { res.json(await sanPablo(q)); }
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