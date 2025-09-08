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
 */
app.get("/api/sanpablo/search", async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    if (!q) return res.status(400).json({ error: "Missing q query param" });

    const pageSize = Number(req.query.pageSize) || 10;
    const currentPage = Number(req.query.page) || 0;

    const fields = "products(code,name,basePrice(FULL),price(FULL),packaging,unit,measure,images(FULL));pagination;sorts";

    const url = new URL("https://api.farmaciasanpablo.com.mx/rest/v2/fsp/products/search");
    url.searchParams.set("q", q);
    url.searchParams.set("pageSize", String(pageSize));
    url.searchParams.set("currentPage", String(currentPage));
    url.searchParams.set("fields", fields);
    url.searchParams.set("format", "json");

    const r = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!r.ok) {
      const body = await r.text();
      return res.status(r.status).json({ error: "Upstream error", status: r.status, body });
    }

    const data = await r.json();
    const products = Array.isArray(data.products) ? data.products : [];

    const items = products.map(p => {
      const price = pickPrice(p);
      const img = p.images?.[0]?.url ?? null;
      const pack = p.packaging || [p.unit, p.measure].filter(Boolean).join(" ") || null;

      return {
        code: p.code ?? null,
        name: p.name ?? null,
        price: price ? price.formattedValue : null,
        priceValue: price ? price.value : null,
        currency: price ? price.currencyIso : "MXN",
        pack,
        image: absolutizeImage(img),
      };
    });

    // Sort by price (ascending)
    items.sort((a, b) => {
      const av = a.priceValue ?? Number.POSITIVE_INFINITY;
      const bv = b.priceValue ?? Number.POSITIVE_INFINITY;
      return av - bv;
    });

    res.json({
      query: q,
      page: currentPage,
      pageSize,
      totalResults: data.pagination?.totalResults ?? items.length,
      items,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error", details: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`San Pablo proxy listening on :${PORT}`);
});
