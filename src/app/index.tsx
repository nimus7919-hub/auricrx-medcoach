import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { searchPrices, nearbyPharmacies } from "../lib/api";
import { getUserLocation } from "../lib/geo";
import { kmBetween } from "../lib/distance";
import { PriceCard } from "../components/PriceCard";
import { StoreRow } from "../components/StoreRow";
import { useTranslation } from "../i18n";

type SortMode = "price" | "distance";

export default function Home() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [priceItems, setPriceItems] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [coord, setCoord] = useState<{lat:number;lng:number} | null>(null);
  const [sortBy, setSortBy] = useState<SortMode>("price");
  const [nearbyError, setNearbyError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const c = await getUserLocation();
      setCoord(c);
      try {
        const [prices, nearby] = await Promise.all([
          searchPrices(q, 10),
          c ? nearbyPharmacies(c.lat, c.lng, 5000, "Farmacia") : Promise.resolve({ results: [] })
        ]);
        setPriceItems(prices.items);
        setStores(nearby.results);
        setNearbyError(null);
      } catch (e: any) {
        // If nearby fails (e.g., backend missing GOOGLE_PLACES_API_KEY), continue showing prices
        setNearbyError(t.sanpablo.nearbyError);
      }
    })();
  }, []);

  const sanPabloRegex = /san\s*pablo/i;

  const decoratedStores = useMemo(() => {
    return stores.map(s => {
      const km = coord ? kmBetween(coord, { lat: s.lat, lng: s.lng }) : null;
      const priceable = sanPabloRegex.test(s.name);
      return { ...s, km, priceable };
    }).sort((a, b) => {
      if (sortBy === "distance") {
        const ax = a.km ?? Number.POSITIVE_INFINITY;
        const bx = b.km ?? Number.POSITIVE_INFINITY;
        return ax - bx;
      }
      // keep default order for "price" since store list itself has no per-store price
      return 0;
    });
  }, [stores, coord, sortBy]);

  async function runSearch() {
    setLoading(true);
    try {
      const prices = await searchPrices(q, 10);
      setPriceItems(prices.items);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>{t.sanpablo.searchTitle}</Text>
      <View style={styles.row}>
        <TextInput value={q} onChangeText={setQ} placeholder={t.sanpablo.searchPlaceholder} style={styles.input} />
        <Pressable onPress={runSearch} style={styles.btn}><Text style={styles.btnTxt}>{t.sanpablo.searchButton}</Text></Pressable>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.sub}>{t.sanpablo.sortBy}</Text>
        <Pressable onPress={() => setSortBy("price")} style={[styles.toggle, sortBy==="price" && styles.toggleOn]}><Text>{t.sanpablo.price}</Text></Pressable>
        <Pressable onPress={() => setSortBy("distance")} style={[styles.toggle, sortBy==="distance" && styles.toggleOn]}><Text>{t.sanpablo.distance}</Text></Pressable>
      </View>

      <Text style={styles.section}>{t.sanpablo.sanpabloSection}</Text>
      {loading ? <ActivityIndicator /> : null}
      {priceItems.map((p, idx) => (
        <PriceCard key={`${p.code}-${idx}`} name={p.name} price={p.price} pack={p.pack} image={p.image} strings={t} />
      ))}
      {priceItems.length === 0 && !loading ? <Text>{t.sanpablo.noResults}</Text> : null}

      <Text style={styles.section}>{t.sanpablo.nearbySection}</Text>
      {nearbyError ? (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ color: "tomato", marginBottom: 8 }}>{nearbyError}</Text>
          <Pressable onPress={() => {
            setNearbyError(null);
            if (coord) {
              nearbyPharmacies(coord.lat, coord.lng, 5000, "Farmacia")
                .then(nearby => setStores(nearby.results))
                .catch(() => setNearbyError(t.sanpablo.nearbyError));
            }
          }} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t.sanpablo.retry}</Text>
          </Pressable>
        </View>
      ) : null}
      {decoratedStores.map(s => (
        <StoreRow key={s.placeId} placeId={s.placeId} name={s.name} address={s.address} lat={s.lat} lng={s.lng} km={s.km} priceable={s.priceable} strings={t} />
      ))}
      {decoratedStores.length === 0 && !nearbyError ? <Text>{t.sanpablo.noLocation}</Text> : null}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  h1: { fontSize: 20, fontWeight: "700", marginBottom: 6 },
  row: { flexDirection: "row", gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 12, height: 42, backgroundColor: "white" },
  btn: { paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: "#bbb", alignItems: "center", justifyContent: "center" },
  btnTxt: { fontWeight: "600" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  toggle: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: "#ddd" },
  toggleOn: { backgroundColor: "#eef" },
  sub: { fontWeight: "600", marginRight: 4 },
  section: { fontSize: 16, fontWeight: "700", marginTop: 16, marginBottom: 6 },
  retryBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: "#007AFF", backgroundColor: "#007AFF", alignSelf: "flex-start" },
  retryText: { color: "white", fontWeight: "600", fontSize: 14 }
});
