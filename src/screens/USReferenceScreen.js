import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PremiumEntitlementService } from '../services/premiumEntitlementService';
import PremiumUpgradeScreen from './PremiumUpgradeScreen';
import { usReference, costPlusSearchUrl } from '../services/usReferenceService';
import notices from '../legal/usDisclaimers.json';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GoldHealthIcon from '../components/GoldHealthIcon';
import PremiumButton from '../components/PremiumButton';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FAB_SCROLL_PADDING } from '../layout/fabLayout';
import { styles as app } from './appStyles';
const modes = { drugs: 'Drug search and labels', interactions: 'Interaction label text', recalls: 'FDA recalls', 'fda-labels': 'FDA labels', nadac: 'Acquisition cost', pharmacies: 'US pharmacies' };
export default function USReferenceScreen({ onClose, initialMode = 'drugs', initialQuery = '', drugName = '' }) {
  const insets = useSafeAreaInsets();
  const { getCardBackgroundColor, getCardBorderColor, getSubTextColor, getAccentColor } = useWallpaper();
  const cardBg = getCardBackgroundColor() + 'CC', border = getCardBorderColor(), sub = getSubTextColor(), accent = getAccentColor();
  
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [entitlement, setEntitlement] = useState(null);
  const [mode, setMode] = useState(initialMode);
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  
  useEffect(() => {
    checkPremiumAccess();
  }, []);
  
  const checkPremiumAccess = async () => {
    const ent = await PremiumEntitlementService.getInstance().checkPremiumAccess();
    setEntitlement(ent);
    if (!ent.hasPremiumAccess && (initialMode === 'pharmacies' || initialMode === 'drugs')) {
      setShowUpgrade(true);
    }
  };
  
  if (showUpgrade && entitlement) {
    return <PremiumUpgradeScreen 
      onClose={onClose} 
      entitlement={entitlement} 
      feature={initialMode === 'pharmacies' ? 'pharmacy' : 'general'} 
    />;
  }
  const [data, setData] = useState(null);
  const [label, setLabel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const load = async (kind, params) => {
    const ent = await PremiumEntitlementService.getInstance().checkPremiumAccess();
    if (!ent.hasPremiumAccess && (kind === 'pharmacies' || kind === 'drugs' || kind === 'nadac' || kind === 'recalls' || kind === 'interactions' || kind === 'fda-labels' || kind === 'labels' || kind === 'label')) {
      setEntitlement(ent);
      setShowUpgrade(true);
      return;
    }
    
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setError(''); setData(null); setLabel(null);
    try {
      const result = await usReference(kind, params, controller.signal);
      if (controller.signal.aborted) return;
      if (kind === 'label') setLabel(result); else setData(result);
    } catch (e) {
      console.warn('USReference load failed:', e?.message || e);
      if (!controller.signal.aborted) setError(require('../i18n').default.t('errors.generic'));
    }
    finally { if (!controller.signal.aborted) setBusy(false); }
  };
  const search = () => load(mode === 'interactions' ? 'drugs' : mode, mode === 'pharmacies' ? { zip: query.trim(), city: city.trim(), state: state.toUpperCase().trim() } : mode === 'nadac' ? { ndc: query.trim() } : { name: query.trim() });
  const pick = key => { request.current?.abort(); setBusy(false); setMode(key); setData(null); setLabel(null); setError(''); setQuery(''); };
  const link = (title, url) => <TouchableOpacity accessibilityRole="link" onPress={() => Linking.openURL(url).catch(() => setError('Could not open the source link.'))} style={styles.linkButton}><Text style={styles.link}>{title} ↗</Text></TouchableOpacity>;
  const isMedicine = mode === 'drugs' || mode === 'fda-labels';
  const tool = TOOLS.find(t => t.key === mode || (t.key === 'drugs' && isMedicine)) || TOOLS[0];
  const placeholder = mode === 'pharmacies' ? 'ZIP code' : mode === 'nadac' ? '11-digit NDC from the package' : mode === 'interactions' ? 'First medicine name' : 'Medicine name, e.g. ibuprofen';
  const hint = mode === 'nadac' ? 'Typical pharmacy acquisition cost - pharmacy acquisition cost, not your price. Enter the exact 11-digit NDC from the package; do not guess a match.' : mode === 'pharmacies' ? 'Search by ZIP, or leave ZIP blank and enter city and state. Registry entries are not a recommendation.' : mode === 'recalls' ? 'Type a medicine name to see FDA safety recalls.' : mode === 'interactions' ? 'Search one medicine, pick the exact product, then read what its official label says about other medicines.' : 'Search a medicine, pick the exact one, then read its official label (uses, warnings, side effects).';
  return <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 0) + 12, paddingBottom: FAB_SCROLL_PADDING }]} keyboardShouldPersistTaps="handled">
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back" onPress={onClose} style={app.headerHomeButton}><Image source={require('../../assets/AuricRX_home_button_across_screens.png')} style={app.headerHomeIcon} resizeMode="contain" /></TouchableOpacity>
    <DynamicText type="primary" style={[styles.h1, { fontFamily: 'Inter_700Bold' }]}>Look up a medicine</DynamicText>
    <Text style={[styles.intro, { color: sub, fontFamily: 'Inter_400Regular' }]}>Official US information about medicines, recalls, prices and pharmacies.</Text>
    <View style={styles.grid}>{TOOLS.map(t => {
      const active = t === tool;
      return <TouchableOpacity key={t.key} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => pick(t.key)} activeOpacity={0.8} style={[styles.tool, { backgroundColor: active ? accent + '14' : cardBg, borderColor: active ? accent : border, borderWidth: active ? 2.5 : 2 }]}>
        <GoldHealthIcon name={t.icon} />
        <View style={{ flex: 1 }}><DynamicText type="card" style={[styles.toolTitle, { fontFamily: 'Inter_700Bold' }]}>{t.title}</DynamicText><Text style={[styles.toolSub, { color: sub, fontFamily: 'Inter_400Regular' }]}>{t.sub}</Text></View>
        {active && <Ionicons name="checkmark-circle" size={22} color={accent} />}
      </TouchableOpacity>;
    })}</View>
    <View style={[styles.panel, { backgroundColor: cardBg, borderColor: border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}><GoldHealthIcon name={tool.icon} /><DynamicText type="card" style={[styles.panelTitle, { fontFamily: 'Inter_700Bold' }]}>{tool.title}</DynamicText></View>
      <Text style={[styles.hint, { color: sub }]}>{hint}</Text>
      {isMedicine && <View style={[styles.segment, { borderColor: border }]}>{[['drugs', 'DailyMed (NLM)'], ['fda-labels', 'FDA label database']].map(([k, l]) => <TouchableOpacity key={k} onPress={() => mode !== k && pick(k)} style={[styles.segItem, mode === k && { backgroundColor: accent + '22' }]}><Text style={[styles.segText, { color: mode === k ? accent : sub }]}>{l}</Text></TouchableOpacity>)}</View>}
      <View style={[styles.inputRow, { borderColor: border }]}>
        <Ionicons name="search" size={18} color={accent} style={{ marginRight: 8 }} />
        <TextInput accessibilityLabel={placeholder} placeholder={placeholder} placeholderTextColor="#8C9AB0" style={styles.input} value={query} onChangeText={setQuery} onSubmitEditing={search} returnKeyType="search" keyboardType={mode === 'nadac' || mode === 'pharmacies' ? 'number-pad' : 'default'} />
      </View>
      {mode === 'pharmacies' && <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput accessibilityLabel="City" placeholder="City (if no ZIP)" placeholderTextColor="#8C9AB0" style={[styles.inputPlain, { borderColor: border }, { flex: 2 }]} value={city} onChangeText={setCity} />
        <TextInput accessibilityLabel="State" placeholder="State" placeholderTextColor="#8C9AB0" style={[styles.inputPlain, { borderColor: border }, { flex: 1 }]} value={state} onChangeText={setState} maxLength={2} autoCapitalize="characters" />
      </View>}
      <PremiumButton disabled={busy} onPress={search} style={[styles.primary, busy && { opacity: 0.6 }]}><Text style={[styles.primaryText, { fontFamily: 'Inter_700Bold' }]}>{busy ? 'Searching…' : 'Search'}</Text></PremiumButton>
    </View>
    {busy && <ActivityIndicator color={GOLD} />}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {data && <>
      {!!data.results?.some(item => item.rxcui) && <Text style={styles.step}>Pick the exact medicine</Text>}
      {!!data.results?.some(item => item.setid && !item.sections) && <Text style={styles.step}>Pick the product label</Text>}
      {!data.results?.length && <Text style={styles.body}>{mode === 'interactions' ? `No records returned by this ${data.source} query as of ${data.retrievedAt}. No result does not mean a combination is safe. Try another spelling or open the official source.` : 'No records returned by this query. This is not a medical conclusion. Try another spelling or open the official source.'}</Text>}
      {(data.results || []).map((item, index) => {
        const tap = item.rxcui ? () => load('labels', { rxcui: item.rxcui }) : item.setid ? () => load('label', { setid: item.setid }) : null;
        const Wrap = tap ? TouchableOpacity : View;
        return <Wrap key={item.rxcui || item.setid || item.npi || index} onPress={tap || undefined} activeOpacity={0.8} style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={[styles.cardTitle, { flex: 1 }]}>{item.name || item.title || item.description}</Text>{tap && <Text style={styles.chev}>▶</Text>}</View>
          {item.rxcui && <Text style={styles.muted}>RxCUI {item.rxcui} · tap to see labels</Text>}
          {item.setid && <><Text style={styles.muted}>Label published {item.updatedAt || 'date not supplied'} · tap to read</Text>{link('Open DailyMed label', item.sourceUrl)}</>}
          {!!item.text && <Text style={styles.body}>{item.text}</Text>}
          {!!item.date && <Text style={styles.muted}>Source date: {item.date}</Text>}
          {!!item.status && <Text style={styles.muted}>{item.status} / {item.recallNumber}</Text>}
          {!!item.npi && <><Text style={styles.muted}>NPI {item.npi} / Updated {item.updatedAt || 'not supplied'}</Text>{item.addresses?.map((address, i) => <View key={i}><Text style={styles.body}>{address.address}</Text>{!!address.phone && link(address.phone, `tel:${address.phone.replace(/[^+0-9]/g, '')}`)}</View>)}</>}
          {item.costPerUnit != null && <Text style={styles.body}>NDC {item.ndc} / USD {item.costPerUnit} per {item.unit} acquisition cost / Effective {item.effectiveDate} / Data as of {item.asOfDate || 'not supplied'}</Text>}
          {item.sections?.map((section, i) => <View key={i}><Text style={styles.cardTitle}>{section.title}</Text><Text selectable style={styles.body}>{section.text}</Text></View>)}
        </Wrap>;
      })}
      <View style={styles.sourceBox}>
        <Text style={styles.small}>{data.title || data.source} / Retrieved {data.retrievedAt}{data.dataDate ? ` / Source data date ${data.dataDate}` : ''}</Text>
        {!!data.attribution && <Text style={styles.small}>{data.attribution}</Text>}
        {!!data.disclaimer && <Text style={styles.small}>{data.disclaimer}</Text>}
        {!!data.priceDisclaimer && <Text style={styles.small}>{data.priceDisclaimer}</Text>}
        {link('Open official source', data.sourceUrl)}
      </View>
    </>}
    {label && <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
      {link('Open complete DailyMed label', label.sourceUrl)}
      <Text style={styles.muted}>In this label: {label.sections.map(s => s.title).join(' / ') || 'No supported sections extracted. Open the complete label.'}</Text>
      {(mode === 'interactions' ? label.sections.filter(section => section.title === 'Drug Interactions') : label.sections).map((section, i) => <View key={i}><Text style={styles.cardTitle}>{section.title}</Text><Text selectable style={styles.body}>{section.text}</Text></View>)}
      {mode === 'interactions' && !label.sections.some(s => s.title === 'Drug Interactions') && <Text style={styles.body}>No interaction found in DailyMed/NLM as of {label.retrievedAt}. This does not mean the combination is safe.</Text>}
      <View style={styles.sourceBox}><Text style={styles.small}>{label.attribution}</Text><Text style={styles.small}>{label.disclaimer}</Text></View>
    </View>}
    {mode === 'nadac' && <>{link('Check price at Cost Plus Drugs', costPlusSearchUrl(drugName || (mode === 'nadac' ? '' : query)))}<Text style={styles.small}>{notices.prices}</Text><Text style={styles.small}>{notices.costplus}</Text></>}
    {mode === 'recalls' && <Text style={styles.small}>{notices.recalls}</Text>}
    {mode === 'interactions' && <Text style={styles.small}>{notices.interactions.replace('[DailyMed/NLM]', 'DailyMed/NLM').replace('[date]', label?.updatedAt || 'shown on the selected label')}</Text>}
  </ScrollView>;
}
const GOLD = '#D4AF37';
const NAVY = '#0B1F3A';
const TOOLS = [
  { key: 'drugs', icon: 'medical-outline', title: 'Medicine info', sub: 'Uses, warnings and side effects from the official label' },
  { key: 'interactions', icon: 'git-compare-outline', title: 'Check two medicines together', sub: 'What the label says about other medicines' },
  { key: 'recalls', icon: 'warning-outline', title: 'Recalls', sub: 'FDA safety recalls' },
  { key: 'nadac', icon: 'pricetag-outline', title: 'Price check', sub: 'Typical pharmacy cost and Cost Plus Drugs' },
  { key: 'pharmacies', icon: 'storefront-outline', title: 'Find a pharmacy', sub: 'Pharmacies near a ZIP code or city' },
];
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#101B2A' }, content: { padding: 20, paddingTop: 48, paddingBottom: 50, gap: 12 },
    h1: { fontSize: 24, marginTop: 4 }, intro: { color: '#C9D3E0', fontSize: 14, lineHeight: 20 },
  grid: { gap: 10 }, tool: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18 },
  toolTitle: { fontSize: 16 }, toolSub: { color: '#C9D3E0', fontSize: 12, marginTop: 2 },
  panel: { padding: 16, borderRadius: 18, borderWidth: 2, gap: 10 }, panelTitle: { fontSize: 17 }, hint: { color: '#C9D3E0', fontSize: 13, lineHeight: 19 },
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: 10, padding: 2 }, segItem: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' }, segText: { fontSize: 12, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B1626', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  input: { flex: 1, color: 'white', paddingVertical: 12, fontSize: 15 }, inputPlain: { color: 'white', backgroundColor: '#0B1626', borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15 },
  primary: { paddingVertical: 14, alignItems: 'center' }, primaryText: { fontSize: 16 },
  step: { color: GOLD, fontSize: 16, fontWeight: '700', marginTop: 4 }, error: { color: '#F87171', fontSize: 14 },
  card: { padding: 14, borderWidth: 2, borderRadius: 18, gap: 4 }, cardTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 4 }, chev: { color: GOLD, fontSize: 14, marginLeft: 8 },
  body: { color: '#F0F0F0', fontSize: 14, lineHeight: 21, marginVertical: 4 }, muted: { color: '#9AA8BC', fontSize: 12, lineHeight: 18 },
  sourceBox: { borderTopWidth: 1, borderTopColor: GOLD + '33', paddingTop: 8, marginTop: 4 }, small: { color: '#8C9AB0', fontSize: 11, lineHeight: 16, marginVertical: 2 },
  linkButton: { paddingVertical: 8, minHeight: 36 }, link: { color: GOLD, fontSize: 14, fontWeight: '600' },
});
