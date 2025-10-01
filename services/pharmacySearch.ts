export type Pharmacy = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address: string;
  logoUrl?: string;
  distanceMiles?: number;
  rating?: number;
};

export type StorePrice = Pharmacy & {
  price: number | null; // USD for now, null when not available
  priceNotAvailable?: boolean; // Flag for "Price not available"
  pharmacyNotAvailable?: boolean; // Flag for "Pharmacy not available"
  pickup?: boolean;
  delivery?: boolean;
  requiresCoupon?: boolean;
  excelMatch?: {
    medicinas: string;
    precioOriginal: number;
    unidades: string;
    similarity: number;
  };
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
  console.log('🔍 DEBUG: getMedicationPrices called with:', {
    pharmaciesCount: pharmacies.length,
    medication: medication.name,
    currency: opts?.currency,
    apiBase: API_BASE
  });
  
  try {
    console.log('🔍 DEBUG: Making API call to:', `${API_BASE}/pharmacies/prices`);
    const res = await fetch(`${API_BASE}/pharmacies/prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ medication, pharmacies, currency: opts?.currency }),
    });
    
    console.log('🔍 DEBUG: API response status:', res.status);
    
    if (!res.ok) {
      console.log('❌ DEBUG: API call failed with status:', res.status);
      throw new Error(`HTTP ${res.status}`);
    }
    
    const json = await res.json();
    console.log('🔍 DEBUG: API response data:', {
      ok: json.ok,
      pricesCount: json.prices?.length,
      samplePrices: json.prices?.slice(0, 3).map((p: any) => ({
        name: p.name,
        price: p.price,
        priceNotAvailable: p.priceNotAvailable
      }))
    });
    
    if (!json.ok) {
      console.log('❌ DEBUG: API returned error:', json.error);
      throw new Error(json.error || 'api_error');
    }
    
    return { prices: json.prices || [], meta: json.meta };
  } catch (e) {
    console.warn('🔍 DEBUG: API call failed, using fallback:', e.message);
    console.log('🔍 DEBUG: Fallback - returning "Price not available" for all pharmacies');
    // Fallback: Show "Price not available" instead of mock prices
    return { prices: pharmacies.map((p) => ({
      ...p,
      price: null, // No price available
      priceNotAvailable: true,
      pharmacyNotAvailable: true, // Added pharmacy not available flag
      pickup: true,
      delivery: Math.random() > 0.5,
      requiresCoupon: Math.random() > 0.8,
    })) };
  }
}