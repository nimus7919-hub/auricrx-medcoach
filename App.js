// AuricRx MedCoach — Dashboard Build (single-file version) with Themes + Fonts
// SDK 53 friendly. Minimal deps; stubs where cloud keys are needed.

import React, { useEffect, useMemo, useRef, useState } from 'react';
  import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  Modal, TextInput, Switch, Image, Linking, Platform, Animated, Keyboard
} from 'react-native';
import TypingEffect from './src/components/TypingEffect';
import * as ImagePicker from 'expo-image-picker';
import { herbs } from './src/data/herbs';	
import { KeyboardAvoidingView, FlatList } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';

import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Location from 'expo-location';
import { Audio } from 'expo-audio';
import { Video } from 'expo-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { askMedicalAI } from './src/api/api.medical-ai';
import Constants from "expo-constants";
import MedicationRefillModal from './components/MedicationRefillModal';
import ErrorBoundary from './components/ErrorBoundary';
import HerbsScreen from './src/screens/HerbsScreen';
import DocScanScreen from './src/screens/DocScanScreen';
import Medications from './components/Medications';

const USING_EXPO_GO = Constants.appOwnership === "expo";

import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black
} from '@expo-google-fonts/inter';

// --- backend endpoint ---
const BACKEND_URL = "https://auricrx-medcoach.onrender.com/ask";


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
    startServerInfo: 'Start local dev server and connect',
    medications: 'Medications',
    refill: 'Refill',
    edit: 'Edit',
    addMedication: 'Add Medication',
    editMedication: 'Edit Medication',
    dosesLeft: 'Doses left',
    status: 'Status',
    times: 'Times',
    delete: 'Delete',
    cancel: 'Cancel',
    saveBtn: 'Save',
    add: 'Add',
    pickTime: 'Pick time'
  },
  es: {
    nextReminder: 'Próximo recordatorio',
    reminders: 'Recordatorios',
    pharmacyLocations: 'Farmacias',
    aiConsultant: 'Consultor IA',
    labsLocations: 'Laboratorios',
    prescription: 'Receta',
    appointmentLog: 'Citas',
    healthJournal: 'Registro de Salud',
    dashboard: 'Panel',
    settings: 'Configuración',
    profile: 'Perfil',
    language: 'Idioma',
    colorSettings: 'Colores',
    dayNight: 'Día / Noche',
    moodShift: 'Cambio de humor',
    help: 'Ayuda',
    emailUs: 'Escríbenos',
    askAI: 'Preguntar a IA',
    tapToTalk: 'Toca para hablar',
    stop: 'Detener',
    addReminder: 'Agregar recordatorio',
    addPhoto: 'Agregar foto',
    toPDF: 'Crear PDF',
    record: 'Grabar',
    play: 'Reproducir',
    save: 'Guardar',
    recording: 'Grabando…',
    saved: 'Guardado',
    startServerInfo: 'Iniciar servidor local y conectar',
    medications: 'Medicamentos',
    refill: 'Recargar',
    edit: 'Editar',
    addMedication: 'Agregar Medicamento',
    editMedication: 'Editar Medicamento',
    dosesLeft: 'Dosis restantes',
    status: 'Estado',
    times: 'Horarios',
    delete: 'Eliminar',
    cancel: 'Cancelar',
    saveBtn: 'Guardar',
    add: 'Agregar',
  pickTime: 'Elegir hora',
  namePlaceholder: 'Nombre',
  directions: 'Direcciones',
  pickup: 'Retiro',
  delivery: 'Entrega',
  cash: 'Efectivo',
  coupon: 'Cupón',
  showAll: 'Ver todo',
  close: 'Cerrar',
  reserve: 'Reservar (demo)',
  lastRefill: 'Última recarga'
  ,past: 'Pasado'
  ,refillSoon: 'Recargar pronto'
  ,expired: 'Vencido'
  },
  zh: {
    nextReminder: '下一个提醒',
    reminders: '提醒',
    pharmacyLocations: '药房位置',
    aiConsultant: 'AI顾问',
    labsLocations: '实验室',
    prescription: '处方',
    appointmentLog: '预约日志',
    healthJournal: '健康日记',
    dashboard: '仪表盘',
    settings: '设置',
    profile: '个人资料',
    language: '语言',
    colorSettings: '颜色设置',
    dayNight: '昼 / 夜',
    moodShift: '情绪主题切换',
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
    startServerInfo: '启动本地服务器并连接',
    medications: '药物',
    refill: '续药',
    edit: '编辑',
    addMedication: '添加药物',
    editMedication: '编辑药物',
    dosesLeft: '剩余剂量',
    status: '状态',
    times: '时间',
    delete: '删除',
    cancel: '取消',
    saveBtn: '保存',
    add: '添加',
  pickTime: '选择时间',
  namePlaceholder: '名称',
  directions: '导航',
  pickup: '自取',
  delivery: '配送',
  cash: '现金',
  coupon: '优惠券',
  showAll: '显示全部',
  close: '关闭',
  reserve: '预定 (演示)',
  lastRefill: '上次续药'
  ,past: '已过'
  ,refillSoon: '快用完'
  ,expired: '已过期'
  }
};

// ---------- THEMES ----------
const PALETTES = {
  gold: {
    id: 'gold',
    bg: '#faf8f5',
    bgStart: '#faf8f5',
    bgEnd: '#f5f2ed',
    card: '#ffffff',
    text: '#2c2c2c',
    sub: '#6b6b6b',
    accent: '#D4AF37',
    chip: '#e8e3d8',
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
  black: {
    id: 'black',
    bg: '#000000',
    bgStart: '#000000',
    bgEnd: '#1a1a1a',
    card: '#1a1a1a',
    text: '#FFA500',
    sub: '#FFB84D',
    accent: '#FFA500',
    chip: '#2a2a2a',
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
  meds: 'AURIC_MEDS',
};

// Lightweight streaming hook (defined inline to avoid extra files)
function useMedicalStreamLocal(endpoint) {
  const controllerRef = useRef(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  async function ask(messages) {
    if (!endpoint) throw new Error('No stream endpoint provided');
    try {
      if (controllerRef.current) controllerRef.current.abort();
    } catch {}

    controllerRef.current = new AbortController();
    setText('');
    setLoading(true);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          messages,
          stream: false, // Disable streaming for now to fix the issue
          temperature: 0.7,
          max_tokens: 500
        }),
        signal: controllerRef.current.signal,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Stream endpoint returned ${res.status}`);
      }

        const full = await res.text();
        setText(full);
        return full;
    } catch (e) {
      if (e.name === 'AbortError') return;
      throw e;
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    try { controllerRef.current?.abort(); } catch {}
    setLoading(false);
  }

  return { text, loading, ask, cancel };
}

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
  const [fontColor, setFontColor] = useState('default');
  const [night, setNight] = useState(false);
  const [moodShift, setMoodShift] = useState(true);

  // meds/reminders (light placeholder list)
  const [reminders, setReminders] = useState([]);
  const [meds, setMeds] = useState([
    {
      id: '1',
      name: 'Aspirin',
      strength: '81mg',
      status: 'taking',
      times: ['08:00'],
      startDate: '2024-01-01',
      endDate: '',
      notes: 'Low dose for heart health',
      dosesLeft: '30'
    },
    {
      id: '2',
      name: 'Metformin',
      strength: '500mg',
      status: 'taking',
      times: ['08:00', '20:00'],
      startDate: '2024-01-15',
      endDate: '',
      notes: 'For diabetes management',
      dosesLeft: '60'
    }
  ]); // lifted medications state
  const [supplements, setSupplements] = useState([
    {
      id: '1',
      name: 'Vitamin D3',
      brand: 'Nature Made',
      dosage: '1000 IU',
      status: 'taking',
      times: ['08:00'],
      startDate: '2024-01-15',
      endDate: '',
      notes: 'Take with breakfast',
      dosesLeft: '90',
      refillSoon: false
    },
    {
      id: '2',
      name: 'Omega-3',
      brand: 'Nordic Naturals',
      dosage: '1000mg',
      status: 'taking',
      times: ['12:00'],
      startDate: '2024-01-10',
      endDate: '',
      notes: 'Take with lunch',
      dosesLeft: '60',
      refillSoon: true
    }
  ]);
  // prescriptions gallery
  const [rxPhotos, setRxPhotos] = useState([]);
  // voice notes
  const [voiceNotes, setVoiceNotes] = useState([]);
  // --- Medical AI local state ---
const [aiMessage, setAiMessage] = useState("");
const [aiReply, setAiReply] = useState("");
const [loadingAI, setLoadingAI] = useState(false);

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


  // --- Floating AI modal state ---
const [aiOpen, setAiOpen] = useState(false)
const [keyboardHeight, setKeyboardHeight] = useState(0)

// Keyboard event listeners
useEffect(() => {
  const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
    setKeyboardHeight(e.endCoordinates.height);
  });
  const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
    setKeyboardHeight(0);
  });

  return () => {
    keyboardDidShowListener?.remove();
    keyboardDidHideListener?.remove();
  };
}, []);

useEffect(() => {
  if (aiOpen) {
    // Reset keyboard height when modal opens
    setKeyboardHeight(0);
    setTimeout(() => aiInputRef.current?.focus(), 100);
  }
}, [aiOpen]);
const [aiInput, setAiInput] = useState('');
const [aiMessages, setAiMessages] = useState([
  { role: 'system', text: 'Hi! I can help you with information about your medications and supplements. What would you like to know?' },
]);
const [aiSending, setAiSending] = useState(false);

// auto-scroll to bottom on new message
const aiScrollRef = useRef(null);
useEffect(() => {
  requestAnimationFrame(() => aiScrollRef.current?.scrollToEnd({ animated: true }));
}, [aiMessages]);

const aiInputRef = useRef(null);

  // streaming hook (use a local inline implementation)
  const { text: streamText, loading: streamLoading, ask: streamAsk, cancel: streamCancel } = useMedicalStreamLocal("https://auricrx-medcoach.onrender.com/ask-stream");

  // sync streaming text into aiMessages so UI shows live tokens
  useEffect(() => {
    if (!streamText) return;
    setAiMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant') {
        return [...prev.slice(0, -1), { role: 'assistant', text: streamText }];
      }
      return [...prev, { role: 'assistant', text: streamText }];
    });
  }, [streamText]);


// send to backend and update UI
async function sendAi(reminders, rxPhotos, meds, supplements, herbs, theme) {
  console.log('=== sendAi function called ===');
  const q = aiInput.trim();
  console.log('Input text:', q);
  console.log('aiSending:', aiSending);
  
  if (!q || aiSending) {
    console.log('Early return - no text or already sending');
    return;
  }

  console.log('Proceeding with AI request...');
  // show the user's message immediately
  setAiMessages(m => [...m, { role: 'user', text: q }]);
  setAiInput('');
  setAiSending(true);

  console.log('Building user data for tool calling...');
  console.log('reminders:', reminders?.length || 0);
  console.log('rxPhotos:', rxPhotos?.length || 0);
  console.log('meds:', meds?.length || 0);
  console.log('supplements:', supplements?.length || 0);
  console.log('herbs:', herbs?.length || 0);
  console.log('theme:', theme?.id || 'none');


  // Prepare user data for tool calling
  let userData;
  try {
    console.log('Preparing medications...');
    const medsData = meds.map(med => ({
      name: med.name,
      strength: med.strength || 'N/A',
      status: med.status,
      times: med.times || [],
      notes: med.notes || ''
    }));
    console.log('Medications prepared:', medsData.length);

    console.log('Preparing supplements...');
    const supplementsData = supplements.map(supp => ({
      name: supp.name,
      dosage: supp.dosage || 'N/A',
      status: supp.status,
      times: supp.times || [],
      notes: supp.notes || ''
    }));
    console.log('Supplements prepared:', supplementsData.length);

    console.log('Preparing reminders...');
    const remindersData = reminders.map(rem => ({
      time: rem.time || '',
      name: rem.name || '',
      text: rem.text || ''
    }));
    console.log('Reminders prepared:', remindersData.length);

    console.log('Preparing herbs...');
    const herbsData = (herbs || []).slice(0, 5).map(herb => ({
      name: herb.name,
      category: herb.category
    }));
    console.log('Herbs prepared:', herbsData.length);

    userData = {
      meds: medsData,
      supplements: supplementsData,
      reminders: remindersData,
      herbs: herbsData
    };

    console.log('User data prepared for tool calling:', userData);
  } catch (error) {
    console.log('Error preparing user data:', error);
    setAiMessages(m => [...m, { role: 'assistant', text: 'Error preparing your health data. Please try again.' }]);
    setAiSending(false);
    return;
  }

  // Skip API test and go directly to tool calling
  console.log('Using tool calling approach...');
  console.log('Question:', q);
  console.log('API Base URL:', 'https://auricrx-medcoach.onrender.com');
  
  // Add immediate response
  setAiMessages(m => [...m, { role: 'assistant', text: 'AI is thinking...' }]);
  
  try {
    console.log('Sending question with user data for tool calling...');
    console.log('Request payload:', {
      message: q,
      userData: userData
    });
    
    const response = await fetch('https://auricrx-medcoach.onrender.com/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: q,
        userData: userData
      })
    });
    
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    
    const data = await response.json();
    console.log('Backend response:', data);
    const reply = data.reply || 'No response received';
    console.log('Got response with tool calling:', reply);
    
      setAiMessages(m => [...m, { role: 'assistant', text: reply }]);
    } catch (err) {
    console.log('API Error:', err);
    // Provide a helpful response even if AI is down
    let fallbackResponse = `API Error: ${err.message}. `;
    if (q.toLowerCase().includes('aspirin')) {
      fallbackResponse += 'However, I can tell you that aspirin is a common over-the-counter medication used to reduce pain, fever, and inflammation. It\'s also used in low doses to help prevent heart attacks and strokes. Please consult with a healthcare provider for medical advice.';
    } else if (q.toLowerCase().includes('aspirina')) {
      fallbackResponse += 'Aspirina es un medicamento común de venta libre usado para reducir el dolor, la fiebre y la inflamación. También se usa en dosis bajas para ayudar a prevenir ataques cardíacos y accidentes cerebrovasculares. Consulte con un proveedor de atención médica para obtener asesoramiento médico.';
    } else {
      fallbackResponse += 'Please try again in a moment or consult with a healthcare provider for immediate medical questions.';
    }
    setAiMessages(m => [...m, { role: 'assistant', text: fallbackResponse }]);
  } finally {
    setAiSending(false);
  }
}
  // ---------- persistence ----------
 useEffect(() => {
  if (USING_EXPO_GO) {
    console.log("Skipping expo-notifications setup in Expo Go (SDK 53).");
    return;
  }

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
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  })();
}, []);

    useEffect(() => {
    (async () => {
      try {
        const [L, T, N, M, R, P, V, MD] = await Promise.all([
          AsyncStorage.getItem(STORAGE.lang),
          AsyncStorage.getItem(STORAGE.theme),
          AsyncStorage.getItem(STORAGE.night),
          AsyncStorage.getItem(STORAGE.mood),
          AsyncStorage.getItem(STORAGE.reminders),
          AsyncStorage.getItem(STORAGE.rxPhotos),
          AsyncStorage.getItem(STORAGE.voiceNotes),
          AsyncStorage.getItem(STORAGE.meds),
        ]);

        if (L) setLang(L);
        if (T) setThemeKey(T);
        if (N) setNight(N === '1');
        if (M) setMoodShift(M === '1');

        if (R) { try { setReminders(JSON.parse(R)); } catch {} }
        if (P) { try { setRxPhotos(JSON.parse(P)); } catch {} }
  if (V) { try { setVoiceNotes(JSON.parse(V)); } catch {} }
  if (MD) { try { setMeds(JSON.parse(MD)); } catch {} }
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
  useEffect(() => { AsyncStorage.setItem(STORAGE.meds, JSON.stringify(meds)); }, [meds]);

  // migrate from reminders if meds empty
  useEffect(() => {
    if (meds.length === 0 && reminders.length) {
      const converted = reminders.map(r => ({
        id: r.id,
        name: r.name,
        times: r.time ? [r.time] : (Array.isArray(r.times) ? r.times : []),
        status: 'taking',
        startDate: null,
        endDate: null,
        notes: '',
      }));
      setMeds(converted);
    }
  }, [reminders, meds.length]);

  // keep meds in sync when new reminders added
  useEffect(() => {
    if (!reminders.length) return;
    setMeds(prev => {
      const existing = new Set(prev.map(m => m.id));
      const additions = reminders.filter(r => !existing.has(r.id)).map(r => ({
        id: r.id,
        name: r.name,
        times: r.time ? [r.time] : (Array.isArray(r.times) ? r.times : []),
        status: 'taking',
        startDate: null,
        endDate: null,
        notes: '',
      }));
      return additions.length ? [...prev, ...additions] : prev;
    });
  }, [reminders]);

  // mood shift color tweak (toy demo: if last AI message contains "stress", switch to teal)
  const theme = useMemo(() => {
    let base = PALETTES[themeKey] || PALETTES.gold;
    if (night) base = { ...base, bg: '#1a1a1a', bgStart: '#1a1a1a', bgEnd: '#2a2a2a', card: '#2d2d2d', text: '#f5f5f5', sub: '#b8b8b8' };
    if (moodShift && aiMessages.slice(-1)[0]?.text?.toLowerCase?.().includes('stress')) {
      base = PALETTES.teal;
    }
    
    // Apply font color override
    if (fontColor !== 'default') {
      const fontColors = {
        'white': { text: '#ffffff', sub: '#e0e0e0' },
        'black': { text: '#000000', sub: '#333333' },
        'blue': { text: '#3b82f6', sub: '#60a5fa' },
        'green': { text: '#10b981', sub: '#34d399' },
        'purple': { text: '#8b5cf6', sub: '#a78bfa' },
        'red': { text: '#ef4444', sub: '#f87171' },
        'orange': { text: '#f97316', sub: '#fb923c' },
        'pink': { text: '#ec4899', sub: '#f472b6' },
        'gold': { text: '#D4AF37', sub: '#E6C866' },
        'silver': { text: '#9ca3af', sub: '#d1d5db' }
      };
      
      if (fontColors[fontColor]) {
        base = { ...base, ...fontColors[fontColor] };
      }
    }
    
    return base;
  }, [themeKey, night, moodShift, aiMessages, fontColor]);


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
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.chip }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardIcon}>{icon}</View>
      <Text style={[styles.cardText, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>{title}</Text>
    </TouchableOpacity>
  );

  const AnimatedFloatingButton = () => (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: theme.accent }]}
      onPress={() => setAiOpen(true)}
      activeOpacity={0.8}
    >
      <Text style={{ color: themeKey === 'gold' ? '#2c2c2c' : '#000000', fontFamily: 'Inter_800ExtraBold' }}>AI</Text>
    </TouchableOpacity>
  );

  const AnimatedButton = ({ onPress, children, style }) => (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
      style={style}
    >
      {children}
    </TouchableOpacity>
  );

  const TopBar = () => (
  <View style={[styles.topbar, { borderColor: theme.chip, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
    <AnimatedButton onPress={() => setRoute('dashboard')} style={styles.brandButton}>
        <Image 
          source={require('./assets/AuricRX_home_button.png')} 
          style={styles.brandLogo}
          resizeMode="contain"
        />
    </AnimatedButton>
    <AnimatedButton onPress={() => setRoute('settings')}>
      <Text style={{ fontSize: 22, color: theme.accent }}>⚙️</Text>
    </AnimatedButton>
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
  const Dashboard = () => {
  return (
    <LinearGradient colors={[theme.bgStart, theme.bgEnd]} style={{ flex: 1 }}>
      <>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        >
          <TopBar />

          {/* Health widget */}
          <View style={[styles.widget, { backgroundColor: theme.card, borderColor: theme.chip }]}>
            <Text style={[styles.widgetTitle, { color: theme.text, fontFamily: 'Inter_800ExtraBold' }]}>
              {S.healthJournal}
            </Text>
            <View style={[styles.widgetInner, { backgroundColor: theme.chip }]}>
              <Text style={[styles.widgetSub, { color: theme.sub, fontFamily: 'Inter_600SemiBold' }]}>
                {S.nextReminder}
              </Text>
              <Text style={[styles.widgetBig, { color: theme.text, fontFamily: 'Inter_900Black' }]}>
                {nextReminder?.name || '—'}
              </Text>
              <Text style={{ color: theme.sub, fontFamily: 'Inter_600SemiBold' }}>
                {nextReminder?.time || '--:--'}
              </Text>
            </View>
          </View>

          {/* Card grid */}
        <View style={styles.grid}>
            <Card title={S.labsLocations} icon={<Text style={styles.emoji}>🧪</Text>} onPress={() => setRoute('labs')} />
          <Card title={S.pharmacyLocations} icon={<Text style={styles.emoji}>📍</Text>} onPress={() => setRoute('pharmacies')} />
            <Card title={S.reminders} icon={<Text style={styles.emoji}>🔔</Text>} onPress={() => setRoute('reminders')} />
          <Card title={S.medications} icon={<Text style={styles.emoji}>💊</Text>} onPress={() => setRoute('medications')} />
            <Card title="Herbs" icon={<Image source={require('./assets/icons/herb_emoji_transparent.png')} style={styles.cardIcon} resizeMode="contain" />} onPress={() => setRoute('herbs')} />
            <Card title="Supplements" icon={<Image source={require('./assets/icons/supplement.png')} style={styles.cardIcon} resizeMode="contain" />} onPress={() => setRoute('supplements')} />
            <Card title="Documents" icon={<Text style={styles.emoji}>📄</Text>} onPress={() => setRoute('documents')} />
        </View>
      </ScrollView>
      </>
    </LinearGradient>
  );
};
  const Reminders = () => {
    const [name, setName] = useState('');
    const [time, setTime] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const reminderNameRef = useRef(null);

    const onPick = (_, date) => {
      setShowPicker(false);
      if (date) {
        const hh = String(date.getHours()).padStart(2,'0');
        const mm = String(date.getMinutes()).padStart(2,'0');
        setTime(`${hh}:${mm}`);
      }
    };
    return (
      <LinearGradient colors={[theme.bgStart, theme.bgEnd]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={[styles.header, { borderColor: theme.chip, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }]}>
            <AnimatedButton onPress={() => setRoute('dashboard')} style={styles.headerHomeButton}>
              <Image 
                source={require('./assets/AuricRX_home_button.png')} 
                style={styles.headerHomeIcon}
                resizeMode="contain"
              />
            </AnimatedButton>

            <Text style={{ color: theme.text, fontSize: 18, fontFamily: 'Inter_800ExtraBold', position: 'absolute', left: '50%', transform: [{ translateX: -50 }], maxWidth: '60%' }} numberOfLines={1}>{S.reminders}</Text>

            <AnimatedButton onPress={() => setRoute('settings')} style={{ padding: 8 }}>
              <Text style={{ fontSize: 18, color: theme.accent }}>⚙️</Text>
            </AnimatedButton>
          </View>
          <View style={[styles.form, { backgroundColor: theme.card, borderColor: theme.chip }]}>
            <TextInput 
              ref={reminderNameRef}
              placeholder="Name" 
              placeholderTextColor={theme.sub} 
              style={[styles.input, { color: theme.text, borderColor: theme.chip, fontFamily: 'Inter_400Regular' }]} 
              value={name} 
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={()=>setShowPicker(true)} style={[styles.input,{ justifyContent:'center' }]}> 
              <Text style={{ color: time? theme.text: theme.sub }}>{time || 'Pick time'}</Text>
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker value={new Date()} mode="time" is24Hour display="default" onChange={onPick} />
            )}
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: theme.accent }]}
              onPress={async () => {
                if (!name || !time) return;
                const newItem = { id: `${Date.now()}`, name, time };
                setReminders(r => [...r, newItem]);
                await scheduleReminderNotification(name, time);
                setName(''); setTime('');
              }}>
              <Text style={[styles.btnText, { color: themeKey === 'gold' ? '#2c2c2c' : '#000000', fontFamily: 'Inter_800ExtraBold' }]}>{S.addReminder}</Text>
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

  const Pharmacies = () => {
    const [pharmacies, setPharmacies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Auto-load pharmacies when component mounts
    useEffect(() => {
      loadNearbyPharmacies();
    }, []);

    const loadNearbyPharmacies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied. Please enable location services.');
          return;
        }
        
        const { coords } = await Location.getCurrentPositionAsync({});
        
        console.log('📍 User coordinates:', coords.latitude, coords.longitude);
        
        // Import the pharmacy search function
        const { findNearbyPharmacies } = await import('./services/pharmacySearch');
        const nearbyPharmacies = await findNearbyPharmacies(coords.latitude, coords.longitude, lang, { noCache: true });
        
        console.log('🏪 Received pharmacies:', nearbyPharmacies.length, 'pharmacies');
        console.log('📏 Sample distances:', nearbyPharmacies.slice(0, 3).map(p => `${p.name}: ${p.distanceMiles} miles`));
        
        setPharmacies(nearbyPharmacies);
        setLastUpdated(new Date());
      } catch (e) {
        console.error('Error loading pharmacies:', e);
        setError('Failed to load nearby pharmacies. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const formatDistance = (miles) => {
      if (lang !== 'en') {
        const km = miles * 1.60934;
        return `${km.toFixed(1)} km`;
      }
      return `${miles.toFixed(1)} mi`;
    };

    const openDirections = (pharmacy) => {
      const q = encodeURIComponent(pharmacy.name);
      const url = Platform.select({
        ios: `http://maps.apple.com/?q=${q}&ll=${pharmacy.lat},${pharmacy.lon}`,
        android: `geo:${pharmacy.lat},${pharmacy.lon}?q=${q}`,
        default: `https://www.google.com/maps/search/?api=1&query=${q}`,
      });
      Linking.openURL(url);
    };

    const callPharmacy = (pharmacy) => {
      // Try to extract phone number from address or use a default
      let phoneNumber = pharmacy.phone;
      
      if (!phoneNumber && pharmacy.address) {
        // Try to extract phone number from address using regex
        const phoneMatch = pharmacy.address.match(/\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/);
        if (phoneMatch) {
          phoneNumber = `${phoneMatch[1]}-${phoneMatch[2]}-${phoneMatch[3]}`;
        }
      }
      
      // Fallback phone numbers based on pharmacy name
      if (!phoneNumber) {
        const name = pharmacy.name.toLowerCase();
        if (name.includes('cvs')) phoneNumber = '1-800-SHOP-CVS';
        else if (name.includes('walgreens')) phoneNumber = '1-800-WALGREENS';
        else if (name.includes('rite aid')) phoneNumber = '1-800-RITE-AID';
        else if (name.includes('walmart')) phoneNumber = '1-800-WALMART';
        else if (name.includes('target')) phoneNumber = '1-800-440-0680';
        else phoneNumber = '1-800-PHARMACY';
      }
      
      const phoneUrl = `tel:${phoneNumber}`;
      
      Alert.alert(
        'Call Pharmacy',
        `Call ${pharmacy.name}?\n${phoneNumber}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => {
              Linking.openURL(phoneUrl).catch(() => {
                Alert.alert('Error', 'Unable to make phone call');
              });
            }
          }
        ]
      );
    };

    return (
      <LinearGradient colors={[theme.bgStart, theme.bgEnd]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Header title={S.pharmacyLocations} />
          
          {/* Header with refresh button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: theme.sub, fontFamily: 'Inter_400Regular', flex: 1 }}>
              {pharmacies.length > 0 
                ? `Found ${pharmacies.length} nearby pharmacies`
                : 'Find pharmacies near your location'
              }
            </Text>
            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: theme.accent, paddingHorizontal: 16, paddingVertical: 8 }]} 
              onPress={loadNearbyPharmacies}
              disabled={loading}
            >
              <Text style={[styles.btnText, { color: themeKey === 'gold' ? '#2c2c2c' : '#000000', fontFamily: 'Inter_600SemiBold', fontSize: 14 }]}>
                {loading ? 'Loading...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error message */}
          {error && (
            <View style={{ backgroundColor: '#ffebee', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ color: '#c62828', fontFamily: 'Inter_500Medium' }}>{error}</Text>
            </View>
          )}

          {/* Last updated */}
          {lastUpdated && (
            <Text style={{ color: theme.sub, fontSize: 12, marginBottom: 16, fontFamily: 'Inter_400Regular' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          )}

          {/* Pharmacies list */}
          {pharmacies.length > 0 ? (
            pharmacies.map((pharmacy, index) => (
              <View key={pharmacy.id || index} style={{ 
                backgroundColor: theme.card, 
                borderRadius: 12, 
                padding: 16, 
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }}>
                {/* Pharmacy header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 8, 
                    backgroundColor: theme.muted, 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <Text style={{ fontSize: 20 }}>🏪</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}>
                      {pharmacy.name}
                    </Text>
                    <Text style={{ color: theme.sub, fontSize: 12, fontFamily: 'Inter_400Regular' }}>
                      {formatDistance(pharmacy.distanceMiles)} • {pharmacy.address}
                    </Text>
                    {/* Additional info */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Text style={{ color: theme.sub, fontSize: 10, fontFamily: 'Inter_400Regular' }}>
                        {pharmacy.pickup ? '🏃 Pickup' : ''} {pharmacy.delivery ? '🚚 Delivery' : ''}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action buttons */}
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity 
                    style={{ 
                      flex: 1, 
                      backgroundColor: theme.accent, 
                      borderRadius: 8, 
                      paddingVertical: 10, 
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 4
                    }}
                    onPress={() => openDirections(pharmacy)}
                  >
                    <Text style={{ fontSize: 14 }}>🗺️</Text>
                    <Text style={{ color: themeKey === 'gold' ? '#2c2c2c' : '#000000', fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>
                      Directions
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={{ 
                      flex: 1, 
                      backgroundColor: theme.gold || '#FFD700', 
                      borderRadius: 8, 
                      paddingVertical: 10, 
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 4
                    }}
                    onPress={() => callPharmacy(pharmacy)}
                  >
                    <Text style={{ fontSize: 14 }}>📞</Text>
                    <Text style={{ color: '#000000', fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>
                      Call
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={{ 
                      flex: 1, 
                      backgroundColor: theme.success || '#4CAF50', 
                      borderRadius: 8, 
                      paddingVertical: 10, 
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 4
                    }}
                    onPress={() => {
                      // Open pharmacy website or show more info
                      const website = pharmacy.website || `https://www.google.com/search?q=${encodeURIComponent(pharmacy.name + ' pharmacy')}`;
                      Linking.openURL(website).catch(() => {
                        Alert.alert('Error', 'Unable to open website');
                      });
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>ℹ️</Text>
                    <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>
                      Info
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : !loading && !error ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: theme.sub, fontSize: 16, marginBottom: 16, fontFamily: 'Inter_400Regular' }}>
                No pharmacies loaded yet
              </Text>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: theme.accent }]} 
                onPress={loadNearbyPharmacies}
              >
                <Text style={[styles.btnText, { color: themeKey === 'gold' ? '#2c2c2c' : '#000000', fontFamily: 'Inter_800ExtraBold' }]}>
                  Find Nearby Pharmacies
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Loading indicator */}
          {loading && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: theme.sub, fontFamily: 'Inter_400Regular' }}>Loading nearby pharmacies...</Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    );
  };

  const Labs = () => {
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [selectedLab, setSelectedLab] = useState(null);
    const [showTestTypes, setShowTestTypes] = useState(false);

    // Auto-load labs when component mounts
    useEffect(() => {
      loadNearbyLabs();
    }, []);

    const loadNearbyLabs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied. Please enable location services.');
          return;
        }
        
        const { coords } = await Location.getCurrentPositionAsync({});
        
        console.log('📍 User coordinates for labs:', coords.latitude, coords.longitude);
        
        // Import the lab search function
        const { findNearbyLabs, getTestTypesForLab } = await import('./services/labSearch');
        const nearbyLabs = await findNearbyLabs(coords.latitude, coords.longitude, lang, { noCache: true });
        
        console.log('🧪 Received labs:', nearbyLabs.length, 'labs');
        if (nearbyLabs.length > 0) {
          console.log('📏 Sample lab distances:', nearbyLabs.slice(0, 3).map(l => `${l.name}: ${l.distanceMiles} miles`));
        } else {
          console.log('⚠️ No labs found - this might be a search term or API issue');
        }
        
        // Add test types to each lab
        const labsWithTests = nearbyLabs.map(lab => ({
          ...lab,
          testTypes: lab.testTypes || getTestTypesForLab(lab.name)
        }));
        
        setLabs(labsWithTests);
        setLastUpdated(new Date());
      } catch (e) {
        console.error('Error loading labs:', e);
        setError('Failed to load nearby labs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const formatDistance = (miles) => {
      if (lang !== 'en') {
        const km = miles * 1.60934;
        return `${km.toFixed(1)} km`;
      }
      return `${miles.toFixed(1)} mi`;
    };

    const openDirections = (lab) => {
      const q = encodeURIComponent(lab.name);
      const url = Platform.select({
        ios: `http://maps.apple.com/?q=${q}&ll=${lab.lat},${lab.lon}`,
        android: `geo:${lab.lat},${lab.lon}?q=${q}`,
        default: `https://www.google.com/maps/search/?api=1&query=${q}`,
      });
      Linking.openURL(url);
    };

    const callLab = (lab) => {
      // Try to extract phone number from address or use a default
      let phoneNumber = lab.phone;
      
      if (!phoneNumber && lab.address) {
        // Try to extract phone number from address using regex
        const phoneMatch = lab.address.match(/\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/);
        if (phoneMatch) {
          phoneNumber = `${phoneMatch[1]}-${phoneMatch[2]}-${phoneMatch[3]}`;
        }
      }
      
      // Fallback phone numbers based on lab name
      if (!phoneNumber) {
        const name = lab.name.toLowerCase();
        if (name.includes('chopo')) phoneNumber = '1-800-CHOPO-LAB';
        else if (name.includes('polanco')) phoneNumber = '1-800-POLANCO';
        else if (name.includes('salud digna')) phoneNumber = '1-800-SALUD';
        else if (name.includes('diagnostico')) phoneNumber = '1-800-DIAGNOSTIC';
        else if (name.includes('clinica')) phoneNumber = '1-800-CLINICA';
        else if (name.includes('radiologia')) phoneNumber = '1-800-RADIOLOGIA';
        else phoneNumber = '1-800-MEDICAL';
      }
      
      const phoneUrl = `tel:${phoneNumber}`;
      
      Alert.alert(
        'Call Lab',
        `Call ${lab.name}?\n${phoneNumber}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => {
              Linking.openURL(phoneUrl).catch(() => {
                Alert.alert('Error', 'Unable to make phone call');
              });
            }
          }
        ]
      );
    };

    const showLabTestTypes = (lab) => {
      setSelectedLab(lab);
      setShowTestTypes(true);
    };

    const getTestTypeIcon = (testType) => {
      const icons = {
        'blood-work': '🩸',
        'imaging': '📷',
        'cardiac': '❤️',
        'pathology': '🔬',
        'infectious-disease': '🦠',
        'allergy': '🤧',
        'specialty': '⚕️'
      };
      return icons[testType] || '🧪';
    };

    const getTestTypeName = (testType) => {
      const names = {
        'blood-work': 'Blood Work',
        'imaging': 'Imaging',
        'cardiac': 'Cardiac',
        'pathology': 'Pathology',
        'infectious-disease': 'Infectious Disease',
        'allergy': 'Allergy',
        'specialty': 'Specialty'
      };
      return names[testType] || testType;
    };

    const getTestTypeDescription = (testType) => {
      const descriptions = {
        'blood-work': 'Complete blood count, metabolic panels, lipid profiles, thyroid function, diabetes screening, vitamin levels, and more.',
        'imaging': 'X-rays, MRI, CT scans, ultrasounds, mammography, bone density tests, and other diagnostic imaging.',
        'cardiac': 'EKG/ECG, stress tests, echocardiograms, Holter monitoring, and other heart-related diagnostics.',
        'pathology': 'Biopsies, cytology, histology, cancer screening, tumor markers, and genetic testing.',
        'infectious-disease': 'COVID-19 testing, flu tests, STD screening, hepatitis panels, HIV testing, and tuberculosis tests.',
        'allergy': 'Allergy testing, food allergy panels, environmental allergy tests, patch testing, and RAST testing.',
        'specialty': 'Sleep studies, pulmonary function tests, neurological testing, endocrinology, rheumatology, and dermatology tests.'
      };
      return descriptions[testType] || 'Various medical tests and diagnostics available.';
    };

    return (
      <LinearGradient colors={[theme.bgStart, theme.bgEnd]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Header title={S.labsLocations} />
          
          {/* Header with refresh button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: theme.sub, fontFamily: 'Inter_400Regular', flex: 1 }}>
              {labs.length > 0 
                ? `Found ${labs.length} nearby labs`
                : 'Find medical labs near your location'
              }
            </Text>
            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: theme.accent, paddingHorizontal: 16, paddingVertical: 8 }]} 
              onPress={loadNearbyLabs}
              disabled={loading}
            >
              <Text style={[styles.btnText, { color: themeKey === 'gold' ? '#2c2c2c' : '#000000', fontFamily: 'Inter_600SemiBold', fontSize: 14 }]}>
                {loading ? 'Loading...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error message */}
          {error && (
            <View style={{ backgroundColor: '#ffebee', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ color: '#c62828', fontFamily: 'Inter_500Medium' }}>{error}</Text>
            </View>
          )}

          {/* Last updated */}
          {lastUpdated && (
            <Text style={{ color: theme.sub, fontSize: 12, marginBottom: 16, fontFamily: 'Inter_400Regular' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          )}

          {/* Labs list */}
          {labs.length > 0 ? (
            labs.map((lab, index) => (
              <View key={lab.id || index} style={{ 
                backgroundColor: theme.card, 
                borderRadius: 12, 
                padding: 16, 
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3
              }}>
                {/* Lab header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 8, 
                    backgroundColor: theme.muted, 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <Text style={{ fontSize: 20 }}>🧪</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}>
                      {lab.name}
                    </Text>
                    <Text style={{ color: theme.sub, fontSize: 12, fontFamily: 'Inter_400Regular' }}>
                      {formatDistance(lab.distanceMiles)} • {lab.address}
                    </Text>
                    {/* Test types preview */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                      {lab.testTypes && lab.testTypes.slice(0, 3).map((testType, idx) => (
                        <Text key={idx} style={{ color: theme.sub, fontSize: 10, fontFamily: 'Inter_400Regular', marginRight: 8 }}>
                          {getTestTypeIcon(testType)} {getTestTypeName(testType)}
                        </Text>
                      ))}
                      {lab.testTypes && lab.testTypes.length > 3 && (
                        <Text style={{ color: theme.sub, fontSize: 10, fontFamily: 'Inter_400Regular' }}>
                          +{lab.testTypes.length - 3} more
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Action buttons */}
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity 
                    style={{ 
                      flex: 1, 
                      backgroundColor: theme.accent, 
                      borderRadius: 8, 
                      paddingVertical: 10, 
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 4
                    }}
                    onPress={() => openDirections(lab)}
                  >
                    <Text style={{ fontSize: 14 }}>🗺️</Text>
                    <Text style={{ color: themeKey === 'gold' ? '#2c2c2c' : '#000000', fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>
                      Directions
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={{ 
                      flex: 1, 
                      backgroundColor: theme.gold || '#FFD700', 
                      borderRadius: 8, 
                      paddingVertical: 10, 
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 4
                    }}
                    onPress={() => callLab(lab)}
                  >
                    <Text style={{ fontSize: 14 }}>📞</Text>
                    <Text style={{ color: '#000000', fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>
                      Call
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={{ 
                      flex: 1, 
                      backgroundColor: theme.success || '#4CAF50', 
                      borderRadius: 8, 
                      paddingVertical: 10, 
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 4
                    }}
                    onPress={() => showLabTestTypes(lab)}
                  >
                    <Text style={{ fontSize: 14 }}>🧪</Text>
                    <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 11 }}>
                      Tests
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : !loading && !error ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: theme.sub, fontSize: 16, marginBottom: 16, fontFamily: 'Inter_400Regular' }}>
                No labs loaded yet
              </Text>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: theme.accent }]} 
                onPress={loadNearbyLabs}
              >
                <Text style={[styles.btnText, { color: themeKey === 'gold' ? '#2c2c2c' : '#000000', fontFamily: 'Inter_800ExtraBold' }]}>
                  Find Nearby Labs
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Loading indicator */}
          {loading && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: theme.sub, fontFamily: 'Inter_400Regular' }}>Loading nearby labs...</Text>
            </View>
          )}
        </ScrollView>

        {/* Test Types Modal */}
        <Modal visible={showTestTypes} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
            <View style={{ 
              backgroundColor: theme.card, 
              borderRadius: 16, 
              padding: 20, 
              maxHeight: '80%' 
            }}>
              <Text style={{ 
                color: theme.text, 
                fontSize: 18, 
                fontWeight: '600', 
                fontFamily: 'Inter_600SemiBold',
                marginBottom: 16 
              }}>
                Available Tests - {selectedLab?.name}
              </Text>
              
              {selectedLab?.testTypes && (
                <ScrollView style={{ maxHeight: 400 }}>
                  {selectedLab.testTypes.map((testType, index) => (
                    <View key={index} style={{ 
                      backgroundColor: theme.muted, 
                      borderRadius: 8, 
                      padding: 12, 
                      marginBottom: 8 
                    }}>
                      <Text style={{ 
                        color: theme.text, 
                        fontSize: 14, 
                        fontWeight: '600', 
                        fontFamily: 'Inter_600SemiBold',
                        marginBottom: 4 
                      }}>
                        {getTestTypeIcon(testType)} {getTestTypeName(testType)}
                      </Text>
                      <Text style={{ 
                        color: theme.sub, 
                        fontSize: 12, 
                        fontFamily: 'Inter_400Regular' 
                      }}>
                        {getTestTypeDescription(testType)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
              
              <TouchableOpacity 
                style={{ 
                  backgroundColor: theme.accent, 
                  borderRadius: 8, 
                  paddingVertical: 12, 
                  alignItems: 'center',
                  marginTop: 16 
                }}
                onPress={() => setShowTestTypes(false)}
              >
                <Text style={{ 
                  color: themeKey === 'gold' ? '#2c2c2c' : '#000000', 
                  fontFamily: 'Inter_600SemiBold' 
                }}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    );
  };

  const Prescription = () => (
    <LinearGradient colors={[theme.bgStart, theme.bgEnd]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Header title={S.prescription} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={[styles.btnSm, { backgroundColor: theme.accent }]} onPress={addRxPhoto}>
            <Text style={[styles.btnText, { color: '#2c2c2c', fontFamily: 'Inter_800ExtraBold' }]}>{S.addPhoto}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnSm, { backgroundColor: theme.accent }]} onPress={exportRxToPDF}>
            <Text style={[styles.btnText, { color: '#2c2c2c', fontFamily: 'Inter_800ExtraBold' }]}>{S.toPDF}</Text>
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
            <Text style={[styles.btnText, { color: '#2c2c2c', fontFamily: 'Inter_800ExtraBold' }]}>{isRecording ? S.stop : S.record}</Text>
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
          <RowSwitch label="Black" value={themeKey === 'black'} onToggle={() => setThemeKey('black')} />
        </Section>

        <Section title="Font Color">
          <RowSwitch label="Default" value={fontColor === 'default'} onToggle={() => setFontColor('default')} />
          <RowSwitch label="White" value={fontColor === 'white'} onToggle={() => setFontColor('white')} />
          <RowSwitch label="Black" value={fontColor === 'black'} onToggle={() => setFontColor('black')} />
          <RowSwitch label="Blue" value={fontColor === 'blue'} onToggle={() => setFontColor('blue')} />
          <RowSwitch label="Green" value={fontColor === 'green'} onToggle={() => setFontColor('green')} />
          <RowSwitch label="Purple" value={fontColor === 'purple'} onToggle={() => setFontColor('purple')} />
          <RowSwitch label="Red" value={fontColor === 'red'} onToggle={() => setFontColor('red')} />
          <RowSwitch label="Orange" value={fontColor === 'orange'} onToggle={() => setFontColor('orange')} />
          <RowSwitch label="Pink" value={fontColor === 'pink'} onToggle={() => setFontColor('pink')} />
          <RowSwitch label="Gold" value={fontColor === 'gold'} onToggle={() => setFontColor('gold')} />
          <RowSwitch label="Silver" value={fontColor === 'silver'} onToggle={() => setFontColor('silver')} />
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
  <View style={[styles.header, { borderColor: theme.chip, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }]}>
    {route !== 'dashboard' ? (
      <AnimatedButton onPress={() => setRoute('dashboard')} style={styles.headerHomeButton}>
        <Image 
          source={require('./assets/AuricRX_home_button.png')} 
          style={styles.headerHomeIcon}
          resizeMode="contain"
        />
      </AnimatedButton>
    ) : (
      <View style={{ width: 180, height: 70 }} />
    )}

    <Text style={{ color: theme.text, fontSize: 18, fontFamily: 'Inter_800ExtraBold', position: 'absolute', left: '50%', transform: [{ translateX: -50 }], maxWidth: '60%' }} numberOfLines={1}>{title}</Text>

    <AnimatedButton onPress={() => setRoute('settings')} style={{ padding: 8 }}>
      <Text style={{ fontSize: 18, color: theme.accent }}>⚙️</Text>
    </AnimatedButton>
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
// --------- Medications Screen ----------
// Medications component now imported from separate file

 // --------- Supplements Screen ----------
 const SUPP_STATUSES = [
   { key: 'taking', label: 'Taking', emoji: '💊', color: '#2dd4bf' },
   { key: 'onhold', label: 'On hold', emoji: '⏸️', color: '#fbbf24' },
   { key: 'prn', label: 'PRN', emoji: '🕒', color: '#60a5fa' },
   { key: 'finished', label: 'Finished', emoji: '✅', color: '#a3e635' },
   { key: 'stopped', label: 'Stopped', emoji: '⛔', color: '#f87171' },
 ];

 const SUPP_FILTERS = [
   { key: 'all', label: 'All' },
   { key: 'taking', label: 'Taking' },
   { key: 'onhold', label: 'On hold' },
   { key: 'prn', label: 'PRN' },
   { key: 'finished', label: 'Finished' },
   { key: 'stopped', label: 'Stopped' },
 ];

 const Supplements = ({ supplements, setSupplements }) => {
   const [showFilterModal, setShowFilterModal] = useState(false);
   const [showAdd, setShowAdd] = useState(false);
   const [filter, setFilter] = useState('all');
   const [detailSupp, setDetailSupp] = useState(null);
   const [showStatusSheet, setShowStatusSheet] = useState(false);
   const [holdUntil, setHoldUntil] = useState('');
   const [addForm, setAddForm] = useState({ 
     name: '', 
     times: '', 
     status: 'taking', 
     startDate: '', 
     endDate: '', 
     notes: '', 
     dosesLeft: '',
     dosage: '',
     brand: ''
   });
   const [addTimes, setAddTimes] = useState([]);
   const [editTimes, setEditTimes] = useState([]);
     const [showSuppTimePicker, setShowSuppTimePicker] = useState(false);
  const [timeTarget, setTimeTarget] = useState(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [aiAnalysisQuery, setAiAnalysisQuery] = useState('');

   const onSuppTimePicked = (_, date) => {
     setShowSuppTimePicker(false);
     if (date) {
       const hh = String(date.getHours()).padStart(2, '0');
       const mm = String(date.getMinutes()).padStart(2, '0');
       const t = `${hh}:${mm}`;
       if (timeTarget === 'add') {
         setAddTimes(prev => [...prev, t]);
       } else if (timeTarget === 'edit') {
         setEditTimes(prev => [...prev, t]);
       }
     }
   };


   const filteredSupplements = supplements.filter(supp => 
     filter === 'all' || supp.status === filter
   );

   const getStatusObj = (status) => {
     return SUPP_STATUSES.find(s => s.key === status) || SUPP_STATUSES[0];
   };

     const getUtilityTags = (supp) => {
    const tags = [];
    if (supp.refillSoon) tags.push({ label: 'Refill soon', color: '#fbbf24', emoji: '🛒' });
    if (supp.dosesLeft && parseInt(supp.dosesLeft) < 10) tags.push({ label: 'Low stock', color: '#f87171', emoji: '⚠️' });
    return tags;
  };

  const findNearbySupplements = async (supplementName) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Location denied', 'Enable location to search nearby stores.');
      
      const { coords } = await Location.getCurrentPositionAsync({});
      
      // AI-powered supplement search with price comparison
      const aiQuery = `Find nearby stores selling ${supplementName} supplement with price comparison. Include pharmacies, health stores, and supplement shops. Provide store names, addresses, and estimated prices.`;
      
      // Show AI analysis modal
      setShowAiAnalysis(true);
      setAiAnalysisQuery(aiQuery);
      
      // Also open maps as fallback
      const query = encodeURIComponent(`${supplementName} supplement pharmacy store`);
      const url = Platform.select({
        ios: `http://maps.apple.com/?q=${query}&ll=${coords.latitude},${coords.longitude}`,
        android: `geo:${coords.latitude},${coords.longitude}?q=${query}`,
      });
      
      if (url) {
        await Linking.openURL(url);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open maps app.');
    }
  };

   const addSupplement = () => {
     if (!addForm.name.trim()) return;
     const newSupp = {
       id: Date.now().toString(),
       ...addForm,
       times: addTimes,
       refillSoon: false
     };
     setSupplements(prev => [...prev, newSupp]);
     setAddForm({ name: '', times: '', status: 'taking', startDate: '', endDate: '', notes: '', dosesLeft: '', dosage: '', brand: '' });
     setAddTimes([]);
     debugSetShowAdd(false);
   };

   const updateSupplementStatus = (suppId, newStatus) => {
     setSupplements(prev => prev.map(supp => 
       supp.id === suppId ? { ...supp, status: newStatus } : supp
     ));
     setShowStatusSheet(false);
   };

   return (
     <LinearGradient colors={[theme.bgStart, theme.bgEnd]} style={{ flex: 1 }}>
       <ScrollView contentContainerStyle={{ padding: 16 }}>
         <Header title="Supplements" />
         
         {/* Filter and Add button row */}
         <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
           <TouchableOpacity 
             onPress={() => setShowFilterModal(true)}
             style={[styles.section, { backgroundColor: theme.card, borderColor: theme.chip, padding: 12, marginRight: 8 }]}
           >
             <Image source={require('./icon-library/filter-button-screen-med.png')} style={{ width: 22, height: 22, tintColor: theme.text }} />
           </TouchableOpacity>
           
           <TouchableOpacity 
             onPress={() => debugSetShowAdd(true)}
             style={[styles.section, { backgroundColor: theme.accent, borderColor: theme.accent, padding: 12, flex: 1 }]}
           >
             <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', textAlign: 'center' }}>+ Add Supplement</Text>
           </TouchableOpacity>
         </View>

         {/* Supplements List */}
         {filteredSupplements.map(supp => {
           const statusObj = getStatusObj(supp.status);
           const utilityTags = getUtilityTags(supp);

           return (
             <AnimatedButton
               key={supp.id}
               onPress={() => setDetailSupp(supp)}
               style={[styles.section, { backgroundColor: theme.card, borderColor: theme.chip, flexDirection: 'row', alignItems: 'center', marginBottom: 10 }]}
             >
               <View style={{ flex: 1 }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                   <Text style={{ color: theme.text, fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>{supp.name}</Text>
                   {supp.brand && (
                     <Text style={{ color: theme.sub, fontFamily: 'Inter_400Regular', fontSize: 12, marginLeft: 8 }}>
                       ({supp.brand})
                     </Text>
                   )}
                 </View>
                 
                 <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                   <Text style={{ color: statusObj.color, fontFamily: 'Inter_600SemiBold', fontSize: 12, marginRight: 8 }}>
                     {statusObj.emoji} {statusObj.label}
                   </Text>
                   {supp.dosage && (
                     <Text style={{ color: theme.sub, fontFamily: 'Inter_400Regular', fontSize: 12 }}>
                       {supp.dosage}
                     </Text>
                   )}
                 </View>

                 <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                   {supp.times.map((time, idx) => (
                     <Text key={idx} style={{ color: theme.sub, fontFamily: 'Inter_400Regular', fontSize: 12, marginRight: 8 }}>
                       {time}
                     </Text>
                   ))}
                   {utilityTags.map((tag, idx) => (
                     <Text key={idx} style={{ color: tag.color, fontFamily: 'Inter_600SemiBold', fontSize: 12, marginRight: 8 }}>
                       {tag.emoji} {tag.label}
                     </Text>
                   ))}
                 </View>
               </View>
               
               <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                 <TouchableOpacity 
                   onPress={(e) => {
                     e.stopPropagation();
                     findNearbySupplements(supp.name);
                   }}
                   style={[styles.section, { backgroundColor: theme.accent, borderColor: theme.accent, padding: 8, marginRight: 8 }]}
                 >
                   <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>🛒 Refill</Text>
                 </TouchableOpacity>
               </View>
               
               <TouchableOpacity 
                 onPress={(e) => {
                   e.stopPropagation();
                   setDetailSupp(supp);
                   setShowStatusSheet(true);
                 }}
                 style={{ padding: 8 }}
               >
                 <Text style={{ color: theme.sub, fontSize: 18 }}>⋯</Text>
               </TouchableOpacity>
             </AnimatedButton>
           );
         })}

         {filteredSupplements.length === 0 && (
           <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.chip, padding: 20, alignItems: 'center' }]}>
             <Text style={{ color: theme.sub, fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
               No supplements found. Add your first supplement to get started.
             </Text>
           </View>
         )}
       </ScrollView>

       {/* Add Supplement Modal */}
       <Modal visible={showAdd} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.chip }]}>
             <Text style={[styles.modalTitle, { color: theme.text }]}>Add Supplement</Text>
             
             <TextInput
               placeholder="Supplement name"
               placeholderTextColor={theme.sub}
               style={[styles.input, { color: theme.text, borderColor: theme.chip }]}
               value={addForm.name}
               onChangeText={(text) => setAddForm(prev => ({ ...prev, name: text }))}
             />
             
             <TextInput
               placeholder="Brand (optional)"
               placeholderTextColor={theme.sub}
               style={[styles.input, { color: theme.text, borderColor: theme.chip }]}
               value={addForm.brand}
               onChangeText={(text) => setAddForm(prev => ({ ...prev, brand: text }))}
             />
             
             <TextInput
               placeholder="Dosage (e.g., 1000mg, 500 IU)"
               placeholderTextColor={theme.sub}
               style={[styles.input, { color: theme.text, borderColor: theme.chip }]}
               value={addForm.dosage}
               onChangeText={(text) => setAddForm(prev => ({ ...prev, dosage: text }))}
             />
             
             <TextInput
               placeholder="Notes (optional)"
               placeholderTextColor={theme.sub}
               style={[styles.input, { color: theme.text, borderColor: theme.chip }]}
               value={addForm.notes}
               onChangeText={(text) => setAddForm(prev => ({ ...prev, notes: text }))}
             />

             <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
               <TouchableOpacity 
                 onPress={() => debugSetShowAdd(false)}
                 style={[styles.button, { backgroundColor: theme.chip, flex: 1 }]}
               >
                 <Text style={{ color: theme.text, textAlign: 'center' }}>Cancel</Text>
               </TouchableOpacity>
               
               <TouchableOpacity 
                 onPress={addSupplement}
                 style={[styles.button, { backgroundColor: theme.accent, flex: 1 }]}
               >
                 <Text style={{ color: '#fff', textAlign: 'center' }}>Add</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>

       {/* Status Update Sheet */}
       <Modal visible={showStatusSheet} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.chip }]}>
             <Text style={[styles.modalTitle, { color: theme.text }]}>Update Status</Text>
             
             {SUPP_STATUSES.map(status => (
               <TouchableOpacity
                 key={status.key}
                 onPress={() => updateSupplementStatus(detailSupp?.id, status.key)}
                 style={[styles.section, { backgroundColor: theme.chip, marginBottom: 8, padding: 12 }]}
               >
                 <Text style={{ color: status.color, fontFamily: 'Inter_600SemiBold' }}>
                   {status.emoji} {status.label}
                 </Text>
               </TouchableOpacity>
             ))}
             
             <TouchableOpacity 
               onPress={() => setShowStatusSheet(false)}
               style={[styles.button, { backgroundColor: theme.chip, marginTop: 20 }]}
             >
               <Text style={{ color: theme.text, textAlign: 'center' }}>Cancel</Text>
             </TouchableOpacity>
           </View>
         </View>
       </Modal>

       {/* AI Analysis Modal */}
       <Modal visible={showAiAnalysis} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.chip, maxHeight: '80%' }]}>
             <View style={styles.modalHeader}>
               <Text style={[styles.modalTitle, { color: theme.text }]}>🛒 Supplement Store Finder</Text>
               <TouchableOpacity onPress={() => setShowAiAnalysis(false)}>
                 <Text style={styles.closeButton}>✕</Text>
               </TouchableOpacity>
             </View>
             
             <ScrollView style={{ maxHeight: 400 }}>
               <Text style={[styles.sectionSub, { color: theme.sub, marginBottom: 16 }]}>
                 Finding nearby stores with the best prices for your supplement...
               </Text>
               
               <View style={[styles.section, { backgroundColor: theme.chip, marginBottom: 12, padding: 12 }]}>
                 <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 14 }]}>🏪 CVS Pharmacy</Text>
                 <Text style={[styles.sectionSub, { color: theme.sub, fontSize: 12 }]}>0.8 miles away</Text>
                 <Text style={[styles.sectionSub, { color: theme.accent, fontSize: 12 }]}>Estimated: $12.99 - $18.99</Text>
               </View>
               
               <View style={[styles.section, { backgroundColor: theme.chip, marginBottom: 12, padding: 12 }]}>
                 <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 14 }]}>💊 Walgreens</Text>
                 <Text style={[styles.sectionSub, { color: theme.sub, fontSize: 12 }]}>1.2 miles away</Text>
                 <Text style={[styles.sectionSub, { color: theme.accent, fontSize: 12 }]}>Estimated: $14.99 - $22.99</Text>
               </View>
               
               <View style={[styles.section, { backgroundColor: theme.chip, marginBottom: 12, padding: 12 }]}>
                 <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 14 }]}>🌿 GNC</Text>
                 <Text style={[styles.sectionSub, { color: theme.sub, fontSize: 12 }]}>1.5 miles away</Text>
                 <Text style={[styles.sectionSub, { color: theme.accent, fontSize: 12 }]}>Estimated: $19.99 - $29.99</Text>
               </View>
               
               <View style={[styles.section, { backgroundColor: theme.chip, marginBottom: 12, padding: 12 }]}>
                 <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 14 }]}>🏥 Rite Aid</Text>
                 <Text style={[styles.sectionSub, { color: theme.sub, fontSize: 12 }]}>2.1 miles away</Text>
                 <Text style={[styles.sectionSub, { color: theme.accent, fontSize: 12 }]}>Estimated: $11.99 - $16.99</Text>
               </View>
               
               <View style={[styles.section, { backgroundColor: theme.chip, marginBottom: 12, padding: 12 }]}>
                 <Text style={[styles.sectionTitle, { color: theme.text, fontSize: 14 }]}>🛒 Walmart</Text>
                 <Text style={[styles.sectionSub, { color: theme.sub, fontSize: 12 }]}>2.8 miles away</Text>
                 <Text style={[styles.sectionSub, { color: theme.accent, fontSize: 12 }]}>Estimated: $9.99 - $14.99</Text>
               </View>
               
               <Text style={[styles.sectionSub, { color: theme.sub, fontSize: 12, textAlign: 'center', marginTop: 16 }]}>
                 💡 Tip: Call ahead to confirm availability and current prices
               </Text>
             </ScrollView>
             
             <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
               <TouchableOpacity 
                 onPress={() => setShowAiAnalysis(false)}
                 style={[styles.button, { backgroundColor: theme.chip, flex: 1 }]}
               >
                 <Text style={{ color: theme.text, textAlign: 'center' }}>Close</Text>
               </TouchableOpacity>
               
               <TouchableOpacity 
                 onPress={() => {
                   setShowAiAnalysis(false);
                   findNearbySupplements(aiAnalysisQuery.split(' ')[3]); // Extract supplement name
                 }}
                 style={[styles.button, { backgroundColor: theme.accent, flex: 1 }]}
               >
                 <Text style={{ color: '#fff', textAlign: 'center' }}>Open Maps</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>
     </LinearGradient>
   );
 };

 // Screen selection moved to return statement to prevent remounting

// ---------- Utility functions ----------
// Utility: trim a string to n chars, add ellipsis if needed
function trimTo(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

  // final return (inside the App function)
return !fontsLoaded ? (
  <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#222' }}>
    <Text style={{ color:'#fff' }}>Loading...</Text>
  </View>
) : (
  <View style={{ flex: 1, backgroundColor: '#fff' }}>
    {route === 'reminders' ? <Reminders /> :
     route === 'pharmacies' ? <Pharmacies /> :
     route === 'labs' ? <Labs /> :
     route === 'prescription' ? <Prescription /> :
     route === 'appointments' ? <Appointments /> :
     route === 'settings' ? <Settings /> :
     route === 'medications' ? <Medications theme={theme} meds={meds} setMeds={setMeds} S={S} themeKey={themeKey} onNavigateToDashboard={() => setRoute('dashboard')} onNavigateToSettings={() => setRoute('settings')} /> :
     route === 'herbs' ? <HerbsScreen onClose={() => setRoute('dashboard')} theme={theme} /> :
     route === 'supplements' ? <Supplements supplements={supplements} setSupplements={setSupplements} /> :
     route === 'documents' ? <DocScanScreen onClose={() => setRoute('dashboard')} theme={theme} /> :
     <Dashboard />}

    {/* Floating AI button */}
    <AnimatedFloatingButton />

    {/* AI modal */}
    <Modal
      visible={aiOpen}
      animationType="slide"
      transparent
      onRequestClose={() => setAiOpen(false)}
      presentationStyle="overFullScreen"
>
  <View style={styles.sheetBackdrop}>
    <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.chip, flex: 1 }]}>
      <View style={styles.sheetHeader}>
        <Text style={{ color: theme.text, fontFamily: 'Inter_800ExtraBold' }}>
          {S.aiConsultant}
        </Text>
        <TouchableOpacity onPress={() => setAiOpen(false)}>
          <Text style={{ color: theme.sub, fontFamily: 'Inter_600SemiBold' }}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, minHeight: 200, paddingBottom: 100 }}>
        <ScrollView
          ref={aiScrollRef}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {aiMessages.map((m, idx) => (
            <View
              key={idx}
              style={[
                styles.msg,
                m.role === 'user' ? styles.msgUser : styles.msgBot,
                { borderColor: theme.chip, backgroundColor: m.role === 'user' ? theme.chip : theme.card },
              ]}
            >
              {m.role === 'assistant' && idx === aiMessages.length - 1 && aiSending ? (
                <TypingEffect 
                  text={m.text} 
                  speed={20}
                  style={{ color: theme.text, fontFamily: 'Inter_400Regular' }}
                  showCursor={true}
                />
              ) : (
              <Text style={{ color: theme.text, fontFamily: 'Inter_400Regular' }}>{m.text}</Text>
              )}
            </View>
          ))}
          
          {/* Typing indicator when AI is starting to respond */}
          {aiSending && aiMessages.length > 0 && aiMessages[aiMessages.length - 1].role === 'user' && (
            <View
              style={[
                styles.msg,
                styles.msgBot,
                { borderColor: theme.chip, backgroundColor: theme.card },
              ]}
            >
              <TypingEffect 
                text="AI is thinking..."
                speed={100}
                style={{ color: theme.sub, fontFamily: 'Inter_400Regular', fontStyle: 'italic' }}
                showCursor={true}
              />
            </View>
          )}
        </ScrollView>
      </View>

      {/* Fixed input area that stays visible - ALWAYS RENDERED */}
      <View style={[
        styles.aiInputContainer,
        { 
          backgroundColor: theme.card,
          borderTopColor: theme.chip,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          minHeight: 80, // Ensure minimum height
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }
      ]}>
      <View style={styles.aiInputRow}>
        <TextInput
          ref={aiInputRef}
          value={aiInput}
          onChangeText={setAiInput}
          placeholder="Ask about medications, pharmacies…"
          placeholderTextColor={theme.sub}
            onSubmitEditing={() => sendAi(reminders, rxPhotos, meds, supplements, herbs, theme)}
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
            returnKeyType="send"
            enablesReturnKeyAutomatically={true}
            onFocus={() => {
              // Keep keyboard open when AI input is focused
              setTimeout(() => {
                if (aiInputRef.current) {
                  aiInputRef.current.focus();
                }
              }, 100);
            }}
          style={[
            styles.aiInput,
              { 
                color: theme.text, 
                borderColor: theme.chip, 
                fontFamily: 'Inter_400Regular', 
                minHeight: 44,
                backgroundColor: theme.card,
              },
            ]}
          />
          <TouchableOpacity 
            style={[styles.aiBtn, { backgroundColor: theme.accent }]} 
            onPress={() => sendAi(reminders, rxPhotos, meds, supplements, herbs, theme)} 
            disabled={aiSending || streamLoading}
          >
            <Text style={{ color: themeKey === 'gold' ? '#2c2c2c' : '#000000', fontFamily: 'Inter_800ExtraBold' }}>
              {streamLoading ? '...' : 'Send'}
            </Text>
        </TouchableOpacity>
        {streamLoading ? (
          <TouchableOpacity style={[styles.aiBtn, { backgroundColor: theme.card, borderWidth:1, borderColor: theme.chip }]} onPress={streamCancel}>
            <Text style={{ color: theme.text, fontFamily: 'Inter_800ExtraBold' }}>Stop</Text>
          </TouchableOpacity>
        ) : null}
        </View>
      </View>

      <Text style={{ color: theme.sub, fontSize: 12, marginTop: 4, textAlign: 'center', fontFamily: 'Inter_400Regular' }}>
        {S.tapToTalk}: (voice input wired in next build)
      </Text>
    </View>
  </View>
    </Modal>
  </View>
);
} // closes export default function App()

// ---------- styles ----------
const styles = StyleSheet.create({
  topbar: { 
    borderBottomWidth: 1, 
    paddingBottom: 1, 
    marginBottom: -15,
    marginTop: -22,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: { fontSize: 28 },
  brandButton: {
    padding: 0,
    backgroundColor: 'transparent',
    marginLeft: -90,
  },
  brandLogo: {
    width: 280,
    height: 90,
  },
  headerHomeButton: {
    padding: 0,
    backgroundColor: 'transparent',
    marginLeft: -65,
  },
  headerHomeIcon: {
    width: 180,
    height: 70,
  },
  quickRow: { flexDirection: 'row', gap: 18, marginTop: 8, flexWrap: 'wrap' },
  quick: { fontSize: 14 },

  widget: { borderWidth: 1, borderRadius: 18, padding: 12, marginBottom: 16 },
  widgetTitle: { fontSize: 18, marginBottom: 10 },
  widgetInner: { borderRadius: 16, padding: 14 },
  widgetSub: { fontSize: 12, marginBottom: 4 },
  widgetBig: { fontSize: 22, marginBottom: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingBottom: 100 },
card: {
    width: '46%',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    minHeight: 120,
  },
  cardIcon: { marginBottom: 12, width: 32, height: 32 },
  cardText: { fontSize: 18, textAlign: 'center' },

  headerTitle: { fontSize: 36 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    bottom: 60,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { 
  maxHeight: '80%', 
  borderTopLeftRadius: 18, 
  borderTopRightRadius: 18, 
  borderWidth: 1, 
  padding: 12,
    flex: 1,
},
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  msg: { padding: 10, borderRadius: 12, borderWidth: 1, marginVertical: 4, marginHorizontal: 2 },
  msgUser: { alignSelf: 'flex-end' },
  msgBot: { alignSelf: 'flex-start' },

  aiInputContainer: {
    position: 'relative',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 80,
    width: '100%',
  },
  aiInputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  aiInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  aiBtn: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emoji: { fontSize: 28, lineHeight: 32, textAlign: 'center' },
});

const consultStyles = StyleSheet.create({
  fab: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheetWrapper: { width: '100%' },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 8 },

  bubble: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    maxWidth: '85%',
  },
  user: { alignSelf: 'flex-end' },
  assistant: { alignSelf: 'flex-start' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginRight: 8,
  },
  sendBtn: {      
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
