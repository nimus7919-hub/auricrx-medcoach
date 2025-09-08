import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, View, Text, Pressable, Animated, Easing, FlatList, ActivityIndicator, Image, Linking, Alert } from "react-native";
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
  const [sort, setSort] = useState<'distance'|'price'|'name'>('price');
  const [descending, setDescending] = useState(false);
  const [fxMeta, setFxMeta] = useState<{ currency: string; rate: number; fxTs?: number }|null>(null);
  const SORT_KEY = 'AURIC_SORT';

  useEffect(()=>{
    AsyncStorage.getItem(SORT_KEY).then(v=>{ if (v === 'distance' || v==='price' || v==='name') setSort(v); else setSort('price'); }).catch(()=>{});
  },[]);
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
      let determinedCurrency: string = 'USD';
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
          // Expanded mapping (common global currencies)
          const C: Record<string,string> = {
            // North America
            US:'USD', PR:'USD', CA:'CAD', MX:'MXN',
            // Latin America
            BR:'BRL', AR:'ARS', CL:'CLP', CO:'COP', PE:'PEN', VE:'VES', EC:'USD', UY:'UYU', PY:'PYG', BO:'BOB', CR:'CRC', GT:'GTQ', HN:'HNL', NI:'NIO', SV:'USD', DO:'DOP', PA:'PAB',
            // Europe (Euro + others)
            ES:'EUR', PT:'EUR', FR:'EUR', DE:'EUR', IT:'EUR', NL:'EUR', BE:'EUR', IE:'EUR', LU:'EUR', AT:'EUR', FI:'EUR', GR:'EUR', SK:'EUR', SI:'EUR', LV:'EUR', LT:'EUR', EE:'EUR', MT:'EUR', CY:'EUR',
            PL:'PLN', CZ:'CZK', HU:'HUF', RO:'RON', BG:'BGN', HR:'EUR', SE:'SEK', NO:'NOK', DK:'DKK', CH:'CHF', GB:'GBP', IS:'ISK', TR:'TRY',
            // Middle East & Africa
            AE:'AED', SA:'SAR', QA:'QAR', KW:'KWD', BH:'BHD', OM:'OMR', IL:'ILS', EG:'EGP', MA:'MAD', NG:'NGN', KE:'KES', ZA:'ZAR', GH:'GHS',
            // Asia / Pacific
            CN:'CNY', JP:'JPY', KR:'KRW', IN:'INR', HK:'HKD', TW:'TWD', SG:'SGD', MY:'MYR', TH:'THB', ID:'IDR', PH:'PHP', VN:'VND', AU:'AUD', NZ:'NZD', FJ:'FJD'
          };
          if (C[cc]) determinedCurrency = C[cc];
        }
      } catch {}
      // If geocode failed we can do a crude language fallback
      if (!determinedCurrency) {
        determinedCurrency = (lang === 'es' ? 'EUR' : lang === 'zh' ? 'CNY' : 'USD');
      }
      setCurrency(determinedCurrency); // single definitive assignment
      const near = await findNearbyPharmacies(coords.latitude, coords.longitude, lang);
  const { prices, meta } = await getMedicationPrices(near, medication, { currency: determinedCurrency.toUpperCase() });
  setResults(prices);
  if (meta) setFxMeta(meta);
      setMockMode(near.some(p => p.id.startsWith('mock-')));
    } catch (e) {
      console.warn('Refill load error', e);
    } finally {
      setLoading(false);
    }
  }

  const data = useMemo(() => {
    let list = results.slice();
    // apply sorting
    list.sort((a,b)=>{
      let cmp;
      if (sort === 'price') cmp = (a.price ?? 0) - (b.price ?? 0);
      else if (sort === 'name') cmp = a.name.localeCompare(b.name);
      else cmp = (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0);
      return descending ? -cmp : cmp;
    });
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
  }, [results, showAll, activeFilters, sort, descending]);

  // Precompute current lowest price once per results array
  const lowestPrice = useMemo(() => {
    if (!results.length) return null;
    let min = Infinity; for (const r of results) if (typeof r.price === 'number' && r.price < min) min = r.price;
    return isFinite(min) ? min : null;
  }, [results]);

  // Basic product info extraction from medication name/dosage text (heuristic)
  const productInfo = useMemo(() => {
    const baseName = medication.name || '';
    const raw = (medication.dosage || '').trim();
    const source = `${baseName} ${raw}`.trim();
    // Strength patterns (e.g., 500mg, 50 mg, 50/500, 5mg/500mg)
    const strengths = [] as string[];
    const strengthRegex = /(\d+\s?mg(?:\/\d+\s?mg)?|\d+\/\d+|\d+\s?mcg|\d+\s?iu)/ig;
    let m;
    while ((m = strengthRegex.exec(source)) !== null) {
      const val = m[0].replace(/\s+/g,'');
      if (!strengths.includes(val)) strengths.push(val);
      if (strengths.length >= 2) break; // limit
    }
    // Package size (e.g., 30 tablets, 14 caps, 90 tab)
    const pkgMatch = source.match(/(\d+)\s?(tablet|tab|capsule|cap|caps|pill|pills|unit|units|ml|vial|vials|strip|strips)/i);
    let packageSize = pkgMatch ? `${pkgMatch[1]} ${pkgMatch[2]}` : null;
    if (packageSize) packageSize = packageSize.replace(/tab($|\b)/i,'tablets').replace(/caps?($|\b)/i,'capsules');
    if (!packageSize) packageSize = '30 tablets'; // default assumption
    const strengthDisplay = strengths.join(' / ');
    const display = [strengthDisplay || null, packageSize].filter(Boolean).join(' • ');
    return { display, strengthDisplay, packageSize };
  }, [medication.name, medication.dosage]);
  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });

  const useKm = lang !== 'en';
  function formatDistance(mi?: number) {
    if (mi == null) return '';
    if (!useKm) return `${mi.toFixed(1)} mi`;
    const km = mi * 1.60934;
    return `${km.toFixed(1)} km`;
  }
  // currency formatting
  const symbolMap: Record<string,string> = {
    USD:'$', CAD:'C$', MXN:'MX$','BRL':'R$','ARS':'AR$','CLP':'CLP$','COP':'COL$','PEN':'S/','VES':'Bs.','UYU':'$U','PYG':'Gs.','BOB':'Bs','CRC':'₡','GTQ':'Q','HNL':'L','NIO':'C$','DOP':'RD$','PAB':'B/.',
    EUR:'€','GBP':'£','PLN':'zł','CZK':'Kč','HUF':'Ft','RON':'lei','BGN':'лв','SEK':'kr','NOK':'kr','DKK':'kr','CHF':'CHF','ISK':'kr','TRY':'₺',
    AED:'د.إ','SAR':'﷼','QAR':'﷼','KWD':'KD','BHD':'BD','OMR':'﷼','ILS':'₪','EGP':'E£','MAD':'د.م.','NGN':'₦','KES':'KSh','ZAR':'R','GHS':'₵',
    CNY:'¥','JPY':'¥','KRW':'₩','INR':'₹','HKD':'HK$','TWD':'NT$','SGD':'S$','MYR':'RM','THB':'฿','IDR':'Rp','PHP':'₱','VND':'₫','AUD':'A$','NZD':'NZ$','FJD':'FJ$'
  };
  let formatPrice = (n:number) => {
    const sym = symbolMap[currency];
    return sym ? `${sym}${n.toFixed(2)}` : `${n.toFixed(2)} ${currency}`;
  };
  try {
    const nf = new Intl.NumberFormat(lang, { style:'currency', currency, maximumFractionDigits:2 });
    formatPrice = (n:number) => nf.format(n);
  } catch {}

  function renderItem({ item }: { item: StorePrice }) {
    if (!item || typeof item !== 'object') return null;
    const isLowest = lowestPrice != null && typeof item.price === 'number' && item.price === lowestPrice;
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
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 86
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
          {item.logoUrl ? (
            <Image source={{ uri: item.logoUrl }} style={{ width: 32, height: 32, borderRadius: 6 }} />
          ) : (
            <View style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: colors.muted, alignItems:'center', justifyContent:'center' }}>
              <Text style={{ fontSize:18 }}>🏪</Text>
            </View>
          )}
          <View style={{ flex:1 }}>
            <Text style={{ color: colors.text, fontSize:16, fontWeight:'600' }}>{item.name}</Text>
            <Text style={{ color: colors.sub, fontSize:12 }}>{formatDistance(item.distanceMiles)} • {item.address}</Text>
            <View style={{ flexDirection:'row', alignItems:'center', marginTop:2 }}>
              <Text style={{ color: colors.sub, fontSize:11 }}>💊 {productInfo.display}</Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems:'flex-end', gap:4 }}>
          <Text style={{ color: colors.text, fontSize:18, fontWeight:'700' }}>{typeof item.price==='number'? formatPrice(item.price): '—'}</Text>
          {isLowest && (
            <View style={{ backgroundColor: colors.gold, paddingHorizontal:8, paddingVertical:2, borderRadius: radius.pill }}>
              <Text style={{ color:'#000', fontSize:10, fontWeight:'700' }}>{strings.lowest||'Lowest'}</Text>
            </View>
          )}
          <Pressable onPress={() => openInMaps({ lat: item.lat, lon: item.lon, address: item.address })} style={{ backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: 6, minHeight:32, justifyContent:'center' }}>
            <Text style={{ color:'#000', fontWeight:'700', fontSize:12 }}>{strings.directions || 'Directions'}</Text>
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
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}>{(strings.refill||'Refill')} {`(${(strings.sortBy||'Sort')}: ${strings[sort]||sort}${descending?' ↓':' ↑'})`}</Text>
            <Text style={{ color: colors.sub, fontSize: 14 }}>
              {medication.name} • {medication.dosage}{medication.lastRefill ? ` • ${(strings.lastRefill||'Last refill')}: ${medication.lastRefill}` : ""}
            </Text>
            {mockMode && (
              <View style={{ backgroundColor: '#fbbf24', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.xl }}>
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
            {/* Sorting row */}
            <View style={{ flexDirection:'row', alignItems:'center', flexWrap:'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
              <Text style={{ color: colors.sub, fontSize: 12 }}>{strings.sortBy || 'Sort:'}</Text>
              {['distance','price','name'].map(key => {
                const label = key === 'distance' ? (strings.distance||'Distance') : key === 'price' ? (strings.price||'Price') : (strings.name||'Name');
                const active = sort === key;
                return (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Sort by ${label}`} key={key} onPress={()=> { setSort(key as any); AsyncStorage.setItem(SORT_KEY, key).catch(()=>{}); }} style={{ backgroundColor: active? colors.gold: colors.muted, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill }}>
                    <Text style={{ color: active? '#000': colors.text, fontSize: 12 }}>{label}</Text>
                  </Pressable>
                );
              })}
              <Pressable accessibilityRole="button" accessibilityLabel={descending? 'Ascending order':'Descending order'} onPress={()=> setDescending(d=>!d)} style={{ backgroundColor: colors.muted, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill }}>
                <Text style={{ color: colors.text, fontSize: 12 }}>{descending? '↓':'↑'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={'Refresh pharmacies'} onPress={()=>{ load(); }} style={{ backgroundColor: colors.muted, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill }}>
                <Text style={{ color: colors.text, fontSize: 12 }}>{strings.refresh||'Refresh'}</Text>
              </Pressable>
            </View>
            {fxMeta && (
              <Text style={{ color: colors.sub, fontSize: 10, marginTop: spacing.xs }}>
                {(strings.fxLabel||'FX')+`: 1 USD → ${(fxMeta.rate||1).toFixed(4)} ${fxMeta.currency}${fxMeta.fxTs? ' @ '+new Date(fxMeta.fxTs).toLocaleDateString():''}`}
              </Text>
            )}
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