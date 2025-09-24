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
    
    // Log first pharmacy coordinates for debugging
    if (json.pharmacies && json.pharmacies.length > 0) {
      const firstPharmacy = json.pharmacies[0];
      console.log('🔍 First pharmacy coordinates:', {
        name: firstPharmacy.name,
        lat: firstPharmacy.lat,
        lon: firstPharmacy.lon,
        distanceMiles: firstPharmacy.distanceMiles
      });
      console.log('🔍 User coordinates:', { lat, lon });
      
      // Calculate distance manually for verification
      const calculatedKm = calculateDistance(lat, lon, firstPharmacy.lat, firstPharmacy.lon);
      const calculatedMiles = calculatedKm * 0.621371;
      console.log('🔍 Manual distance calculation:', {
        km: calculatedKm.toFixed(2),
        miles: calculatedMiles.toFixed(2)
      });
    }
    
    return json.pharmacies || [];
  } catch (e) {
    console.error('❌ Pharmacy API call failed:', e);
    throw new Error(`Failed to fetch pharmacies: ${e.message}`);
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