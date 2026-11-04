import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Switch, TouchableOpacity, Alert, Linking, AppState, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { readSmart, updateSmart, nativeCapabilities, reconcileSmart, smartStatus, currentCoordinates, addressCoordinates, backgroundPermission, suggestions } from '../services/smartNotificationEngine';
import { ensureReminderPermission, reconcileReminderNotifications } from '../services/reminderNotifications';

export default function SmartNotificationsScreen({ onClose, theme, meds = [], reminders = [], setMeds, setReminders }: any) {
  const [state, setState] = useState<any>(null);
  const [status, setStatus] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const [place, setPlace] = useState<any>({ name: '', address: '', radius: '200', message: '', event: 'enter', reminderId: '' });
  const [alert, setAlert] = useState<any>({ condition: 'heat', threshold: '35', message: '' });
  const [explain, setExplain] = useState(false);
  const color = theme?.text || '#eee';
  const refresh = async () => { setState(await readSmart()); setStatus(await smartStatus()); };
  useEffect(() => { refresh().catch(report); const sub = AppState.addEventListener('change', s => { if (s === 'active') refresh().catch(report); }); return () => sub.remove(); }, [meds, reminders]);
  function report(e: any) { Alert.alert('Notificaciones inteligentes', e.message || 'No se pudo completar la operación.', [{ text: 'Cerrar' }, { text: 'Abrir Ajustes', onPress: () => Linking.openSettings() }]); }
  async function run(fn: any) { setBusy(true); try { await fn(); await refresh(); } catch (e) { report(e); } finally { setBusy(false); } }
  async function save(patch: any) { await updateSmart(patch); await reconcileSmart(meds, reminders); await reconcileReminderNotifications(reminders); }
  const button = (title: string, fn: any) => <TouchableOpacity disabled={busy} accessibilityRole="button" onPress={() => run(fn)} style={styles.button}><Text style={{ color: '#D4AF37' }}>{title}</Text></TouchableOpacity>;
  const input = (label: string, value: any, change: any, numeric = false) => <View><Text style={{ color }}>{label}</Text><TextInput accessibilityLabel={label} value={String(value ?? '')} onChangeText={change} keyboardType={numeric ? 'decimal-pad' : 'default'} style={[styles.input, { color }]} /></View>;
  const badge = (icon: any) => <View style={styles.badge}><Feather name={icon} size={20} color="#D4AF37" /></View>;
  if (!state) return <View style={styles.container}><Text style={{ color }}>Cargando ajustes…</Text></View>;
  const capabilities = nativeCapabilities();
  const toggle = (key: string, label: string, icon: any, detail: string) => <View style={styles.card}><View style={styles.row}>{badge(icon)}<Text style={[styles.title, { color, flex: 1 }]}>{label}</Text><Switch disabled={busy} value={!!state[key]} onValueChange={value => {
    if (key === 'location' && value) { setExplain(true); return; }
    run(async () => {
      if (value && key !== 'timing' && !await ensureReminderPermission(true)) throw new Error('Notificaciones denegadas. Habilítalas en Ajustes.');
      if (key === 'weather' && value) { const c = await currentCoordinates(); await updateSmart({ weatherCoords: { latitude: Math.round(c.latitude*100)/100, longitude: Math.round(c.longitude*100)/100 }, weatherChecked: null }); }
      await save({ [key]: value, ...(key === 'location' && !value ? { inside: [] } : {}) });
    });
  }} /></View><Text style={{ color }}>{detail}</Text></View>;
  return <ScrollView style={[styles.container, { backgroundColor: theme?.card || '#10141e' }]} contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
    {button('Volver', onClose)}
    <Text style={[styles.heading, { color }]}>Notificaciones Inteligentes</Text>
    <Text accessibilityLiveRegion="polite" style={{ color: status.active ? '#D4AF37' : color }}>{status.active ? 'Activas: hay funciones operativas' : 'Sin funciones activas: revisa configuración y permisos'}</Text>
    <Text style={{ color }}>Ubicación: {status.geo ? 'registrada' : 'inactiva'} · Clima en segundo plano: {status.weather ? 'registrado' : 'inactivo'}</Text>
    {(!capabilities.tasks || !capabilities.fetch || !capabilities.location) && <Text style={{ color }}>Este APK requiere una nueva compilación para ubicación y clima en segundo plano. Los ajustes locales siguen disponibles.</Text>}
    {button(status.permission ? 'Revisar permisos en Ajustes' : 'Permitir notificaciones', async () => { if (status.permission) await Linking.openSettings(); else { if (!await ensureReminderPermission(true)) throw new Error('Permiso denegado. Abre Ajustes para habilitarlo.'); await save({}); } })}
    {toggle('refill', 'Predicciones de Recarga', 'package', 'Calcula existencias según el calendario real. Completa cantidad y unidades por toma. Una alerta por configuración de inventario.')}
    <View style={styles.row}>{[3,5,7].map(n => <View key={n}>{button(`${state.lead === n ? '✓ ' : ''}${n} días antes`, () => save({ lead: n }))}</View>)}</View>
    {meds.map((med: any) => <View key={med.id} style={styles.card}><Text style={[styles.title, { color }]}>{med.name}</Text>
      {input('Cantidad actual (opcional)', med.remainingQuantity, (value: string) => setMeds((prev: any[]) => prev.map(m => m.id === med.id ? { ...m, remainingQuantity: value } : m)), true)}
      {input('Unidades por toma (opcional)', med.unitsPerDose, (value: string) => setMeds((prev: any[]) => prev.map(m => m.id === med.id ? { ...m, unitsPerDose: value } : m)), true)}
    </View>)}
    {toggle('timing', 'Tiempo Inteligente', 'clock', 'Con 5 tomas registradas y una mediana de retraso mayor a 20 minutos, propone un horario. Tú decides.')}
    {suggestions(state, reminders).map((s: any) => <View key={s.reminder.id} style={styles.card}><Text style={{ color }}>Sueles tomar {s.reminder.medicationName || s.reminder.name} a las {s.time}. ¿Mover el recordatorio?</Text>
      {button('Aceptar', async () => { const next = reminders.map((r: any) => r.id === s.reminder.id ? { ...r, time: s.time } : r); setReminders(next); await updateSmart({ reminders: next }); await reconcileReminderNotifications(next); await reconcileSmart(meds,next); })}
      {button('No', () => updateSmart((latest: any) => { latest.dismissed[s.reminder.id] = s.reminder.time; return latest; }))}
    </View>)}
    {toggle('location', 'Recordatorios Basados en Ubicación', 'map-pin', 'Al entrar o salir de lugares guardados. La ubicación y los lugares se guardan en el teléfono.')}
    {explain && <View style={styles.card}><Text style={[styles.title, { color }]}>Permitir ubicación en segundo plano</Text><Text style={{ color }}>Primero pediremos permiso mientras usas la app. Después, permite ubicación siempre para detectar entradas y salidas aunque la app esté cerrada. Android puede abrir Ajustes. Puedes desactivarlo en cualquier momento. Los lugares permanecen en este teléfono.</Text>
      {button('Continuar y solicitar permisos', async () => { await backgroundPermission(); if (!await ensureReminderPermission(true)) throw new Error('Habilita notificaciones en Ajustes.'); await save({ location: true }); setExplain(false); })}
      {button('Ahora no', () => setExplain(false))}</View>}
    <View style={styles.card}><Text style={[styles.title, { color }]}>{place.id ? 'Editar lugar' : 'Agregar lugar'}</Text>
      {input('Nombre del lugar', place.name, (v: string) => setPlace({ ...place, name: v }))}
      {input('Dirección (o usa ubicación actual)', place.address, (v: string) => setPlace({ ...place, address: v, latitude: undefined, longitude: undefined }))}
      {button('Usar ubicación actual', async () => { const c = await currentCoordinates(); setPlace({ ...place, latitude: c.latitude, longitude: c.longitude, address: 'Ubicación actual' }); })}
      {place.latitude != null && <Text style={{ color }}>Ubicación seleccionada: {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}</Text>}
      {input('Radio en metros (150–300)', place.radius, (v: string) => setPlace({ ...place, radius: v }), true)}
      <Text style={{ color }}>Elige un recordatorio:</Text>{reminders.map((r: any) => <View key={r.id}>{button(`${String(place.reminderId) === String(r.id) ? '✓ ' : ''}${r.name} · ${r.time}`, () => setPlace({ ...place, reminderId: String(r.id) }))}</View>)}
      {button(place.event === 'enter' ? 'Evento: al entrar (cambiar)' : 'Evento: al salir (cambiar)', () => setPlace({ ...place, event: place.event === 'enter' ? 'exit' : 'enter' }))}
      {input('Mensaje del lugar / texto contextual', place.message, (v: string) => setPlace({ ...place, message: v }))}
      {button('Guardar lugar', async () => {
        if (!place.name.trim() || !place.message.trim() || !place.reminderId || !Number.isFinite(Number(place.radius)) || Number(place.radius)<150 || Number(place.radius)>300) throw new Error('Completa nombre, mensaje, recordatorio y radio de 150 a 300 m.');
        if (!place.id && state.places.length >= 20) throw new Error('Máximo 20 lugares por dispositivo.');
        const coords = place.latitude != null ? place : await addressCoordinates(place.address);
        const p = { ...place, id: place.id || `place:${Date.now()}`, latitude: coords.latitude, longitude: coords.longitude, radius: Number(place.radius), enabled: true };
        await save({ places: [...state.places.filter((x: any) => x.id !== p.id), p], inside: state.inside.filter((id: string) => id !== p.id) }); setPlace({ name: '', address: '', radius: '200', message: '', reminderId: '', event: 'enter' });
      })}
    </View>
    {state.places.map((p: any) => <View key={p.id} style={styles.card}><Text style={{ color }}>{p.name} · {p.radius} m · {p.event === 'exit' ? 'salir' : 'entrar'}{state.inside.includes(p.id) ? ' · Estás aquí' : ''}</Text><Text style={{ color }}>{p.message}</Text>{button('Editar', () => setPlace({ ...p, radius: String(p.radius) }))}{button('Eliminar lugar', () => save({ places: state.places.filter((x: any) => x.id !== p.id), inside: state.inside.filter((id: string) => id !== p.id) }))}</View>)}
    {toggle('weather', 'Alertas Basadas en el Clima', 'cloud', 'Pronóstico Open-Meteo con coordenadas aproximadas. Revisión al abrir y por la mañana cuando el sistema permita la tarea; máximo un envío de cada alerta por día.')}
    <View style={styles.card}><Text style={[styles.title, { color }]}>{alert.id ? 'Editar alerta climática' : 'Agregar alerta climática'}</Text>
      {(['heat','cold','rain','humidity','uv'] as const).map((c, i) => <View key={c}>{button(`${alert.condition === c ? '✓ ' : ''}${['Calor mayor a °C','Frío menor a °C','Lluvia','Humedad mayor a %','Índice UV mayor a'][i]}`, () => setAlert({ ...alert, condition: c, threshold: ({heat:'35',cold:'5',rain:'0',humidity:'80',uv:'8'})[c] }))}</View>)}
      {alert.condition !== 'rain' && input('Umbral', alert.threshold, (v: string) => setAlert({ ...alert, threshold: v }), true)}
      {input('Mensaje práctico (sin afirmaciones médicas)', alert.message, (v: string) => setAlert({ ...alert, message: v }))}
      {button('Guardar alerta', async () => { if (!alert.message.trim() || alert.threshold.trim() === '' || !Number.isFinite(Number(alert.threshold))) throw new Error('Escribe un mensaje y un umbral válido.'); const a = { ...alert, id: alert.id || `weather:${Date.now()}`, threshold: Number(alert.threshold), enabled: true }; await save({ alerts: [...state.alerts.filter((x: any) => x.id !== a.id), a], weatherChecked: null }); setAlert({ condition: 'heat', threshold: '35', message: '' }); })}
    </View>
    {state.alerts.map((a: any) => <View key={a.id} style={styles.card}><Text style={{ color }}>{({heat:'Calor',cold:'Frío',rain:'Lluvia',humidity:'Humedad',uv:'UV'} as any)[a.condition]} · {a.threshold}: {a.message}</Text>{button('Editar', () => setAlert({ ...a, threshold: String(a.threshold) }))}{button('Eliminar alerta', () => save({ alerts: state.alerts.filter((x: any) => x.id !== a.id) }))}</View>)}
    {toggle('context', 'Recordatorios Conscientes del Contexto', 'moon', 'Pospone los recordatorios hasta el final de las horas de silencio. En un lugar guardado usa su mensaje para el recordatorio elegido.')}
    {input('Silencio desde (HH:mm)', state.quietStart, (v: string) => setState({ ...state, quietStart: v }))}
    {input('Silencio hasta (HH:mm)', state.quietEnd, (v: string) => setState({ ...state, quietEnd: v }))}
    {button('Guardar horas de silencio', async () => { if (![state.quietStart,state.quietEnd].every(t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t))) throw new Error('Usa horas válidas en formato HH:mm.'); await save({ quietStart: state.quietStart, quietEnd: state.quietEnd }); })}
    <Text style={{ color }}>Todo el análisis de tomas es local. Open-Meteo recibe solo coordenadas redondeadas para consultar el pronóstico.</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 20, paddingTop: 40 }, heading: { fontSize: 24, fontWeight: '700', marginBottom: 12 }, title: { fontSize: 16, fontWeight: '600' }, card: { borderColor: '#D4AF3755', borderWidth: 1, borderRadius: 16, padding: 14, marginVertical: 8 }, row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }, badge: { borderColor: '#D4AF3770', borderWidth: 1, borderRadius: 12, padding: 9, backgroundColor: '#D4AF3714' }, input: { borderColor: '#D4AF3766', borderWidth: 1, padding: 10, marginVertical: 8, borderRadius: 8 }, button: { padding: 12, marginVertical: 3, borderRadius: 8, backgroundColor: '#D4AF3718' } });
