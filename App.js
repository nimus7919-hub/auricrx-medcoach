// AuricRx MedCoach — Dashboard Build (single-file version) with Themes + Fonts
// SDK 53 friendly. Minimal deps; stubs where cloud keys are needed.

import React, { useEffect, useMemo, useRef, useState } from 'react';
  import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  Modal, TextInput, Switch, Image, Linking, Platform, Animated
} from 'react-native';import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';
import EnvCheck from './src/EnvCheck';

import { EXPO_PUBLIC_OPENAI_API_KEY, EXPO_PUBLIC_API_MODEL } from '@env';

console.log("🔑 OpenAI Key:", EXPO_PUBLIC_OPENAI_API_KEY);
console.log("🤖 API Model:", EXPO_PUBLIC_API_MODEL);

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Location from 'expo-location';
import { Audio } from 'expo-audio';
import { Video } from 'expo-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { askMedicalAI } from './src/api/api.medical-ai';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black
} from '@expo-google-fonts/inter';

const BACKEND_URL = 'https://YOUR_ENDPOINT/auricrx-chat'; // <= replace later

// ---------- i18n (inline, tiny) ----------
const STRINGS = {
  en: {
    nextReminder: 'Next reminder',
    reminders: 'Reminders',
    pharmacyLocations: 'Pharmacy Locations',
    aiConsultant: 'AI Consultant',
    labsLocations: 'Labs Locations',
    prescription: 'Prescription',
    appointmentLog: 'Appointment Log',
    healthJournal: 'Health Journal Widget',
    dashboard: 'Dashboard',
    settings: 'Settings',
    profile: 'Profile',
    language: 'Language',
    colorSettings: 'Color Settings',
    dayNight: 'Day / Night',
    moodShift: 'Mood-Based Theme Shift',
    help: 'Help',
    emailUs: 'Email us',
    askAI: 'Ask AI',
    tapToTalk: 'Tap to speak',
    stop: 'Stop',
    addReminder: 'Add Reminder',
    addPhoto: 'Add Photo',
    toPDF: 'Create PDF',
    record: 'Record',
    play: 'Play',
    save: 'Save',
    recording: 'Recording…',
    saved: 'Saved',
    startServerInfo: 'Start a local dev server and connect',
  },
  es: {
    nextReminder: 'Próximo recordatorio',
    reminders: 'Recordatorios',
    pharmacyLocations: 'Farmacias',
    aiConsultant: 'Asesor IA',
    labsLocations: 'Laboratorios',
    prescription: 'Receta',
    appointmentLog: 'Bitácora de Citas',
    healthJournal: 'Widget de Salud',
    dashboard: 'Inicio',
    settings: 'Ajustes',
    profile: 'Perfil',
    language: 'Idioma',
    colorSettings: 'Colores',
    dayNight: 'Día / Noche',
    moodShift: 'Cambio por estado de ánimo',
    help: 'Ayuda',
    emailUs: 'Escríbenos',
    askAI: 'Preguntar a IA',
    tapToTalk: 'Toque para hablar',
    stop: 'Detener',
    addReminder: 'Añadir recordatorio',
    addPhoto: 'Añadir foto',
    toPDF: 'Crear PDF',
    record: 'Grabar',
    play: 'Reproducir',
    save: 'Guardar',
    recording: 'Grabando…',
    saved: 'Guardado',
    startServerInfo: 'Inicie el servidor local y conecte',
  },
  zh: {
    nextReminder: '下一个提醒',
    reminders: '提醒',
    pharmacyLocations: '药房位置',
    aiConsultant: 'AI 咨询',
    labsLocations: '化验地点',
    prescription: '处方',
    appointmentLog: '就诊记录',
    healthJournal: '健康小组件',
    dashboard: '首页',
    settings: '设置',
    profile: '个人资料',
    language: '语言',
    colorSettings: '配色',
    dayNight: '日 / 夜',
    moodShift: '情绪感知主题',
    help: '帮助',
    emailUs: '给我们发邮件',
    askAI: '询问 AI',
    tapToTalk: '点击说话',
    stop: '停止',
    addReminder: '添加提醒',
    addPhoto: '添加照片',
    toPDF: '生成 PDF',
    record: '录音',
    play: '播放',
    save: '保存',
    recording: '录音中…',
    saved: '已保存',
    startServerInfo: '启动本地开发服务器并连接',
  },
};

// ---------- THEMES ----------
const PALETTES = {
  gold: {
    id: 'gold',
    bg: '#0b1117',
    bgStart: '#0b1117',
    bgEnd: '#0f1622',
    card: '#121a24',
    text: '#F3C96A',
    sub: '#b9a35a',
    accent: '#F3C96A',
    chip: '#1a2937',
  },
  blue: {
    id: 'blue',
    bg: '#0e1324',
    bgStart: '#0e1324',
    bgEnd: '#0b1020',
    card: '#121a33',
    text: '#bcd2ff',
    sub: '#91a6d8',
    accent: '#3a7bfd',
    chip: '#141b2e',
  },
  teal: {
    id: 'teal',
    bg: '#071b1b',
    bgStart: '#071b1b',
    bgEnd: '#052222',
    card: '#0d2424',
    text: '#aafaf0',
    sub: '#6bd7cb',
    accent: '#2dd4bf',
    chip: '#0c2a29',
  },
};

const STORAGE = {
  lang: 'AURIC_LANG',
  theme: 'AURIC_THEME',
  night: 'AURIC_NIGHT',
  mood: 'AURIC_MOOD',
  reminders: 'AURIC_REMINDERS',
  rxPhotos: 'AURIC_RX_PHOTOS',
  voiceNotes: 'AURIC_VOICE_NOTES',
};

// ---------- ROOT APP ----------
export default function App() {
  // TEMP FLAG - set to false when done testing env
  const debugEnv = true;

  // Load fonts first (simple gate)
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  // Put hooks/state INSIDE the component, before returns
  const [route, setRoute] = useState('dashboard'); 
  // 'reminders' | 'pharmacies' | 'labs' | 'prescription' | 'appointments' | 'settings'

  // language & theme
  const [lang, setLang] = useState('en');
  const [themeKey, setThemeKey] = useState('gold');
  const [night, setNight] = useState(false);
  const [moodShift, setMoodShift] = useState(true);

  // meds/reminders (light placeholder list)
  const [reminders, setReminders] = useState([]);
  // prescriptions gallery
  const [rxPhotos, setRxPhotos] = useState([]);
  // voice notes
  const [voiceNotes, setVoiceNotes] = useState([]);

// --- Medical AI local state ---
const [medInput, setMedInput] = useState('');
const [medAnswer, setMedAnswer] = useState('');
const [medLoading, setMedLoading] = useState(false);

async function handleAskMedical() {
  const q = medInput.trim();
  if (!q) return;
  try {
    setMedLoading(true);
    const answer = await askMedicalAI(q);   // calls ./src/api/API.Medical-AI
    setMedAnswer(answer || 'I could not find an answer.');
  } catch (e) {
    Alert.alert('AI error', 'Could not get an answer right now.');
  } finally {
    setMedLoading(false);
  }
}


  // AI Sheet state...
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([
    { role: 'system', text: 'Hi! Ask me anything about your meds or pharmacies.' },
  ]);

  // ---------- persistence ----------
  // load persisted
  useEffect(() => {
Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  (async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Notifications disabled', 'Enable notifications for reminder alerts.');
    }
  })();
}, []);

    useEffect(() => {
    (async () => {
      try {
        const [L, T, N, M, R, P, V] = await Promise.all([
          AsyncStorage.getItem(STORAGE.lang),
          AsyncStorage.getItem(STORAGE.theme),
          AsyncStorage.getItem(STORAGE.night),
          AsyncStorage.getItem(STORAGE.mood),
          AsyncStorage.getItem(STORAGE.reminders),
          AsyncStorage.getItem(STORAGE.rxPhotos),
          AsyncStorage.getItem(STORAGE.voiceNotes),
        ]);

        if (L) setLang(L);
        if (T) setThemeKey(T);
        if (N) setNight(N === '1');
        if (M) setMoodShift(M === '1');

        if (R) { try { setReminders(JSON.parse(R)); } catch {} }
        if (P) { try { setRxPhotos(JSON.parse(P)); } catch {} }
        if (V) { try { setVoiceNotes(JSON.parse(V)); } catch {} }
      } catch {
        // ignore corrupt storage on boot
      }
    })();
  }, []);

// inside componen schedule reminder
async function scheduleReminderNotification(name, time24h) {
  // time24h like "13:45"
  const [hh, mm] = (time24h || '').split(':').map(n => parseInt(n, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return;

  const now = new Date();
  const fire = new Date(now);
  fire.setHours(hh, mm, 0, 0);
  if (fire <= now) fire.setDate(fire.getDate() + 1); // schedule for tomorrow if time already passed

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Medication Reminder',
        body: name || 'Time to take your medication',
        sound: 'default',
      },
      trigger: fire, // exact datetime
    });
  } catch (e) {
    console.log('schedule error', e);
  }
}
  // persist basics
  useEffect(() => { AsyncStorage.setItem(STORAGE.lang, lang); }, [lang]);
  useEffect(() => { AsyncStorage.setItem(STORAGE.theme, themeKey); }, [themeKey]);
  useEffect(() => { AsyncStorage.setItem(STORAGE.night, night ? '1' : '0'); }, [night]);
  useEffect(() => { AsyncStorage.setItem(STORAGE.mood, moodShift ? '1' : '0'); }, [moodShift]);
  useEffect(() => { AsyncStorage.setItem(STORAGE.reminders, JSON.stringify(reminders)); }, [reminders]);
  useEffect(() => { AsyncStorage.setItem(STORAGE.rxPhotos, JSON.stringify(rxPhotos)); }, [rxPhotos]);
  useEffect(() => { AsyncStorage.setItem(STORAGE.voiceNotes, JSON.stringify(voiceNotes)); }, [voiceNotes]);

  // mood shift color tweak (toy demo: if last AI message contains "stress", switch to teal)
  const theme = useMemo(() => {
    let base = PALETTES[themeKey] || PALETTES.gold;
    if (night) base = { ...base, bg: '#000000', bgStart: '#000000', bgEnd: '#070a0e', card: '#0c0c0f', text: base.text, sub: base.sub };
    if (moodShift && aiMessages.slice(-1)[0]?.text?.toLowerCase?.().includes('stress')) {
      base = PALETTES.teal;
    }
    return base;
  }, [themeKey, night, moodShift, aiMessages]);


// animation refs
const splashOpacity = useRef(new Animated.Value(1)).current;
const logoScale = useRef(new Animated.Value(1)).current;
const textOpacity = useRef(new Animated.Value(1)).current;

useEffect(() => {
  if (!fontsLoaded) {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(logoScale, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(logoScale, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(textOpacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
          Animated.timing(textOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }
}, [fontsLoaded]);

// fade out when fonts loaded
useEffect(() => {
  if (fontsLoaded) {
    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }
}, [fontsLoaded]);

const S = STRINGS[lang] || STRINGS.en;


  // --------- Helpers ----------
  const Card = ({ title, icon, onPress }) => (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme.card, borderColor: theme.chip }]} onPress={onPress}>
      <View style={styles.cardIcon}>{icon}</View>
      <Text style={[styles.cardText, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>{title}</Text>
    </TouchableOpacity>
  );

  const TopBar = () => (
  <View style={[styles.topbar, { borderColor: theme.chip, flexDirection:'row', alignItems:'center', justifyContent:'space-between' }]}>
    <TouchableOpacity onPress={() => setRoute('dashboard')}>
      <Text style={[styles.brand, { color: theme.text, fontFamily: 'Inter_900Black' }]}>AuricRx</Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={() => setRoute('settings')}>
      <Text style={{ fontSize: 22, color: theme.accent }}>⚙️</Text>
    </TouchableOpacity>
  </View>
);

  // --------- Dashboard ----------
  const nextReminder = reminders.slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''))[0];

//------------AI-----------
const [medicalInput, setMedicalInput] = useState("");
const [medicalResponse, setMedicalResponse] = useState("");

const handleAskMedicalAI = async () => {
  const answer = await askMedicalAI(medicalInput);
  setMedicalResponse(answer);
};


  // --------- Pharmacies ----------
  async function openPharmaciesNearMe() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Location denied', 'Enable location to search nearby pharmacies.');
      const { coords } = await Location.getCurrentPositionAsync({});
      const q = encodeURIComponent('pharmacy');
      const url = Platform.select({
        ios: `http://maps.apple.com/?q=${q}&ll=${coords.latitude},${coords.longitude}`,
        android: `geo:${coords.latitude},${coords.longitude}?q=${q}`,
        default: `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=`,
      });
      Linking.openURL(url);
    } catch (e) {
      Alert.alert('Map error', 'Could not open maps.');
    }
  }

  // --------- Prescription: pick image & create simple PDF ----------
  async function addRxPhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Camera needed', 'Please allow camera.');
    const photo = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!photo.canceled) {
      const uri = photo.assets?.[0]?.uri;
      if (uri) setRxPhotos((p) => [...p, { id: `${Date.now()}`, uri }]);
    }
  }

  async function exportRxToPDF() {
    if (rxPhotos.length === 0) return Alert.alert('No photos', 'Add at least one prescription photo.');
    const imgs = rxPhotos.map(p => `<div style="margin:12px 0"><img src="${p.uri}" style="width:100%"/></div>`).join('');
    const html = `<html><body>${imgs}</body></html>`;
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share prescription PDF' });
    } else {
      Alert.alert('PDF saved', uri);
    }
  }

  // --------- Appointment Log: voice note ----------
  const recRef = useRef(null);
  const soundRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  async function toggleRecord() {
    try {
      if (!isRecording) {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') return;
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const rec = new Audio.Recording();
        await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        await rec.startAsync();
        recRef.current = rec;
        setIsRecording(true);
      } else {
        const rec = recRef.current;
        if (!rec) return;
        await rec.stopAndUnloadAsync();
        const uri = rec.getURI();
        setIsRecording(false);
        if (uri) {
          const note = { id: `${Date.now()}`, uri, createdAt: Date.now() };
          setVoiceNotes((v) => [note, ...v]);
          Alert.alert(S.saved);
        }
      }
    } catch (e) {
      setIsRecording(false);
      Alert.alert('Recording error');
    }
  }

  async function playNote(uri) {
    try {
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      await sound.playAsync();
    } catch { /* noop */ }
  }

  // --------- AI Sheet (stub: replace with your backend later) ----------
  async function askAI() {
  const q = aiInput.trim();
  if (!q) return;
  setAiMessages(m => [...m, { role: 'user', text: q }]);
  setAiInput('');

  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: q }),
    });
    const data = await res.json();
    const reply = data?.reply || 'Sorry—no response.';
    setAiMessages(m => [...m, { role: 'assistant', text: reply }]);
  } catch (e) {
    setAiMessages(m => [...m, { role: 'assistant', text: 'Network error. Try again.' }]);
  }
}

  // --------- Screens ----------
  const Dashboard = () => (
    <LinearGradient colors={[theme.bgStart, theme.bgEnd]} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
        <TopBar />
        {/* Health widget */}
        <View style={[styles.widget, { backgroundColor: theme.card, borderColor: theme.chip }]}>
          <Text style={[styles.widgetTitle, { color: theme.text, fontFamily: 'Inter_800ExtraBold' }]}>{S.healthJournal}</Text>
          <View style={[styles.widgetInner, { backgroundColor: theme.chip }]}>
            <Text style={[styles.widgetSub, { color: theme.sub, fontFamily: 'Inter_600SemiBold' }]}>{S.nextReminder}</Text>
            <Text style={[styles.widgetBig, { color: theme.text, fontFamily: 'Inter_900Black' }]}>
              {nextReminder?.name || '—'}
            </Text>
            <Text style={{ color: theme.sub, fontFamily: 'Inter_600SemiBold' }}>{nextReminder?.time || '--:--'}</Text>
          </View>
        </View>

<View style={{ marginTop: 20, padding: 16 }}>
  <Text style={{ color: theme.text, fontFamily: "Inter_800ExtraBold", marginBottom: 8 }}>
    Medical AI
  </Text>
  <TextInput
    placeholder="Ask a medical question..."
    value={medicalInput}
    onChangeText={setMedicalInput}
    placeholderTextColor={theme.sub}
    style={{
      borderWidth: 1,
      borderColor: theme.chip,
      padding: 10,
      marginBottom: 10,
      color: theme.text,
      fontFamily: "Inter_400Regular"
    }}
  />
  <TouchableOpacity
    style={[styles.aiBtn, { backgroundColor: theme.accent, padding: 10 }]}
    onPress={handleAskMedicalAI}
  >
    <Text style={{ color: "#0b1117", fontFamily: "Inter_800ExtraBold" }}>
      Ask Medical AI
    </Text>
  </TouchableOpacity>
  <ScrollView style={{ marginTop: 20, maxHeight: 200 }}>
    <Text style={{ color: theme.text, fontFamily: "Inter_400Regular" }}>
      {medicalResponse}
    </Text>
  </ScrollView>
</View>


        {/* 2x3 card grid */}
        <View style={styles.grid}>
          <Card title={S.reminders} icon={<Text style={styles.emoji}>🔔</Text>} onPress={() => setRoute('reminders')} />
          <Card title={S.pharmacyLocations} icon={<Text style={styles.emoji}>📍</Text>} onPress={() => setRoute('pharmacies')} />
          <Card title={S.aiConsultant} icon={<Text style={styles.emoji}>💬</Text>} onPress={() => setAiOpen(true)} />
          <Card title={S.labsLocations} icon={<Text style={styles.emoji}>🧪</Text>} onPress={() => setRoute('labs')} />
          <Card title={S.prescription} icon={<Text style={styles.emoji}>🧾</Text>} onPress={() => setRoute('prescription')} />
          <Card title={S.appointmentLog} icon={<Text style={styles.emoji}>🗓️</Text>} onPress={() => setRoute('appointments')} />
        </View>
      </ScrollView>
    </LinearGradient>
  );

  const Reminders = () => {
    const [name, setName] = useState('');
    const [time, setTime] = useState('');
    return (
      <LinearGradient colors={[theme.bgStart, theme.bgEnd]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Header title={S.reminders} />
          <View style={[styles.form, { backgroundColor: theme.card, borderColor: theme.chip }]}>
            <TextInput placeholder="Name" placeholderTextColor={theme.sub} style={[styles.input, { color: theme.text, borderColor: theme.chip, fontFamily: 'Inter_400Regular' }]} value={name} onChangeText={setName} />
            <TextInput placeholder="HH:MM (24h)" placeholderTextColor={theme.sub} style={[styles.input, { color: theme.text, borderColor: theme.chip, fontFamily: 'Inter_400Regular' }]} value={time} onChangeText={setTime} />
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: theme.accent }]}
              onPress={async () => {
  if (!name || !time) return;
  const newItem = { id: `${Date.now()}`, name, time };
  setReminders(r => [...r, newItem]);
  await scheduleReminderNotification(name, time);
  setName(''); setTime('');
}}>
              <Text style={[styles.btnText, { color: '#0b1117', fontFamily: 'Inter_800ExtraBold' }]}>{S.addReminder}</Text>
            </TouchableOpacity>
          </View>

          {reminders.map(r => (
            <View key={r.id} style={[styles.row, { backgroundColor: theme.card, borderColor: theme.chip }]}>
              <Text style={{ color: theme.text, fontFamily: 'Inter_700Bold' }}>{r.time}</Text>
              <Text style={{ color: theme.text, flex: 1, marginLeft: 12, fontFamily: 'Inter_400Regular' }}>{r.name}</Text>
              <TouchableOpacity onPress={() => setReminders((all) => all.filter(x => x.id !== r.id))}>
                <Text style={{ color: theme.sub, fontFamily: 'Inter_600SemiBold' }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </LinearGradient>
    );
  };

  const Pharmacies = () => (
    <LinearGradient colors={[theme.bgStart, theme.bgEnd]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Header title={S.pharmacyLocations} />
        <Text style={{ color: theme.sub, marginBottom: 12, fontFamily: 'Inter_400Regular' }}>
          Tap below to open your maps with nearby pharmacies.
        </Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent }]} onPress={openPharmaciesNearMe}>
          <Text style={[styles.btnText, { color: '#0b1117', fontFamily: 'Inter_800ExtraBold' }]}>Open Maps</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );

  const Labs = () => (
    <LinearGradient colors={[theme.bgStart, theme.bgEnd]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Header title={S.labsLocations} />
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent }]}
          onPress={async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            const { coords } = await Location.getCurrentPositionAsync({});
            const q = encodeURIComponent('medical laboratory');
            const url = Platform.select({
              ios: `http://maps.apple.com/?q=${q}&ll=${coords.latitude},${coords.longitude}`,
              android: `geo:${coords.latitude},${coords.longitude}?q=${q}`,
              default: `https://www.google.com/maps/search/?api=1&query=${q}`,
            });
            Linking.openURL(url);
          }}>
          <Text style={[styles.btnText, { color: '#0b1117', fontFamily: 'Inter_800ExtraBold' }]}>Find Labs Near Me</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );

  const Prescription = () => (
    <LinearGradient colors={[theme.bgStart, theme.bgEnd]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Header title={S.prescription} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={[styles.btnSm, { backgroundColor: theme.accent }]} onPress={addRxPhoto}>
            <Text style={[styles.btnText, { color: '#0b1117', fontFamily: 'Inter_800ExtraBold' }]}>{S.addPhoto}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnSm, { backgroundColor: theme.accent }]} onPress={exportRxToPDF}>
            <Text style={[styles.btnText, { color: '#0b1117', fontFamily: 'Inter_800ExtraBold' }]}>{S.toPDF}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gallery}>
          {rxPhotos.map(p => (
            <Image key={p.id} source={{ uri: p.uri }} style={styles.thumb} />
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );

  const Appointments = () => (
    <LinearGradient colors={[theme.bgStart, theme.bgEnd]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Header title={S.appointmentLog} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={[styles.btnSm, { backgroundColor: theme.accent }]} onPress={toggleRecord}>
            <Text style={[styles.btnText, { color: '#0b1117', fontFamily: 'Inter_800ExtraBold' }]}>{isRecording ? S.stop : S.record}</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: theme.sub, marginTop: 8, fontFamily: 'Inter_600SemiBold' }}>{isRecording ? S.recording : ' '}</Text>

        {voiceNotes.map(n => (
          <View key={n.id} style={[styles.row, { backgroundColor: theme.card, borderColor: theme.chip, marginTop: 12 }]}>
            <Text style={{ color: theme.text, flex: 1, fontFamily: 'Inter_400Regular' }}>{new Date(n.createdAt).toLocaleString()}</Text>
            <TouchableOpacity onPress={() => playNote(n.uri)}><Text style={{ color: theme.sub, fontFamily: 'Inter_600SemiBold' }}>{S.play}</Text></TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );

  const Settings = () => (
    <LinearGradient colors={[theme.bgStart, theme.bgEnd]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Header title={S.settings} />
        <Section title={S.profile}>
          <Text style={{ color: theme.sub, fontFamily: 'Inter_400Regular' }}>AuricRx — MedCoach</Text>
        </Section>

        <Section title={S.language}>
          <RowSwitch label="English" value={lang === 'en'} onToggle={() => setLang('en')} />
          <RowSwitch label="Español" value={lang === 'es'} onToggle={() => setLang('es')} />
          <RowSwitch label="中文" value={lang === 'zh'} onToggle={() => setLang('zh')} />
        </Section>

        <Section title={S.colorSettings}>
          <RowSwitch label="Gold" value={themeKey === 'gold'} onToggle={() => setThemeKey('gold')} />
          <RowSwitch label="Blue" value={themeKey === 'blue'} onToggle={() => setThemeKey('blue')} />
          <RowSwitch label="Teal" value={themeKey === 'teal'} onToggle={() => setThemeKey('teal')} />
        </Section>

        <Section title={S.dayNight}>
          <SwitchRow label="Night mode" value={night} onValueChange={setNight} />
        </Section>

        <Section title={S.moodShift}>
          <SwitchRow label="Auto-calm colors when stressed" value={moodShift} onValueChange={setMoodShift} />
        </Section>

        <Section title={S.help}>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:AuricRx@gmail.com')}>
            <Text style={{ color: theme.accent, fontFamily: 'Inter_700Bold' }}>{S.emailUs}: AuricRx@gmail.com</Text>
          </TouchableOpacity>
        </Section>
      </ScrollView>
    </LinearGradient>
  );

  const Header = ({ title }) => (
  <View style={[styles.header, { borderColor: theme.chip }]}>
    {route !== 'dashboard' ? (
      <TouchableOpacity onPress={() => setRoute('dashboard')}>
        <Text style={{ color: theme.text, fontSize: 18, fontFamily: 'Inter_600SemiBold' }}>←</Text>
      </TouchableOpacity>
    ) : (
      <View style={{ width: 20 }} />
    )}

    <Text style={{ color: theme.text, fontSize: 16, fontFamily: 'Inter_800ExtraBold' }}>{title}</Text>

    <TouchableOpacity onPress={() => setRoute('settings')}>
      <Text style={{ fontSize: 18, color: theme.accent }}>⚙️</Text>
    </TouchableOpacity>
  </View>
);

  const Section = ({ title, children }) => (
    <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.chip }]}>
      <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: 'Inter_800ExtraBold' }]}>{title}</Text>
      {children}
    </View>
  );

  const RowSwitch = ({ label, value, onToggle }) => (
    <TouchableOpacity style={styles.rowBetween} onPress={onToggle}>
      <Text style={{ color: theme.text, fontFamily: 'Inter_400Regular' }}>{label}</Text>
      <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: value ? theme.accent : theme.chip }} />
    </TouchableOpacity>
  );

  const SwitchRow = ({ label, value, onValueChange }) => (
    <View style={styles.rowBetween}>
      <Text style={{ color: theme.text, fontFamily: 'Inter_400Regular' }}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );

 // choose screen
  let Screen = <View><Text>Dashboard</Text></View>;
  if (route === 'reminders') Screen = <Reminders />;
  else if (route === 'pharmacies') Screen = <Pharmacies />;
  else if (route === 'labs') Screen = <Labs />;
  else if (route === 'prescription') Screen = <Prescription />;
  else if (route === 'appointments') Screen = <Appointments />;
  else if (route === 'settings') Screen = <Settings />;

  // final return (inside the App function)
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {Screen}

    {/* Floating AI button */}
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: theme.accent }]}
      onPress={() => setAiOpen(true)}
    >
      <Text style={{ color: '#0b1117', fontFamily: 'Inter_800ExtraBold' }}>AI</Text>
    </TouchableOpacity>

    {/* Medical AI widget (always visible) */}
    <View style={[styles.widget, { backgroundColor: theme.card, borderColor: theme.chip, marginBottom: 16 }]}>
      <Text style={[styles.widgetTitle, { color: theme.text, fontFamily: 'Inter_800ExtraBold' }]}>
        Medical AI
      </Text>

      <TextInput
        placeholder="Ask me a medical question..."
        value={medInput}
        onChangeText={setMedInput}
        placeholderTextColor={theme.sub}
        style={[
          styles.input,
          { color: theme.text, borderColor: theme.chip, marginBottom: 8, fontFamily: 'Inter_400Regular' }
        ]}
      />

      <TouchableOpacity
        style={[styles.btnSm, { backgroundColor: theme.accent, alignSelf: 'flex-start' }]}
        onPress={handleAskMedical}
        disabled={medLoading}
      >
        <Text style={[styles.btnText, { color: '#0b1117', fontFamily: 'Inter_800ExtraBold' }]}>
          {medLoading ? 'Thinking…' : 'Ask AI'}
        </Text>
      </TouchableOpacity>

      {!!medAnswer && (
        <View style={[styles.section, { backgroundColor: theme.chip, borderColor: theme.chip, marginTop: 12 }]}>
          <Text style={{ color: theme.text, fontFamily: 'Inter_400Regular' }}>{medAnswer}</Text>
        </View>
      )}
    </View>

    {/* AI modal */}
    <Modal visible={aiOpen} animationType="slide" transparent onRequestClose={() => setAiOpen(false)}>
      <View style={styles.sheetBackdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.chip }]}>
          <View style={styles.sheetHeader}>
            <Text style={{ color: theme.text, fontFamily: 'Inter_800ExtraBold' }}>{S.aiConsultant}</Text>
            <TouchableOpacity onPress={() => setAiOpen(false)}>
              <Text style={{ color: theme.sub, fontFamily: 'Inter_600SemiBold' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 8 }}>
            {aiMessages.map((m, idx) => (
              <View
                key={idx}
                style={[
                  styles.msg,
                  m.role === 'user' ? styles.msgUser : styles.msgBot,
                  { borderColor: theme.chip, backgroundColor: m.role === 'user' ? theme.chip : theme.card },
                ]}
              >
                <Text style={{ color: theme.text, fontFamily: 'Inter_400Regular' }}>{m.text}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.aiInputRow}>
            <TextInput
              value={aiInput}
              onChangeText={setAiInput}
              placeholder="Ask about medications, pharmacies…"
              placeholderTextColor={theme.sub}
              style={[styles.aiInput, { color: theme.text, borderColor: theme.chip, fontFamily: 'Inter_400Regular' }]}
            />
            <TouchableOpacity style={[styles.aiBtn, { backgroundColor: theme.accent }]} onPress={askAI}>
              <Text style={{ color: '#0b1117', fontFamily: 'Inter_800ExtraBold' }}>Send</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: theme.sub, fontSize: 12, marginTop: 4, textAlign: 'center', fontFamily: 'Inter_400Regular' }}>
            {S.tapToTalk}: (voice input wired in next build)
          </Text>
        </View>
      </View>
    </Modal>
  </View>
);
} // <-- CLOSES export default function App()

// ---------- styles ----------
const styles = StyleSheet.create({
  topbar: { borderBottomWidth: 1, paddingBottom: 10, marginBottom: 16 },
  brand: { fontSize: 28 },
  quickRow: { flexDirection: 'row', gap: 18, marginTop: 8, flexWrap: 'wrap' },
  quick: { fontSize: 14 },

  widget: { borderWidth: 1, borderRadius: 18, padding: 12, marginBottom: 16 },
  widgetTitle: { fontSize: 18, marginBottom: 10 },
  widgetInner: { borderRadius: 16, padding: 14 },
  widgetSub: { fontSize: 12, marginBottom: 4 },
  widgetBig: { fontSize: 22, marginBottom: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: '47%', borderWidth: 1, borderRadius: 20, paddingVertical: 26, alignItems: 'center' },
  cardIcon: { marginBottom: 12 },
  cardText: { fontSize: 18, textAlign: 'center' },
  emoji: { fontSize: 36 },

  header: {  // ✅ fixed here, only one "header"
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  section: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 16, marginBottom: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },

  form: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },

  row: { borderWidth: 1, padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: { marginTop: 6, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  btnSm: { borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  btnText: { fontSize: 15 },

  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  thumb: { width: '48%', height: 160, borderRadius: 12 },

  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '80%', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, padding: 12 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  msg: { padding: 10, borderRadius: 12, borderWidth: 1, marginVertical: 4, marginHorizontal: 2 },
  msgUser: { alignSelf: 'flex-end' },
  msgBot: { alignSelf: 'flex-start' },

  aiInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  aiInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  aiBtn: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});