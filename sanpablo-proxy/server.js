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
  'Accept': 'application/xml, text/xml, */*',
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

// Map search terms to San Pablo categories
function getCategoryForSearch(q) {
  const query = (q || '').toLowerCase().trim();
  
  // Pain relievers / Analgesics
  if (query.includes('aspirina') || query.includes('aspirin') || 
      query.includes('ibuprofeno') || query.includes('ibuprofen') ||
      query.includes('paracetamol') || query.includes('acetaminophen') ||
      query.includes('naproxeno') || query.includes('naproxen') ||
      query.includes('dolor') || query.includes('pain') ||
      query.includes('analgesic') || query.includes('analgésico')) {
    return '060030001'; // Analgésicos
  }
  
  // Default to general search if no specific category matches
  return null;
}

// Search using San Pablo's actual XML-based search system
async function spSearchXML(q, currentPage = 0, pageSize = 12) {
  const category = getCategoryForSearch(q);
  
  // If we have a specific category, use category search
  if (category) {
    const url = `https://www.farmaciasanpablo.com.mx/search?q=%3A%3AallCategories%3A${category}&page=${currentPage}&pageSize=${pageSize}`;
    const r = await fetch(url, { headers: SP_HEADERS });
    if (!r.ok) throw new Error(`SanPablo ${r.status}`);
    const xmlText = await r.text();
    return parseXMLResponse(xmlText);
  }
  
  // Otherwise, try text search
  const encodedQuery = encodeURIComponent(q);
  const url = `https://www.farmaciasanpablo.com.mx/search?q=${encodedQuery}&page=${currentPage}&pageSize=${pageSize}`;
  const r = await fetch(url, { headers: SP_HEADERS });
  if (!r.ok) throw new Error(`SanPablo ${r.status}`);
  const xmlText = await r.text();
  return parseXMLResponse(xmlText);
}

// Parse XML response to extract product data
function parseXMLResponse(xmlText) {
  const products = [];
  
  // Simple regex-based parsing (in production, you'd want a proper XML parser)
  const productMatches = xmlText.match(/<products>[\s\S]*?<\/products>/g);
  
  if (productMatches) {
    for (const productMatch of productMatches) {
      const codeMatch = productMatch.match(/<code>([^<]+)<\/code>/);
      const nameMatch = productMatch.match(/<name>([^<]+)<\/name>/);
      const priceMatch = productMatch.match(/<price>[\s\S]*?<value>([^<]+)<\/value>[\s\S]*?<\/price>/);
      const basePriceMatch = productMatch.match(/<basePrice>[\s\S]*?<value>([^<]+)<\/value>[\s\S]*?<\/basePrice>/);
      const currencyMatch = productMatch.match(/<currencyIso>([^<]+)<\/currencyIso>/);
      const imageMatch = productMatch.match(/<url>([^<]+)<\/url>/);
      const additionalDescMatch = productMatch.match(/<additionalDescription>([^<]+)<\/additionalDescription>/);
      
      const price = parseMoney(priceMatch?.[1] || basePriceMatch?.[1]);
      if (price == null) continue; // Skip products without valid price
      
      products.push({
        source: 'san-pablo',
        chain: 'San Pablo',
        productCode: codeMatch?.[1] || null,
        name: nameMatch?.[1] || null,
        pack: additionalDescMatch?.[1] || null,
        price: price,
        currency: currencyMatch?.[1] || 'MXN',
        image: imageMatch?.[1] || null
      });
    }
  }
  
  return { products };
}

async function sanPabloSmart(q) {
  const out = new Map(); // key by productCode
  
  try {
    // Try category-based search first (more reliable)
    const categoryResults = await spSearchXML(q, 0, 24);
    if (categoryResults.products.length > 0) {
      for (const product of categoryResults.products) {
        if (product.productCode) {
          const prev = out.get(product.productCode);
          if (!prev || product.price < prev.price) {
            out.set(product.productCode, product);
          }
        }
      }
    }
    
    // If no results from category search, try text search
    if (out.size === 0) {
      const textResults = await spSearchXML(q, 0, 24);
      for (const product of textResults.products) {
        if (product.productCode) {
          const prev = out.get(product.productCode);
          if (!prev || product.price < prev.price) {
            out.set(product.productCode, product);
          }
        }
      }
    }
    
  } catch (error) {
    console.log(`[SanPablo] Error searching for "${q}":`, error.message);
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