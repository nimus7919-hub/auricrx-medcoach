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

// Function to get detailed place information using Google Places API (New) - Place Details
async function getPlaceDetails(placeId, apiKey) {
  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    
    console.log('🔍 Places API (New) - Place Details for:', placeId);
    console.log('🌐 Places API (New) Place Details Endpoint:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,nationalPhoneNumber,internationalPhoneNumber,websiteUri,rating,regularOpeningHours'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Place Details API HTTP Error:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Place Details API HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('📥 Places API (New) - Place Details Response:', {
      apiName: 'Places API (New)',
      endpoint: 'Place Details',
      place_id: placeId,
      name: data.displayName?.text,
      nationalPhoneNumber: data.nationalPhoneNumber,
      internationalPhoneNumber: data.internationalPhoneNumber,
      websiteUri: data.websiteUri,
      rating: data.rating,
      hasPhoneNumber: !!(data.nationalPhoneNumber || data.internationalPhoneNumber),
      fullResponse: data
    });
    
    if (data) {
      return {
        phone: data.nationalPhoneNumber || data.internationalPhoneNumber,
        website: data.websiteUri,
        rating: data.rating,
        openingHours: data.regularOpeningHours?.weekdayDescriptions
      };
    }
    
    return { phone: null, website: null, rating: null, openingHours: null };
  } catch (error) {
    console.error('❌ Place Details API failed:', error.message);
    return { phone: null, website: null, rating: null, openingHours: null };
  }
}

async function fetchNearbyPharmacies(lat, lon, limit = 10, lang = 'en', { useCache = true } = {}) {
  console.log('🚀 STARTING fetchNearbyPharmacies:', { lat, lon, limit, lang, useCache });
  console.log('🔥 THIS IS THE PHARMACY SEARCH FUNCTION - IF YOU SEE THIS, THE SERVER IS WORKING!');
  const key = `${lat.toFixed(3)}:${lon.toFixed(3)}`;
  const now = Date.now();
  if (useCache) {
    const cached = pharmacyCache.get(key);
    if (cached && now - cached.ts < PHARMACY_CACHE_TTL_MS) {
      console.log('📦 Using cached pharmacy data');
      return { list: cached.data.slice(0, limit), cached: true, mock: false };
    }
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  console.log('🔑 API Key status:', apiKey ? 'Present' : 'Missing');
  console.log('🔑 API Key value (first 10 chars):', apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING');
  if (!apiKey) {
    console.warn('❌ Nearby pharmacies: no API key present – returning mock data.');
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
      console.log('🔍 SKIPPING Legacy Places API (nearbysearch) - Using Places API (New) only');
      console.log(`📍 Legacy Places API URL: ${url}`);
      console.log('🔥 SKIPPING LEGACY API - GOING STRAIGHT TO PLACES API (NEW)!');
      console.log(`Places API (legacy) fetch: lat=${lat.toFixed(4)} lon=${lon.toFixed(4)} lang=${lang} limit=${limit}`);
      // Skip legacy API entirely - go straight to Places API (New)
      throw new Error('SKIP_LEGACY_API');
      if (json.status === 'OK' || json.status === 'ZERO_RESULTS') {
        const places = (json.results || []).slice(0, limit).map(p => {
          const plat = p.geometry?.location?.lat;
          const plon = p.geometry?.location?.lng;
          const dist = (plat && plon) ? haversineMi(lat, lon, plat, plon) : null;
          
          // Debug logging for pharmacy data
          console.log('🔍 Pharmacy API Response DEBUG:', {
            name: p.name,
            formatted_phone_number: p.formatted_phone_number,
            website: p.website,
            rating: p.rating,
            vicinity: p.vicinity,
            formatted_address: p.formatted_address,
            place_id: p.place_id,
            fullPlaceObject: p
          });
          
          return {
            id: p.place_id,
            name: p.name,
            lat: plat,
            lon: plon,
            address: p.vicinity || p.formatted_address || '',
            distanceMiles: dist ? Number(dist.toFixed(2)) : undefined,
            phone: p.formatted_phone_number, // This will be null from nearbysearch
            website: p.website, // This will be null from nearbysearch
            rating: p.rating, // This will be null from nearbysearch
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
                    // Distance Matrix API returns distance in meters when units=metric
                    // Convert meters to kilometers, then kilometers to miles
                    const distanceMeters = element.distance.value;
                    const distanceKm = distanceMeters / 1000;
                    const distanceMiles = distanceKm * 0.621371; // Convert KM to Miles
                    place.distanceMiles = Number(distanceMiles.toFixed(2));
                    console.log(`📍 ${place.name}: ${distanceMeters}m = ${distanceKm.toFixed(2)}km = ${distanceMiles.toFixed(2)} miles - driving distance`);
                  }
                });
              }
            }
          } catch (e) {
            console.warn('Distance Matrix API failed, using straight-line distances:', e.message);
          }
        }

        // Fetch detailed information for each place using Place Details API
        console.log('🔍 Fetching place details for', places.length, 'pharmacies...');
        const placesWithDetails = await Promise.all(places.map(async (place) => {
          const details = await getPlaceDetails(place.id, apiKey);
          return {
            ...place,
            phone: details.phone,
            website: details.website,
            rating: details.rating,
            openingHours: details.openingHours
          };
        }));
        
        console.log('🔍 Final pharmacy data with details:', placesWithDetails.map(p => ({
          name: p.name,
          phone: p.phone,
          website: p.website,
          rating: p.rating
        })));

      console.log('✅ SUCCESS: Legacy Places API completed');
      console.log('📊 Final Results:', {
        apiName: 'Legacy Places API',
        apiVersion: 'legacy',
        placesCount: placesWithDetails.length,
        withPhoneNumbers: placesWithDetails.filter(p => p.phone).length,
        withWebsites: placesWithDetails.filter(p => p.website).length,
        withRatings: placesWithDetails.filter(p => p.rating).length
      });

        if (useCache) pharmacyCache.set(key, { data: placesWithDetails, ts: now });
        return { list: placesWithDetails, cached: false, mock: false, apiVersion: 'legacy', legacyStatus: json.status };
      } else {
        legacyError = json.status;
      }
    } catch (e) {
      legacyError = e.message;
    }

    // Fallback to Places API (New) if legacy failed & new might be enabled.
    try {
      console.log('🔄 ATTEMPTING Places API (New) - searchNearby (PRIMARY METHOD)');
      console.log('❌ Legacy error:', legacyError);
      console.log('🔥 CALLING PLACES API (NEW) - IF YOU SEE THIS, THE SERVER IS WORKING!');
      const body = {
        includedTypes: ['pharmacy'],
        maxResultCount: Math.min(limit, 20),
        languageCode: lang,
        locationRestriction: { circle: { center: { latitude: lat, longitude: lon }, radius: radius * 1.0 } },
      };
      console.log('📡 Places API (New) Request Body:', JSON.stringify(body, null, 2));
      console.log('📡 Places API (New) Headers (BASIC DATA ONLY - NO CONTACT FIELDS):', {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey ? 'Present' : 'Missing',
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating'
      });
      console.log('🌐 Places API (New) Endpoint: https://places.googleapis.com/v1/places:searchNearby');
      
      const newResp = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating'
        },
        body: JSON.stringify(body)
      });
      if (!newResp.ok) throw new Error(`New Places HTTP ${newResp.status}`);
      const j = await newResp.json();
      console.log('📥 Places API (New) Response (BASIC DATA ONLY):', {
        apiName: 'Places API (New)',
        endpoint: 'searchNearby',
        status: 'Success',
        placesCount: j.places?.length || 0,
        firstPlace: j.places?.[0] ? {
          id: j.places[0].id,
          name: j.places[0].displayName?.text,
          address: j.places[0].formattedAddress,
          rating: j.places[0].rating
        } : null
      });
      
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
          rating: p.rating,
          logoUrl: null,
        };
      });

      // Get actual driving distances using Distance Matrix API (low cost)
      if (placesArr.length > 0) {
        try {
          console.log('🗺️ Fetching driving distances using Distance Matrix API...');
          console.log('🗺️ Number of pharmacies to calculate:', placesArr.length);
          const origins = `${lat},${lon}`;
          const destinations = placesArr.map(p => `${p.lat},${p.lon}`).join('|');
          const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=metric&key=${apiKey}`;
          console.log('🗺️ Distance Matrix API URL:', distUrl.replace(apiKey, 'API_KEY_HIDDEN'));
          const distResp = await fetch(distUrl);
          console.log('🗺️ Distance Matrix API response status:', distResp.status);
          
          if (distResp.ok) {
            const distanceJson = await distResp.json();
            console.log('🗺️ Distance Matrix API status:', distanceJson.status);
            console.log('🗺️ Distance Matrix API rows:', distanceJson.rows?.length || 0);
            
            if (distanceJson.status === 'OK' && distanceJson.rows?.[0]?.elements) {
              console.log('🗺️ Distance Matrix API elements:', distanceJson.rows[0].elements.length);
              placesArr.forEach((place, index) => {
                const element = distanceJson.rows[0].elements[index];
                console.log(`🗺️ Processing ${place.name}: element status = ${element.status}`);
                if (element.status === 'OK' && element.distance) {
                  // Distance Matrix API returns distance in meters when units=metric
                  const distanceMeters = element.distance.value;
                  const distanceKm = distanceMeters / 1000;
                  const distanceMiles = distanceKm * 0.621371; // Convert KM to Miles
                  const oldDistance = place.distanceMiles;
                  place.distanceMiles = Number(distanceMiles.toFixed(2));
                  console.log(`📍 ${place.name}: ${oldDistance} mi (straight-line) → ${distanceMeters}m = ${distanceKm.toFixed(2)}km = ${distanceMiles.toFixed(2)} mi (driving)`);
                } else {
                  console.warn(`⚠️ ${place.name}: Distance element status = ${element.status}, keeping straight-line distance`);
                }
              });
            } else {
              console.warn('⚠️ Distance Matrix API returned status:', distanceJson.status, '- using straight-line distances');
            }
          } else {
            const errorText = await distResp.text();
            console.warn('⚠️ Distance Matrix API failed with status:', distResp.status, 'Error:', errorText);
          }
        } catch (e) {
          console.warn('⚠️ Distance Matrix API error:', e.message, '- using straight-line distances');
        }
      }

      // REMOVED: Place Details API calls to save costs
      // We only use basic data from searchNearby (name, address, location, rating)
      console.log('💰 Skipping Place Details API calls to save costs');
      console.log('📊 Final pharmacy data (BASIC DATA ONLY):', placesArr.slice(0, 3).map(p => ({
        name: p.name,
        address: p.address,
        distance: p.distanceMiles,
        rating: p.rating
      })));

      console.log('✅ SUCCESS: Places API (New) completed (PRIMARY METHOD - BASIC DATA ONLY)');
      console.log('📊 Final Results:', {
        apiName: 'Places API (New)',
        apiVersion: 'new',
        method: 'PRIMARY',
        dataType: 'BASIC (no contact fields)',
        placesCount: placesArr.length,
        withRatings: placesArr.filter(p => p.rating).length
      });
      
      console.log('Places API (New) results:', placesArr.length);
      if (useCache) pharmacyCache.set(key, { data: placesArr, ts: now });
      return { list: placesArr.slice(0, limit), cached: false, mock: false, apiVersion: 'new' };
    } catch (e2) {
      console.error('Places API (New) fallback failed:', e2.message);
      throw new Error('places_failed');
    }
}

// Fetch nearby medical laboratories using Google Places API
async function fetchNearbyLabs(lat, lon, limit = 10, lang = 'en', { useCache = true } = {}) {
  console.log('🧪 STARTING fetchNearbyLabs:', { lat, lon, limit, lang, useCache });
  console.log('🔥 THIS IS THE LABS SEARCH FUNCTION - IF YOU SEE THIS, THE SERVER IS WORKING!');
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
  
  // Skip legacy API and use Places API (New) directly
  try {
    console.log('🔄 ATTEMPTING Places API (New) for labs - searchNearby (PRIMARY METHOD)');
    console.log('🔥 CALLING PLACES API (NEW) FOR LABS!');
    
    const body = {
      includedTypes: ['medical_lab', 'hospital'], // Using new API types for labs
      maxResultCount: Math.min(limit, 20),
      languageCode: lang,
      locationRestriction: { circle: { center: { latitude: lat, longitude: lon }, radius: radius * 1.0 } },
    };
    
    console.log('📡 Places API (New) Request Body for Labs:', JSON.stringify(body, null, 2));
    console.log('📡 Places API (New) Headers (BASIC DATA ONLY - NO CONTACT FIELDS):', {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey ? 'Present' : 'Missing',
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating'
    });
    console.log('🌐 Places API (New) Endpoint: https://places.googleapis.com/v1/places:searchNearby');
    
    const newResp = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating'
      },
      body: JSON.stringify(body)
    });
    
    if (!newResp.ok) throw new Error(`Labs Places API (New) HTTP ${newResp.status}`);
    const json = await newResp.json();
    console.log('📥 Places API (New) Response for Labs (BASIC DATA ONLY):', {
      apiName: 'Places API (New)',
      endpoint: 'searchNearby',
      status: 'Success',
      placesCount: json.places?.length || 0,
      firstPlace: json.places?.[0] ? {
        id: json.places[0].id,
        name: json.places[0].displayName?.text,
        address: json.places[0].formattedAddress,
        rating: json.places[0].rating
      } : null
    });
    
    // Parse Places API (New) format for labs
    const labsArr = (json.places || []).map(p => {
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
        rating: p.rating,
        logoUrl: null,
      };
    });

    // Get actual driving distances using Distance Matrix API (low cost)
    if (labsArr.length > 0) {
      try {
        console.log('🗺️ Fetching driving distances for labs using Distance Matrix API...');
        console.log('🗺️ Number of labs to calculate:', labsArr.length);
        const origins = `${lat},${lon}`;
        const destinations = labsArr.map(lab => `${lab.lat},${lab.lon}`).join('|');
          const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=metric&key=${apiKey}`;
          console.log('🗺️ Distance Matrix API URL:', distanceUrl.replace(apiKey, 'API_KEY_HIDDEN'));
          
          const distanceResp = await fetch(distanceUrl);
          console.log('🗺️ Distance Matrix API response status:', distanceResp.status);
          
          if (distanceResp.ok) {
            const distanceJson = await distanceResp.json();
            console.log('🗺️ Distance Matrix API status:', distanceJson.status);
            console.log('🗺️ Distance Matrix API rows:', distanceJson.rows?.length || 0);
            
            if (distanceJson.status === 'OK' && distanceJson.rows?.[0]?.elements) {
              console.log('🗺️ Distance Matrix API elements:', distanceJson.rows[0].elements.length);
              labsArr.forEach((lab, index) => {
                const element = distanceJson.rows[0].elements[index];
                console.log(`🗺️ Processing ${lab.name}: element status = ${element.status}`);
                if (element.status === 'OK' && element.distance) {
                  // Distance Matrix API returns distance in meters when units=metric
                  const distanceMeters = element.distance.value;
                  const distanceKm = distanceMeters / 1000;
                  const distanceMiles = distanceKm * 0.621371; // Convert KM to Miles
                  const oldDistance = lab.distanceMiles;
                  lab.distanceMiles = Number(distanceMiles.toFixed(2));
                  console.log(`🧪 ${lab.name}: ${oldDistance} mi (straight-line) → ${distanceMeters}m = ${distanceKm.toFixed(2)}km = ${distanceMiles.toFixed(2)} mi (driving)`);
                } else {
                  console.warn(`⚠️ ${lab.name}: Distance element status = ${element.status}, keeping straight-line distance`);
                }
              });
            } else {
              console.warn('⚠️ Distance Matrix API returned status:', distanceJson.status, '- using straight-line distances');
            }
          } else {
            const errorText = await distanceResp.text();
            console.warn('⚠️ Distance Matrix API failed with status:', distanceResp.status, 'Error:', errorText);
          }
        } catch (e) {
          console.warn('⚠️ Distance Matrix API error:', e.message, '- using straight-line distances');
        }
      }

    // REMOVED: Place Details API calls to save costs
    // We only use basic data from searchNearby (name, address, location, rating)
    console.log('💰 Skipping Place Details API calls for labs to save costs');
    console.log('📊 Final lab data (BASIC DATA ONLY):', labsArr.slice(0, 3).map(l => ({
      name: l.name,
      address: l.address,
      distance: l.distanceMiles,
      rating: l.rating
    })));

    console.log('✅ SUCCESS: Places API (New) completed for labs (PRIMARY METHOD - BASIC DATA ONLY)');
    console.log('📊 Final Results:', {
      apiName: 'Places API (New)',
      apiVersion: 'new',
      dataType: 'BASIC (no contact fields)',
      placesCount: labsArr.length,
      withRatings: labsArr.filter(l => l.rating).length
    });

    console.log('Labs API results:', labsArr.length);
    if (useCache) pharmacyCache.set(key, { data: labsArr, ts: now });
    return { list: labsArr.slice(0, limit), cached: false, mock: false, apiVersion: 'new' };
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
              phone: r.formatted_phone_number,
              website: r.website,
              rating: r.rating,
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
  
  // Debug logging for final pharmacy data being sent to client
  console.log('🔍 Final Pharmacy Data Sent to Client:', list.slice(0, limit).map(p => ({
    name: p.name,
    phone: p.phone,
    website: p.website,
    rating: p.rating,
    address: p.address
  })));
  
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
    
    // Debug logging for final lab data being sent to client
    console.log('🔍 Final Lab Data Sent to Client:', result.list.map(l => ({
      name: l.name,
      phone: l.phone,
      website: l.website,
      rating: l.rating,
      address: l.address
    })));
    
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
  console.log('🔍 DEBUG: Search query:', medication.searchQuery || medication.name);
  console.log('🔍 DEBUG: Quantity unit:', medication.quantityUnit);
  console.log('🔍 DEBUG: Pharmacies count:', pharmacies?.length);
  console.log('🔍 DEBUG: Currency:', currency);
  
  if (!medication?.name || !Array.isArray(pharmacies)) {
    console.log('❌ DEBUG: Bad request - missing medication or pharmacies');
    return res.status(400).json({ ok: false, error: 'bad_request' });
  }
  
  try {
    console.log('🔍 DEBUG: Attempting enhanced medication search...');
    console.log('🔍 DEBUG: Medication:', medication);
    console.log('🔍 DEBUG: Pharmacies count:', pharmacies?.length);
    
    // Try enhanced medication search with Excel data
    try {
      const EnhancedMedicationSearch = require('../services/enhancedMedicationSearch.js');
      console.log('✅ DEBUG: EnhancedMedicationSearch module loaded successfully');
      
      const enhancedSearch = new EnhancedMedicationSearch();
      console.log('✅ DEBUG: EnhancedMedicationSearch instance created');
      
      console.log('🔍 DEBUG: Calling enhanced medication search...');
      const result = await enhancedSearch.searchMedicationPrices(pharmacies, medication, { currency });
      console.log('✅ DEBUG: Enhanced search completed, result:', {
        hasPrices: !!result.prices,
        pricesLength: result.prices?.length,
        hasMeta: !!result.meta
      });
      
      if (result.prices && result.prices.length > 0) {
        console.log(`✅ DEBUG: Enhanced search returned ${result.prices.length} prices`);
        console.log('🔍 DEBUG: Sample prices:', result.prices.slice(0, 3).map(p => ({ 
          name: p.name, 
          price: p.price, 
          priceNotAvailable: p.priceNotAvailable 
        })));
        res.json({ ok: true, prices: result.prices, meta: result.meta || { currency: currency || 'USD', rate: 1, fxTs: Date.now() } });
        return;
      } else {
        console.log('⚠️ DEBUG: Enhanced search returned no prices, falling back to "Price not available"');
      }
    } catch (enhancedError) {
      console.error('❌ DEBUG: Enhanced medication search failed:', enhancedError.message);
      console.error('❌ DEBUG: Enhanced medication search stack:', enhancedError.stack);
      console.log('⚠️ DEBUG: Falling back to "Price not available" due to enhanced search error');
    }
    
    // Fallback: Return "Price not available"
    const prices = pharmacies.map(p => ({
      ...p,
      price: null, // No price available
      priceNotAvailable: true,
      pickup: true,
      delivery: (p.id.charCodeAt(0) % 2) === 0,
      requiresCoupon: (p.id.charCodeAt(1) % 3) === 0,
    }));
    console.log('🔍 DEBUG: Returning fallback prices with priceNotAvailable:', prices.map(p => ({ name: p.name, priceNotAvailable: p.priceNotAvailable })));
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
  getMedicationContributions,
  saveUserProfile,
  getUserProfile,
  saveUserMedication,
  getUserMedications,
  saveUserFastingProfile,
  getUserFastingProfile
} = require('./neon');

// Load existing data on startup
let medicationContributions = [];

// Load contributions from Neon on startup
async function loadContributionsFromNeon() {
  try {
    // Skip loading on startup since we need user_id for data isolation
    // Contributions will be loaded per-user when needed
    console.log('📊 Neon database ready - contributions will be loaded per-user');
    medicationContributions = [];
  } catch (error) {
    console.log('⚠️ Could not initialize Neon connection, starting fresh:', error.message);
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
      currency,
      userId
    } = req.body || {};

    // Validate required fields
    if (!medicationName || !price || !storeName || !userId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_required_fields',
        message: 'Medication name, price, store name, and user ID are required'
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
      userId: userId.trim(),
      verified: false,
      source: 'user_contribution'
    };

    // Save to Neon database
    console.log('📊 Attempting to save contribution to database:', contribution);
    const savedContribution = await saveMedicationContribution(contribution);
    console.log('📊 Successfully saved to database:', savedContribution);
    
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
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      contribution: req.body
    });
    res.status(500).json({ 
      ok: false, 
      error: 'save_failed',
      message: `Failed to save contribution: ${error.message}`
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
      offset = 0,
      userId
    } = req.query;

    // Validate user_id is provided
    if (!userId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'user_id_required',
        message: 'User ID is required for data isolation'
      });
    }

    // Get contributions from Neon for specific user
    const filteredContributions = await getMedicationContributions({
      userId,
      search,
      medication,
      store,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset)
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

// POST /supplement-contributions - Save a new supplement contribution
app.post('/supplement-contributions', async (req, res) => {
  try {
    console.log('📊 POST /supplement-contributions endpoint hit');
    console.log('📊 Request body:', req.body);
    
    const { 
      supplementName, 
      brand, 
      price, 
      quantity, 
      storeName, 
      storeAddress, 
      pharmacyId, 
      currency, 
      userLocation, 
      userId 
    } = req.body;

    console.log('📊 Received supplement contribution:', {
      supplementName,
      brand,
      price,
      quantity,
      storeName,
      userId
    });

    // Validate required fields
    if (!supplementName || !price || !storeName || !userId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_fields',
        message: 'Missing required fields: supplementName, price, storeName, userId'
      });
    }

    const contribution = {
      supplementName: supplementName.trim(),
      brand: brand ? brand.trim() : null,
      price: parseFloat(price) || 0,
      quantity: quantity ? quantity.trim() : null,
      storeName: storeName.trim(),
      storeAddress: storeAddress ? storeAddress.trim() : null,
      pharmacyId: pharmacyId || null,
      currency: currency || 'USD',
      userLocation: userLocation || null,
      userId: userId,
      verified: false,
      source: 'user_contribution',
      createdAt: new Date().toISOString()
    };

    // Save to Neon database
    const savedContribution = await saveSupplementContribution(contribution);
    
    console.log('📊 New supplement contribution saved:', {
      id: savedContribution.id,
      supplement: contribution.supplementName,
      price: contribution.price,
      store: contribution.storeName
    });

    res.json({ 
      ok: true, 
      contribution: savedContribution,
      message: 'Supplement contribution saved successfully'
    });

  } catch (error) {
    console.error('❌ Failed to save supplement contribution:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'save_failed',
      message: 'Failed to save supplement contribution'
    });
  }
});

// GET /supplement-contributions - Get all supplement contributions with optional filtering
app.get('/supplement-contributions', async (req, res) => {
  try {
    const { 
      search, 
      supplement, 
      store, 
      verified, 
      userId,
      limit = 50, 
      offset = 0 
    } = req.query;

    // Get contributions from Neon database
    const filters = {};
    if (search) filters.search = search;
    if (supplement) filters.supplementName = supplement;
    if (store) filters.storeName = store;
    if (verified !== undefined) filters.verified = verified === 'true';
    if (userId) filters.userId = userId;

    const contributions = await getSupplementContributions(filters);

    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedContributions = contributions.slice(startIndex, endIndex);

    res.json({ 
      ok: true, 
      contributions: paginatedContributions,
      total: contributions.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < contributions.length
      }
    });

  } catch (error) {
    console.error('❌ Failed to get supplement contributions:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'retrieve_failed',
      message: 'Failed to retrieve supplement contributions'
    });
  }
});

// --- User Medications Endpoints ---

// POST /api/medications - Save a new user medication
app.post('/api/medications', async (req, res) => {
  try {
    const { 
      userId,
      medicationName, 
      strengthValue, 
      strengthUnit,
      status, 
      times, 
      startDate, 
      endDate, 
      notes, 
      dosesLeft, 
      quantityValue,
      quantityUnit,
      lastRefill 
    } = req.body;

    // Validate required fields
    if (!userId || !medicationName || !status) {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_required_fields',
        message: 'userId, medicationName, and status are required'
      });
    }

    // Prepare medication data
    const medicationData = {
      medicationName: medicationName.trim(),
      strengthValue: strengthValue?.trim() || '',
      strengthUnit: strengthUnit?.trim() || '',
      status: status.trim(),
      times: Array.isArray(times) ? times : [],
      startDate: startDate || null,
      endDate: endDate || null,
      notes: notes?.trim() || '',
      dosesLeft: dosesLeft?.trim() || '',
      quantityValue: quantityValue?.trim() || '',
      quantityUnit: quantityUnit?.trim() || '',
      lastRefill: lastRefill || null,
      isActive: true
    };

    // Save to Neon database
    const savedMedication = await saveUserMedication(userId, medicationData);
    
    console.log('✅ Medication saved successfully:', savedMedication.id);
    
    res.json({ 
      ok: true, 
      medication: savedMedication,
      message: 'Medication saved successfully'
    });
  } catch (error) {
    console.error('❌ Failed to save medication:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'save_failed',
      message: 'Failed to save medication'
    });
  }
});

// GET /api/medications - Get user medications
app.get('/api/medications', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_user_id',
        message: 'userId is required'
      });
    }

    // Get medications from Neon database
    const medications = await getUserMedications(userId);
    
    console.log(`📊 Retrieved ${medications.length} medications for user ${userId}`);
    
    res.json({ 
      ok: true, 
      medications,
      count: medications.length
    });
  } catch (error) {
    console.error('❌ Failed to get medications:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'retrieve_failed',
      message: 'Failed to retrieve medications'
    });
  }
});

// --- Fasting Profile Endpoints ---

// POST /api/fasting-profile - Save user fasting profile
app.post('/api/fasting-profile', async (req, res) => {
  try {
    const { userId, profileData } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_user_id',
        message: 'userId is required' 
      });
    }

    if (!profileData) {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_profile_data',
        message: 'Profile data is required' 
      });
    }

    console.log(`💾 Saving fasting profile for user: ${userId}`);
    const result = await saveUserFastingProfile(userId, profileData);
    
    res.json({ 
      ok: true, 
      message: 'Fasting profile saved successfully',
      profileId: result.id,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    });
  } catch (error) {
    console.error('❌ Error saving fasting profile:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'save_failed',
      message: 'Failed to save fasting profile',
      details: error.message 
    });
  }
});

// GET /api/fasting-profile - Get user fasting profile
app.get('/api/fasting-profile', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_user_id',
        message: 'userId is required' 
      });
    }

    console.log(`📖 Loading fasting profile for user: ${userId}`);
    const profile = await getUserFastingProfile(userId);
    
    res.json({ 
      ok: true, 
      profile: profile,
      found: profile !== null
    });
  } catch (error) {
    console.error('❌ Error loading fasting profile:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'retrieve_failed',
      message: 'Failed to load fasting profile',
      details: error.message 
    });
  }
});

// --- User Profile Endpoints ---

// POST /api/users - Create or update user profile
app.post('/api/users', async (req, res) => {
  try {
    console.log('📝 POST /api/users called with body:', req.body);
    
    const { user_id, first_name, last_name, email, phone, username, country, unique_id, created_at } = req.body;
    
    if (!user_id) {
      console.log('❌ Missing user_id');
      return res.status(400).json({ 
        ok: false, 
        error: 'user_id_required',
        message: 'User ID is required' 
      });
    }
    
    const profileData = {
      first_name,
      last_name,
      email,
      phone,
      username,
      country,
      unique_id,
      created_at
    };
    
    console.log('📊 Profile data to save:', profileData);
    
    const result = await saveUserProfile(user_id, profileData);
    
    console.log('✅ User profile saved to Neon for user:', user_id);
    res.json({ 
      ok: true, 
      message: 'User profile saved successfully',
      data: result
    });
    
  } catch (error) {
    console.error('❌ Failed to save user profile:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      ok: false, 
      error: 'save_failed',
      message: 'Failed to save user profile',
      details: error.message
    });
  }
});

// GET /api/users/:userId - Get user profile
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        ok: false, 
        error: 'user_id_required',
        message: 'User ID is required' 
      });
    }
    
    const profile = await getUserProfile(userId);
    
    if (!profile) {
      return res.status(404).json({ 
        ok: false, 
        error: 'profile_not_found',
        message: 'User profile not found' 
      });
    }
    
    console.log('✅ User profile retrieved from Neon for user:', userId);
    res.json({ 
      ok: true, 
      message: 'User profile retrieved successfully',
      data: profile
    });
    
  } catch (error) {
    console.error('❌ Failed to get user profile:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'get_failed',
      message: 'Failed to get user profile'
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
    routes: ['/medication-contributions', '/medication-contributions/export', '/supplement-contributions', '/api/users']
  });
});

// Test supplement contributions endpoint
app.get('/supplement-contributions/test', (_req, res) => {
  res.json({ 
    message: 'Supplement contributions endpoint is working!', 
    timestamp: new Date().toISOString(),
    endpoint: '/supplement-contributions'
  });
});

// Debug Neon connection
app.get('/debug/neon', async (_req, res) => {
  try {
    const { neon } = require('@neondatabase/serverless');
    const neonClient = neon(process.env.DATABASE_URL);
    
    // Test basic connection
    const result = await neonClient`SELECT 1 as test`;
    
    // Check if user_profiles table exists
    const tableCheck = await neonClient`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
      ) as table_exists
    `;
    
    res.json({
      ok: true,
      message: 'Neon connection working',
      testQuery: result,
      tableExists: tableCheck[0]?.table_exists,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'Not set'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'Not set'
    });
  }
});

// Create user_profiles table if it doesn't exist
app.post('/debug/create-table', async (_req, res) => {
  try {
    const { neon } = require('@neondatabase/serverless');
    const neonClient = neon(process.env.DATABASE_URL);
    
    // Create user_profiles table
    await neonClient`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- User identification
        user_id TEXT NOT NULL UNIQUE,
        
        -- Profile data
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        phone TEXT,
        date_of_birth DATE,
        gender TEXT,
        
        -- Medical data
        blood_type TEXT,
        allergies TEXT[],
        medical_conditions TEXT[],
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        
        -- Preferences
        language TEXT DEFAULT 'en',
        timezone TEXT,
        notifications_enabled BOOLEAN DEFAULT TRUE
      )
    `;
    
    res.json({
      ok: true,
      message: 'user_profiles table created successfully'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
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

// Health Report PDF Generation Endpoint
app.post('/api/generate-health-report', async (req, res) => {
  try {
    const { medications, fastingProfile, fastingAnalysis, generatedDate } = req.body;
    
    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Health Report - ${generatedDate}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; border-left: 4px solid #007bff; padding-left: 10px; }
          .medication-item { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 5px; }
          .profile-item { margin: 8px 0; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 10px; border-radius: 5px; margin: 10px 0; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>AuricRX Health Report</h1>
          <p>Generated on ${generatedDate}</p>
        </div>

        <div class="section">
          <h2 class="section-title">Current Medications</h2>
          ${medications && medications.length > 0 ? 
            medications.map(med => `
              <div class="medication-item">
                <div class="label">Medication:</div>
                <div class="value">${med.name || 'N/A'}</div>
                <div class="label">Dosage:</div>
                <div class="value">${med.strength || 'N/A'}</div>
                <div class="label">Quantity:</div>
                <div class="value">${med.quantity || 'N/A'}</div>
                <div class="label">Times:</div>
                <div class="value">${med.times ? med.times.join(', ') : 'N/A'}</div>
                ${med.notes ? `<div class="label">Notes:</div><div class="value">${med.notes}</div>` : ''}
              </div>
            `).join('') : 
            '<p>No medications recorded</p>'
          }
        </div>

        <div class="section">
          <h2 class="section-title">Fasting Profile</h2>
          ${fastingProfile ? `
            <div class="profile-item">
              <span class="label">Weight:</span>
              <span class="value">${fastingProfile.weight || 'Not specified'} ${fastingProfile.weightUnit || 'kg'}</span>
            </div>
            <div class="profile-item">
              <span class="label">Height:</span>
              <span class="value">${fastingProfile.height || 'Not specified'} ${fastingProfile.heightUnit || 'cm'}</span>
            </div>
            <div class="profile-item">
              <span class="label">Health Conditions:</span>
              <span class="value">
                ${[
                  fastingProfile.diabetes ? 'Diabetes' : '',
                  fastingProfile.hypoglycemia ? 'Hypoglycemia' : '',
                  fastingProfile.heartConditions ? 'Heart Conditions' : '',
                  fastingProfile.kidneyDisease ? 'Kidney Disease' : '',
                  fastingProfile.liverDisease ? 'Liver Disease' : '',
                  fastingProfile.eatingDisorders ? 'Eating Disorders' : '',
                  fastingProfile.pregnancy ? 'Pregnancy' : '',
                  fastingProfile.breastfeeding ? 'Breastfeeding' : '',
                  fastingProfile.gastrointestinalIssues ? 'Gastrointestinal Issues' : '',
                  ...(fastingProfile.otherHealthConditions || [])
                ].filter(Boolean).join(', ') || 'None reported'}
              </span>
            </div>
            <div class="profile-item">
              <span class="label">Activity Level:</span>
              <span class="value">${fastingProfile.activityLevel || 'Not specified'}</span>
            </div>
            <div class="profile-item">
              <span class="label">Primary Goal:</span>
              <span class="value">${fastingProfile.primaryGoal || 'Not specified'}</span>
            </div>
          ` : '<p>No fasting profile completed</p>'}
        </div>

        ${fastingAnalysis ? `
          <div class="section">
            <h2 class="section-title">Fasting Analysis</h2>
            <div class="${fastingAnalysis.compatible ? 'success' : 'warning'}">
              <strong>Status:</strong> ${fastingAnalysis.compatible ? 'Compatible' : 'Needs Review'}<br>
              <strong>Recommended Fasting Window:</strong> ${fastingAnalysis.suggestedHours}:${24-fastingAnalysis.suggestedHours}<br>
              <strong>Analysis:</strong> ${fastingAnalysis.message}
            </div>
            ${fastingAnalysis.warnings && fastingAnalysis.warnings.length > 0 ? `
              <div class="warning">
                <strong>Important Considerations:</strong>
                <ul>
                  ${fastingAnalysis.warnings.map(warning => `<li>${warning}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <div class="footer">
          <p>This report was generated by AuricRX Medical Coach</p>
          <p>Please consult with your healthcare provider before making any changes to your medication or fasting routine.</p>
        </div>
      </body>
      </html>
    `;

    // For now, return the HTML content as a response
    // In a full implementation, you would use puppeteer or similar to generate actual PDF
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="AuricRX_Health_Report_${generatedDate.replace(/\//g, '-')}.html"`);
    res.send(htmlContent);
    
  } catch (error) {
    console.error('Error generating health report:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'pdf_generation_failed',
      message: 'Failed to generate health report PDF' 
    });
  }
});

app.listen(port, () => {
  console.log(`✅ API running on http://localhost:${port}`);
  console.log('🔥 SERVER IS RUNNING - IF YOU SEE THIS, THE SERVER IS WORKING!');
});