export type Pharmacy = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address: string;
  logoUrl?: string;
  distanceMiles?: number;
};

export type StorePrice = Pharmacy & {
  price: number; // USD for now
  pickup?: boolean;
  delivery?: boolean;
  requiresCoupon?: boolean;
};

import { API_BASE } from "../src/config/api";

// Haversine formula for calculating distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

export async function findNearbyPharmacies(lat: number, lon: number, lang: string = 'en', opts?: { limit?: number; noCache?: boolean }): Promise<Pharmacy[]> {
  try {
  const brands = encodeURIComponent('HEB,Walmart,Target,Costco,CVS,Walgreens');
  const limit = opts?.limit ?? 15;
  const noCache = opts?.noCache ? '&noCache=1' : '';
  const url = `${API_BASE}/pharmacies/nearby?lat=${lat}&lon=${lon}&limit=${limit}&lang=${encodeURIComponent(lang)}&brands=${brands}${noCache}`;
  
  const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'api_error');
    console.log('✅ Pharmacy API success:', json.pharmacies?.length, 'pharmacies');
    return json.pharmacies || [];
  } catch (e) {
    console.warn('❌ Pharmacy API call failed, using fallback (mock)', e);
    // Fallback mock with realistic coordinates and proper distance calculation
    // Using larger offsets to simulate real pharmacy distances (0.01-0.05 degrees = 1-5 km)
    const mockPharmacies = [
      { id: "mock-cvs",  name: "CVS Pharmacy",     lat: lat+0.015, lon: lon+0.015, address: "123 Main St",  logoUrl: "", distanceMiles: 0.8 },
      { id: "mock-wal",  name: "Walgreens",        lat: lat+0.025, lon: lon-0.010, address: "45 Oak Ave",   logoUrl: "", distanceMiles: 1.1 },
      { id: "mock-rite", name: "Rite Aid",         lat: lat-0.020, lon: lon+0.030, address: "8 Pine Rd",    logoUrl: "", distanceMiles: 1.3 },
      { id: "mock-wmt",  name: "Walmart Pharmacy", lat: lat-0.030, lon: lon-0.025, address: "220 Market",   logoUrl: "", distanceMiles: 1.9 },
      { id: "mock-cost", name: "Costco Pharmacy",  lat: lat+0.040, lon: lon+0.035, address: "5 Lake Dr",    logoUrl: "", distanceMiles: 2.4 },
      { id: "mock-tar",  name: "Target (CVS)",     lat: lat+0.050, lon: lon-0.040, address: "77 River Rd",  logoUrl: "", distanceMiles: 3.1 },
    ];
    
    // Calculate actual distances using Haversine formula
    return mockPharmacies.map(pharmacy => {
      const distanceKm = calculateDistance(lat, lon, pharmacy.lat, pharmacy.lon);
      const distanceMiles = distanceKm * 0.621371; // Convert km to miles
      
      return {
        ...pharmacy,
        distanceMiles: distanceMiles
      };
    });
  }
}

export async function getMedicationPrices(pharmacies: Pharmacy[], medication: { name: string; dosage: string }, opts?: { currency?: string }): Promise<{ prices: StorePrice[]; meta?: { currency: string; rate: number; fxTs?: number } }> {
  try {
    const res = await fetch(`${API_BASE}/pharmacies/prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ medication, pharmacies, currency: opts?.currency }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'api_error');
    return { prices: json.prices || [], meta: json.meta };
  } catch (e) {
    console.warn('prices fallback (mock)', e);
    // Fallback deterministic mock
    return { prices: pharmacies.map((p, i) => ({
      ...p,
      price: [25, 30, 22, 28, 24, 27][i % 6],
      pickup: true,
      delivery: i % 2 === 0,
      requiresCoupon: i % 3 === 0,
    })) };
  }
}