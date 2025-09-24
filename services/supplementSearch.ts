export type SupplementStore = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address: string;
  logoUrl?: string;
  distanceMiles?: number;
};

export type StorePrice = SupplementStore & {
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

export async function findNearbySupplementStores(lat: number, lon: number, supplementName: string, lang: string = 'en', opts?: { limit?: number; noCache?: boolean }): Promise<SupplementStore[]> {
  try {
    const limit = opts?.limit ?? 15;
    const noCache = opts?.noCache ? '&noCache=1' : '';
    const url = `${API_BASE}/supplements/nearby?lat=${lat}&lon=${lon}&supplement=${encodeURIComponent(supplementName)}&limit=${limit}&lang=${encodeURIComponent(lang)}${noCache}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'api_error');
    console.log('✅ Supplement Store API success:', json.stores?.length, 'stores');
    
    // Add distance calculations
    const storesWithDistance = json.stores.map((store: any) => ({
      ...store,
      distanceMiles: calculateDistance(lat, lon, store.lat, store.lon) * 0.621371 // Convert km to miles
    }));
    
    return storesWithDistance;
  } catch (error) {
    console.warn('Supplement store API failed, using mock data:', error);
    // Return mock data as fallback
    return generateMockSupplementStores(lat, lon, supplementName);
  }
}

export async function getSupplementPrices(stores: SupplementStore[], supplementName: string, opts?: { currency?: string }): Promise<{ prices: StorePrice[], meta?: any }> {
  try {
    // For now, generate mock prices since we don't have a real supplement pricing API
    const prices: StorePrice[] = stores.map(store => ({
      ...store,
      price: Math.random() * 50 + 10, // Random price between $10-$60
      pickup: Math.random() > 0.3, // 70% chance of pickup
      delivery: Math.random() > 0.5, // 50% chance of delivery
      requiresCoupon: Math.random() > 0.8 // 20% chance of requiring coupon
    }));
    
    return { prices };
  } catch (error) {
    console.warn('Supplement pricing failed:', error);
    return { prices: [] };
  }
}

function generateMockSupplementStores(lat: number, lon: number, supplementName: string): SupplementStore[] {
  const mockStores = [
    { name: 'GNC', address: '123 Main St, Downtown' },
    { name: 'Vitamin Shoppe', address: '456 Oak Ave, Midtown' },
    { name: 'CVS Pharmacy', address: '789 Pine St, Uptown' },
    { name: 'Walgreens', address: '321 Elm St, Westside' },
    { name: 'Target', address: '654 Maple Dr, Eastside' },
    { name: 'Walmart', address: '987 Cedar Ln, Northside' },
    { name: 'Whole Foods', address: '147 Birch St, Southside' },
    { name: 'Sprouts', address: '258 Spruce Ave, Central' }
  ];
  
  return mockStores.map((store, index) => {
    // Generate random coordinates within ~5 miles of user location
    const randomLat = lat + (Math.random() - 0.5) * 0.1;
    const randomLon = lon + (Math.random() - 0.5) * 0.1;
    
    return {
      id: `mock-supplement-${index}`,
      name: store.name,
      lat: randomLat,
      lon: randomLon,
      address: store.address,
      distanceMiles: calculateDistance(lat, lon, randomLat, randomLon) * 0.621371
    };
  });
}


