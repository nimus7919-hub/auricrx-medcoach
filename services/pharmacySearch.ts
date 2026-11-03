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
  presentacion?: string;
  parsed?: { count: number | null; unit: string | null; strength: string | null };
  observed_at?: string;
  stale?: boolean;
  verified?: boolean;
  purchase_url?: string;
  online?: boolean;
  price: number | null; // Recorded MXN reference price, null when missing or stale
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
  const url = `${API_BASE}/api/pharmacies/nearby?lat=${lat}&lng=${lon}&radius=3000`;
  
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
    throw new Error(`Failed to fetch pharmacies: ${(e instanceof Error ? e.message : String(e))}`);
  }
}

export type QQPQuote = {
  radius_km: number;
  presentations?: Pick<StorePrice, "presentacion" | "parsed">[];
  state: QQPQuote["summary"]; national: QQPQuote["summary"];
  as_of: string | null; fallback: boolean; source: string;
  summary: { min: number | null; avg: number | null; max: number | null; count: number };
};
export async function getMedicationPrices(pharmacies: Pharmacy[], medication: { name: string; dosage: string; activeIngredient?: string; strength?: string; form?: string; ean?: string }, opts?: { currency?: string; lat?: number; lng?: number; state?: string; radiusKm?: number }): Promise<{ prices: StorePrice[]; meta?: { currency: string; rate: number }; quote?: QQPQuote }> {
  const params = new URLSearchParams({ med: medication.name });
  if (opts?.lat != null && opts?.lng != null) { params.set('lat', String(opts.lat)); params.set('lng', String(opts.lng)); }
  if (opts?.radiusKm != null) params.set('radius_km', String(opts.radiusKm));
  if (opts?.state) params.set('state', opts.state);
  const response = await fetch(API_BASE + '/api/prices?' + params.toString());
  if (!response.ok) throw new Error('Price data unavailable');
  const data = await response.json();
  return { prices: (data.nearest || []).map((p: any) => ({ ...p, priceNotAvailable: p.price == null })), meta: { currency: 'MXN', rate: 1 }, quote: data };
}

export function formatPresentation(item: Pick<StorePrice, 'presentacion' | 'parsed'>, t: (key: string) => string): string {
  const p = item.parsed;
  const pack = p?.count != null && p.unit ? `${p.count} ${['ml', 'g'].includes(p.unit) ? p.unit : t('refillSheet.units.' + p.unit)}` : '';
  return [pack, p?.strength].filter(Boolean).join(' ? ') || item.presentacion || t('refillSheet.detailsUnavailable');
}
