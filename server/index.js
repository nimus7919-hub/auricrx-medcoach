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
// Temporarily disable CSP for admin page to fix button functionality
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: "1mb" }));

// --- CORS allowlist ---
const ALLOW_ORIGINS = [
  "https://auricrx-medcoach.onrender.com", // deployed server
  "http://localhost:8081",                 // Expo dev app
  "http://localhost:19006",                // Expo web
  "http://localhost:19000",                // Expo dev tools
  "http://localhost:3000",                 // React dev server
  "http://localhost:8080",                 // Alternative port
  "http://127.0.0.1:8081",                // Alternative localhost
  "http://127.0.0.1:19006",               // Alternative localhost
  // later add your production mobile/web domain
];

// Temporary: Allow all origins for debugging
app.use(cors({
  origin: true, // Allow all origins temporarily
  credentials: true
}));

// Original CORS (commented out for debugging)
/*
app.use(cors({
  origin: function (origin, callback) {
    console.log('CORS request from origin:', origin);
    if (!origin || ALLOW_ORIGINS.includes(origin)) {
      console.log('CORS: Allowing origin:', origin);
      callback(null, true);
    } else {
      console.log('CORS: Blocking origin:', origin);
      callback(new Error("Not allowed by CORS"));
    }
  }
}));
*/

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
      { id: "mock-cvs", name: "CVS Pharmacy", lat: lat + 0.015, lon: lon + 0.015, address: "123 Main St", distanceMiles: 0.8 },
      { id: "mock-wal", name: "Walgreens", lat: lat + 0.025, lon: lon - 0.010, address: "45 Oak Ave", distanceMiles: 1.1 },
      { id: "mock-rite", name: "Rite Aid", lat: lat - 0.020, lon: lon + 0.030, address: "8 Pine Rd", distanceMiles: 1.3 },
      { id: "mock-wmt", name: "Walmart Pharmacy", lat: lat - 0.030, lon: lon - 0.025, address: "220 Market", distanceMiles: 1.9 },
      { id: "mock-cost", name: "Costco Pharmacy", lat: lat + 0.040, lon: lon + 0.035, address: "5 Lake Dr", distanceMiles: 2.4 },
      { id: "mock-tar", name: "Target (CVS)", lat: lat + 0.050, lon: lon - 0.040, address: "77 River Rd", distanceMiles: 3.1 },
    ];
    
    // Calculate actual distances using Haversine formula
    const mockWithDistances = mock.map(pharmacy => {
      const distanceMiles = haversineMi(lat, lon, pharmacy.lat, pharmacy.lon);
      return {
        ...pharmacy,
        distanceMiles: distanceMiles
      };
    });
    
    return { list: mockWithDistances.slice(0, limit), cached: false, mock: true };
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

        // Get actual driving distances using Distance Matrix API
        if (places.length > 0) {
          try {
            const origins = `${lat},${lon}`;
            const destinations = places.map(p => `${p.lat},${p.lon}`).join('|');
            const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=metric&key=${apiKey}`;
            
            console.log('Distance Matrix API call for', places.length, 'pharmacies');
            const distanceResp = await fetch(distanceUrl);
            if (distanceResp.ok) {
              const distanceJson = await distanceResp.json();
              if (distanceJson.status === 'OK' && distanceJson.rows?.[0]?.elements) {
                places.forEach((place, index) => {
                  const element = distanceJson.rows[0].elements[index];
                  if (element.status === 'OK' && element.distance) {
                    // Convert meters to miles
                    const distanceKm = element.distance.value / 1000;
                    const distanceMiles = distanceKm * 0.621371;
                    place.distanceMiles = Number(distanceMiles.toFixed(2));
                    console.log(`📍 ${place.name}: ${distanceKm.toFixed(2)}km (${distanceMiles.toFixed(2)} miles) - driving distance`);
                  }
                });
              }
            }
          } catch (e) {
            console.warn('Distance Matrix API failed, using straight-line distances:', e.message);
          }
        }

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

// Fetch nearby medical laboratories using Google Places API
async function fetchNearbyLabs(lat, lon, limit = 10, lang = 'en', { useCache = true } = {}) {
  const key = `labs:${lat.toFixed(3)}:${lon.toFixed(3)}`;
  const now = Date.now();
  if (useCache) {
    const cached = pharmacyCache.get(key); // Reuse same cache for now
    if (cached && now - cached.ts < PHARMACY_CACHE_TTL_MS) {
      return { list: cached.data.slice(0, limit), cached: true, mock: false };
    }
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn('Nearby labs: no API key present – returning mock data.');
    const mock = [
      { id: "mock-chopo", name: "Laboratorio Chopo", lat: lat + 0.015, lon: lon + 0.015, address: "123 Medical Center Dr", distanceMiles: 0.8 },
      { id: "mock-polanco", name: "Laboratorio Polanco", lat: lat + 0.025, lon: lon - 0.010, address: "456 Healthcare Ave", distanceMiles: 1.2 },
      { id: "mock-salud", name: "Salud Digna", lat: lat - 0.020, lon: lon + 0.030, address: "789 Wellness St", distanceMiles: 1.5 },
      { id: "mock-diagnostico", name: "Centro de Diagnóstico", lat: lat - 0.030, lon: lon - 0.025, address: "321 Diagnostic Blvd", distanceMiles: 2.1 },
      { id: "mock-clinica", name: "Clínica Especializada", lat: lat + 0.040, lon: lon + 0.035, address: "654 Specialty Rd", distanceMiles: 2.8 },
      { id: "mock-radiologia", name: "Centro de Radiología", lat: lat + 0.050, lon: lon - 0.040, address: "987 Imaging Way", distanceMiles: 3.2 },
    ];
    
    // Calculate actual distances using Haversine formula
    const mockWithDistances = mock.map(lab => {
      const distanceMiles = haversineMi(lat, lon, lab.lat, lab.lon);
      return {
        ...lab,
        distanceMiles: distanceMiles
      };
    });
    
    return { list: mockWithDistances.slice(0, limit), cached: false, mock: true };
  }

  const radius = 5000; // meters (~3.1 mi)
  try {
    // Search for medical laboratories and diagnostic centers with Mexican-specific terms
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&keyword=laboratorio clinico,centro diagnostico,laboratorio medico,analisis clinicos,laboratorio chopo,laboratorio polanco,salud digna,laboratorio simi,centro medico,laboratorio&language=${encodeURIComponent(lang)}&key=${apiKey}`;
    console.log(`Labs API fetch: lat=${lat.toFixed(4)} lon=${lon.toFixed(4)} lang=${lang} limit=${limit}`);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Labs API HTTP ${resp.status}`);
    const json = await resp.json();
    console.log('Labs API status:', json.status, 'results:', json.results?.length);
    
    if (json.status === 'OK' || json.status === 'ZERO_RESULTS') {
      let labs = (json.results || []).slice(0, limit).map(p => {
        const plat = p.geometry?.location?.lat;
        const plon = p.geometry?.location?.lng;
        const dist = (plat && plon) ? haversineMi(lat, lon, plat, plon) : null;
        return {
          id: p.place_id,
          name: p.name,
          lat: plat,
          lon: plon,
          address: p.vicinity || p.formatted_address || 'Address not available',
          distanceMiles: dist,
          rating: p.rating,
          phone: p.formatted_phone_number,
          website: p.website,
          openingHours: p.opening_hours?.weekday_text,
          logoUrl: null
        };
      }).filter(lab => lab.lat && lab.lon); // Only include labs with valid coordinates
      
      // If no labs found with Spanish terms, try English terms as fallback
      if (labs.length === 0) {
        console.log('No labs found with Spanish terms, trying English fallback...');
        try {
          const fallbackUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&keyword=medical laboratory,diagnostic center,clinical lab,blood test,imaging center,pathology lab&language=${encodeURIComponent(lang)}&key=${apiKey}`;
          const fallbackResp = await fetch(fallbackUrl);
          if (fallbackResp.ok) {
            const fallbackJson = await fallbackResp.json();
            console.log('Fallback labs API status:', fallbackJson.status, 'results:', fallbackJson.results?.length);
            if (fallbackJson.status === 'OK' && fallbackJson.results?.length > 0) {
              labs = (fallbackJson.results || []).slice(0, limit).map(p => {
                const plat = p.geometry?.location?.lat;
                const plon = p.geometry?.location?.lng;
                const dist = (plat && plon) ? haversineMi(lat, lon, plat, plon) : null;
                return {
                  id: p.place_id,
                  name: p.name,
                  lat: plat,
                  lon: plon,
                  address: p.vicinity || p.formatted_address || 'Address not available',
                  distanceMiles: dist,
                  rating: p.rating,
                  phone: p.formatted_phone_number,
                  website: p.website,
                  openingHours: p.opening_hours?.weekday_text,
                  logoUrl: null
                };
              }).filter(lab => lab.lat && lab.lon);
            }
          }
        } catch (e) {
          console.warn('Fallback labs search failed:', e.message);
        }
      }
      
      // Get actual driving distances using Distance Matrix API
      if (labs.length > 0) {
        try {
          const origins = `${lat},${lon}`;
          const destinations = labs.map(lab => `${lab.lat},${lab.lon}`).join('|');
          const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=metric&key=${apiKey}`;
          
          console.log('Distance Matrix API call for', labs.length, 'labs');
          const distanceResp = await fetch(distanceUrl);
          if (distanceResp.ok) {
            const distanceJson = await distanceResp.json();
            if (distanceJson.status === 'OK' && distanceJson.rows?.[0]?.elements) {
              labs.forEach((lab, index) => {
                const element = distanceJson.rows[0].elements[index];
                if (element.status === 'OK' && element.distance) {
                  // Convert meters to miles
                  const distanceKm = element.distance.value / 1000;
                  const distanceMiles = distanceKm * 0.621371;
                  lab.distanceMiles = Number(distanceMiles.toFixed(2));
                  console.log(`🧪 ${lab.name}: ${distanceKm.toFixed(2)}km (${distanceMiles.toFixed(2)} miles) - driving distance`);
                }
              });
            }
          }
        } catch (e) {
          console.warn('Distance Matrix API failed for labs, using straight-line distances:', e.message);
        }
      }
      
      console.log('Labs API results:', labs.length);
      if (useCache) pharmacyCache.set(key, { data: labs, ts: now });
      return { list: labs.slice(0, limit), cached: false, mock: false };
    } else {
      throw new Error(`Labs API error: ${json.status}`);
    }
  } catch (e) {
    console.error('Labs API failed:', e.message);
    throw new Error('labs_api_failed');
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

// GET /labs/nearby - Find nearby medical laboratories
app.get('/labs/nearby', async (req, res) => {
  const { lat, lon, limit = 10, lang = 'en' } = req.query;
  if (!lat || !lon) return res.status(400).json({ ok: false, error: 'lat_lon_required' });
  
  try {
    const result = await fetchNearbyLabs(Number(lat), Number(lon), Number(limit), lang);
    res.json({ ok: true, labs: result.list, meta: { mock: result.mock, cached: result.cached, count: result.list.length } });
  } catch (e) {
    console.error('labs nearby error', e.message);
    res.status(500).json({ ok: false, error: 'labs_failed' });
  }
});

// POST /pharmacies/prices { medication: { name, dosage }, pharmacies: [{id,...}] }
app.post('/pharmacies/prices', async (req, res) => {
  const { medication, pharmacies, currency } = req.body || {};
  console.log('🔍 DEBUG: Pharmacy prices API called');
  console.log('🔍 DEBUG: Medication:', medication);
  console.log('🔍 DEBUG: Pharmacies count:', pharmacies?.length);
  console.log('🔍 DEBUG: Currency:', currency);
  
  if (!medication?.name || !Array.isArray(pharmacies)) {
    console.log('❌ DEBUG: Bad request - missing medication or pharmacies');
    return res.status(400).json({ ok: false, error: 'bad_request' });
  }
  
  try {
    // DISABLED: Mock price generation - return "Price not available" instead
    console.log('⚠️ DEBUG: Pharmacy prices API: Returning "Price not available" instead of mock prices');
    console.log('🔍 DEBUG: Processing pharmacies:', pharmacies.map(p => ({ name: p.name, id: p.id })));
    
    const prices = pharmacies.map(p => ({
      ...p,
      price: null, // No price available
      priceNotAvailable: true,
      pickup: true,
      delivery: (p.id.charCodeAt(0) % 2) === 0,
      requiresCoupon: (p.id.charCodeAt(1) % 3) === 0,
    }));
    
    console.log('🔍 DEBUG: Returning prices with priceNotAvailable:', prices.map(p => ({ name: p.name, priceNotAvailable: p.priceNotAvailable })));
    res.json({ ok: true, prices, meta: { currency: currency || 'USD', rate: 1, fxTs: Date.now() } });
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
    const maxLoops = 5;
    
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

      // CRITICAL FIX: Add the AI's message to the messages array FIRST
      messages.push(msg);

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

          // CRITICAL FIX: Add tool response with correct structure
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(payload)
          });
        }
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
    console.error('Error in /ask endpoint:', err);
    console.error('Error stack:', err.stack);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code
    });
    res.status(500).json({ ok: false, error: 'server_error', message: err.message });
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

// --- Medication Data Collection Endpoints ---

// Persistent storage using Neon database
const { 
  saveMedicationContribution, 
  getMedicationContributions 
} = require('./neon');

// Load existing data on startup
let medicationContributions = [];

// Load contributions from Neon on startup
async function loadContributionsFromNeon() {
  try {
    medicationContributions = await getMedicationContributions();
    console.log(`📊 Loaded ${medicationContributions.length} existing contributions from Neon`);
  } catch (error) {
    console.log('⚠️ Could not load contributions from Neon, starting fresh:', error.message);
    medicationContributions = [];
  }
}

// Initialize Neon connection
loadContributionsFromNeon();

// Save data to Neon
async function saveContributions() {
  try {
    console.log(`💾 ${medicationContributions.length} contributions in memory`);
    console.log('📊 Current contributions:', JSON.stringify(medicationContributions, null, 2));
    
    // Data is automatically saved to Neon when new contributions are added
  } catch (error) {
    console.error('❌ Failed to save contributions:', error);
  }
}

// POST /medication-contributions - Save a new medication contribution
app.post('/medication-contributions', async (req, res) => {
  try {
    const { 
      medicationName, 
      strength, 
      price, 
      quantity, 
      storeName, 
      storeAddress, 
      pharmacyId, 
      userLocation, 
      currency 
    } = req.body || {};

    // Validate required fields
    if (!medicationName || !price || !storeName) {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_required_fields',
        message: 'Medication name, price, and store name are required'
      });
    }

    // Create contribution object
    const contribution = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      medicationName: medicationName.trim(),
      strength: (strength || '').trim(),
      price: parseFloat(price) || 0,
      quantity: (quantity || '').trim(),
      storeName: storeName.trim(),
      storeAddress: (storeAddress || '').trim(),
      pharmacyId: pharmacyId || '',
      userLocation: userLocation || null,
      currency: currency || 'USD',
      verified: false,
      source: 'user_contribution'
    };

    // Save to Neon database
    const savedContribution = await saveMedicationContribution(contribution);
    
    // Add to local cache
    medicationContributions.push(savedContribution);

    console.log('📊 New medication contribution saved:', {
      id: contribution.id,
      medication: contribution.medicationName,
      price: contribution.price,
      store: contribution.storeName
    });

    res.json({ 
      ok: true, 
      contribution,
      message: 'Contribution saved successfully'
    });

  } catch (error) {
    console.error('❌ Failed to save medication contribution:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'save_failed',
      message: 'Failed to save contribution'
    });
  }
});

// GET /medication-contributions - Get all contributions with optional filtering
app.get('/medication-contributions', async (req, res) => {
  try {
    const { 
      search, 
      medication, 
      store, 
      verified, 
      limit = 100, 
      offset = 0 
    } = req.query;

    // Get contributions from Neon
    const filteredContributions = await getMedicationContributions({
      search,
      medication,
      store,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined
    });

    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedContributions = filteredContributions.slice(startIndex, endIndex);

    // Calculate statistics
    const stats = {
      totalContributions: filteredContributions.length,
      filteredContributions: filteredContributions.length,
      uniqueMedications: [...new Set(filteredContributions.map(c => c.medication_name))].length,
      uniqueStores: [...new Set(filteredContributions.map(c => c.store_name))].length,
      verifiedContributions: filteredContributions.filter(c => c.verified).length,
      averagePrice: filteredContributions.length > 0 
        ? filteredContributions.reduce((sum, c) => sum + parseFloat(c.price), 0) / filteredContributions.length 
        : 0
    };

    res.json({
      ok: true,
      contributions: paginatedContributions,
      statistics: stats,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: filteredContributions.length,
        hasMore: endIndex < filteredContributions.length
      }
    });

  } catch (error) {
    console.error('❌ Failed to get medication contributions:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'retrieve_failed',
      message: 'Failed to retrieve contributions'
    });
  }
});

// GET /medication-contributions/export - Export contributions as CSV
app.get('/medication-contributions/export', async (req, res) => {
  try {
    const { format = 'csv' } = req.query;

    if (format === 'csv') {
      // Create CSV content
      const headers = [
        'ID',
        'Timestamp',
        'Medication Name',
        'Strength/Dosage',
        'Price',
        'Quantity',
        'Store Name',
        'Store Address',
        'Currency',
        'Verified',
        'Source'
      ];

      const rows = medicationContributions.map(contrib => [
        contrib.id,
        contrib.timestamp,
        `"${contrib.medicationName}"`,
        `"${contrib.strength}"`,
        contrib.price,
        `"${contrib.quantity}"`,
        `"${contrib.storeName}"`,
        `"${contrib.storeAddress}"`,
        contrib.currency,
        contrib.verified ? 'Yes' : 'No',
        contrib.source
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="medication_contributions_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);

    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="medication_contributions_${new Date().toISOString().split('T')[0]}.json"`);
      res.json(medicationContributions);

    } else {
      res.status(400).json({ 
        ok: false, 
        error: 'invalid_format',
        message: 'Format must be csv or json'
      });
    }

  } catch (error) {
    console.error('❌ Failed to export medication contributions:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'export_failed',
      message: 'Failed to export contributions'
    });
  }
});

// PUT /medication-contributions/:id/verify - Mark a contribution as verified
app.put('/medication-contributions/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const contribution = medicationContributions.find(c => c.id === id);

    if (!contribution) {
      return res.status(404).json({ 
        ok: false, 
        error: 'not_found',
        message: 'Contribution not found'
      });
    }

    contribution.verified = true;
    saveContributions(); // Save changes to file
    console.log(`✅ Contribution ${id} marked as verified`);

    res.json({ 
      ok: true, 
      contribution,
      message: 'Contribution verified successfully'
    });

  } catch (error) {
    console.error('❌ Failed to verify contribution:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'verify_failed',
      message: 'Failed to verify contribution'
    });
  }
});

// DELETE /medication-contributions/:id - Delete a contribution
app.delete('/medication-contributions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const initialLength = medicationContributions.length;
    
    medicationContributions = medicationContributions.filter(c => c.id !== id);

    if (medicationContributions.length === initialLength) {
      return res.status(404).json({ 
        ok: false, 
        error: 'not_found',
        message: 'Contribution not found'
      });
    }

    saveContributions(); // Save changes to file
    console.log(`🗑️ Contribution ${id} deleted`);

    res.json({ 
      ok: true, 
      message: 'Contribution deleted successfully'
    });

  } catch (error) {
    console.error('❌ Failed to delete contribution:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'delete_failed',
      message: 'Failed to delete contribution'
    });
  }
});

// DELETE /medication-contributions - Clear all contributions (admin only)
app.delete('/medication-contributions', async (req, res) => {
  try {
    const count = medicationContributions.length;
    medicationContributions = [];
    saveContributions(); // Save changes to file
    
    console.log(`🗑️ All ${count} contributions cleared`);

    res.json({ 
      ok: true, 
      message: `All ${count} contributions cleared successfully`
    });

  } catch (error) {
    console.error('❌ Failed to clear contributions:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'clear_failed',
      message: 'Failed to clear contributions'
    });
  }
});

app.get('/', (_req, res) => {
  res.send('AuricRx Medcoach API is running ✅ - Medication endpoints available! - v2.1');
});

// Debug route to test if new code is deployed
app.get('/debug', (_req, res) => {
  res.json({ 
    message: 'Debug endpoint working!', 
    timestamp: new Date().toISOString(),
    routes: ['/medication-contributions', '/medication-contributions/export']
  });
});

// Admin interface for viewing medication contributions
app.get('/admin', (_req, res) => {
  res.sendFile(__dirname + '/admin.html');
});

// Debug endpoint to check file storage
app.get('/debug/storage', (_req, res) => {
  res.json({
    ok: true,
    contributionsCount: medicationContributions.length,
    dataFile: DATA_FILE,
    fileExists: require('fs').existsSync(DATA_FILE),
    sampleContributions: medicationContributions.slice(0, 2)
  });
});

app.listen(port, () => {
  console.log(`✅ API running on http://localhost:${port}`);
});