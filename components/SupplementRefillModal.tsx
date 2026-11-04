import { getRegion } from '../src/services/region';
import USRefillModal from '../src/components/USRefillModal';
import Modal from '../src/components/BackModal';
import uiI18n from "../src/i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import KeyboardForm from './KeyboardForm';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, Animated, Easing, FlatList, ActivityIndicator, Image, Alert, TextInput, ScrollView } from 'react-native';
import * as Location from "expo-location";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, spacing } from "../theme/tokens";
import { openInMaps } from "../utils/maps";
import { findNearbySupplementStores, getSupplementPrices, StorePrice } from "../services/supplementSearch";
// ENABLED: EnhancedSupplementSearch for database integration
const EnhancedSupplementSearch = require("../services/enhancedSupplementSearch");
import supplementDataCollector from "../services/supplementDataCollector";

interface SupplementInfo { name: string; brand?: string; dosage?: string; quantity?: string; quantityUnit?: string; lastRefill?: string }
interface Props { 
  visible: boolean; 
  onClose: () => void; 
  supplement: SupplementInfo; 
  strings: any; 
  lang: string; 
  userCountry?: string; 
  onRefillComplete?: (supplementName: string) => void;
  // Pre-loaded data for faster loading
  preloadedPharmacies?: any[];
  preloadedCoords?: { latitude: number; longitude: number };
  preloadedCurrency?: string;
  preloadedFxMeta?: any;
}

function MexicoSupplementRefillModal({ visible, onClose, supplement, strings, lang, userCountry, onRefillComplete, preloadedPharmacies, preloadedCoords, preloadedCurrency, preloadedFxMeta }: Props) {
  useUILanguage();
  
  const slide = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<StorePrice[]>([]);
  const [sort, setSort] = useState<'distance'|'price'|'name'>('distance');
  const [descending, setDescending] = useState(false);
  const [fxMeta, setFxMeta] = useState<{ currency: string; rate: number; fxTs?: number }|null>(null);
  const SORT_KEY = 'AURIC_SUPPLEMENT_SORT';


  const [showAll, setShowAll] = useState(false);
  const [currency, setCurrency] = useState<string>(uiI18n.t("common.usd"));
  const [coordsUsed, setCoordsUsed] = useState<{lat:number; lon:number}|null>(null);
  const LAST_LOC_KEY = 'AURIC_LAST_LOC';

  // Price contribution modal state
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<StorePrice | null>(null);
  const [contributionData, setContributionData] = useState({
    supplementName: '',
    brand: '',
    dosage: '',
    price: '',
    quantity: '',
    storeName: '',
    storeAddress: ''
  });

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
      let determinedCurrency: string = uiI18n.t("common.usd");
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
            US:uiI18n.t("common.usd"), PR:uiI18n.t("common.usd"), CA:'CAD', MX:uiI18n.t("common.mxn"),
            // Latin America
            BR:'BRL', AR:'ARS', CL:'CLP', CO:'COP', PE:'PEN', VE:'VES', EC:uiI18n.t("common.usd"), UY:'UYU', PY:'PYG', BO:'BOB', CR:'CRC', GT:'GTQ', HN:'HNL', NI:'NIO', SV:uiI18n.t("common.usd"), DO:'DOP', PA:'PAB',
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
        determinedCurrency = (lang === 'es' ? 'EUR' : lang === 'zh' ? 'CNY' : uiI18n.t("common.usd"));
      }
      setCurrency(determinedCurrency); // single definitive assignment
      
      // Load stores if not pre-loaded
      let near = preloadedPharmacies || [];
      if (!preloadedPharmacies) {
        near = await findNearbySupplementStores(coords.latitude, coords.longitude, supplement.name, lang);
      }
      
      // Try enhanced search first
      let prices = [];
      let meta = null;
      
      try {
        console.log('🔍 Attempting enhanced supplement search...');
        const enhancedResult = await EnhancedSupplementSearch.searchSupplementPrices(near, supplement, { 
          currency: determinedCurrency.toUpperCase() 
        });
        prices = enhancedResult.prices;
        meta = enhancedResult.meta;
        console.log('✅ Enhanced supplement search successful:', prices.length, 'prices');
      } catch (enhancedError) {
        console.warn('⚠️ Enhanced supplement search failed, falling back to original method:', enhancedError);
        
        // Fallback to original method
        console.log('🔍 DEBUG: Calling getSupplementPrices with:', {
          nearCount: near.length,
          supplement: supplement.name,
          currency: determinedCurrency.toUpperCase()
        });
        
        const originalResult = await getSupplementPrices(near, supplement.name, { currency: determinedCurrency.toUpperCase() });
        prices = originalResult.prices;
        meta = originalResult.meta;
        
        console.log('🔍 DEBUG: getSupplementPrices returned:', {
          pricesCount: prices.length,
          samplePrices: prices.slice(0, 3).map(p => ({
            store: p.name,
            price: p.price,
            pickup: p.pickup,
            delivery: p.delivery
          }))
        });
      }
      
      setResults(prices);
      if (meta) setFxMeta(meta);
    } catch (e) {
      console.warn('Supplement refill load error', e);
    } finally {
      setLoading(false);
    }
  }

  // Price contribution functions
  const openContributionModal = (pharmacy: StorePrice) => {
    setSelectedPharmacy(pharmacy);
    setContributionData({
      supplementName: supplement.name || '',
      brand: supplement.brand || '',
      dosage: supplement.dosage || '',
      price: '',
      quantity: supplement.quantity || '',
      storeName: pharmacy.name || '',
      storeAddress: pharmacy.address || ''
    });
    setShowContributionModal(true);
  };

  const closeContributionModal = () => {
    setShowContributionModal(false);
    setSelectedPharmacy(null);
    setContributionData({
      supplementName: '',
      brand: '',
      dosage: '',
      price: '',
      quantity: '',
      storeName: '',
      storeAddress: ''
    });
  };

  const submitContribution = async () => {
    // Debug: Log the form data
    console.log('🔍 Form validation - contributionData:', contributionData);
    console.log('🔍 supplementName:', contributionData.supplementName, 'trimmed:', contributionData.supplementName?.trim());
    console.log('🔍 price:', contributionData.price, 'trimmed:', contributionData.price?.trim());
    console.log('🔍 storeName:', contributionData.storeName, 'trimmed:', contributionData.storeName?.trim());
    
    // Validate form
    if (!contributionData.supplementName?.trim() || !contributionData.price?.trim() || !contributionData.storeName?.trim()) {
      Alert.alert(
        uiI18n.t("ai.contributionError"),
        uiI18n.t("ai.contributionErrorText"),
        [{ text: uiI18n.t("adminProfile.ok") }]
      );
      return;
    }

    try {
      // Add contribution to data collector (sends to server)
      const contribution = await supplementDataCollector.collectSupplementPrice({
        ...contributionData,
        pharmacyId: selectedPharmacy?.id || '',
        userLocation: coordsUsed,
        currency: currency
      });

      console.log('📊 Supplement price contribution saved to server:', contribution);

      Alert.alert(
        uiI18n.t("ai.contributionSuccess"),
        uiI18n.t("ai.contributionSuccessText"),
        [
          {
            text: uiI18n.t("adminProfile.ok"),
            onPress: () => {
              closeContributionModal();
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Failed to save supplement contribution:', error);
      Alert.alert(
        uiI18n.t("adminProfile.error"),
        uiI18n.t("ui.failedToSaveYourContributionPleaseTryAgain"),
        [{ text: uiI18n.t("adminProfile.ok") }]
      );
    }
  };

  // Collect supplement price data for user contributions
  const collectSupplementPriceData = async (storePrice: StorePrice) => {
    try {
      if (!storePrice.price || typeof storePrice.price !== 'number') return;
      
      const supplementData = {
        name: supplement.name,
        brand: supplement.brand,
        price: storePrice.price,
        quantity: null, // Could be enhanced to track quantity
        storeName: storePrice.name,
        storeAddress: storePrice.address,
        pharmacyId: storePrice.id,
        currency: currency,
        userLocation: coordsUsed ? {
          latitude: coordsUsed.lat,
          longitude: coordsUsed.lon
        } : null,
        userId: 'anonymous' // Could be enhanced to use actual user ID
      };
      
      await supplementDataCollector.collectSupplementPrice(supplementData);
      console.log('✅ Supplement price data collected for contribution');
    } catch (error) {
      console.warn('⚠️ Failed to collect supplement price data:', error);
    }
  };

  const data = useMemo(() => {
    let list = results.slice();
    // apply sorting
    list.sort((a,b)=>{
      let cmp;
      if (sort === 'price') {
        // For price sorting, put "price not available" items at the end
        if (a.priceNotAvailable && !b.priceNotAvailable) return 1;
        if (!a.priceNotAvailable && b.priceNotAvailable) return -1;
        if (a.priceNotAvailable && b.priceNotAvailable) return 0;
        cmp = (a.price ?? 0) - (b.price ?? 0);
      } else if (sort === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0);
      }
      return descending ? -cmp : cmp;
    });
    return showAll ? list : list.slice(0,5);
  }, [results, showAll, sort, descending, uiI18n.resolvedLanguage]);

  // Precompute current lowest price once per results array
  // Precompute current lowest price once per results array (excluding "price not available" items)
  const lowestPrice = useMemo(() => {
    if (!results.length) return null;
    let min = Infinity; 
    for (const r of results) {
      if (typeof r.price === 'number' && !r.priceNotAvailable && r.price < min) {
        min = r.price;
      }
    }
    return isFinite(min) ? min : null;
  }, [results, uiI18n.resolvedLanguage]);

  // Function to normalize and translate units based on user's language
  const normalizeUnits = (units: string) => {
    if (!units) return '';
    
    // Language-specific unit translations
    const unitTranslations: Record<string, Record<string, string>> = { get en() { return uiI18n.t("localized.SupplementRefillModal.normalizeUnits.unitTranslations", { lng: 'en', returnObjects: true }) as any; }, get es() { return uiI18n.t("localized.SupplementRefillModal.normalizeUnits.unitTranslations", { lng: 'es', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.SupplementRefillModal.normalizeUnits.unitTranslations", { lng: 'zh', returnObjects: true }) as any; } };
    
    // Get translations for current language
    const translations = unitTranslations[lang] || unitTranslations['en'];
    
    // Try to find and replace each unit (case insensitive)
    let normalizedUnits = units;
    
    // Handle common patterns like "10 COMPRIMIDOS", "1 ampoule", etc.
    Object.entries(translations).forEach(([original, translated]) => {
      const regex = new RegExp(`\\b${original}\\b`, 'gi');
      normalizedUnits = normalizedUnits.replace(regex, translated);
    });
    
    // Clean up extra spaces and make it look nice
    normalizedUnits = normalizedUnits.replace(/\s+/g, ' ').trim();
    
    // Debug log to see what's happening
    if (units !== normalizedUnits) {
      console.log(`🔄 Unit translation (${lang}): "${units}" → "${normalizedUnits}"`);
    }
    
    return normalizedUnits;
  };

  // Basic product info extraction from supplement name/dosage text (heuristic)
  const productInfo = useMemo(() => {
    const baseName = supplement.name || '';
    const raw = (supplement.dosage || '').trim();
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
    // Don't use hardcoded fallback - let it be null if not found
    const strengthDisplay = strengths.join(' / ');
    const display = [strengthDisplay || null, packageSize].filter(Boolean).join(' • ');
    return { display, strengthDisplay, packageSize };
  }, [supplement.name, supplement.dosage, uiI18n.resolvedLanguage]);
  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });

  // Use country-based distance units: miles for USA, kilometers for other countries
  const useKm = userCountry !== 'US';
  console.log('💊 SUPPLEMENT SupplementRefillModal - userCountry:', userCountry, 'useKm:', useKm);
  function formatDistance(mi?: number) {
    console.log('💊 SUPPLEMENT formatDistance called with:', { mi, useKm, userCountry });
    if (mi == null) return '';
    if (!useKm) {
      console.log('💊 SUPPLEMENT Using miles:', `${mi.toFixed(1)} mi`);
      return `${mi.toFixed(1)} mi`;
    }
    const km = mi * 1.60934;
    console.log(`💊 SUPPLEMENT Conversion: ${mi} miles × 1.60934 = ${km} km`);
    console.log(`💊 SUPPLEMENT Final display: ${km.toFixed(1)} km`);
    return `${km.toFixed(1)} km`;
  }
  // currency formatting (same as medication refill modal)
  const symbolMap: Record<string,string> = {
    USD:'$', CAD:'C$', MXN:'MX$','BRL':'R$','ARS':'AR$','CLP':'CLP$','COP':'COL$','PEN':"S/",'VES':'Bs.','UYU':'$U','PYG':'Gs.','BOB':'Bs','CRC':'₡','GTQ':'Q','HNL':uiI18n.t("unitLabels.L"),'NIO':'C$','DOP':'RD$','PAB':'B/.',
    EUR:'€','GBP':'£','PLN':'zł','CZK':'Kč','HUF':'Ft','RON':'lei','BGN':'лв','SEK':'kr','NOK':'kr','DKK':'kr','CHF':'CHF','ISK':'kr','TRY':'₺',
    AED:'د.إ','SAR':'﷼','QAR':'﷼','KWD':'KD','BHD':'BD','OMR':'﷼','ILS':'₪','EGP':'E£','MAD':'د.م.','NGN':'₦','KES':'KSh','ZAR':'R','GHS':'₵',
    CNY:'¥','JPY':'¥','KRW':'₩','INR':'₹','HKD':'HK$','TWD':'NT$','SGD':"S$",'MYR':'RM','THB':'฿','IDR':'Rp','PHP':'₱','VND':'₫','AUD':'A$','NZD':'NZ$','FJD':'FJ$'
  };
  // Map language codes to proper locales for currency formatting
  const localeMap: Record<string, string> = {"en":"en-US","es":"es-MX","zh":"zh-CN","fr":"fr-FR","de":"de-DE","pt":"pt-BR"};
  
  const locale = localeMap[lang] || 'en-US';
  const nf = new Intl.NumberFormat(locale, { style:'currency', currency, maximumFractionDigits:2 });
  const formatPrice = (n:number) => {
    const formatted = nf.format(n);
    console.log(`💰 Price formatting: ${n} -> ${formatted} (locale: ${locale}, currency: ${currency})`);
    return formatted;
  };

  function renderItem({ item }: { item: StorePrice }) {
    if (!item || typeof item !== 'object') return null;
    const isLowest = lowestPrice != null && typeof item.price === 'number' && item.price === lowestPrice;
    return (
      <Pressable
        onPress={() => {
          openInMaps({ lat: item.lat, lon: item.lon, address: item.address });
          collectSupplementPriceData(item);
        }}
        accessibilityRole="button"
        accessibilityLabel={uiI18n.t("ui.openDirectionsToValue_8b053a", { value1: item.name })}
        hitSlop={8}
        style={{
          backgroundColor: colors.muted,
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
              <Text style={{ fontSize:18 }}>💊</Text>
            </View>
          )}
          <View style={{ flex:1 }}>
            <Text style={{ color: colors.text, fontSize:16, fontWeight:'600' }}>{item.name}</Text>
            <Text style={{ color: colors.sub, fontSize:12 }}>{formatDistance(item.distanceMiles)} • {item.address}</Text>
            <View style={{ flexDirection:'row', alignItems:'center', marginTop:2 }}>
              <Text style={{ color: colors.sub, fontSize:11 }}>
                {item.excelMatch?.unidades ? normalizeUnits(String(item.excelMatch.unidades)) : (productInfo.display || supplement.dosage || supplement.name)}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems:'flex-end', gap:4 }}>
          {item.priceNotAvailable ? (
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={{ color: colors.sub, fontSize:14, fontWeight:'500', fontStyle: 'italic' }}>
                {uiI18n.t("supplements.priceNotAvailable")}
              </Text>
              <Pressable 
                onPress={() => openContributionModal(item)} 
                style={{ backgroundColor: '#10b981', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4, minHeight:28, justifyContent:'center' }}
              >
                <Text style={{ color:'#ffffff', fontWeight:'600', fontSize:11 }}>
                  {uiI18n.t("ai.helpUsGetPrice")}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={{ color: colors.text, fontSize:18, fontWeight:'700' }}>{typeof item.price==='number'? formatPrice(item.price): '—'}</Text>
              {isLowest && (
                <View style={{ backgroundColor: colors.gold, paddingHorizontal:8, paddingVertical:2, borderRadius: radius.pill }}>
                  <Text style={{ color:'#000', fontSize:10, fontWeight:'700' }}>{uiI18n.t("medications.lowest")}</Text>
                </View>
              )}
            </>
          )}
          <Pressable onPress={() => {
            openInMaps({ lat: item.lat, lon: item.lon, address: item.address });
            collectSupplementPriceData(item);
          }} style={{ backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: 6, minHeight:32, justifyContent:'center' }}>
            <Text style={{ color:'#000', fontWeight:'700', fontSize:12 }}>{uiI18n.t("common.directions")}</Text>
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
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}>{uiI18n.t("medications.refill")} ({uiI18n.t("refillSheet.sortBy")}: {uiI18n.t("refillSheet.sort." + sort)}{descending ? " ?" : " ?"})</Text>
            <Text style={{ color: colors.sub, fontSize: 14 }}>
              {supplement.name} • {supplement.dosage || supplement.brand}{supplement.quantity && supplement.quantity !== 'N/A' ? uiI18n.t("healthAnalytics.value", { value1: supplement.quantity }) : ""}{supplement.lastRefill ? ` • ${uiI18n.t("medications.lastRefill")}: ${supplement.lastRefill}` : ""}
            </Text>
            {coordsUsed && (
              <Text style={{ color: colors.sub, fontSize: 10 }}>
                {`📍 ${coordsUsed.lat.toFixed(4)}, ${coordsUsed.lon.toFixed(4)} • ${currency}`}
              </Text>
            )}
            {/* Sorting row */}
            <View style={{ flexDirection:'row', alignItems:'center', flexWrap:'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
              <Text style={{ color: colors.sub, fontSize: 12 }}>{(uiI18n.t("refillSheet.sortBy"))}:</Text>
              {['distance','price','name'].map(key => {
                const label = uiI18n.t("refillSheet.sort." + key);
                const active = sort === key;
                return (
                  <Pressable accessibilityRole="button" accessibilityLabel={uiI18n.t("ui.sortByValue_3ebf1c", { value1: label })} key={key} onPress={()=> { setSort(key as any); AsyncStorage.setItem(SORT_KEY, key).catch(()=>{}); }} style={{ backgroundColor: active? colors.gold: colors.muted, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill }}>
                    <Text style={{ color: active? '#000': colors.text, fontSize: 12 }}>{label}</Text>
                  </Pressable>
                );
              })}
              <Pressable accessibilityRole="button" accessibilityLabel={descending? uiI18n.t("common.ascending"):uiI18n.t("common.descending")} onPress={()=> setDescending(d=>!d)} style={{ backgroundColor: colors.muted, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill }}>
                <Text style={{ color: colors.text, fontSize: 12 }}>{descending? '↓':'↑'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={uiI18n.t("ui.refreshStores")} onPress={()=>{ load(); }} style={{ backgroundColor: colors.muted, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill }}>
                <Text style={{ color: colors.text, fontSize: 12 }}>{uiI18n.t("appointments.refresh")}</Text>
              </Pressable>
            </View>
              {fxMeta && (
              <Text style={{ color: colors.sub, fontSize: 10, marginTop: spacing.xs }}>
                {(uiI18n.t("common.fx"))+`: 1 USD → ${(fxMeta.rate||1).toFixed(4)} ${fxMeta.currency}${fxMeta.fxTs? ' @ '+new Date(fxMeta.fxTs).toLocaleDateString():''}`}
              </Text>
            )}
          </View>

          {/* List */}
      <View style={{ marginTop: spacing.lg, maxHeight: 360 }}>
            {loading ? (
              <ActivityIndicator color="#FFD700" />
            ) : (
              <FlatList
        data={data}
                keyExtractor={item => item.id}
                getItemLayout={(_, index) => ({ length: 84, offset: 84 * index, index })}
                ListEmptyComponent={<Text style={{ color: colors.sub }}>{uiI18n.t("refillSheet.noSupplementPrices")}</Text>}
                renderItem={renderItem}
              />
            )}
            {!showAll && results.length > 5 && !loading && (
              <Pressable onPress={() => setShowAll(true)} style={{ alignSelf: 'center', marginTop: spacing.sm }}>
                <Text style={{ color: "#FFD700", fontSize: 14, fontWeight: '600' }}>{uiI18n.t("common.showAll")}</Text>
              </Pressable>
            )}
          </View>

          {/* Footer actions */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: colors.muted, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{uiI18n.t("ai.close")}</Text>
            </Pressable>
            <Pressable style={{ flex: 1, backgroundColor: colors.gold, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: '#000', fontWeight: '700' }}>{uiI18n.t("medications.reserve")}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>

      {/* Price Contribution Modal */}
      <Modal visible={showContributionModal} animationType="slide" transparent onRequestClose={closeContributionModal}>
        <KeyboardForm><View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: spacing.lg }}>
          <View style={{
            backgroundColor: colors.bg,
            borderRadius: radius.xl,
            padding: spacing.lg,
            maxHeight: '80%'
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>
                {uiI18n.t("ai.helpUsGetPrice")}
              </Text>
              <Pressable onPress={closeContributionModal} style={{ padding: spacing.xs }}>
                <Text style={{ color: colors.sub, fontSize: 24 }}>×</Text>
              </Pressable>
            </View>

            {/* Form */}
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} 
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ gap: spacing.md }}>
                <Text style={{ color: colors.sub, fontSize: 14, marginBottom: spacing.sm }}>
                  {uiI18n.t("ai.contributionDescription")}
                </Text>

                {/* Supplement Name */}
                <View>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500', marginBottom: spacing.xs }}>
                    {uiI18n.t("ai.supplementName")} *
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: colors.muted,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      color: colors.text,
                      fontSize: 16
                    }}
                    value={contributionData.supplementName}
                    onChangeText={(text) => setContributionData(prev => ({ ...prev, supplementName: text }))}
                    placeholder={uiI18n.t("ai.supplementNamePlaceholder")}
                    placeholderTextColor={colors.sub}
                  />
                </View>

                {/* Brand */}
                <View>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500', marginBottom: spacing.xs }}>
                    {uiI18n.t("supplements.supplementBrand")}
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: colors.muted,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      color: colors.text,
                      fontSize: 16
                    }}
                    value={contributionData.brand}
                    onChangeText={(text) => setContributionData(prev => ({ ...prev, brand: text }))}
                    placeholder={uiI18n.t("ai.brandPlaceholder")}
                    placeholderTextColor={colors.sub}
                  />
                </View>

                {/* Dosage */}
                <View>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500', marginBottom: spacing.xs }}>
                    {uiI18n.t("ai.dosage")}
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: colors.muted,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      color: colors.text,
                      fontSize: 16
                    }}
                    value={contributionData.dosage}
                    onChangeText={(text) => setContributionData(prev => ({ ...prev, dosage: text }))}
                    placeholder={uiI18n.t("ai.dosagePlaceholder")}
                    placeholderTextColor={colors.sub}
                  />
                </View>

                {/* Price */}
                <View>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500', marginBottom: spacing.xs }}>
                    {uiI18n.t("medications.sort.price")} *
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: colors.muted,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      color: colors.text,
                      fontSize: 16
                    }}
                    value={contributionData.price}
                    onChangeText={(text) => setContributionData(prev => ({ ...prev, price: text }))}
                    placeholder={uiI18n.t("ai.pricePlaceholder")}
                    placeholderTextColor={colors.sub}
                    keyboardType="numeric"
                  />
                </View>

                {/* Quantity */}
                <View>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500', marginBottom: spacing.xs }}>
                    {uiI18n.t("ui.quantityPackageSize")}
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: colors.muted,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      color: colors.text,
                      fontSize: 16
                    }}
                    value={contributionData.quantity}
                    onChangeText={(text) => setContributionData(prev => ({ ...prev, quantity: text }))}
                    placeholder={uiI18n.t("ai.quantityPlaceholder")}
                    placeholderTextColor={colors.sub}
                  />
                </View>

                {/* Store Name */}
                <View>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500', marginBottom: spacing.xs }}>
                    {uiI18n.t("ui.storeName")} *
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: colors.muted,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      color: colors.text,
                      fontSize: 16
                    }}
                    value={contributionData.storeName}
                    onChangeText={(text) => setContributionData(prev => ({ ...prev, storeName: text }))}
                    placeholder={uiI18n.t("ai.storeNamePlaceholder")}
                    placeholderTextColor={colors.sub}
                  />
                </View>

                {/* Store Address */}
                <View>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500', marginBottom: spacing.xs }}>
                    {uiI18n.t("ui.storeAddress")}
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: colors.muted,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      color: colors.text,
                      fontSize: 16
                    }}
                    value={contributionData.storeAddress}
                    onChangeText={(text) => setContributionData(prev => ({ ...prev, storeAddress: text }))}
                    placeholder={uiI18n.t("ai.storeAddressPlaceholder")}
                    placeholderTextColor={colors.sub}
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
              <Pressable onPress={closeContributionModal} style={{ flex: 1, backgroundColor: colors.muted, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{uiI18n.t("healthAnalytics.cancel")}</Text>
              </Pressable>
              <Pressable onPress={submitContribution} style={{ flex: 1, backgroundColor: '#10b981', borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: '#ffffff', fontWeight: '700' }}>{uiI18n.t("ai.submitContribution")}</Text>
              </Pressable>
            </View>
          </View>
        </View></KeyboardForm>
      </Modal>
    </Modal>
  );
}



export default function SupplementRefillModal(props: Props) {
  return getRegion() === 'US' ? <USRefillModal {...props} /> : <MexicoSupplementRefillModal {...props} />;
}
