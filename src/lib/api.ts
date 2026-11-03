import uiI18n from "../i18n";
const API = "https://sanpablo-proxy.onrender.com";

/** San Pablo price search */
export async function searchPrices(q: string, pageSize = 10, page = 0) {
  // Paused until written permission or an official feed is available.
  return { query: q, page, pageSize, totalResults: 0, items: [] };
  const url = new URL("/api/sanpablo/search", API);
  url.searchParams.set("q", q);
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("page", String(page));
  const r = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(uiI18n.t("ui.searchFailedValue", { value1: r.status }));
  return r.json() as Promise<{
    query: string; page: number; pageSize: number; totalResults: number;
    items: Array<{
      code: string | null;
      name: string | null;
      price: string | null;
      priceValue: number | null;
      currency: string | null;
      pack: string | null;
      image: string | null;
    }>;
  }>;
}

/** Nearby pharmacies (all chains) */
export async function nearbyPharmacies(
  lat: number,
  lng: number,
  radius = 5000,
  keyword = uiI18n.t("ui.farmacia")
) {
  const url = new URL("/api/pharmacies/nearby", API);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("keyword", keyword);
  const r = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(uiI18n.t("ui.nearbyFailedValue", { value1: r.status }));
  return r.json() as Promise<{
    results: Array<{
      placeId: string;
      name: string;
      address: string | null;
      lat: number;
      lng: number;
      rating: number | null;
    }>;
  }>;
}
