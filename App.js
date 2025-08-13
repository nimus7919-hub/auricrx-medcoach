// MedCoach v4 — PASTE THIS ENTIRE FILE INTO App.js
// Single-file build: AuricRx branding • Reminders • i18n (EN/ES/ZH) • Region toggle (MX/US/CN)
// Voice commands auto-disable in Expo Go and auto-enable in Dev Client if @react-native-voice/voice is installed.
// Google Login button is included but harmless if you skip configuring OAuth.
//
// What you still need in your project folder:
//   1) assets/auricrx-logo.png   (1024x1024 PNG)
//   2) (Optional) app.json → { "expo": { "plugins": ["@react-native-voice/voice"] } } + Dev Client for voice
//   3) Install deps:
//      npm i expo-notifications @react-native-async-storage/async-storage date-fns i18next react-i18next expo-localization expo-auth-session
//      (Voice, optional) npm i @react-native-voice/voice

import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, SafeAreaView, ScrollView, StatusBar, Switch, Text, TextInput, TouchableOpacity, View, PermissionsAndroid } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { I18nextProvider, useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

// --- AuricRx logo asset (add your PNG): ./assets/auricrx-logo.png ---
const AURIC_LOGO = require('./assets/auricrx-logo.png');

/*****************
 * i18n resources
 *****************/
const resources = {
  en: { t: { appName: 'MedCoach', hello: 'Hi', guest: 'Guest', reminders: 'Reminders • Voice • Guidance', notifications: 'Notifications', on: 'On', off: 'Off', times: 'Your Daily Times', wake: 'Wake (Linaclotide)', breakfast: 'Breakfast (Galvusmet AM)', psyllium: 'Midday Psyllium', dinner: 'Dinner (Galvusmet PM)', bedtime: 'Bedtime (Atorva + Clopidogrel + Aspirin)', save: 'Save & Reschedule', coachTitle: 'Your Coach', coachLine: 'Steady wins. Same time daily. Snack if stomach is upset at night pills. Watch for bleeding on aspirin + clopidogrel. Never double a dose. Hydrate well.', emergency: 'Emergency flags: black stools, vomiting blood, chest pain, shortness of breath — seek urgent care.', todaysMeds: "Today’s Meds", missed: 'Missed?', marked: 'Marked', markedByVoice: 'Marked by Voice', rule: 'Rule', disclaimer: 'This is general education. You may ignore this and consult your medical doctor for personalized advice.', loginGoogle: 'Continue with Google', orGuest: 'or continue as guest', yourName: 'Your name (optional)', region: 'Region', language: 'Language', mx: 'Mexico', us: 'United States', cn: 'China', en: 'English', es: 'Español', zh: '中文', regionNote: 'Region affects voice/OCR aliases and future pharmacy price lookups.', pressToSpeak: 'Press to speak', listening: 'Listening…' } },
  es: { t: { appName: 'MedCoach', hello: 'Hola', guest: 'Invitado', reminders: 'Recordatorios • Voz • Guía', notifications: 'Notificaciones', on: 'Activadas', off: 'Desactivadas', times: 'Tus horarios diarios', wake: 'Despertar (Linaclotide)', breakfast: 'Desayuno (Galvusmet AM)', psyllium: 'Psyllium del mediodía', dinner: 'Cena (Galvusmet PM)', bedtime: 'Noche (Atorva + Clopidogrel + Aspirina)', save: 'Guardar y reprogramar', coachTitle: 'Tu Coach', coachLine: 'Constancia primero. Misma hora diario. Snack si hay malestar nocturno. Vigila sangrado con aspirina + clopidogrel. Nunca dupliques dosis. Hidrátate bien.', emergency: 'Alertas: heces negras, vómito con sangre, dolor en el pecho, falta de aire — acude a urgencias.', todaysMeds: 'Medicinas de hoy', missed: '¿Olvidaste?', marked: 'Marcado', markedByVoice: 'Marcado por voz', rule: 'Regla', disclaimer: 'Es orientación general. Puedes ignorarla y consultar a tu médico para una respuesta personalizada.', loginGoogle: 'Continuar con Google', orGuest: 'o continuar como invitado', yourName: 'Tu nombre (opcional)', region: 'Región', language: 'Idioma', mx: 'México', us: 'Estados Unidos', cn: 'China', en: 'English', es: 'Español', zh: '中文', regionNote: 'La región afecta alias de voz/OCR y futuras búsquedas de precios.', pressToSpeak: 'Pulsa para hablar', listening: 'Escuchando…' } },
  zh: { t: { appName: 'MedCoach', hello: '你好', guest: '访客', reminders: '提醒 • 语音 • 指引', notifications: '通知', on: '开启', off: '关闭', times: '每日时间表', wake: '起床（利那洛肽）', breakfast: '早餐（Galvusmet 早）', psyllium: '午间洋车前子', dinner: '晚餐（Galvusmet 晚）', bedtime: '睡前（阿托伐他汀 + 氯吡格雷 + 阿司匹林）', save: '保存并重新安排', coachTitle: '你的教练', coachLine: '坚持最重要。尽量固定时间。如夜间药物胃不适，可少量加餐。服用阿司匹林 + 氯吡格雷需留意出血。切勿加倍剂量。注意补水。', emergency: '警示：黑便、呕血、胸痛、呼吸困难 — 立即就医。', todaysMeds: '今日用药', missed: '忘记了？', marked: '已记录', markedByVoice: '语音记录完成', rule: '规则', disclaimer: '本信息仅供教育参考。你可忽略并咨询医生以获得个性化建议。', loginGoogle: '使用 Google 登录', orGuest: '或以访客继续', yourName: '你的名字（可选）', region: '地区', language: '语言', mx: '墨西哥', us: '美国', cn: '中国', en: 'English', es: 'Español', zh: '中文', regionNote: '地区会影响语音/OCR 别名以及后续药房价格查询。', pressToSpeak: '按下说话', listening: '正在聆听…' } },
};

if (!i18n.isInitialized) {
  i18n.init({
    compatibilityJSON: 'v3',
    resources,
    lng: (Localization.locale || 'en').startsWith('es') ? 'es' : (Localization.locale || 'en').startsWith('zh') ? 'zh' : 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

/*****************
 * DATA & GUIDANCE
 *****************/
const DEFAULT_SCHEDULE = { wake: '06:00', breakfast: '06:30', psyllium: '12:30', dinner: '19:00', bedtime: '21:45' };
const DEFAULT_PROFILE = { name: '', region: 'mx', language: i18n.language, photo: '' };

const MEDS = [
  { key: 'linaclotide', name: { en: 'Linaclotide', es: 'Linaclotide', zh: '利那洛肽' }, aliases: ['linaclotide','linzess','利那洛肽'], timeKey: 'wake', rule: 'empty' },
  { key: 'galvusmet_am', name: { en: 'Galvusmet (AM)', es: 'Galvusmet (AM)', zh: 'Galvusmet（早）' }, aliases: ['galvusmet','vildagliptin','metformin','维格列汀','二甲双胍'], timeKey: 'breakfast', rule: 'withFood' },
  { key: 'psyllium', name: { en: 'Psyllium', es: 'Psyllium', zh: '洋车前子' }, aliases: ['psyllium','plantago','洋车前子'], timeKey: 'psyllium', rule: 'fiber2h' },
  { key: 'galvusmet_pm', name: { en: 'Galvusmet (PM)', es: 'Galvusmet (PM)', zh: 'Galvusmet（晚）' }, aliases: ['galvusmet','vildagliptin','metformin','维格列汀','二甲双胍'], timeKey: 'dinner', rule: 'withFood' },
  { key: 'bed_atorva', name: { en: 'Atorvastatin', es: 'Atorvastatina', zh: '阿托伐他汀' }, aliases: ['atorvastatin','atorva','阿托伐他汀'], timeKey: 'bedtime', rule: 'any' },
  { key: 'bed_plavix', name: { en: 'Clopidogrel', es: 'Clopidogrel', zh: '氯吡格雷' }, aliases: ['clopidogrel','plavix','氯吡格雷'], timeKey: 'bedtime', rule: 'antiplatelet' },
  { key: 'bed_aspirin', name: { en: 'Aspirin Protect', es: 'Aspirina Protect', zh: '阿司匹林肠溶片' }, aliases: ['aspirin','asa','阿司匹林'], timeKey: 'bedtime', rule: 'antiplatelet' },
];

const DISCLAIMER_LINES = {
  en: 'This is general education. You may ignore this and consult your medical doctor for personalized advice.',
  es: 'Es orientación general. Puedes ignorarla y consultar a tu médico para una respuesta personalizada.',
  zh: '本信息仅供教育参考。你可忽略并咨询医生以获得个性化建议。',
};

function conciseLine(rule) {
  switch (rule) {
    case 'empty': return 'Empty stomach. If you already ate, skip and take tomorrow.';
    case 'withFood': return 'Take with food. If >2h from meal or near next dose, skip.';
    case 'fiber2h': return 'Keep 2h away from other meds; flexible timing.';
    case 'antiplatelet': return 'Once daily. Take when remembered unless near next dose.';
    default: return 'Take as prescribed. Do not double up.';
  }
}
function reasonText(rule) {
  switch (rule) {
    case 'empty': return 'Linaclotide needs an empty stomach to work and avoid diarrhea; skip if fed and resume tomorrow.';
    case 'withFood': return 'Metformin works best with food; taking far from meals increases side effects and benefit is lower.';
    case 'fiber2h': return 'Psyllium can bind medicines; keep a 2‑hour gap to avoid interactions.';
    case 'antiplatelet': return 'Clopidogrel/Aspirin are once‑daily; doubling increases bleeding risk without extra benefit.';
    case 'any': return 'Atorvastatin is long‑acting; keep daily, do not double.';
    default: return '';
  }
}

/*****************
 * NOTIFICATIONS
 *****************/
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }) });
async function askNotifPerms() { const { status } = await Notifications.requestPermissionsAsync(); if (status !== 'granted') Alert.alert('Permission needed', 'Please allow notifications to get reminders.'); }
async function scheduleAll(schedule) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const results = [];
  for (const med of MEDS) {
    const base = schedule[med.timeKey]; if (!base) continue;
    const [hh, mm] = base.split(':').map(Number);
    const id = await Notifications.scheduleNotificationAsync({ content: { title: `Time for ${med.name.en}`, body: conciseLine(med.rule), data: { medKey: med.key } }, trigger: { hour: hh, minute: mm, repeats: true } });
    results.push({ key: med.key, id });
  }
  await AsyncStorage.setItem('notifIds', JSON.stringify(results));
}

/*****************
 * STORAGE
 *****************/
const store = {
  async getSchedule() { const raw = await AsyncStorage.getItem('schedule'); return raw ? JSON.parse(raw) : DEFAULT_SCHEDULE; },
  async setSchedule(s) { await AsyncStorage.setItem('schedule', JSON.stringify(s)); },
  async setTaken(key, dateISO) { await AsyncStorage.setItem(`taken:${key}:${dateISO.slice(0,10)}`, '1'); },
  async isTaken(key, dateISO) { return (await AsyncStorage.getItem(`taken:${key}:${dateISO.slice(0,10)}`)) === '1'; },
  async getProfile() { const raw = await AsyncStorage.getItem('profile'); return raw ? JSON.parse(raw) : DEFAULT_PROFILE; },
  async setProfile(p) { await AsyncStorage.setItem('profile', JSON.stringify(p)); },
};

/*****************
 * AUTH (Google) — Optional
 *****************/
const GOOGLE_EXPO_CLIENT_ID = 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';
function useGoogleAuth(profile, setProfile) {
  const [request, response, promptAsync] = Google.useAuthRequest({ expoClientId: GOOGLE_EXPO_CLIENT_ID, androidClientId: GOOGLE_ANDROID_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID });
  useEffect(() => { (async () => { if (response?.type === 'success') { const minimal = { name: 'Google User', photo: '' }; const p = { ...profile, name: minimal.name, photo: minimal.photo }; setProfile(p); await store.setProfile(p); } })(); }, [response]);
  return { request, promptAsync };
}

/*****************
 * VOICE — optional; auto-disables in Expo Go
 *****************/
let VoiceModule = null;
async function maybeLoadVoice() {
  if (VoiceModule) return VoiceModule;
  try {
    const mod = require('@react-native-voice/voice').default || require('@react-native-voice/voice');
    VoiceModule = mod;
    return mod;
  } catch (e) {
    return null;
  }
}

function VoiceDock({ onMarkTaken, lang }) {
  const { t } = useTranslation('t');
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState('');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => { (async () => { const M = await maybeLoadVoice(); setEnabled(!!M); if (!M) return; M.onSpeechResults = (e) => { const text = (e.value && e.value[0]) || ''; setLastHeard(text); const m = findMedFromSpeech(text); if (m) { onMarkTaken(m); stop(M); } }; M.onSpeechError = () => setListening(false); return () => { try { M.destroy(); } catch {} }; })(); }, [lang]);

  const requestMic = async () => {
    if (Platform.OS === 'android') {
      const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      if (res !== PermissionsAndroid.RESULTS.GRANTED) { Alert.alert('Microphone', 'Microphone permission is required for voice commands.'); return false; }
    }
    return true;
  };

  const start = async (M) => {
    const ok = await requestMic(); if (!ok) return;
    try { setListening(true); try { await M.start(lang === 'es' ? 'es-MX' : lang === 'zh' ? 'zh-CN' : 'en-US'); } catch { await M.start('en-US'); } } catch { setListening(false); }
  };
  const stop = async (M) => { try { await M.stop(); } catch {} setListening(false); };

  if (!enabled) return (
    <View style={{ position:'absolute', right:16, bottom:28, backgroundColor:'#64748b', borderRadius:28, paddingVertical:14, paddingHorizontal:18 }}>
      <Text style={{ color:'white', fontWeight:'800' }}>{t('pressToSpeak')} (Dev Client)</Text>
    </View>
  );

  return (
    <TouchableOpacity onPress={async()=>{ const M = await maybeLoadVoice(); if (!M) return; listening ? stop(M) : start(M); }} style={{ position:'absolute', right:16, bottom:28, backgroundColor: listening ? '#ef4444' : '#22c55e', borderRadius:28, paddingVertical:14, paddingHorizontal:18 }}>
      <Text style={{ color:'white', fontWeight:'800' }}>{listening ? t('listening') : t('pressToSpeak')}</Text>
      {lastHeard ? <Text style={{ color:'#e5e7eb', marginTop:4, maxWidth:260 }}>Heard: {lastHeard}</Text> : null}
    </TouchableOpacity>
  );
}

function findMedFromSpeech(text) {
  const t = (text || '').toLowerCase();
  for (const m of MEDS) { for (const a of m.aliases) { if (t.includes(a.toLowerCase())) return m; } }
  return null;
}

/*****************
 * UI PARTS
 *****************/
const S = {
  screen: { flex: 1, backgroundColor: '#0b1117' },
  header: { padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  titleWrap: { marginLeft: 10 },
  title: { color: 'white', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#9fb3c8', marginTop: 6 },
  logo: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#111827' },
  card: { backgroundColor: '#111827', borderRadius: 16, padding: 16, marginVertical: 8, marginHorizontal: 16 },
  label: { color: '#d1e3f0', fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#0b1117', color: 'white', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#1f2937' },
  btn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: 'white', fontWeight: '700' },
  chip: { backgroundColor: '#0b1117', borderColor: '#374151', borderWidth: 1, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, marginRight: 8, marginTop: 8 },
  chipText: { color: '#9fb3c8', fontSize: 12 },
  pill: { backgroundColor: '#0ea5e9', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, marginRight: 8 },
  pillText: { color: 'white', fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
};

function TimeField({ label, value, onChange }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={S.label}>{label}</Text>
      <TextInput style={S.input} value={v} onChangeText={setV} onBlur={() => /^(\d{2}):(\d{2})$/.test(v) ? onChange(v) : (setV(value), Alert.alert('Format', 'Use HH:mm, e.g., 06:30'))} placeholder="HH:mm" keyboardType="numeric" />
    </View>
  );
}

function MedCard({ med, schedule, lang }) {
  const { t } = useTranslation('t');
  const [taken, setTaken] = useState(false);
  const today = new Date().toISOString();
  const time = schedule[med.timeKey];
  const title = med.name[lang] || med.name.en;

  useEffect(() => { (async () => setTaken(await store.isTaken(med.key, today)))(); }, [med.key]);

  const markTaken = async () => { await store.setTaken(med.key, today); setTaken(true); Alert.alert(t('marked'), `${title} ✓`); };
  const onMissed = () => {
    const advice = conciseLine(med.rule);
    const reason = reasonText(med.rule);
    const disclaimer = DISCLAIMER_LINES[lang] || DISCLAIMER_LINES.en;
    Alert.alert(`${title} — ${t('missed')}`, `${advice}\n\n${reason}\n\n${disclaimer}`, [{ text: 'OK' }]);
  };

  return (
    <View style={S.card}>
      <View style={S.rowBetween}>
        <View style={S.row}>
          <View style={S.pill}><Text style={S.pillText}>{time}</Text></View>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>{title}</Text>
        </View>
        <View style={S.row}>
          <TouchableOpacity onPress={markTaken} style={[S.btn, { marginRight: 8, opacity: taken ? 0.6 : 1 }]} disabled={taken}><Text style={S.btnText}>{taken ? t('marked') : 'Mark'}</Text></TouchableOpacity>
          <TouchableOpacity onPress={onMissed} style={S.btn}><Text style={S.btnText}>{t('missed')}</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/*****************
 * MAIN APP
 *****************/
function AppInner() {
  const { t } = useTranslation('t');
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [enabled, setEnabled] = useState(true);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  const lang = profile.language;

  useEffect(() => { (async () => { await askNotifPerms(); const s = await store.getSchedule(); setSchedule(s); await scheduleAll(s); const p = await store.getProfile(); if (p) { setProfile(p); i18n.changeLanguage(p.language || 'en'); } })(); }, []);

  const updateField = async (k, v) => { const s2 = { ...schedule, [k]: v }; setSchedule(s2); await store.setSchedule(s2); if (enabled) await scheduleAll(s2); };
  const toggleEnabled = async (val) => { setEnabled(val); if (val) await scheduleAll(schedule); else await Notifications.cancelAllScheduledNotificationsAsync(); };
  const markTakenByMed = async (m) => { const today = new Date().toISOString(); await store.setTaken(m.key, today); Alert.alert(t('markedByVoice'), `${(m.name[lang]||m.name.en)} ✓`); };

  const { request, promptAsync } = useGoogleAuth(profile, setProfile);

  const updateLang = async (language) => { const p = { ...profile, language }; setProfile(p); i18n.changeLanguage(language); await store.setProfile(p); };
  const updateRegion = async (region) => { const p = { ...profile, region }; setProfile(p); await store.setProfile(p); };

  return (
    <SafeAreaView style={S.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView>
        {/* AuricRx branded header */}
        <View style={[{ padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20 }, S.row]}> 
          <Image source={AURIC_LOGO} style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#111827' }} resizeMode="contain" />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ color:'white', fontSize: 22, fontWeight:'800' }}>AuricRx — {t('appName')}</Text>
            <Text style={{ color:'#9fb3c8', marginTop:6 }}>{t('reminders')}</Text>
          </View>
        </View>

        {/* Login / Personalization */}
        <View style={S.card}>
          <Text style={S.label}>{t('hello')}, {profile.name || t('guest')}</Text>
          <View style={[S.row, { marginTop: 10 }]}>
            <TouchableOpacity disabled={!request} onPress={() => promptAsync()} style={[S.btn, { marginRight: 10 }]}><Text style={S.btnText}>{t('loginGoogle')}</Text></TouchableOpacity>
            <Text style={S.subtitle}>{t('orGuest')}</Text>
          </View>
          <View style={{ height: 10 }} />
          <Text style={S.label}>{t('yourName')}</Text>
          <TextInput style={S.input} value={profile.name} onChangeText={async (name)=>{ const p={...profile,name}; setProfile(p); await store.setProfile(p); }} placeholder="Name" placeholderTextColor="#6b7280" />

          <Text style={[S.label, { marginTop: 12 }]}>{t('language')}</Text>
          <View style={S.row}> 
            {['en','es','zh'].map(code => (
              <TouchableOpacity key={code} onPress={()=>updateLang(code)} style={[S.chip, { borderColor: profile.language===code?'#22c55e':'#374151' }]}><Text style={S.chipText}>{t(code)}</Text></TouchableOpacity>
            ))}
          </View>

          <Text style={[S.label, { marginTop: 12 }]}>{t('region')}</Text>
          <View style={S.row}> 
            {['mx','us','cn'].map(code => (
              <TouchableOpacity key={code} onPress={()=>updateRegion(code)} style={[S.chip, { borderColor: profile.region===code?'#22c55e':'#374151' }]}><Text style={S.chipText}>{t(code)}</Text></TouchableOpacity>
            ))}
          </View>
          <Text style={{ color:'#93a5b1', fontSize:12, marginTop:6 }}>{t('regionNote')}</Text>
        </View>

        {/* Notifications toggle */}
        <View style={[S.card, S.rowBetween]}>
          <Text style={S.label}>{t('notifications')}</Text>
          <View style={S.row}><Text style={{ color:'#9fb3c8', marginRight:8 }}>{enabled ? t('on') : t('off')}</Text><Switch value={enabled} onValueChange={toggleEnabled} /></View>
        </View>

        {/* Time fields */}
        <View style={S.card}>
          <Text style={{ color:'white', fontWeight:'800', fontSize:16, marginBottom:6 }}>{t('times')}</Text>
          <TimeField label={t('wake')} value={schedule.wake} onChange={(v)=>updateField('wake',v)} />
          <TimeField label={t('breakfast')} value={schedule.breakfast} onChange={(v)=>updateField('breakfast',v)} />
          <TimeField label={t('psyllium')} value={schedule.psyllium} onChange={(v)=>updateField('psyllium',v)} />
          <TimeField label={t('dinner')} value={schedule.dinner} onChange={(v)=>updateField('dinner',v)} />
          <TimeField label={t('bedtime')} value={schedule.bedtime} onChange={(v)=>updateField('bedtime',v)} />
          <TouchableOpacity onPress={()=>scheduleAll(schedule)} style={[S.btn, { marginTop:8 }]}><Text style={S.btnText}>{t('save')}</Text></TouchableOpacity>
        </View>

        {/* Coach */}
        <View style={S.card}>
          <Text style={{ color:'#a3e635', fontWeight:'800', fontSize:16 }}>{t('coachTitle')}</Text>
          <Text style={{ color:'#d1fae5', marginTop:8 }}>{t('coachLine')}</Text>
          <Text style={{ color:'#bae6fd', marginTop:12 }}>{t('emergency')}</Text>
        </View>

        {/* Meds list */}
        <Text style={{ color:'#9fb3c8', marginLeft:16, marginTop:8, fontWeight:'700' }}>{t('todaysMeds')}</Text>
        {MEDS.map(m => (<MedCard key={m.key} med={m} schedule={schedule} lang={lang} />))}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Voice Dock (shows disabled hint in Expo Go) */}
      <VoiceDock onMarkTaken={markTakenByMed} lang={lang} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AppInner />
    </I18nextProvider>
  );
}
