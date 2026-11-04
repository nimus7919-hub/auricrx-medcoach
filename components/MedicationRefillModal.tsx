import { getRegion } from '../src/services/region';
import USRefillModal from '../src/components/USRefillModal';
import Modal from '../src/components/BackModal';
import uiI18n from "../src/i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import KeyboardForm from './KeyboardForm';
import MedicationAutocomplete from './MedicationAutocomplete';
import { contributeMedication } from '../src/services/medicationCatalog';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, Animated, Easing, FlatList, ActivityIndicator, Image, Linking, Alert, TextInput, ScrollView } from 'react-native';
import * as Location from "expo-location";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, spacing } from "../theme/tokens";
import { openInMaps } from "../utils/maps";
import { API_BASE } from "../src/config/api";
import { findNearbyPharmacies, getMedicationPrices, StorePrice, QQPQuote, formatPresentation } from "../services/pharmacySearch";
// ENABLED: EnhancedMedicationSearch for Excel integration with safety measures
const EnhancedMedicationSearch = require("../services/enhancedMedicationSearch");
import medicationDataCollector from "../services/medicationDataCollector";

interface MedicationInfo { name: string; dosage: string; activeIngredient?: string; strength?: string; form?: string; ean?: string; quantity?: string; quantityUnit?: string; lastRefill?: string }
interface Props { 
  visible: boolean; 
  onClose: () => void; 
  medication: MedicationInfo; 
  strings: any; 
  lang: string; 
  userCountry?: string; 
  onRefillComplete?: (medicationName: string) => void;
  // Pre-loaded data for faster loading
  preloadedPharmacies?: any[];
  preloadedCoords?: { latitude: number; longitude: number };
  preloadedCurrency?: string;
  preloadedFxMeta?: any;
}

function MexicoMedicationRefillModal({ visible, onClose, medication, strings, lang, userCountry, onRefillComplete, preloadedPharmacies, preloadedCoords, preloadedCurrency, preloadedFxMeta }: Props) {
  useUILanguage();
  const catalogSelection = useRef<{ name: string; components: any[] } | null>(null);
  const slide = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  const [placements, setPlacements] = useState<Array<{ id: string; title: string; chain: string }>>([]);
  useEffect(() => {
    if (!visible) return;
    let active = true;
    setPlacements([]);
    fetch(API_BASE + '/api/prices/placements').then(r => r.ok ? r.json() : { placements: [] })
      .then(j => { if (active) setPlacements(j.placements || []); }).catch(() => {});
    return () => { active = false; };
  }, [visible]);
  const [results, setResults] = useState<StorePrice[]>([]);
  const [qqpQuote, setQqpQuote] = useState<QQPQuote | null>(null);
  const [radiusKm, setRadiusKm] = useState(15);
  const requestId = useRef(0);
  const [priceError, setPriceError] = useState(false);
  const [sort, setSort] = useState<'distance'|'price'|'name'>('distance');
  const [descending, setDescending] = useState(false);
  const [fxMeta, setFxMeta] = useState<{ currency: string; rate: number; fxTs?: number }|null>(null);
  const SORT_KEY = 'AURIC_SORT';
  
  // ENABLED: Enhanced medication search instance for Excel integration



  const [showAll, setShowAll] = useState(false);
  const [currency, setCurrency] = useState<string>(uiI18n.t("common.usd"));
  const [mockMode, setMockMode] = useState(false);
  const [coordsUsed, setCoordsUsed] = useState<{lat:number; lon:number}|null>(null);
  const LAST_LOC_KEY = 'AURIC_LAST_LOC';

  // Price contribution modal state
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [contributionData, setContributionData] = useState({
    medicationName: '',
    strength: '',
    price: '',
    quantity: '',
    storeName: '',
    storeAddress: ''
  });
  const [selectedPharmacy, setSelectedPharmacy] = useState<StorePrice | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(slide, { toValue: 1, duration: 150, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
      load();
    } else {
      Animated.timing(slide, { toValue: 0, duration: 120, easing: Easing.in(Easing.ease), useNativeDriver: true }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  async function load(requestedRadius?: number) {
    const id = ++requestId.current;
    try {
      setLoading(true);
      setResults([]); setQqpQuote(null); setPriceError(false);
      
      // Use pre-loaded data if available for faster loading
      let hasCoords = !!preloadedCoords;
      let coords = preloadedCoords || { latitude: 0, longitude: 0 };
      let determinedCurrency: string = preloadedCurrency || uiI18n.t("common.usd");
      let near = preloadedPharmacies || [];
      
      // If no pre-loaded data, load it manually (fallback)
      if (!preloadedCoords || !preloadedPharmacies || !preloadedCurrency) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          try {
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            hasCoords = true;
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
                hasCoords = true;
              }
            }
          } catch {}
        }
        setCoordsUsed(hasCoords ? { lat: coords.latitude, lon: coords.longitude } : null);
        
        // Determine currency from country (reverse geocode); fall back to language mapping then USD
        if (!preloadedCurrency && hasCoords) {
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
        }
        setCurrency(determinedCurrency); // single definitive assignment
        
        // Load pharmacies if not pre-loaded
        if (!preloadedPharmacies && hasCoords) {
          try { near = await findNearbyPharmacies(coords.latitude, coords.longitude, lang); } catch { near = []; }
        }
      } else {
        // Use pre-loaded data
        setCoordsUsed(hasCoords ? { lat: coords.latitude, lon: coords.longitude } : null);
        setCurrency(determinedCurrency);
        console.log('🚀 Using pre-loaded refill data for faster loading');
      }
      
      let state: string | undefined;
      try { if (hasCoords) state = (await Location.reverseGeocodeAsync(coords))[0]?.region || undefined; } catch {}
      const { prices, meta, quote } = await getMedicationPrices(near, medication, { currency: uiI18n.t("common.mxn"), lat: hasCoords ? coords.latitude : undefined, lng: hasCoords ? coords.longitude : undefined, state, radiusKm: requestedRadius });
      if (id !== requestId.current) return;
      setRadiusKm(quote?.radius_km || requestedRadius || 50);
      setQqpQuote(quote || null);
      setResults(prices);
      setCurrency(uiI18n.t("common.mxn"));
      if (meta) setFxMeta(meta);
      setMockMode(false);
    } catch (e) {
      if (id !== requestId.current) return;
      setPriceError(true);
      console.warn('Refill load error', e);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  // Price contribution functions
  const openContributionModal = (pharmacy: StorePrice) => {
    setSelectedPharmacy(pharmacy);
    catalogSelection.current = null;
    setContributionData({
      medicationName: medication.name || '',
      strength: medication.dosage || '',
      price: '',
      quantity: medication.quantity || '',
      storeName: pharmacy.name || '',
      storeAddress: pharmacy.address || ''
    });
    setShowContributionModal(true);
  };

  const submitContribution = async () => {
    // Validate form
    if (!contributionData.medicationName.trim() || !contributionData.price.trim() || !contributionData.storeName.trim()) {
      Alert.alert(
        uiI18n.t("ai.contributionError"),
        uiI18n.t("localized.appConstants.STRINGS.contributionErrorText"),
        [{ text: uiI18n.t("adminProfile.ok") }]
      );
      return;
    }

    try {
    contributeMedication(contributionData.medicationName, catalogSelection.current?.components || [], catalogSelection.current?.name);
      // Add contribution to data collector (sends to server)
      const contribution = await medicationDataCollector.addContribution({
        ...contributionData,
        pharmacyId: selectedPharmacy?.id || '',
        userLocation: coordsUsed,
        currency: currency
      });

      console.log('📊 Price contribution saved to server:', contribution);

      Alert.alert(
        uiI18n.t("ai.contributionSuccess"),
        uiI18n.t("ai.contributionSuccessText"),
        [
          {
            text: uiI18n.t("adminProfile.ok"),
            onPress: () => {
              setShowContributionModal(false);
              setSelectedPharmacy(null);
              catalogSelection.current = null;
    setContributionData({
                medicationName: '',
                strength: '',
                price: '',
                quantity: '',
                storeName: '',
                storeAddress: ''
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Failed to save contribution:', error);
      Alert.alert(
        uiI18n.t("adminProfile.error"),
        uiI18n.t("ui.failedToSaveYourContributionPleaseTryAgain"),
        [{ text: uiI18n.t("adminProfile.ok") }]
      );
    }
  };

  const closeContributionModal = () => {
    setShowContributionModal(false);
    setSelectedPharmacy(null);
    catalogSelection.current = null;
    setContributionData({
      medicationName: '',
      strength: '',
      price: '',
      quantity: '',
      storeName: '',
      storeAddress: ''
    });
  };

  const data = useMemo(() => {
    let list = results.filter(r => r.distanceMiles != null && r.distanceMiles * 1.609344 <= radiusKm);
    console.log('🔍 MedicationRefillModal - Before sorting:', list.slice(0, 3).map(r => ({
      name: r.name,
      distanceMiles: r.distanceMiles,
      price: r.price
    })));
    
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
      
      console.log(`🔍 Sorting ${a.name} (${a.distanceMiles}) vs ${b.name} (${b.distanceMiles}): cmp=${cmp}, descending=${descending}`);
      return descending ? -cmp : cmp;
    });
    
    console.log('🔍 MedicationRefillModal - After sorting:', list.slice(0, 3).map(r => ({
      name: r.name,
      distanceMiles: r.distanceMiles,
      price: r.price
    })));
    return showAll ? list : list.slice(0,5);
  }, [results, radiusKm, showAll, sort, descending, uiI18n.resolvedLanguage]);

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
    // Removed default assumption to prevent misleading package size info
    const strengthDisplay = strengths.join(' / ');
    const display = [strengthDisplay || null, packageSize].filter(Boolean).join(' • ');
    return { display, strengthDisplay, packageSize };
  }, [medication.name, medication.dosage, uiI18n.resolvedLanguage]);
  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });

  // Use country-based distance units: miles for USA, kilometers for other countries
  const useKm = userCountry !== 'US';
  console.log('💊 MEDICATION MedicationRefillModal - userCountry:', userCountry, 'useKm:', useKm);
  function formatDistance(mi?: number) {
    console.log('💊 MEDICATION formatDistance called with:', { mi, useKm, userCountry });
    if (mi == null) return '';
    if (!useKm) {
      console.log('💊 MEDICATION Using miles:', `${mi.toFixed(1)} mi`);
      return `${mi.toFixed(1)} mi`;
    }
    const km = mi * 1.60934;
    console.log(`💊 MEDICATION Conversion: ${mi} miles × 1.60934 = ${km} km`);
    console.log(`💊 MEDICATION Final display: ${km.toFixed(1)} km`);
    return `${km.toFixed(1)} km`;
  }
  // currency formatting
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

  // Extract strength and quantity from Excel medication data
  const extractStrengthAndQuantity = (medicinas: string, unidades: string = '') => {
    if (!medicinas) return '';
    
    const combined = `${medicinas} ${unidades}`.toLowerCase();
    
    // Extract multi-component strength patterns (e.g., "50 mg / 500 mg", "50mg/500mg", "100/25 mg")
    // This regex captures patterns like: "50 mg / 500 mg", "50mg/500mg", "50/500 mg"
    const multiStrengthRegex = /(\d+\s*(?:mg|mcg|g|ml|iu|%)\s*\/\s*\d+\s*(?:mg|mcg|g|ml|iu|%))/i;
    const multiStrengthMatch = combined.match(multiStrengthRegex);
    
    // If multi-component strength found, use it directly
    let strength = '';
    if (multiStrengthMatch) {
      strength = multiStrengthMatch[0].trim();
    } else {
      // Extract single strength patterns (e.g., "400 mg", "500mg", "250mg/5ml")
      const strengthRegex = /(\d+(?:\/\d+)?\s*(?:mg|g|ml|mcg|iu|%))/gi;
      const strengthMatches = combined.match(strengthRegex);
      strength = strengthMatches ? strengthMatches.join(' / ') : '';
    }
    
    // Extract quantity patterns (e.g., "20 tablets", "30 tabs", "60 comprimidos")
    // Enhanced to capture more variations including Spanish
    const quantityRegex = /(\d+)\s*(?:tablet|tab|capsule|cap|pill|comprimido|tableta|capsula|ampoule|ampolla|ml|vial|strip|tira|piece|pieza|aplicador|sobre|frasco|softgel|gragea)/gi;
    let quantityMatches = combined.match(quantityRegex);
    
    // If quantity not found in combined string, try just the unidades field
    if (!quantityMatches && unidades) {
      quantityMatches = unidades.match(quantityRegex);
    }
    
    const quantity = quantityMatches ? quantityMatches[0] : '';
    
    // Format the result: "Strength • Quantity" or just "Strength" if no quantity
    const parts = [strength, quantity].filter(Boolean);
    const result = parts.join(' • ');
    
    console.log(`🔍 Extract strength/quantity: "${medicinas}" + "${unidades}" -> "${result}"`);
    
    return result || medicinas; // Fallback to full name if no extraction possible
  };

  function renderItem({ item }: { item: StorePrice }) {
    if (!item || typeof item !== 'object') return null;
    const isLowest = lowestPrice != null && typeof item.price === 'number' && item.price === lowestPrice;
    console.log('[PHARMACY DEBUG] Rendering pharmacy:', item.name, 'excelMatch:', item.excelMatch);
    console.log('[PHARMACY DEBUG] excelMatch.medicinas:', item.excelMatch?.medicinas);
    console.log('[PHARMACY DEBUG] excelMatch.unidades:', item.excelMatch?.unidades);
    return (
      <Pressable
        onPress={() => item.online
          ? (item.purchase_url && !item.priceNotAvailable ? Linking.openURL(item.purchase_url) : undefined)
          : openInMaps({ lat: item.lat, lon: item.lon, address: item.address })}
        accessibilityRole="button"
        accessibilityLabel={item.online ? uiI18n.t("ui.openValue", { value1: item.name }) : uiI18n.t("ui.openDirectionsToValue", { value1: item.name })}
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
              <Text style={{ color: colors.sub, fontSize: 11 }}>{formatPresentation(item, key => uiI18n.t(key))}</Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems:'flex-end', gap:4 }}>
          {item.priceNotAvailable ? (
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={{ color: colors.sub, fontSize:14, fontWeight:'500', fontStyle: 'italic' }}>
                {item.pharmacyNotAvailable ? 
                  (lang === 'es' ? uiI18n.t("ui.farmaciaNoDisponible") : 
                   lang === 'zh' ? '药店不可用' : 
                   uiI18n.t("ui.pharmacyNotAvailable")) :
                  (lang === 'es' ? uiI18n.t("ui.precioNoDisponible") : 
                   lang === 'zh' ? '价格不可用' : 
                   uiI18n.t("supplements.priceNotAvailable"))
                }
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
            <Text style={{ color: item.stale ? colors.sub : colors.text, fontSize:18, fontWeight:'700' }}>
              {typeof item.price==='number'? formatPrice(item.price): '—'}
            </Text>
          )}
          {item.observed_at && (
            <Text style={{ color: colors.sub, fontSize: 11, maxWidth: 210 }}>
              {lang === 'es'
                ? uiI18n.t("ui.precioAproximadoAl") + new Date(item.observed_at).toLocaleDateString('es-MX') + uiI18n.t("ui.puedeVariarEnTienda")
                : uiI18n.t("ui.approximatePriceAsOf") + new Date(item.observed_at).toLocaleDateString('en-US') + uiI18n.t("ui.mayVaryInStore")}
            </Text>
          )}
          {item.verified && !item.priceNotAvailable && <Text style={{ color: colors.sub, fontSize: 11 }}>{uiI18n.t("ui.precioVerificado")}</Text>}
          {item.purchase_url && !item.priceNotAvailable && <Pressable onPress={() => Linking.openURL(item.purchase_url!)}><Text style={{ color: colors.sub }}>{uiI18n.t("ui.mercadoLibre")}</Text></Pressable>}
          {isLowest && !item.priceNotAvailable && (
            <View style={{ backgroundColor: colors.gold, paddingHorizontal:8, paddingVertical:2, borderRadius: radius.pill }}>
              <Text style={{ color:'#000', fontSize:10, fontWeight:'700' }}>{uiI18n.t("medications.lowest")}</Text>
            </View>
          )}
          {!item.online && (<Pressable onPress={() => openInMaps({ lat: item.lat, lon: item.lon, address: item.address })} style={{ backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: 6, minHeight:32, justifyContent:'center' }}>
            <Text style={{ color:'#000', fontWeight:'700', fontSize:12 }}>{uiI18n.t("common.directions")}</Text>
          </Pressable>)}
        </View>
      </Pressable>
    );
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
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
              {medication.name} • {medication.dosage}{medication.quantity && medication.quantity !== 'N/A' ? uiI18n.t("healthAnalytics.value", { value1: medication.quantity }) : ""}{medication.lastRefill ? ` • ${(uiI18n.t("medications.lastRefill"))}: ${medication.lastRefill}` : ""}
            </Text>
            <Text style={{ color: colors.gold, fontSize: 20, fontWeight: '700' }}>{uiI18n.t('refillSheet.pricesFor', { name: medication.name })}</Text>
            {qqpQuote?.presentations?.map((p, i) => <Text key={i} style={{ color: colors.sub }}>{formatPresentation(p, key => uiI18n.t(key))}</Text>)}
            {qqpQuote && (
              <View style={{ backgroundColor: '#10243A', borderColor: colors.gold, borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 }}>
                <Text style={{ color: colors.gold, fontWeight: '600' }}>
                  {uiI18n.t("localized.MedicationRefillModal.text541")}{qqpQuote.as_of ? ' - ' + String(qqpQuote.as_of).slice(0, 10) : ''}
                </Text>
                {(['state', 'national'] as const).map(scope => <Text key={scope} style={{ color: '#fff', fontSize: 12 }}>{uiI18n.t('refillSheet.' + scope)}: {qqpQuote[scope]?.count ? `${formatPrice(qqpQuote[scope].min!)} ? ${formatPrice(qqpQuote[scope].max!)}` : uiI18n.t('refillSheet.noPrices')}</Text>)}
                <Text style={{ color: '#fff', fontSize: 10 }}>{uiI18n.t("ui.fuenteProfecoQuienEsQuienEnLosPreciosCcBy40")}</Text>
              </View>
            )}
            {priceError && <Text style={{ color: colors.gold }}>{uiI18n.t("localized.MedicationRefillModal.text550")}</Text>}
            {mockMode && (
              <View style={{ backgroundColor: '#fbbf24', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.xl }}>
                <Text style={{ color:'#000', fontSize:12, fontWeight:'600' }}>{uiI18n.t("ui.mockDataAddGooglePlacesApiKeyForLivePharmacies")}</Text>
              </View>
            )}
            {/* DISABLED: Excel data indicator removed since we're not using Excel data */}
            {/* {!mockMode && results.length > 0 && (
              <View style={{ backgroundColor: '#10b981', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.xl }}>
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>
                  📊 Real prices from Excel data
                </Text>
              </View>
            )} */}
            {coordsUsed && (
              <Text style={{ color: colors.sub, fontSize: 10 }}>
                {`📍 ${coordsUsed.lat.toFixed(4)}, ${coordsUsed.lon.toFixed(4)} • ${currency}`}
              </Text>
            )}
            <Text style={{ color: colors.text }}>{uiI18n.t('refillSheet.within', { radius: radiusKm })}</Text>
            {radiusKm < 250 && <Pressable accessibilityRole="button" disabled={loading} onPress={() => load(radiusKm < 100 ? 100 : 250)}><Text style={{ color: colors.gold }}>{uiI18n.t('refillSheet.expand')}</Text></Pressable>}
            {/* Sorting row */}
            <View style={{ flexDirection:'row', alignItems:'center', flexWrap:'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
              <Text style={{ color: colors.sub, fontSize: 12 }}>{uiI18n.t("refillSheet.sortBy")}</Text>
              {['distance','price','name'].map(key => {
                const label = uiI18n.t("refillSheet.sort." + key);
                const active = sort === key;
                return (
                  <Pressable accessibilityRole="button" accessibilityLabel={uiI18n.t("ui.sortByValue", { value1: label })} key={key} onPress={()=> { setSort(key as any); AsyncStorage.setItem(SORT_KEY, key).catch(()=>{}); }} style={{ backgroundColor: active? colors.gold: colors.muted, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill }}>
                    <Text style={{ color: active? '#000': colors.text, fontSize: 12 }}>{label}</Text>
                  </Pressable>
                );
              })}
              <Pressable accessibilityRole="button" accessibilityLabel={descending? uiI18n.t("common.ascending"):uiI18n.t("common.descending")} onPress={()=> setDescending(d=>!d)} style={{ backgroundColor: colors.muted, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill }}>
                <Text style={{ color: colors.text, fontSize: 12 }}>{descending? '↓':'↑'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={uiI18n.t("ui.refreshPharmacies")} onPress={()=>{ load(); }} style={{ backgroundColor: colors.muted, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill }}>
                <Text style={{ color: colors.text, fontSize: 12 }}>{uiI18n.t("appointments.refresh")}</Text>
              </Pressable>
            </View>
            {fxMeta && currency !== uiI18n.t("common.mxn") && (
              <Text style={{ color: colors.sub, fontSize: 10, marginTop: spacing.xs }}>
                {(uiI18n.t("common.fx"))+`: 1 USD → ${(fxMeta.rate||1).toFixed(4)} ${fxMeta.currency}${fxMeta.fxTs? ' @ '+new Date(fxMeta.fxTs).toLocaleDateString():''}`}
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
                ListHeaderComponent={placements.length ? <View style={{ padding: 12, gap: 8 }}>
                  {placements.map(ad => <View key={ad.id} style={{ padding: 10, backgroundColor: colors.muted }}>
                    <Text style={{ color: colors.sub }}>{uiI18n.t("ui.patrocinado")}{ad.chain}</Text>
                    <Text style={{ color: colors.text }}>{ad.title}</Text>
                    <Text style={{ color: colors.sub }}>{uiI18n.t("ui.consulteASuMedico")}</Text>
                  </View>)}
                </View> : null}
                ListEmptyComponent={<Text style={{ color: colors.sub }}>{uiI18n.t(qqpQuote?.national?.count ? 'refillSheet.noNearby' : 'refillSheet.noPrices')}</Text>}
                renderItem={renderItem}
              />
            )}
            {!showAll && results.length > 5 && !loading && (
              <Pressable onPress={() => setShowAll(true)} style={{ alignSelf: 'center', marginTop: spacing.sm }}>
                <Text style={{ color: colors.gold, fontSize: 14, fontWeight: '600' }}>{uiI18n.t("common.showAll")}</Text>
              </Pressable>
            )}
          </View>

          {/* Footer actions */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: colors.muted, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{uiI18n.t("ai.close")}</Text>
            </Pressable>
            {onRefillComplete && (
              <Pressable 
                onPress={() => {
                  onRefillComplete(medication.name);
                  onClose();
                }}
                style={{ flex: 1, backgroundColor: colors.gold, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#000', fontWeight: '700' }}>{uiI18n.t("common.refillComplete")}</Text>
              </Pressable>
            )}
            {!onRefillComplete && (
              <Pressable style={{ flex: 1, backgroundColor: colors.gold, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: '#000', fontWeight: '700' }}>{uiI18n.t("medications.reserve")}</Text>
              </Pressable>
            )}
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
                  {uiI18n.t("ui.helpUsImproveOurMedicationPriceDatabaseBySharingWhatYouFound")}
                </Text>

                {/* Medication Name */}
                <View>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500', marginBottom: spacing.xs }}>
                    {uiI18n.t("medications.medicationName")} *
                  </Text>
                  <MedicationAutocomplete
                    onSelect={(med: any) => { catalogSelection.current = med; setContributionData(prev => ({ ...prev, medicationName: med.name, strength: med.components.map((c: any) => `${c.strength || ''}${c.unit || ''}`).join('/') })); }}
                    style={{
                      backgroundColor: colors.muted,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      color: colors.text,
                      fontSize: 16
                    }}
                    value={contributionData.medicationName}
                    onChangeText={(text: string) => { catalogSelection.current = null; setContributionData(prev => ({ ...prev, medicationName: text })); }}
                    placeholder={uiI18n.t("localized.appConstants.STRINGS.medicationNamePlaceholder")}
                    placeholderTextColor={colors.sub}
                  />
                  {!!catalogSelection.current?.components.length && <Text style={{ color: colors.text, marginTop: 8 }}>
                    {catalogSelection.current.components.map((c: any) => c.name).filter(Boolean).join(', ')}
                  </Text>}
                </View>

                {/* Strength */}
                <View>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500', marginBottom: spacing.xs }}>
                    {uiI18n.t("ui.strengthDosage")}
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: colors.muted,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      color: colors.text,
                      fontSize: 16
                    }}
                    value={contributionData.strength}
                    onChangeText={(text) => setContributionData(prev => ({ ...prev, strength: text }))}
                    placeholder={uiI18n.t("medications.strengthPlaceholder")}
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

export default function MedicationRefillModal(props: Props) {
  return getRegion() === 'US' ? <USRefillModal {...props} /> : <MexicoMedicationRefillModal {...props} />;
}
