import { getRegion } from '../services/region';
import { useTranslation } from 'react-i18next';
import USSmartNotificationsScreen from './USSmartNotificationsScreen';
import uiI18n from '../i18n';
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Switch, TouchableOpacity, Alert, Linking, AppState, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { readSmart, updateSmart, nativeCapabilities, reconcileSmart, smartStatus, currentCoordinates, addressCoordinates, backgroundPermission, suggestions } from '../services/smartNotificationEngine';
import { ensureReminderPermission, reconcileReminderNotifications } from '../services/reminderNotifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FAB_SCROLL_PADDING } from '../layout/fabLayout';

function MexicoSmartNotificationsScreen({ onClose, theme, meds = [], reminders = [], setMeds, setReminders }: any) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const fail = (key: string) => Object.assign(new Error(t(key)), { userMessage: t(key) });
  const [state, setState] = useState<any>(null);
  const [status, setStatus] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const [place, setPlace] = useState<any>({ name: '', address: '', radius: '200', message: '', event: 'enter', reminderId: '' });
  const [alert, setAlert] = useState<any>({ condition: 'heat', threshold: '35', message: '' });
  const [explain, setExplain] = useState(false);
  const color = theme?.text || '#eee';
  const refresh = async () => { setState(await readSmart()); setStatus(await smartStatus()); };
  useEffect(() => { refresh().catch(report); const sub = AppState.addEventListener('change', s => { if (s === 'active') refresh().catch(report); }); return () => sub.remove(); }, [meds, reminders]);
  function report(e: any) {
    console.warn('[SmartNotifications]', e?.message || e);
    Alert.alert(
      t('errors.title'),
      e?.userMessage || t('errors.generic'),
      [
        { text: t('adminProfile.ok') },
        { text: t('locationSearch.openSettings'), onPress: () => Linking.openSettings() },
      ]
    );
  }
  async function run(fn: any) { setBusy(true); try { await fn(); await refresh(); } catch (e) { report(e); } finally { setBusy(false); } }
  async function save(patch: any) { await updateSmart(patch); await reconcileSmart(meds, reminders); await reconcileReminderNotifications(reminders); }
  const button = (title: string, fn: any) => <TouchableOpacity disabled={busy} accessibilityRole="button" onPress={() => run(fn)} style={styles.button}><Text style={{ color: '#D4AF37' }}>{title}</Text></TouchableOpacity>;
  const input = (label: string, value: any, change: any, numeric = false) => <View><Text style={{ color }}>{label}</Text><TextInput accessibilityLabel={label} value={String(value ?? '')} onChangeText={change} keyboardType={numeric ? 'decimal-pad' : 'default'} style={[styles.input, { color }]} /></View>;
  const badge = (icon: any) => <View style={styles.badge}><Feather name={icon} size={20} color="#D4AF37" /></View>;
  if (!state) return <View style={styles.container}><Text style={{ color }}>{t('smartNotif.loading')}</Text></View>;
  const capabilities = nativeCapabilities();
  const toggle = (key: string, label: string, icon: any, detail: string) => <View style={styles.card}><View style={styles.row}>{badge(icon)}<Text style={[styles.title, { color, flex: 1 }]}>{label}</Text><Switch disabled={busy} value={!!state[key]} onValueChange={value => {
    if (key === 'location' && value) { setExplain(true); return; }
    run(async () => {
      if (value && key !== 'timing' && !await ensureReminderPermission(true)) throw fail('smartNotif.notificationsDenied');
      if (key === 'weather' && value) { const c = await currentCoordinates(); await updateSmart({ weatherCoords: { latitude: Math.round(c.latitude*100)/100, longitude: Math.round(c.longitude*100)/100 }, weatherChecked: null }); }
      await save({ [key]: value, ...(key === 'location' && !value ? { inside: [] } : {}) });
    });
  }} /></View><Text style={{ color }}>{detail}</Text></View>;
  return <ScrollView style={[styles.container, { backgroundColor: theme?.card || '#10141e' }]} contentContainerStyle={{ paddingTop: Math.max(insets.top, 0) + 12, paddingBottom: FAB_SCROLL_PADDING }} keyboardShouldPersistTaps="handled">
    {button(t('smartNotif.back'), onClose)}
    <Text style={[styles.heading, { color }]}>{t('smartNotif.heading')}</Text>
    <Text accessibilityLiveRegion="polite" style={{ color: status.active ? '#D4AF37' : color }}>{status.active ? t('smartNotif.statusActive') : t('smartNotif.statusInactive')}</Text>
    <Text style={{ color }}>{t('smartNotif.statusLine', { geo: status.geo ? t('smartNotif.registered') : t('smartNotif.inactiveF'), weather: status.weather ? t('smartNotif.registeredWeather') : t('smartNotif.inactiveM') })}</Text>
    {(!capabilities.tasks || !capabilities.fetch || !capabilities.location) && <Text style={{ color }}>{t('smartNotif.needsBuild')}</Text>}
    {button(status.permission ? t('smartNotif.reviewPermissions') : t('smartNotif.allowNotifications'), async () => { if (status.permission) await Linking.openSettings(); else { if (!await ensureReminderPermission(true)) throw fail('smartNotif.permissionDenied'); await save({}); } })}
    {toggle('refill', t('smartNotif.refill'), 'package', t('smartNotif.refillDetail'))}
    <View style={styles.row}>{[3,5,7].map(n => <View key={n}>{button(`${state.lead === n ? '✓ ' : ''}${t('smartNotif.daysBefore', { n })}`, () => save({ lead: n }))}</View>)}</View>
    {meds.map((med: any) => <View key={med.id} style={styles.card}><Text style={[styles.title, { color }]}>{med.name}</Text>
      {input(t('smartNotif.currentQuantityOptional'), med.remainingQuantity, (value: string) => setMeds((prev: any[]) => prev.map(m => m.id === med.id ? { ...m, remainingQuantity: value } : m)), true)}
      {input(t('smartNotif.unitsPerDoseOptional'), med.unitsPerDose, (value: string) => setMeds((prev: any[]) => prev.map(m => m.id === med.id ? { ...m, unitsPerDose: value } : m)), true)}
    </View>)}
    {toggle('timing', t('smartNotif.timing'), 'clock', t('smartNotif.timingDetail'))}
    {suggestions(state, reminders).map((s: any) => <View key={s.reminder.id} style={styles.card}><Text style={{ color }}>{t('smartNotif.suggestion', { name: s.reminder.medicationName || s.reminder.name, time: s.time })}</Text>
      {button(t('smartNotif.accept'), async () => { const next = reminders.map((r: any) => r.id === s.reminder.id ? { ...r, time: s.time } : r); setReminders(next); await updateSmart({ reminders: next }); await reconcileReminderNotifications(next); await reconcileSmart(meds,next); })}
      {button(t('smartNotif.no'), () => updateSmart((latest: any) => { latest.dismissed[s.reminder.id] = s.reminder.time; return latest; }))}
    </View>)}
    {toggle('location', t('smartNotif.location'), 'map-pin', t('smartNotif.locationDetail'))}
    {explain && <View style={styles.card}><Text style={[styles.title, { color }]}>{t('smartNotif.bgLocationTitle')}</Text><Text style={{ color }}>{t('smartNotif.bgLocationBody')}</Text>
      {button(t('smartNotif.continueRequest'), async () => { await backgroundPermission(); if (!await ensureReminderPermission(true)) throw fail('smartNotif.enableNotifications'); await save({ location: true }); setExplain(false); })}
      {button(t('smartNotif.notNow'), () => setExplain(false))}</View>}
    <View style={styles.card}><Text style={[styles.title, { color }]}>{place.id ? t('smartNotif.editPlace') : t('smartNotif.addPlace')}</Text>
      {input(t('smartNotif.placeName'), place.name, (v: string) => setPlace({ ...place, name: v }))}
      {input(t('smartNotif.placeAddress'), place.address, (v: string) => setPlace({ ...place, address: v, latitude: undefined, longitude: undefined }))}
      {button(t('smartNotif.useCurrent'), async () => { const c = await currentCoordinates(); setPlace({ ...place, latitude: c.latitude, longitude: c.longitude, address: t('smartNotif.currentLocationLabel') }); })}
      {place.latitude != null && <Text style={{ color }}>{t('smartNotif.selectedLocation', { lat: place.latitude.toFixed(4), lng: place.longitude.toFixed(4) })}</Text>}
      {input(t('smartNotif.radius'), place.radius, (v: string) => setPlace({ ...place, radius: v }), true)}
      <Text style={{ color }}>{t('smartNotif.chooseReminder')}</Text>{reminders.map((r: any) => <View key={r.id}>{button(`${String(place.reminderId) === String(r.id) ? '✓ ' : ''}${r.name} · ${r.time}`, () => setPlace({ ...place, reminderId: String(r.id) }))}</View>)}
      {button(place.event === 'enter' ? t('smartNotif.eventEnter') : t('smartNotif.eventExit'), () => setPlace({ ...place, event: place.event === 'enter' ? 'exit' : 'enter' }))}
      {input(t('smartNotif.placeMessage'), place.message, (v: string) => setPlace({ ...place, message: v }))}
      {button(t('smartNotif.savePlace'), async () => {
        if (!place.name.trim() || !place.message.trim() || !place.reminderId || !Number.isFinite(Number(place.radius)) || Number(place.radius)<150 || Number(place.radius)>300) throw fail('smartNotif.placeIncomplete');
        if (!place.id && state.places.length >= 20) throw fail('smartNotif.placeLimit');
        const coords = place.latitude != null ? place : await addressCoordinates(place.address);
        const p = { ...place, id: place.id || `place:${Date.now()}`, latitude: coords.latitude, longitude: coords.longitude, radius: Number(place.radius), enabled: true };
        await save({ places: [...state.places.filter((x: any) => x.id !== p.id), p], inside: state.inside.filter((id: string) => id !== p.id) }); setPlace({ name: '', address: '', radius: '200', message: '', reminderId: '', event: 'enter' });
      })}
    </View>
    {state.places.map((p: any) => <View key={p.id} style={styles.card}><Text style={{ color }}>{t('smartNotif.placeSummary', { name: p.name, radius: p.radius, event: p.event === 'exit' ? t('smartNotif.onExit') : t('smartNotif.onEnter') })}{state.inside.includes(p.id) ? t('smartNotif.youAreHere') : ''}</Text><Text style={{ color }}>{p.message}</Text>{button(t('smartNotif.edit'), () => setPlace({ ...p, radius: String(p.radius) }))}{button(t('smartNotif.deletePlace'), () => save({ places: state.places.filter((x: any) => x.id !== p.id), inside: state.inside.filter((id: string) => id !== p.id) }))}</View>)}
    {toggle('weather', t('smartNotif.weather'), 'cloud', t('smartNotif.weatherDetail'))}
    <View style={styles.card}><Text style={[styles.title, { color }]}>{alert.id ? t('smartNotif.editWeatherAlert') : t('smartNotif.addWeatherAlert')}</Text>
      {(['heat','cold','rain','humidity','uv'] as const).map((c, i) => <View key={c}>{button(`${alert.condition === c ? '✓ ' : ''}${[t('smartNotif.condHeat'), t('smartNotif.condCold'), t('smartNotif.condRain'), t('smartNotif.condHumidity'), t('smartNotif.condUv')][i]}`, () => setAlert({ ...alert, condition: c, threshold: ({heat:'35',cold:'5',rain:'0',humidity:'80',uv:'8'})[c] }))}</View>)}
      {alert.condition !== 'rain' && input(t('smartNotif.threshold'), alert.threshold, (v: string) => setAlert({ ...alert, threshold: v }), true)}
      {input(t('smartNotif.practicalMessage'), alert.message, (v: string) => setAlert({ ...alert, message: v }))}
      {button(t('smartNotif.saveAlert'), async () => { if (!alert.message.trim() || alert.threshold.trim() === '' || !Number.isFinite(Number(alert.threshold))) throw fail('smartNotif.alertIncomplete'); const a = { ...alert, id: alert.id || `weather:${Date.now()}`, threshold: Number(alert.threshold), enabled: true }; await save({ alerts: [...state.alerts.filter((x: any) => x.id !== a.id), a], weatherChecked: null }); setAlert({ condition: 'heat', threshold: '35', message: '' }); })}
    </View>
    {state.alerts.map((a: any) => <View key={a.id} style={styles.card}><Text style={{ color }}>{t(`smartNotif.short${({heat:'Heat',cold:'Cold',rain:'Rain',humidity:'Humidity',uv:'Uv'} as any)[a.condition]}`)} · {a.threshold}: {a.message}</Text>{button(t('smartNotif.edit'), () => setAlert({ ...a, threshold: String(a.threshold) }))}{button(t('smartNotif.deleteAlert'), () => save({ alerts: state.alerts.filter((x: any) => x.id !== a.id) }))}</View>)}
    {toggle('context', t('smartNotif.context'), 'moon', t('smartNotif.contextDetail'))}
    {input(t('smartNotif.quietFrom'), state.quietStart, (v: string) => setState({ ...state, quietStart: v }))}
    {input(t('smartNotif.quietUntil'), state.quietEnd, (v: string) => setState({ ...state, quietEnd: v }))}
    {button(t('smartNotif.saveQuiet'), async () => { if (![state.quietStart,state.quietEnd].every(v => /^([01]\d|2[0-3]):[0-5]\d$/.test(v))) throw fail('smartNotif.invalidQuiet'); await save({ quietStart: state.quietStart, quietEnd: state.quietEnd }); })}
    <Text style={{ color }}>{t('smartNotif.localNote')}</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({ container: { flex: 1, paddingHorizontal: 20, paddingBottom: 20 }, heading: { fontSize: 24, fontWeight: '700', marginBottom: 12 }, title: { fontSize: 16, fontWeight: '600' }, card: { borderColor: '#D4AF3755', borderWidth: 1, borderRadius: 16, padding: 14, marginVertical: 8 }, row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }, badge: { borderColor: '#D4AF3770', borderWidth: 1, borderRadius: 12, padding: 9, backgroundColor: '#D4AF3714' }, input: { borderColor: '#D4AF3766', borderWidth: 1, padding: 10, marginVertical: 8, borderRadius: 8 }, button: { padding: 12, marginVertical: 3, borderRadius: 8, backgroundColor: '#D4AF3718' } });

export default function SmartNotificationsScreen(props: any) {
  return getRegion() === 'US' ? <USSmartNotificationsScreen {...props} /> : <MexicoSmartNotificationsScreen {...props} />;
}
