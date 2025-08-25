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

export async function findNearbyPharmacies(lat: number, lon: number, lang: string = 'en'): Promise<Pharmacy[]> {
  try {
  const res = await fetch(`${API_BASE}/pharmacies/nearby?lat=${lat}&lon=${lon}&limit=12&lang=${encodeURIComponent(lang)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'api_error');
    return json.pharmacies || [];
  } catch (e) {
    console.warn('nearby fallback (mock)', e);
    // Fallback mock
    return [
      { id: "mock-cvs",  name: "CVS Pharmacy",     lat: lat+0.001, lon: lon+0.001, address: "123 Main St",  logoUrl: "", distanceMiles: 0.8 },
      { id: "mock-wal",  name: "Walgreens",        lat: lat+0.002, lon: lon-0.001, address: "45 Oak Ave",   logoUrl: "", distanceMiles: 1.1 },
      { id: "mock-rite", name: "Rite Aid",         lat: lat-0.001, lon: lon+0.002, address: "8 Pine Rd",    logoUrl: "", distanceMiles: 1.3 },
      { id: "mock-wmt",  name: "Walmart Pharmacy", lat: lat-0.002, lon: lon-0.002, address: "220 Market",   logoUrl: "", distanceMiles: 1.9 },
      { id: "mock-cost", name: "Costco Pharmacy",  lat: lat+0.003, lon: lon+0.003, address: "5 Lake Dr",    logoUrl: "", distanceMiles: 2.4 },
      { id: "mock-tar",  name: "Target (CVS)",     lat: lat+0.004, lon: lon-0.003, address: "77 River Rd",  logoUrl: "", distanceMiles: 3.1 },
    ];
  }
}

export async function getMedicationPrices(pharmacies: Pharmacy[], medication: { name: string; dosage: string }): Promise<StorePrice[]> {
  try {
    const res = await fetch(`${API_BASE}/pharmacies/prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medication, pharmacies }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'api_error');
    return json.prices || [];
  } catch (e) {
    console.warn('prices fallback (mock)', e);
    // Fallback deterministic mock
    return pharmacies.map((p, i) => ({
      ...p,
      price: [25, 30, 22, 28, 24, 27][i % 6],
      pickup: true,
      delivery: i % 2 === 0,
      requiresCoupon: i % 3 === 0,
    }));
  }
}