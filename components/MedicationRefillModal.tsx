import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, View, Text, Pressable, Animated, Easing, FlatList, ActivityIndicator, Image } from "react-native";
import * as Location from "expo-location";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, spacing } from "../theme/tokens";
import { openInMaps } from "../utils/maps";
import { findNearbyPharmacies, getMedicationPrices, StorePrice } from "../services/pharmacySearch";

interface MedicationInfo { name: string; dosage: string; lastRefill?: string }
interface Props { visible: boolean; onClose: () => void; medication: MedicationInfo; strings: any; lang: string }

export default function MedicationRefillModal({ visible, onClose, medication, strings, lang }: Props) {
  const slide = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<StorePrice[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [currency, setCurrency] = useState<string>('USD');
  const [mockMode, setMockMode] = useState(false);
  const [coordsUsed, setCoordsUsed] = useState<{lat:number; lon:number}|null>(null);
  const LAST_LOC_KEY = 'AURIC_LAST_LOC';

  useEffect(() => {
    if (visible) {
      Animated.timing(slide, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      load();
    } else {
      Animated.timing(slide, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  async function load() {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      let coords = { latitude: 37.7749, longitude: -122.4194 }; // fallback (SF)
      if (status === "granted") {
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          // cache it
          AsyncStorage.setItem(LAST_LOC_KEY, JSON.stringify(coords)).catch(()=>{});
        } catch {}
      } else {
        // attempt cached last location
        try {
          const cached = await AsyncStorage.getItem(LAST_LOC_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && typeof parsed.latitude==='number' && typeof parsed.longitude==='number') {
              coords = { latitude: parsed.latitude, longitude: parsed.longitude };
            }
          }
        } catch {}
      }
      setCoordsUsed({ lat: coords.latitude, lon: coords.longitude });
      // Determine currency from country (reverse geocode); fall back to language mapping then USD
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude: coords.latitude, longitude: coords.longitude });
        const cc = geo?.[0]?.isoCountryCode?.toUpperCase();
        if (cc) {
          const currencyByCountry: Record<string,string> = {
            US:'USD', PR:'USD', GU:'USD', VI:'USD', MP:'USD', AS:'USD',
            CA:'CAD', MX:'MXN', BR:'BRL', AR:'ARS', CL:'CLP', CO:'COP', PE:'PEN',
            ES:'EUR', PT:'EUR', FR:'EUR', DE:'EUR', IT:'EUR', NL:'EUR', BE:'EUR', IE:'EUR', LU:'EUR', AT:'EUR', FI:'EUR', GR:'EUR', SK:'EUR', SI:'EUR', LV:'EUR', LT:'EUR', EE:'EUR', MT:'EUR', CY:'EUR',
            GB:'GBP', IE:'EUR', SE:'SEK', NO:'NOK', DK:'DKK', CH:'CHF',
            CN:'CNY', JP:'JPY', KR:'KRW', IN:'INR', AU:'AUD', NZ:'NZD'
          };
          if (currencyByCountry[cc]) setCurrency(currencyByCountry[cc]);
        }
      } catch {}
      if (!coords) {
        setCurrency(lang === 'es' ? 'EUR' : lang === 'zh' ? 'CNY' : 'USD');
      }
      const near = await findNearbyPharmacies(coords.latitude, coords.longitude, lang);
      const prices = await getMedicationPrices(near, medication);
      setResults(prices);
      setMockMode(near.some(p => p.id.startsWith('mock-')));
    } catch (e) {
      console.warn('Refill load error', e);
    } finally {
      setLoading(false);
    }
  }

  const data = useMemo(() => {
    let list = results;
    if (activeFilters.size) {
      list = list.filter(r => {
        if (activeFilters.has('pickup') && !r.pickup) return false;
        if (activeFilters.has('delivery') && !r.delivery) return false;
        if (activeFilters.has('cash')) {
          // placeholder: assume all support cash; keep for future expansion
        }
        if (activeFilters.has('coupon') && !r.requiresCoupon) return false;
        return true;
      });
    }
    return showAll ? list : list.slice(0,5);
  }, [results, showAll, activeFilters]);
  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });

  const useKm = lang !== 'en';
  function formatDistance(mi?: number) {
    if (mi == null) return '';
    if (!useKm) return `${mi.toFixed(1)} mi`;
    const km = mi * 1.60934;
    return `${km.toFixed(1)} km`;
  }
  // currency formatting
  let formatPrice = (n:number) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '';
    return symbol ? `${symbol}${n.toFixed(2)}` : `${n.toFixed(2)} ${currency}`;
  };
  try {
    const nf = new Intl.NumberFormat(lang, { style:'currency', currency, maximumFractionDigits:2 });
    formatPrice = (n:number) => nf.format(n);
  } catch {}

  function renderItem({ item }: { item: StorePrice }) {
    return (
      <Pressable
        onPress={() => openInMaps({ lat: item.lat, lon: item.lon, address: item.address })}
        accessibilityRole="button"
        accessibilityLabel={`Open directions to ${item.name}`}
        hitSlop={8}
        style={{
          backgroundColor: colors.card,
            borderRadius: radius.xl,
            padding: spacing.md,
            marginBottom: spacing.sm,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 72
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 }}>
          {item.logoUrl ? (
            <Image source={{ uri: item.logoUrl }} style={{ width: 28, height: 28, borderRadius: 6 }} />
          ) : (
            <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: colors.muted }} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>{item.name}</Text>
            <Text style={{ color: colors.sub, fontSize: 12 }}>{formatDistance(item.distanceMiles)} • {item.address}</Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end", gap: spacing.sm }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>{formatPrice(item.price)}</Text>
          <Pressable
            onPress={() => openInMaps({ lat: item.lat, lon: item.lon, address: item.address })}
            style={{ backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: 8, minHeight: 36, justifyContent: "center" }}
          >
            <Text style={{ color: "#000", fontWeight: "700" }}>{strings.directions || 'Directions'}</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  }

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <Animated.View style={{
          transform: [{ translateY }],
          backgroundColor: colors.bg,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          padding: spacing.lg,
          paddingBottom: spacing.xl
        }}>
          {/* Header */}
          <View style={{ gap: spacing.sm }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}>{strings.refill || 'Refill'}</Text>
            <Text style={{ color: colors.sub, fontSize: 14 }}>
              {medication.name} • {medication.dosage}{medication.lastRefill ? ` • ${(strings.lastRefill||'Last refill')}: ${medication.lastRefill}` : ""}
            </Text>
            {mockMode && (
              <View style={{ backgroundColor: '#fbbf24', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.md }}>
                <Text style={{ color:'#000', fontSize:12, fontWeight:'600' }}>Mock data (add GOOGLE_PLACES_API_KEY for live pharmacies)</Text>
              </View>
            )}
            {coordsUsed && (
              <Text style={{ color: colors.sub, fontSize: 10 }}>
                {`📍 ${coordsUsed.lat.toFixed(4)}, ${coordsUsed.lon.toFixed(4)} • ${currency}`}
              </Text>
            )}
            <View style={{ flexDirection: "row", flexWrap:'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
              {[
                {k:'pickup', label: strings.pickup||'Pickup'},
                {k:'delivery', label: strings.delivery||'Delivery'},
                {k:'cash', label: strings.cash||'Cash'},
                {k:'coupon', label: strings.coupon||'Coupon'}
              ].map(f => {
                const active = activeFilters.has(f.k);
                return (
                  <Pressable key={f.k} onPress={()=>{
                    setActiveFilters(prev => {
                      const n = new Set(prev);
                      if (n.has(f.k)) n.delete(f.k); else n.add(f.k);
                      return n;
                    });
                  }} style={{ backgroundColor: active? colors.gold: colors.muted, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill }}>
                    <Text style={{ color: active? '#000': colors.text, fontSize: 12 }}>{f.label}</Text>
                  </Pressable>
                );
              })}
              {activeFilters.size>0 && (
                <Pressable onPress={()=> setActiveFilters(new Set())} style={{ backgroundColor: colors.muted, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill }}>
                  <Text style={{ color: colors.text, fontSize: 12 }}>×</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* List */}
      <View style={{ marginTop: spacing.lg, maxHeight: 360 }}>
            {loading ? (
              <ActivityIndicator color={colors.gold} />
            ) : (
              <FlatList
        data={data}
                keyExtractor={item => item.id}
                getItemLayout={(_, index) => ({ length: 84, offset: 84 * index, index })}
                renderItem={renderItem}
              />
            )}
            {!showAll && results.length > 5 && !loading && (
              <Pressable onPress={() => setShowAll(true)} style={{ alignSelf: 'center', marginTop: spacing.sm }}>
                <Text style={{ color: colors.gold, fontSize: 14, fontWeight: '600' }}>{strings.showAll || 'Show all'}</Text>
              </Pressable>
            )}
          </View>

          {/* Footer actions */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: colors.muted, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{strings.close || 'Close'}</Text>
            </Pressable>
            <Pressable style={{ flex: 1, backgroundColor: colors.gold, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: '#000', fontWeight: '700' }}>{strings.reserve || 'Reserve (stub)'}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}