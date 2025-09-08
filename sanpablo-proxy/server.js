import express from "express";
import cors from "cors";

// Render provides PORT; default locally
const PORT = process.env.PORT || 3000;

// Comma-separated origins, e.g. https://yourapp.com,https://staging.yourapp.com
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const app = express();

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error("Not allowed by CORS"));
    },
  })
);

app.get("/healthz", (_req, res) => res.send("ok"));

// Simple welcome page so GET / isn't 404
app.get('/', (_req, res) => {
  res.type('text/plain').send('sanpablo-proxy is running. Try GET /api/sanpablo/search?q=aspirina');
});

// choose price or basePrice
function pickPrice(p) {
  if (!p) return null;
  const node = p.price || p.basePrice || null;
  if (!node) return null;
  return {
    value: typeof node.value === "number" ? node.value : null,
    formattedValue: node.formattedValue || null,
    currencyIso: node.currencyIso || "MXN",
  };
}

function absolutizeImage(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `https://api.farmaciasanpablo.com.mx${url}`;
}

/**
 * GET /api/sanpablo/search?q=aspirina%20100%20mg&pageSize=10&page=0
 * Browser-friendly GET endpoint for quick manual tests
 */
app.get("/api/sanpablo/search", async (req, res) => {
  try {
    const q = String(req.query.q || '');
    if (!q) return res.status(400).json({ error: 'q (query) is required' });

    const pageSize = Number(req.query.pageSize) || 10;
    const currentPage = Number(req.query.page) || 0;

    const url = new URL('https://api.farmaciasanpablo.com.mx/rest/v2/fsp/products/search');
    url.searchParams.set('q', q);
    url.searchParams.set('pageSize', String(pageSize));
    url.searchParams.set('currentPage', String(currentPage));
    url.searchParams.set('fields',
      'products(code,name,basePrice(FULL),price(FULL),images(FULL));pagination'
    );
    url.searchParams.set('format', 'json');

    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    
    if (!r.ok) {
      const body = await r.text();
      return res.status(r.status).json({ error: "Upstream error", status: r.status, body });
    }

    const data = await r.json();

    const prices = (data?.products || [])
      .map(p => {
        const price = p?.price?.value ?? p?.basePrice?.value;
        const currency = p?.price?.currencyIso ?? p?.basePrice?.currencyIso ?? 'MXN';
        if (price == null) return null;
        return {
          source: 'san-pablo',
          chain: 'San Pablo',
          productCode: p.code,
          name: p.name,
          pack: null, // Simplified for now
          price,
          currency,
          image: p?.images?.[0]?.url || null
        };
      })
      .filter(Boolean);

    res.json({ 
      query: q,
      page: currentPage,
      pageSize,
      totalResults: data.pagination?.totalResults ?? prices.length,
      items: prices 
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`San Pablo proxy listening on :${PORT}`);
});
