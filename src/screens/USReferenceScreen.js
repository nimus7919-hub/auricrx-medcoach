import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { usReference, costPlusSearchUrl } from '../services/usReferenceService';
import notices from '../legal/usDisclaimers.json';
const modes = { drugs: 'Drug search and labels', interactions: 'Interaction label text', recalls: 'FDA recalls', 'fda-labels': 'FDA labels', nadac: 'Acquisition cost', pharmacies: 'US pharmacies' };
export default function USReferenceScreen({ onClose, initialMode = 'drugs', initialQuery = '', drugName = '' }) {
  const [mode, setMode] = useState(initialMode);
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [data, setData] = useState(null);
  const [label, setLabel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const load = async (kind, params) => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setError(''); setData(null); setLabel(null);
    try {
      const result = await usReference(kind, params, controller.signal);
      if (controller.signal.aborted) return;
      if (kind === 'label') setLabel(result); else setData(result);
    } catch (e) { if (!controller.signal.aborted) setError(e.message); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  };
  const search = () => load(mode === 'interactions' ? 'drugs' : mode, mode === 'pharmacies' ? { zip: query.trim(), city: city.trim(), state: state.toUpperCase().trim() } : mode === 'nadac' ? { ndc: query.trim() } : { name: query.trim() });
  const link = (title, url) => <TouchableOpacity accessibilityRole="link" onPress={() => Linking.openURL(url).catch(() => setError('Could not open the source link.'))} style={styles.button}><Text style={styles.link}>{title}</Text></TouchableOpacity>;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <TouchableOpacity onPress={onClose} style={styles.button}><Text style={styles.link}>Back</Text></TouchableOpacity>
    <Text style={styles.title}>US reference information</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{Object.entries(modes).map(([key, title]) => <TouchableOpacity key={key} style={styles.button} onPress={() => { request.current?.abort(); setBusy(false); setMode(key); setData(null); setLabel(null); setError(''); setQuery(''); }}><Text style={[styles.link, mode === key && { textDecorationLine: 'underline' }]}>{title}</Text></TouchableOpacity>)}</View>
    <Text style={styles.body}>{mode === 'nadac' ? 'Typical pharmacy acquisition cost - pharmacy acquisition cost, not your price. Enter the exact 11-digit NDC from the package; do not guess a match.' : mode === 'pharmacies' ? 'Search by ZIP, or leave ZIP blank and enter city and state. Includes pharmacy taxonomy 3336C0003X and other 3336 pharmacy types. Registry entries are not a recommendation.' : 'Enter a drug name, select an RxNorm concept, then select the product label. Label sections are source text; the app does not assess your personal risk.'}</Text>
    <TextInput accessibilityLabel={mode === 'pharmacies' ? 'ZIP code' : mode === 'nadac' ? '11-digit NDC' : 'Drug name'} placeholder={mode === 'pharmacies' ? 'ZIP code' : mode === 'nadac' ? '11-digit NDC' : 'Drug name'} placeholderTextColor="#BAC5D5" style={styles.input} value={query} onChangeText={setQuery} onSubmitEditing={search} />
    {mode === 'pharmacies' && <><TextInput accessibilityLabel="City" placeholder="City (if no ZIP)" placeholderTextColor="#BAC5D5" style={styles.input} value={city} onChangeText={setCity} /><TextInput accessibilityLabel="State" placeholder="State, e.g. NY" placeholderTextColor="#BAC5D5" style={styles.input} value={state} onChangeText={setState} maxLength={2} autoCapitalize="characters" /></>}
    <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={search} style={styles.button}><Text style={styles.link}>Search</Text></TouchableOpacity>
    {busy && <ActivityIndicator color="#D4AF37" />}
    {!!error && <Text accessibilityRole="alert" style={styles.body}>{error}</Text>}
    {data && <>
      <Text style={styles.body}>{data.title || data.source} / Retrieved {data.retrievedAt}{data.dataDate ? ` / Source data date ${data.dataDate}` : ''}</Text>
      {!!data.attribution && <Text style={styles.body}>{data.attribution}</Text>}
      {!!data.disclaimer && <Text style={styles.body}>{data.disclaimer}</Text>}
      {!!data.priceDisclaimer && <Text style={styles.body}>{data.priceDisclaimer}</Text>}
      {link('Open official source', data.sourceUrl)}
      {!data.results?.length && <Text style={styles.body}>{mode === 'interactions' ? `No records returned by this ${data.source} query as of ${data.retrievedAt}. No result does not mean a combination is safe. Try another spelling or open the official source.` : 'No records returned by this query. This is not a medical conclusion. Try another spelling or open the official source.'}</Text>}
      {(data.results || []).map((item, index) => <View key={item.rxcui || item.setid || item.npi || index} style={styles.card}>
        <Text style={styles.title}>{item.name || item.title || item.description}</Text>
        {item.rxcui && <><Text style={styles.body}>RxCUI: {item.rxcui}</Text><TouchableOpacity style={styles.button} onPress={() => load('labels', { rxcui: item.rxcui })}><Text style={styles.link}>Choose a DailyMed label</Text></TouchableOpacity></>}
        {item.setid && <><Text style={styles.body}>Label published {item.updatedAt || 'date not supplied'}</Text><TouchableOpacity style={styles.button} onPress={() => load('label', { setid: item.setid })}><Text style={styles.link}>Read label sections</Text></TouchableOpacity>{link('Open DailyMed label', item.sourceUrl)}</>}
        {!!item.text && <Text style={styles.body}>{item.text}</Text>}
        {!!item.date && <Text style={styles.body}>Source date: {item.date}</Text>}
        {!!item.status && <Text style={styles.body}>{item.status} / {item.recallNumber}</Text>}
        {!!item.npi && <><Text style={styles.body}>NPI {item.npi} / Updated {item.updatedAt || 'not supplied'}</Text>{item.addresses?.map((address, i) => <View key={i}><Text style={styles.body}>{address.address}</Text>{!!address.phone && link(address.phone, `tel:${address.phone.replace(/[^+0-9]/g, '')}`)}</View>)}</>}
        {item.costPerUnit != null && <Text style={styles.body}>NDC {item.ndc} / USD {item.costPerUnit} per {item.unit} acquisition cost / Effective {item.effectiveDate} / Data as of {item.asOfDate || 'not supplied'}</Text>}
        {item.sections?.map((section, i) => <View key={i}><Text style={styles.title}>{section.title}</Text><Text selectable style={styles.body}>{section.text}</Text></View>)}
      </View>)}
    </>}
    {label && <View style={styles.card}>
      <Text style={styles.body}>{label.attribution}</Text><Text style={styles.body}>{label.disclaimer}</Text>
      {link('Open complete DailyMed label', label.sourceUrl)}
      <Text style={styles.title}>Section overview</Text>
      <Text style={styles.body}>{label.sections.map(s => s.title).join(' / ') || 'No supported sections extracted. Open the complete label.'}</Text>
      {(mode === 'interactions' ? label.sections.filter(section => section.title === 'Drug Interactions') : label.sections).map((section, i) => <View key={i}><Text style={styles.title}>{section.title}</Text><Text selectable style={styles.body}>{section.text}</Text></View>)}
      {mode === 'interactions' && !label.sections.some(s => s.title === 'Drug Interactions') && <Text style={styles.body}>No interaction found in DailyMed/NLM as of {label.retrievedAt}. This does not mean the combination is safe.</Text>}
    </View>}
    {mode === 'nadac' && <><Text style={styles.body}>{notices.prices}</Text>{link('Check price at Cost Plus Drugs', costPlusSearchUrl(drugName || (mode === 'nadac' ? '' : query)))}<Text style={styles.body}>{notices.costplus}</Text></>}
    {mode === 'recalls' && <Text style={styles.body}>{notices.recalls}</Text>}
    {mode === 'interactions' && <Text style={styles.body}>{notices.interactions.replace('[DailyMed/NLM]', 'DailyMed/NLM').replace('[date]', label?.updatedAt || 'shown on the selected label')}</Text>}
    <Text style={styles.body}>{notices.global}</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#101B2A' }, content: { padding: 20, paddingTop: 48, paddingBottom: 50, gap: 12 }, title: { color: '#E7C777', fontSize: 18, fontWeight: '600' }, body: { color: '#F0F0F0', fontSize: 14, lineHeight: 22, marginVertical: 6 }, input: { color: 'white', borderColor: '#E7C777', borderWidth: 1, borderRadius: 10, padding: 14 }, button: { padding: 12, minHeight: 44 }, link: { color: '#E7C777', fontSize: 15 }, card: { padding: 14, borderWidth: 1, borderColor: '#7C704C', borderRadius: 12 } });
