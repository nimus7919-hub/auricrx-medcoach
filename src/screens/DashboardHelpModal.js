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

// Mode-aware guide content via i18n. General information only; no medical claims.
function buildSteps(t, us) {
  return [
    { title: t('dashboardHelp.welcomeTitle'), sub: t('dashboardHelp.welcomeSub'), items: [
      ['book-outline', t('dashboardHelp.healthJournalTitle'), t('dashboardHelp.healthJournalDesc')],
      ['grid-outline', t('dashboardHelp.bottomTabsTitle'), t('dashboardHelp.bottomTabsDesc')],
      ['help-circle-outline', t('dashboardHelp.thisGuideTitle'), t('dashboardHelp.thisGuideDesc')],
    ] },
    { title: t('dashboardHelp.dailyCareTitle'), sub: t('dashboardHelp.dailyCareSub'), items: [
      ['alarm-outline', t('tiles.reminders'), t('dashboardHelp.remindersDesc')],
      ['medkit-outline', t('tiles.medications'), t('dashboardHelp.medicationsDesc')],
      ['leaf-outline', t('tiles.herbs'), t('dashboardHelp.herbsDesc')],
      ['nutrition-outline', t('tiles.supplements'), t('dashboardHelp.supplementsDesc')],
    ] },
    { title: t('tiles.smartAlerts'), sub: t('dashboardHelp.smartSub'), items: [
      ['repeat-outline', t('dashboardHelp.refillTitle'), t('dashboardHelp.refillDesc')],
      ['time-outline', t('dashboardHelp.timingTitle'), t('dashboardHelp.timingDesc')],
      ['location-outline', t('dashboardHelp.locationTitle'), t('dashboardHelp.locationDesc')],
      ['moon-outline', t('dashboardHelp.quietTitle'), t('dashboardHelp.quietDesc')],
    ] },
    { title: t('dashboardHelp.trackTitle'), sub: t('dashboardHelp.trackSub'), items: [
      ['stats-chart-outline', t('tiles.healthAnalytics'), t('dashboardHelp.healthSummaryDesc')],
      ...(HEALTH_CONNECT_ENABLED ? [['watch-outline', 'Health Connect', t('dashboardHelp.healthConnectDesc')]] : []),
      ['calendar-outline', t('tiles.appointmentLog'), t('dashboardHelp.appointmentsDesc')],
      ['document-text-outline', t('tiles.documents'), t('dashboardHelp.documentsDesc')],
      ['people-outline', t('tiles.familyCircle'), t('ui.familyCircleSubtitle')],
      ['shield-outline', t('tiles.preventionPlanner'), t('ui.preventionPlannerSubtitle')],
      ['flask-outline', t('tiles.labOrganizer'), t('ui.labOrganizerSubtitle')],
      ['checkbox-outline', t('tiles.dailyHabits'), t('ui.dailyHabitsSubtitle')],
    ] },
    { title: t('dashboardHelp.findTitle'), sub: t('dashboardHelp.findSub'), items: [
      us ? ['search-outline', t('tiles.medicineLookup'), t('ui.medicineLookupSubtitle')]
         : ['sparkles-outline', t('tiles.aiHealth'), t('ui.intelligentHealthInsightsAnalysis')],
      ['storefront-outline', t('tiles.pharmacyLocations'), t('dashboardHelp.pharmacyDesc')],
      ['flask-outline', t('tiles.labsLocations'), t('dashboardHelp.labsDesc')],
      ['chatbubble-ellipses-outline', t('dashboardHelp.aiAssistantTitle'), t('dashboardHelp.aiAssistantDesc')],
    ] },
    { title: t('dashboardHelp.settingsTitle'), sub: t('dashboardHelp.settingsSub'), items: [
      ['globe-outline', t('dashboardHelp.regionTitle'), t('dashboardHelp.regionDesc')],
      ['shield-checkmark-outline', t('dashboardHelp.consentsTitle'), t('dashboardHelp.consentsDesc')],
      ['diamond-outline', t('dashboardHelp.subscriptionTitle'), t('dashboardHelp.subscriptionDesc')],
      ['call-outline', t('dashboardHelp.emergencyTitle'), t('dashboardHelp.emergencyDesc')],
    ] },
  ];
}

export default function createDashboardHelpModal(getScope) {
  return () => {
    useUILanguage();
    const { showHelpModal, setShowHelpModal } = getScope();
    const { getCardBackgroundColor, getCardBorderColor, getSubTextColor, getAccentColor } = useWallpaper();
    const [step, setStep] = useState(0);
    const t = uiI18n.t.bind(uiI18n);
    const steps = buildSteps(t, getRegion() === 'US');
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
              <Text style={{ flex: 1, color: sub, fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 }}>{t('dashboardHelp.guideLabel') + `  ·  ${step + 1}/${steps.length}`}</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('dashboardHelp.close')} onPress={close} hitSlop={12} style={{ padding: 4 }}>
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
                <Text style={{ color: accent, fontSize: 15, fontFamily: 'Inter_600SemiBold' }}>{t('dashboardHelp.back')}</Text>
              </TouchableOpacity>
              <PremiumButton onPress={() => (step === last ? close() : go(step + 1))} style={{ flex: 1, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontFamily: 'Inter_700Bold' }}>{step === last ? t('dashboardHelp.done') : t('dashboardHelp.next')}</Text>
              </PremiumButton>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
}
