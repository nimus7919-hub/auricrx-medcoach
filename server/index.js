require('dotenv').config();
const express = require('express');
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { z } = require('zod');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 4000;

// --- Security middleware ---
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

// --- CORS allowlist ---
const ALLOW_ORIGINS = [
  "https://auricrx-medcoach.onrender.com", // deployed server
  "http://localhost:8081",                 // Expo dev app
  // later add your production mobile/web domain
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOW_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

// --- Rate limiter for /ask ---
const askLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests/min
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many requests, please slow down." },
});
app.use("/ask", askLimiter);

// --- Your routes here ---

app.use((req, _res, next) => {
  if (req.method === "POST") {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} len=${JSON.stringify(req.body || '').length}`);
  } else {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Startup diagnostics ---
if (process.env.GOOGLE_PLACES_API_KEY) {
  console.log(`🔐 GOOGLE_PLACES_API_KEY detected (len=${process.env.GOOGLE_PLACES_API_KEY.length})`);
} else {
  console.warn('⚠️  GOOGLE_PLACES_API_KEY NOT set – pharmacy endpoint will serve mock data.');
}
console.log('🟢 Node version:', process.version);

// --- Simple in-memory cache (TTL) for nearby pharmacies to reduce API calls ---
const pharmacyCache = new Map(); // key: `${lat.toFixed(3)}:${lon.toFixed(3)}` -> { data, ts }
const PHARMACY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

// --- FX rates cache (dynamic) ---
let fxRates = { base: 'USD', ts: 0, rates: { USD: 1 } };
const FX_TTL_MS = 6 * 60 * 60 * 1000; // 6h
async function refreshFxRates(force = false) {
  const now = Date.now();
  if (!force && now - fxRates.ts < FX_TTL_MS && Object.keys(fxRates.rates || {}).length > 1) return fxRates;
  const src = process.env.FX_RATES_SOURCE || 'https://open.er-api.com/v6/latest/USD';
  try {
    const r = await fetch(src);
    if (!r.ok) throw new Error('fx_http_' + r.status);
    const j = await r.json();
    const rates = j.rates || j.data || {};
    if (!rates.USD) rates.USD = 1;
    fxRates = { base: 'USD', ts: now, rates };
    console.log('✅ FX rates refreshed', Object.keys(rates).length, 'currencies');
  } catch (e) {
    console.warn('FX refresh failed, using cached/fallback:', e.message);
    if (!fxRates.rates) fxRates = { base: 'USD', ts: now, rates: { USD: 1 } };
  }
  return fxRates;
}

function haversineMi(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // miles
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function fetchNearbyPharmacies(lat, lon, limit = 10, lang = 'en', { useCache = true } = {}) {
  const key = `${lat.toFixed(3)}:${lon.toFixed(3)}`;
  const now = Date.now();
  if (useCache) {
    const cached = pharmacyCache.get(key);
    if (cached && now - cached.ts < PHARMACY_CACHE_TTL_MS) {
      return { list: cached.data.slice(0, limit), cached: true, mock: false };
    }
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn('Nearby pharmacies: no API key present – returning mock data.');
    const mock = [
      { id: "mock-cvs", name: "CVS Pharmacy", lat: lat + 0.001, lon: lon + 0.001, address: "123 Main St", distanceMiles: 0.8 },
      { id: "mock-wal", name: "Walgreens", lat: lat + 0.002, lon: lon - 0.001, address: "45 Oak Ave", distanceMiles: 1.1 },
      { id: "mock-rite", name: "Rite Aid", lat: lat - 0.001, lon: lon + 0.002, address: "8 Pine Rd", distanceMiles: 1.3 },
      { id: "mock-wmt", name: "Walmart Pharmacy", lat: lat - 0.002, lon: lon - 0.002, address: "220 Market", distanceMiles: 1.9 },
      { id: "mock-cost", name: "Costco Pharmacy", lat: lat + 0.003, lon: lon + 0.003, address: "5 Lake Dr", distanceMiles: 2.4 },
      { id: "mock-tar", name: "Target (CVS)", lat: lat + 0.004, lon: lon - 0.003, address: "77 River Rd", distanceMiles: 3.1 },
    ];
    return { list: mock.slice(0, limit), cached: false, mock: true };
  }

    const radius = 5000; // meters (~3.1 mi) adjust as needed
    let legacyError = null;
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=pharmacy&language=${encodeURIComponent(lang)}&key=${apiKey}`;
      console.log(`Places API (legacy) fetch: lat=${lat.toFixed(4)} lon=${lon.toFixed(4)} lang=${lang} limit=${limit}`);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Places API HTTP ${resp.status}`);
      const json = await resp.json();
      console.log('Places API (legacy) status:', json.status, 'results:', json.results?.length);
      if (json.status === 'OK' || json.status === 'ZERO_RESULTS') {
        const places = (json.results || []).slice(0, limit).map(p => {
          const plat = p.geometry?.location?.lat;
          const plon = p.geometry?.location?.lng;
          const dist = (plat && plon) ? haversineMi(lat, lon, plat, plon) : null;
          return {
            id: p.place_id,
            name: p.name,
            lat: plat,
            lon: plon,
            address: p.vicinity || p.formatted_address || '',
            distanceMiles: dist ? Number(dist.toFixed(2)) : undefined,
            logoUrl: null,
          };
        });
        if (useCache) pharmacyCache.set(key, { data: places, ts: now });
        return { list: places, cached: false, mock: false, apiVersion: 'legacy', legacyStatus: json.status };
      } else {
        legacyError = json.status;
      }
    } catch (e) {
      legacyError = e.message;
    }

    // Fallback to Places API (New) if legacy failed & new might be enabled.
    try {
      console.log('Attempting Places API (New) fallback. Legacy error:', legacyError);
      const body = {
        includedTypes: ['pharmacy'],
        maxResultCount: Math.min(limit, 20),
        languageCode: lang,
        locationRestriction: { circle: { center: { latitude: lat, longitude: lon }, radius: radius * 1.0 } },
      };
      const newResp = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.formattedAddress'
        },
        body: JSON.stringify(body)
      });
      if (!newResp.ok) throw new Error(`New Places HTTP ${newResp.status}`);
      const j = await newResp.json();
      const placesArr = (j.places || []).map(p => {
        const plat = p.location?.latitude;
        const plon = p.location?.longitude;
        const dist = (plat && plon) ? haversineMi(lat, lon, plat, plon) : null;
        return {
          id: p.id,
          name: p.displayName?.text || 'Unknown',
          lat: plat,
          lon: plon,
          address: p.formattedAddress || '',
          distanceMiles: dist ? Number(dist.toFixed(2)) : undefined,
          logoUrl: null,
        };
      });
      console.log('Places API (New) results:', placesArr.length);
      if (useCache) pharmacyCache.set(key, { data: placesArr, ts: now });
      return { list: placesArr.slice(0, limit), cached: false, mock: false, apiVersion: 'new', legacyError };
    } catch (e2) {
      console.error('Places API (New) fallback failed:', e2.message);
      throw new Error('places_failed');
    }
}

// Deterministic pseudo-price generator (stable across requests for same id+med)
function genPrice(pharmacyId, medName) {
  const seed = [...(pharmacyId + medName)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = 15 + (seed % 30); // $15 - $44
  return Number((base + (seed % 7) * 0.25).toFixed(2));
}

// GET /pharmacies/nearby?lat=..&lon=..&limit=10&lang=es
app.get('/pharmacies/nearby', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const limit = req.query.limit ? Math.min(25, parseInt(req.query.limit, 10) || 10) : 10;
  const lang = typeof req.query.lang === 'string' ? req.query.lang : 'en';
  const noCache = req.query.noCache === '1';
  const brandsParam = typeof req.query.brands === 'string' ? req.query.brands : '';
  const brandList = brandsParam.split(',').map(s=>s.trim()).filter(Boolean).slice(0,6); // cap brand searches
  if (Number.isNaN(lat) || Number.isNaN(lon)) return res.status(400).json({ ok: false, error: 'bad_coords' });
  try {
    let { list, mock, cached } = await fetchNearbyPharmacies(lat, lon, limit, lang, { useCache: !noCache });

    // --- Optional brand enrichment (text search) ---
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const addedBrands = [];
    if (apiKey && !mock && list.length < limit && brandList.length) {
      for (const brand of brandList) {
        if (list.length >= limit) break;
        try {
          const query = encodeURIComponent(`${brand} pharmacy`);
          const radius = 5000;
          const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&location=${lat},${lon}&radius=${radius}&type=pharmacy&language=${encodeURIComponent(lang)}&key=${apiKey}`;
          const resp = await fetch(url);
          if (!resp.ok) throw new Error('brand_http_'+resp.status);
          const json = await resp.json();
          const existingIds = new Set(list.map(p=>p.id));
            const toAdd = [];
          for (const r of (json.results||[])) {
            if (toAdd.length + list.length >= limit) break;
            if (existingIds.has(r.place_id)) continue;
            const plat = r.geometry?.location?.lat;
            const plon = r.geometry?.location?.lng;
            if (typeof plat !== 'number' || typeof plon !== 'number') continue;
            const dist = haversineMi(lat, lon, plat, plon);
            toAdd.push({
              id: r.place_id,
              name: r.name,
              lat: plat,
              lon: plon,
              address: r.vicinity || r.formatted_address || '',
              distanceMiles: Number(dist.toFixed(2)),
              logoUrl: null,
            });
          }
          if (toAdd.length) {
            list = list.concat(toAdd);
            addedBrands.push({ brand, added: toAdd.length });
          }
        } catch (e) {
          console.warn('Brand search failed', brand, e.message);
        }
      }
    }

  // Ensure deterministic ordering (distance ascending) before slicing so client price sorting starts consistent
  list.sort((a,b)=> (a.distanceMiles||0) - (b.distanceMiles||0));
  res.json({ ok: true, pharmacies: list.slice(0, limit), meta: { mock, cached, count: list.length, addedBrands } });
  } catch (e) {
    console.error('nearby error', e.message);
    res.status(500).json({ ok: false, error: 'nearby_failed' });
  }
});

// POST /pharmacies/prices { medication: { name, dosage }, pharmacies: [{id,...}] }
app.post('/pharmacies/prices', async (req, res) => {
  const { medication, pharmacies, currency } = req.body || {};
  if (!medication?.name || !Array.isArray(pharmacies)) return res.status(400).json({ ok: false, error: 'bad_request' });
  try {
    const usdList = pharmacies.map(p => ({
      ...p,
      priceUSD: genPrice(p.id, medication.name),
      pickup: true,
      delivery: (p.id.charCodeAt(0) % 2) === 0,
      requiresCoupon: (p.id.charCodeAt(1) % 3) === 0,
    }));
    await refreshFxRates();
    const target = (typeof currency === 'string' && currency.toUpperCase()) || 'USD';
    const rate = fxRates.rates[target] || 1;
    const prices = usdList.map(p => ({
      ...p,
      price: Number((p.priceUSD * rate).toFixed(2)),
      currency: target,
      baseUSD: p.priceUSD,
      fxApplied: rate !== 1
    }));
    res.json({ ok: true, prices, meta: { currency: target, rate, fxTs: fxRates.ts } });
  } catch (e) {
    console.error('prices error', e.message);
    res.status(500).json({ ok: false, error: 'prices_failed' });
  }
});

// --- Debug: environment presence (no secrets) ---
app.get('/debug/env', (req, res) => {
  res.json({
    ok: true,
    env: {
      hasPlacesKey: !!process.env.GOOGLE_PLACES_API_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      model: process.env.MODEL || null,
      node: process.version,
      fx: { ts: fxRates.ts, currencies: Object.keys(fxRates.rates || {}).length }
    }
  });
});

// Debug: list registered routes
app.get('/debug/routes', (req, res) => {
  try {
    const routes = [];
    app._router.stack.forEach(layer => {
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods).filter(m => layer.route.methods[m]).map(m => m.toUpperCase());
        routes.push({ path: layer.route.path, methods });
      }
    });
    res.json({ ok: true, routes });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- Debug: raw Places call (no cache) returns provider status ---
app.get('/debug/places', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const lang = typeof req.query.lang === 'string' ? req.query.lang : 'en';
  if (Number.isNaN(lat) || Number.isNaN(lon)) return res.status(400).json({ ok: false, error: 'bad_coords' });
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return res.json({ ok: true, mock: true, reason: 'no_api_key' });
  try {
    const radius = 5000;
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=pharmacy&language=${encodeURIComponent(lang)}&key=${apiKey}`;
    console.log('[debug/places] URL', url.replace(apiKey, '***KEY***'));
    const resp = await fetch(url);
    const json = await resp.json();
    res.json({ ok: true, providerStatus: json.status, resultCount: json.results?.length || 0, sample: (json.results||[]).slice(0,2).map(r=>({ name: r.name, place_id: r.place_id })) });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'fetch_failed', message: e.message });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

// Test endpoint to verify tool calling setup
app.post('/test-tools', async (req, res) => {
  console.log('Test tools endpoint called with:', req.body);
  const { userData } = req.body || {};
  
  try {
    const testMessage = "What medications am I taking?";
    const messages = [
      {
        role: 'system',
        content: [
          'You are a **personal health assistant**.',
          'The only personal info you can use is content **shared in this chat** (tool outputs or user messages).',
          'Never say "I can\'t access your personal records." Instead say "From your dashboard data I see…"',
          'If a list is empty, say so and suggest what the user might add.',
          'Give helpful, non-diagnostic guidance and include brief safety notes when appropriate.'
        ].join(' ')
      },
      { role: 'user', content: testMessage }
    ];

    // Tool calling loop
    while (true) {
      const completion = await client.chat.completions.create({
        model: process.env.MODEL || 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.2
      });

      const msg = completion.choices[0].message;
      console.log('AI response:', msg);

      // If the model asks to call a tool, satisfy it from user data
      if (msg.tool_calls?.length) {
        console.log('AI wants to call tools:', msg.tool_calls);
        for (const call of msg.tool_calls) {
          let payload = null;
          switch (call.function.name) {
            case "get_medications":
              payload = userData?.meds || [];
              console.log('Returning medications:', payload);
              break;
            case "get_supplements":
              payload = userData?.supplements || [];
              console.log('Returning supplements:', payload);
              break;
            case "get_reminders":
              payload = userData?.reminders || [];
              console.log('Returning reminders:', payload);
              break;
            case "get_herbs":
              payload = userData?.herbs || [];
              console.log('Returning herbs:', payload);
              break;
            default:
              payload = { error: "unknown tool" };
          }

          messages.push({
            role: "tool",
            tool_call_id: call.id,
            name: call.function.name,
            content: JSON.stringify(payload)
          });
        }
        // loop again with the tool outputs appended
        continue;
      }

      // Final answer
      const text = msg.content?.trim() || '';
      res.json({ ok: true, reply: text, toolCalls: msg.tool_calls?.length || 0 });
      return;
    }
  } catch (err) {
    console.error('Test tools error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Define tools for the AI to call
const tools = [
  {
    type: "function",
    function: {
      name: "get_medications",
      description: "Return the signed-in user's active medication list from the app's state.",
      parameters: { type: "object", properties: {}, additionalProperties: false }
    }
  },
  {
    type: "function",
    function: {
      name: "get_supplements",
      description: "Return the user's active supplements from the app's state.",
      parameters: { type: "object", properties: {}, additionalProperties: false }
    }
  },
  {
    type: "function",
    function: {
      name: "get_reminders",
      description: "Return upcoming health-related reminders.",
      parameters: { type: "object", properties: {}, additionalProperties: false }
    }
  },
  {
    type: "function",
    function: {
      name: "get_herbs",
      description: "Return the user's herbal remedies and supplements.",
      parameters: { type: "object", properties: {}, additionalProperties: false }
    }
  }
];

app.post('/ask', async (req, res) => {
console.log('POST /ask', req.body);
  try {
    const schema = z.object({ 
      message: z.string().min(1).max(10000),
      userData: z.object({
        meds: z.array(z.any()).optional().default([]),
        supplements: z.array(z.any()).optional().default([]),
        reminders: z.array(z.any()).optional().default([]),
        herbs: z.array(z.any()).optional().default([])
      }).optional().default({})
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      console.log('Schema validation failed:', parsed.error);
      return res.status(400).json({ ok: false, error: 'bad_request', details: parsed.error });
    }

    const { message, userData } = parsed.data;
    const messages = [
      {
        role: 'system',
        content: [
          'You are a **personal health assistant**.',
          'The only personal info you can use is content **shared in this chat** (tool outputs or user messages).',
          'Never say "I can\'t access your personal records." Instead say "From your dashboard data I see…"',
          'If a list is empty, say so and suggest what the user might add.',
          'Give helpful, non-diagnostic guidance and include brief safety notes when appropriate.'
        ].join(' ')
      },
      { role: 'user', content: message }
    ];

    // Tool calling loop
    let loopCount = 0;
    const maxLoops = 5; // Prevent infinite loops
    
    while (loopCount < maxLoops) {
      loopCount++;
      console.log(`Tool calling loop iteration ${loopCount}`);
      
      const completion = await client.chat.completions.create({
        model: process.env.MODEL || 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.2
      });

      const msg = completion.choices[0].message;
      console.log('AI response:', { content: msg.content, tool_calls: msg.tool_calls?.length || 0 });

      // If the model asks to call a tool, satisfy it from user data
      if (msg.tool_calls?.length) {
        console.log('AI wants to call tools:', msg.tool_calls.map(tc => tc.function.name));
        for (const call of msg.tool_calls) {
          let payload = null;
          switch (call.function.name) {
            case "get_medications":
              payload = userData.meds || [];
              console.log('Returning medications:', payload.length, 'items');
              break;
            case "get_supplements":
              payload = userData.supplements || [];
              console.log('Returning supplements:', payload.length, 'items');
              break;
            case "get_reminders":
              payload = userData.reminders || [];
              console.log('Returning reminders:', payload.length, 'items');
              break;
            case "get_herbs":
              payload = userData.herbs || [];
              console.log('Returning herbs:', payload.length, 'items');
              break;
            default:
              payload = { error: "unknown tool" };
              console.log('Unknown tool called:', call.function.name);
          }

          messages.push({
            role: "tool",
            tool_call_id: call.id,
            name: call.function.name,
            content: JSON.stringify(payload)
          });
        }
        // loop again with the tool outputs appended
        continue;
      }

      // Final answer
      const text = msg.content?.trim() || '';
      console.log('Final AI response:', text);
      res.json({ ok: true, reply: text });
      return;
    }
    
    // If we exit the loop without a response
    console.log('Tool calling loop exceeded max iterations');
    res.json({ ok: true, reply: "I'm having trouble processing your request. Please try again." });
  } catch (err) {
    console.error('OpenAI error:', err?.response?.data || err?.message);
    res.status(500).json({ ok: false, error: 'openai_error' });
  }
  } catch (outerErr) {
    console.error('Outer error in /ask endpoint:', outerErr);
    res.status(500).json({ ok: false, error: 'server_error', message: outerErr.message });
  }
});

// --- Streaming endpoint (token-by-token) ---
// POST /ask-stream { messages?: [{role, content}], message?: string }
// Sends back raw tokens as they arrive (plain text stream) so client can append.
app.post('/ask-stream', async (req, res) => {
  try {
    // Accept either a full messages array or a single message string
    let { messages, message } = req.body || {};
    if (!Array.isArray(messages)) {
      if (typeof message === 'string' && message.trim()) {
        messages = [
          {
            role: 'system',
            content: [
              'You are a **personal health assistant**.',
              'The only personal info you can use is content **shared in this chat** (tool outputs or user messages).',
              'Never say "I can\'t access your personal records." Instead say "From your dashboard data I see…"',
              'If a list is empty, say so and suggest what the user might add.',
              'Give helpful, non-diagnostic guidance and include brief safety notes when appropriate.'
            ].join(' ')
          },
          { role: 'user', content: message.trim() },
        ];
      } else {
        return res.status(400).json({ ok: false, error: 'bad_request' });
      }
    }

    // Basic validation / trimming
    messages = messages.map(m => ({
      role: m.role === 'user' || m.role === 'assistant' || m.role === 'system' ? m.role : 'user',
      content: (m.content || '').slice(0, 8000),
    }));

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Transfer-Encoding': 'chunked',
    });

    // Kick an initial small chunk so React Native UI shows activity quickly
    res.write('');

    const stream = await client.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.2,
      stream: true,
    });

    let total = '';
    for await (const chunk of stream) {
      const token = chunk?.choices?.[0]?.delta?.content || '';
      if (token) {
        total += token;
        // write raw token; no SSE framing so client just concatenates
        res.write(token);
      }
    }
    res.end();
  } catch (err) {
    console.error('stream error', err);
    // Best-effort error emit; client can detect and show a message
    try { res.write('\n[STREAM_ERROR]\n'); } catch {}
    try { res.end(); } catch {}
  }
});

app.get('/', (_req, res) => {
  res.send('AuricRx Medcoach API is running ✅');
});

app.listen(port, () => {
  console.log(`✅ API running on http://localhost:${port}`);
});