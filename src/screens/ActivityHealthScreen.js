import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { connectionStatus, connectHealth, disconnectHealth, openHealthSettings, openHealthStore, privacy, readHealth, statusText } from '../services/healthConnectService';

const C = { navy: '#020D1B', card: '#0F1D2A', gold: '#E8BF80', text: '#F6F5F2', gray: '#AAA6A0' };
export function HealthButton({ title, onPress, disabled }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[styles.button, disabled && { opacity: 0.4 }]}><Text style={styles.buttonText}>{title}</Text></TouchableOpacity>;
}
function useConnection(userId) {
  const [status, setStatus] = useState('loading');
  const [data, setData] = useState(null);
  const revision = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++revision.current;
    setData(null); setStatus('loading');
    try {
      const next = await connectionStatus(userId);
      if (current !== revision.current) return;
      setStatus(next);
    } catch { if (current === revision.current) setStatus('error'); }
  }, [userId]);
  useEffect(() => {
    refresh();
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
      else { revision.current += 1; setData(null); setStatus('loading'); }
    });
    return () => { revision.current += 1; listener.remove(); };
  }, [refresh]);
  return { status, setStatus, data, setData, refresh, revision };
}
function ConnectionActions({ status, onConnect, refresh }) {
  return <>
    <Text style={styles.body}>{statusText[status]}</Text>
    {['disconnected', 'denied'].includes(status) && <HealthButton title="Conectar Health Connect" onPress={onConnect} />}
    {status === 'install' && <HealthButton title="Instalar o actualizar Health Connect" onPress={() => openHealthStore().catch(() => {})} />}
    {status === 'denied' && <HealthButton title="Abrir ajustes de Health Connect" onPress={() => openHealthSettings().catch(() => {})} />}
    {['error', 'unavailable', 'install'].includes(status) && <HealthButton title="Volver a comprobar" onPress={refresh} />}
  </>;
}
function Page({ title, onClose, children }) {
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <HealthButton title="Volver" onPress={onClose} />
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>{children}
  </ScrollView>;
}

export function HealthConnectConsentScreen({ userId, onClose, onConnected }) {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const accept = async () => {
    if (!checked || busy) return;
    setBusy(true);
    try {
      const status = await connectHealth(userId);
      if (status === 'connected') onConnected();
      else setMessage(statusText[status]);
    } catch { setMessage('No se pudo completar la conexión. Puedes continuar usando la app e intentarlo después.'); }
    finally { setBusy(false); }
  };
  return <Page title={privacy.title} onClose={onClose}>
    <Text style={styles.body}>{privacy.body}</Text>
    <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked }} disabled={busy} onPress={() => setChecked(value => !value)} style={styles.checkbox}>
      <Text style={styles.body}>{checked ? '☑' : '☐'} {privacy.checkbox}</Text>
    </TouchableOpacity>
    <HealthButton title="Aceptar y continuar" disabled={!checked || busy} onPress={accept} />
    <HealthButton title="Ahora no" disabled={busy} onPress={onClose} />
    {!!message && <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text>}
  </Page>;
}

// Mounted as a proper React component: never invoke this as a conditional function.
export function HealthConnectPrivacyControls({ userId, onConnect }) {
  const { status, setStatus, refresh, revision } = useConnection(userId);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const disconnect = async () => {
    setBusy(true); revision.current += 1;
    try {
      const revoked = await disconnectHealth(userId);
      setStatus('disconnected');
      setMessage(revoked ? 'Conexión, consentimiento y datos importados locales borrados.' : 'Consentimiento y datos locales borrados. Retira también los permisos en los ajustes de Health Connect.');
    } catch { setMessage('No se pudo borrar el consentimiento local. Intenta de nuevo y retira los permisos en Health Connect.'); }
    finally { setBusy(false); }
  };
  return <View style={styles.card}>
    <Text style={styles.heading}>Health Connect</Text>
    <ConnectionActions status={status} onConnect={onConnect} refresh={refresh} />
    <HealthButton title="Desconectar Health Connect" disabled={busy || status === 'loading'} onPress={disconnect} />
    <HealthButton title="Abrir ajustes de Health Connect" onPress={() => openHealthSettings().catch(() => setMessage('No se pudieron abrir los ajustes de Health Connect. Búscalos en los ajustes del teléfono.'))} />
    {!!message && <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text>}
    <Text style={styles.heading}>Datos de actividad y salud de Health Connect</Text>
    <Text style={styles.body}>{privacy.body}</Text>
  </View>;
}
export function HealthConnectPrivacyScreen({ userId, onClose, onConnect }) {
  return <Page title="Privacidad · Health Connect" onClose={onClose}><HealthConnectPrivacyControls userId={userId} onConnect={onConnect} /></Page>;
}

function StepsChart({ days }) {
  const maximum = Math.max(1, ...days.map(day => day.steps));
  return <View accessible accessibilityLabel={days.map(d => `${d.date}: ${d.steps} pasos`).join('. ')}>
    <Svg width="100%" height={190} viewBox="0 0 350 190">
      {days.map((day, i) => {
        const height = day.steps / maximum * 125;
        return <React.Fragment key={day.date}>
          <Rect x={i * 50 + 9} y={145 - height} width={30} height={height} fill={C.gold} />
          <SvgText x={i * 50 + 24} y={Math.max(12, 137 - height)} fill={C.gray} fontSize={10} textAnchor="middle">{day.steps}</SvgText>
          <SvgText x={i * 50 + 24} y={165} fill={C.gray} fontSize={10} textAnchor="middle">{day.date.slice(8)}/{day.date.slice(5, 7)}</SvgText>
        </React.Fragment>;
      })}
    </Svg>
  </View>;
}
function HeartChart({ samples }) {
  // Neutral hourly means keep a week of samples legible; no targets, ranges or interpretation.
  const buckets = new Map();
  for (const sample of samples) {
    const hour = Math.floor(new Date(sample.time).getTime() / 3600000) * 3600000;
    const bucket = buckets.get(hour) || { sum: 0, count: 0 };
    bucket.sum += sample.bpm; bucket.count += 1; buckets.set(hour, bucket);
  }
  const points = [...buckets].sort((a, b) => a[0] - b[0]).map(([time, value]) => ({ time, bpm: value.sum / value.count }));
  if (!points.length) return <Text style={styles.body}>Sin registros de frecuencia cardíaca en los últimos 7 días.</Text>;
  const min = Math.floor(Math.min(...points.map(p => p.bpm))) - 1;
  const max = Math.ceil(Math.max(...points.map(p => p.bpm))) + 1;
  const first = points[0].time; const last = points[points.length - 1].time;
  const coords = points.map(p => `${42 + (p.time - first) / Math.max(1, last - first) * 290},${140 - (p.bpm - min) / (max - min) * 115}`).join(' ');
  const label = time => new Date(time).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  return <View accessible accessibilityLabel={`Frecuencia cardíaca, promedios por hora en lpm. ${points.map(p => `${new Date(p.time).toLocaleString('es-MX')}: ${Math.round(p.bpm)}`).join('. ')}`}>
    <Text style={styles.body}>Últimos 7 días · promedio por hora · lpm</Text>
    <Svg width="100%" height={185} viewBox="0 0 350 185">
      <Line x1={40} x2={340} y1={145} y2={145} stroke={C.gray} />
      <SvgText x={2} y={30} fill={C.gray} fontSize={11}>{max}</SvgText>
      <SvgText x={2} y={140} fill={C.gray} fontSize={11}>{min}</SvgText>
      <Polyline points={coords} fill="none" stroke={C.gold} strokeWidth={2} strokeLinecap="round" />
      {points.length === 1 && <Circle cx={42} cy={140 - (points[0].bpm - min) / (max - min) * 115} r={4} fill={C.gold} />}
      <SvgText x={40} y={170} fill={C.gray} fontSize={10}>{label(first)}</SvgText>
      <SvgText x={338} y={170} fill={C.gray} fontSize={10} textAnchor="end">{label(last)}</SvgText>
    </Svg>
  </View>;
}
const rate = value => value == null ? 'sin registros' : `${Math.round(value)} lpm`;

export default function ActivityHealthScreen({ userId, onClose, onConnect, onPrivacy }) {
  const { status, setStatus, data, setData, refresh, revision } = useConnection(userId);
  const [reading, setReading] = useState(false);
  useEffect(() => {
    if (status !== 'connected') { setReading(false); return; }
    let active = true;
    const current = revision.current;
    setReading(true);
    readHealth(userId).then(result => {
      if (active && current === revision.current) setData(result);
    }).catch(() => {
      if (active && current === revision.current) { setData(null); setStatus('error'); }
    }).finally(() => { if (active) setReading(false); });
    return () => { active = false; };
  }, [status, userId, revision, setData, setStatus]);
  return <Page title="Actividad y salud" onClose={onClose}>
    <ConnectionActions status={status} onConnect={onConnect} refresh={refresh} />
    {reading && <Text style={styles.body}>Leyendo datos del teléfono…</Text>}
    {data && status === 'connected' && <>
      <View style={styles.card}><Text style={styles.heading}>Pasos hoy: {data.days[data.days.length - 1]?.steps ?? 0}</Text>
        <Text style={styles.heading}>Pasos de los últimos 7 días</Text><StepsChart days={data.days} />
        <Text style={styles.body}>Un día con 0 puede indicar que no hay registros sincronizados.</Text></View>
      <View style={styles.card}><Text style={styles.body}>Frecuencia cardíaca en reposo promedio esta semana: {rate(data.restingThisWeek)} (semana anterior: {rate(data.restingLastWeek)})</Text>
        <Text style={styles.body}>Semanas de lunes a domingo; la semana actual incluye los registros disponibles hasta ahora.</Text></View>
      <View style={styles.card}><Text style={styles.heading}>Frecuencia cardíaca</Text><HeartChart samples={data.heart} /></View>
      <View style={styles.card}><Text style={styles.heading}>Sesiones de ejercicio: {data.exercises.length} esta semana</Text>
        {data.exercises.map((item, i) => <Text style={styles.body} key={`${item.date}-${i}`}>{item.type} · {item.minutes} min · {new Date(item.date).toLocaleString('es-MX')}</Text>)}
        {!data.exercises.length && <Text style={styles.body}>Sin sesiones sincronizadas esta semana.</Text>}</View>
      <Text style={styles.body}>Fuente: Health Connect{data.origins.length ? ` (${data.origins.join(', ')})` : ''}</Text>
      <Text style={styles.body}>Actualizado: {new Date(data.updatedAt).toLocaleString('es-MX')}</Text>
      <HealthButton title="Actualizar datos" onPress={refresh} />
    </>}
    <HealthButton title="Privacidad y conexión" onPress={onPrivacy} />
    <Text style={styles.body}>Si tienes dudas sobre tus resultados, consulta a tu médico.</Text>
    <Text style={styles.disclaimer}>{privacy.disclaimer}</Text>
  </Page>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.navy }, content: { padding: 20, paddingBottom: 48 },
  title: { color: C.gold, fontSize: 26, fontWeight: '700', marginVertical: 18 },
  heading: { color: C.gold, fontSize: 18, fontWeight: '600', marginVertical: 10 },
  body: { color: C.text, fontSize: 15, lineHeight: 23, marginVertical: 8 },
  disclaimer: { color: C.gray, fontSize: 13, lineHeight: 21, marginTop: 24 },
  card: { backgroundColor: C.card, borderColor: C.gray, borderWidth: 1, borderRadius: 18, padding: 16, marginVertical: 10 },
  button: { borderColor: C.gold, borderWidth: 1, borderRadius: 14, padding: 14, marginVertical: 7 },
  buttonText: { color: C.gold, fontSize: 16, textAlign: 'center' }, checkbox: { padding: 12, marginVertical: 16, borderColor: C.gray, borderWidth: 1, borderRadius: 12 },
});
