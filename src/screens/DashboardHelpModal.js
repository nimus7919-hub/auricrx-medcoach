import Modal from '../components/BackModal';
import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import { useState, useRef } from "react";
import { View, TouchableOpacity, ScrollView, Text, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWallpaper } from "./../contexts/WallpaperContext";
import DynamicText from "./../components/DynamicText";
import GoldHealthIcon from "./../components/GoldHealthIcon";
import PremiumButton from "./../components/PremiumButton";
import { getRegion } from '../services/region';
import { HEALTH_CONNECT_ENABLED } from '../services/healthConnectService';
import { styles } from "./appStyles";

// Mode-aware guide content. General information only; no medical claims.
function buildSteps(es, us) {
  const L = (en, sp) => (es ? sp : en);
  return [
    { title: L('Welcome to your Home', 'Bienvenido a tu Inicio'), sub: L('A quick tour of everything in the app.', 'Un recorrido rápido por todo lo que hay en la app.'), items: [
      ['book-outline', L('Health Journal', 'Diario de salud'), L('Shows your next reminder. Tap "Add reminder" if you have none yet.', 'Muestra tu próximo recordatorio. Toca "Agregar recordatorio" si aún no tienes.')],
      ['grid-outline', L('Bottom tabs', 'Pestañas inferiores'), L('Home, Medications, Reminders and Settings are always one tap away.', 'Inicio, Medicamentos, Recordatorios y Ajustes siempre a un toque.')],
      ['help-circle-outline', L('This guide', 'Esta guía'), L('Open it anytime from the help button at the top of Home.', 'Ábrela cuando quieras con el botón de ayuda arriba en Inicio.')],
    ] },
    { title: L('Daily care', 'Cuidado diario'), sub: L('Keep your routine organized.', 'Mantén tu rutina organizada.'), items: [
      ['alarm-outline', L('Reminders', 'Recordatorios'), L('Set alerts for doses, refills and appointments.', 'Crea alertas para tomas, resurtidos y citas.')],
      ['medkit-outline', L('Medications', 'Medicamentos'), L('Keep a list of your medicines, doses and schedules.', 'Guarda tu lista de medicamentos, dosis y horarios.')],
      ['leaf-outline', L('Herbs', 'Hierbas'), L('Save herbal products you use and read general information.', 'Guarda productos herbales que usas y lee información general.')],
      ['nutrition-outline', L('Supplements', 'Suplementos'), L('Track vitamins and supplements with optional reminders.', 'Registra vitaminas y suplementos con recordatorios opcionales.')],
    ] },
    { title: L('Smart Notifications', 'Notificaciones inteligentes'), sub: L('Reminders that fit your day. All optional.', 'Recordatorios que se adaptan a tu día. Todo es opcional.'), items: [
      ['repeat-outline', L('Refill estimates', 'Estimación de resurtido'), L('Estimates when you may run low, based on what you entered.', 'Estima cuándo podrías quedarte sin medicamento, según lo que registraste.')],
      ['time-outline', L('Timing suggestions', 'Sugerencias de horario'), L('Suggests reminder times based on when you usually respond.', 'Sugiere horarios según cuándo sueles responder.')],
      ['location-outline', L('Location and weather', 'Ubicación y clima'), L('Optional reminders near places or on weather changes, only with your permission.', 'Avisos opcionales cerca de lugares o con cambios de clima, solo con tu permiso.')],
      ['moon-outline', L('Quiet hours', 'Horas de silencio'), L('Pause non-urgent notifications while you rest.', 'Pausa avisos no urgentes mientras descansas.')],
    ] },
    { title: L('Track and organize', 'Registra y organiza'), sub: L('Your records in one place.', 'Tus registros en un solo lugar.'), items: [
      ['stats-chart-outline', L('Health Analytics', 'Análisis de salud'), L('See charts of reminders taken and notes you log.', 'Ve gráficas de recordatorios cumplidos y notas que registras.')],
      ...(HEALTH_CONNECT_ENABLED ? [['watch-outline', L('Health Connect', 'Health Connect'), L('Optionally import steps and activity from your wearable. You can disconnect anytime.', 'Importa pasos y actividad de tu reloj, si quieres. Puedes desconectarlo cuando quieras.')]] : []),
      ['calendar-outline', L('Appointment Log', 'Registro de citas'), L('Save visits, doctor contacts and past appointments.', 'Guarda citas, contactos de doctores e historial de visitas.')],
      ['document-text-outline', L('Documents', 'Documentos'), L('Keep insurance cards, lab results and prescriptions handy.', 'Ten a mano credenciales, resultados y recetas.')],
    ] },
    { title: L('Find information', 'Encuentra información'), sub: L('General information only, not medical advice.', 'Solo información general, no es consejo médico.'), items: [
      us ? ['search-outline', L('Medicine Lookup', 'Consulta de medicamentos'), L('Medicine info, interactions, recalls, prices and pharmacies from public sources.', 'Información, interacciones, retiros, precios y farmacias de fuentes públicas.')]
         : ['sparkles-outline', L('AI Health', 'Salud IA'), L('Chat with AI assistants about general health topics. They are not doctors.', 'Conversa con asistentes de IA sobre temas generales de salud. No son doctores.')],
      ['storefront-outline', L('Pharmacy Locations', 'Farmacias cercanas'), L('Find nearby pharmacies with distance and directions.', 'Encuentra farmacias cercanas con distancia y ruta.')],
      ['flask-outline', L('Labs Locations', 'Laboratorios cercanos'), L('Find nearby labs and testing centers.', 'Encuentra laboratorios y centros de análisis cercanos.')],
      ['chatbubble-ellipses-outline', L('AI assistant', 'Asistente IA'), L('The floating avatar opens a general information assistant. It is not a doctor.', 'El avatar flotante abre un asistente de información general. No es un doctor.')],
    ] },
    { title: L('Settings and privacy', 'Ajustes y privacidad'), sub: L('You stay in control.', 'Tú tienes el control.'), items: [
      ['globe-outline', L('Region', 'Región'), L('Switch between United States and Mexico modes in Settings.', 'Cambia entre modo Estados Unidos y México en Ajustes.')],
      ['shield-checkmark-outline', L('Consents and legal', 'Consentimientos y legal'), L('Review or withdraw consents and read Legal & Privacy anytime.', 'Revisa o retira consentimientos y lee Legal y Privacidad cuando quieras.')],
      ['diamond-outline', L('Subscription', 'Suscripción'), L('See your trial or plan status from Settings.', 'Consulta tu prueba o plan desde Ajustes.')],
      ['call-outline', L('Emergency', 'Emergencia'), us ? L('In an emergency, call 911.', 'En una emergencia, llama al 911.') : L('In an emergency, call 911.', 'En una emergencia, llama al 911.')],
    ] },
  ];
}

export default function createDashboardHelpModal(getScope) {
  return () => {
    useUILanguage();
    const { showHelpModal, setShowHelpModal } = getScope();
    const { getCardBackgroundColor, getCardBorderColor, getSubTextColor, getAccentColor } = useWallpaper();
    const [step, setStep] = useState(0);
    const es = (uiI18n.resolvedLanguage || uiI18n.language || 'en').startsWith('es');
    const steps = buildSteps(es, getRegion() === 'US');
    const last = steps.length - 1;
    const cur = steps[Math.min(step, last)];
    const card = getCardBackgroundColor(), border = getCardBorderColor(), sub = getSubTextColor(), accent = getAccentColor();
    const close = () => { setShowHelpModal(false); setStep(0); };
    const go = (n) => setStep(Math.max(0, Math.min(last, n)));
    const stepRef = useRef(step); stepRef.current = step;
    const pan = useRef(PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
      onPanResponderRelease: (_, g) => { if (g.dx < -50) go(stepRef.current + 1); else if (g.dx > 50) go(stepRef.current - 1); },
    })).current;

    return (
      <Modal visible={showHelpModal} transparent animationType="slide" onRequestClose={close}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.helpModalContainer, { backgroundColor: card + 'F5', borderColor: border, borderWidth: 2, borderRadius: 22 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10 }}>
              <Text style={{ flex: 1, color: sub, fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 }}>{(es ? 'GUÍA DEL INICIO' : 'DASHBOARD GUIDE') + `  ·  ${step + 1}/${steps.length}`}</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={es ? 'Cerrar' : 'Close'} onPress={close} hitSlop={12} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={accent} />
              </TouchableOpacity>
            </View>
            <View {...pan.panHandlers} style={{ flexShrink: 1 }}>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 12 }}>
                <DynamicText type="primary" style={{ color: '#FFFFFF', fontSize: 22, fontFamily: 'Inter_800ExtraBold' }}>{cur.title}</DynamicText>
                <Text style={{ color: sub, fontSize: 14, marginTop: 4, marginBottom: 14 }}>{cur.sub}</Text>
                {cur.items.map(([icon, title, desc]) => (
                  <View key={title} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: card, borderColor: border, borderWidth: 2, borderRadius: 18, padding: 14, marginBottom: 10 }}>
                    <GoldHealthIcon name={icon} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_700Bold' }}>{title}</Text>
                      <Text style={{ color: sub, fontSize: 13, marginTop: 2, lineHeight: 18 }}>{desc}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 10 }}>
              {steps.map((_, i) => (
                <TouchableOpacity key={i} accessibilityLabel={`${i + 1}`} onPress={() => go(i)} hitSlop={8}>
                  <View style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, marginHorizontal: 4, backgroundColor: i === step ? accent : border }} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 18, gap: 12 }}>
              <TouchableOpacity accessibilityRole="button" disabled={step === 0} onPress={() => go(step - 1)} style={{ paddingVertical: 14, paddingHorizontal: 8, opacity: step === 0 ? 0.35 : 1 }}>
                <Text style={{ color: accent, fontSize: 15, fontFamily: 'Inter_600SemiBold' }}>{es ? 'Atrás' : 'Back'}</Text>
              </TouchableOpacity>
              <PremiumButton onPress={() => (step === last ? close() : go(step + 1))} style={{ flex: 1, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontFamily: 'Inter_700Bold' }}>{step === last ? (es ? 'Listo' : 'Done') : (es ? 'Siguiente' : 'Next')}</Text>
              </PremiumButton>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
}
