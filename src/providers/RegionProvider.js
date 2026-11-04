import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { vip } from '../theme/vip';
import { getRegion, initializeRegion, subscribeRegion, setRegion, hasSavedRegionChoice, hasUSStartupConsent, saveUSStartupConsent } from '../services/region';
import { US_POLICIES } from '../legal/usPolicies';
import notices from '../legal/usDisclaimers.json';
const Context = createContext(null);
async function stopLocationTasks() { try { await require('../services/smartNotificationEngine').disableUSLocationTasks(); } catch {} }
export const useRegion = () => useContext(Context);
export function RegionProvider({ children }) {
  const [region, update] = useState(getRegion());
  const [ready, setReady] = useState(false);
  const [consented, setConsented] = useState(false);
  const [error, setError] = useState('');
  const [regionConfirmed, setRegionConfirmed] = useState(false);
  useEffect(() => {
    const unsubscribe = subscribeRegion(value => { update(value); setConsented(hasUSStartupConsent()); });
    initializeRegion().then(async value => { if (value === 'US') { await stopLocationTasks(); if (!hasUSStartupConsent()) { try { await require('expo-notifications').cancelAllScheduledNotificationsAsync(); } catch {} } } update(value); setRegionConfirmed(hasSavedRegionChoice()); setConsented(hasUSStartupConsent()); setReady(true); }).catch(() => setError('Unable to load region preferences. Restart to retry.'));
    return unsubscribe;
  }, []);
  const changeRegion = async value => { await setRegion(value); if (value === 'US') await stopLocationTasks(); await i18n.changeLanguage(value === 'US' ? 'en' : 'es'); };
  const context = { region, changeRegion, withdraw: () => setConsented(false) };
  return <Context.Provider value={context}>{!ready ? <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /><Text>{error}</Text></View> : !regionConfirmed ? <RegionConfirmation onConfirmed={() => setRegionConfirmed(true)} /> : region === 'US' && !consented ? <USStartupConsent onSaved={() => setConsented(true)} /> : children}</Context.Provider>;
}
function RegionConfirmation({ onConfirmed }) {
  const { region, changeRegion } = useRegion();
  const [selection, setSelection] = useState(region);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const spanish = (i18n.resolvedLanguage || i18n.language || 'es').startsWith('es');
  const name = value => value === 'MX' ? (spanish ? 'México' : 'Mexico') : (spanish ? 'Estados Unidos' : 'United States');
  return <SafeAreaProvider><SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content}><View style={styles.container}>
    <Text accessibilityRole="header" style={styles.title}>AuricRX MedCoach</Text>
    <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.region} onPress={() => setSelection(value => value === 'MX' ? 'US' : 'MX')}>
      <Text style={styles.regionText}>{spanish ? 'Detectamos: ' : 'We detected: '}{name(region)} · {spanish ? 'Cambiar' : 'Change'}</Text>
    </TouchableOpacity>
    <Text style={styles.body}>{spanish ? 'Región seleccionada: ' : 'Selected region: '}{name(selection)}</Text>
    <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.continueButton} onPress={async () => {
      setBusy(true); setError('');
      try { await changeRegion(selection); onConfirmed(); }
      catch { setError(spanish ? 'No se pudo guardar. Intenta de nuevo.' : 'Could not save. Please retry.'); }
      finally { setBusy(false); }
    }}><Text style={styles.continueText}>{spanish ? 'Confirmar región y continuar' : 'Confirm region and continue'}</Text></TouchableOpacity>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View></ScrollView></SafeAreaView></SafeAreaProvider>;
}
function USStartupConsent({ onSaved }) {
  const { region, changeRegion } = useRegion();
  const { t } = useTranslation();
  const english = key => t(key, { lng: 'en' });
  const [choices, setChoices] = useState({ terms: false, collect: false, share: false, adult: false });
  const [document, setDocument] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const labels = { terms: 'I agree to the Terms and Privacy Policy.', collect: 'I consent to collection and processing of my health data (medications, documents, herbs, and wellness entries).', share: 'I separately consent to sharing health data with OpenAI for chat and Firebase/Google, Render, and Neon for authentication, hosting, and synchronization.', adult: 'I confirm that I am 18 or older.' };
  const titles = { terms: 'Terms and privacy', collect: 'Health data collection', share: 'Health data sharing', adult: 'Age confirmation' };
  const disabled = busy || !Object.values(choices).every(Boolean);
  return <SafeAreaProvider><SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>AuricRX MedCoach - United States</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => changeRegion('MX')} style={styles.region}>
          <Text style={styles.regionText}>{english('region.title')}: {english(region === 'US' ? 'region.us' : 'region.mx')} ? {english('usOnboarding.change')}</Text>
          <Ionicons name="chevron-forward" size={18} color={vip.colors.gold} />
        </TouchableOpacity>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={vip.colors.gold} />
          <Text style={styles.body}>{notices.global.split(/(911)/).map((part, index) => part === '911' ? <Text key={index} style={styles.emergency}>{part}</Text> : part)}</Text>
        </View>
        <View style={styles.links}>
          {Object.keys(US_POLICIES).map(key => <TouchableOpacity key={key} accessibilityRole="link" onPress={() => setDocument(US_POLICIES[key])} style={styles.link}>
            <Text style={styles.linkText}>{key}</Text>
            <Ionicons name="chevron-forward" size={20} color={vip.colors.gold} />
          </TouchableOpacity>)}
        </View>
        {!!document && <View style={styles.infoCard}><Text selectable style={styles.body}>{document}</Text></View>}
        {Object.keys(labels).map(key => <TouchableOpacity key={key} accessibilityRole="checkbox" accessibilityLabel={`${titles[key]}. ${labels[key]}`} accessibilityState={{ checked: choices[key], disabled: busy }} disabled={busy} onPress={() => setChoices(prev => ({ ...prev, [key]: !prev[key] }))} style={[styles.consentCard, choices[key] && styles.selectedCard]}>
          <View style={styles.checkbox}>{choices[key] && <Ionicons name="checkmark" size={22} color={vip.colors.gold} />}</View>
          <View style={styles.consentText}>
            <Text style={styles.consentTitle}>{titles[key]}</Text>
            <Text style={styles.body}>{labels[key]}</Text>
          </View>
        </TouchableOpacity>)}
        <Text style={styles.explanation}>Separate choices, unticked by default. This beta requires collection and processor sharing to enable its cloud features. You may decline and return to region selection. Withdraw in Settings; existing cloud data can be deleted through account deletion.</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled, busy }} disabled={disabled} style={[styles.continueButton, disabled && styles.disabled]} onPress={async () => { setBusy(true); try { await saveUSStartupConsent(choices); onSaved(); } catch { setError('Consent could not be saved. Please retry.'); } finally { setBusy(false); } }}>
          <Text style={styles.continueText}>{english('usOnboarding.continue')}</Text>
        </TouchableOpacity>
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      </View>
    </ScrollView>
  </SafeAreaView></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: vip.colors.navy },
  content: { flexGrow: 1, padding: vip.spacing.md, paddingBottom: vip.spacing.xl },
  container: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: vip.spacing.md },
  title: { color: vip.colors.goldLight, fontSize: 28, lineHeight: 36, fontWeight: '700' },
  region: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: vip.spacing.xs, borderRadius: vip.radius.pill, borderWidth: 1, borderColor: vip.colors.line, paddingHorizontal: 16, paddingVertical: vip.spacing.sm, minHeight: 48 },
  regionText: { color: vip.colors.gold, fontSize: 14, fontWeight: '600', flexShrink: 1 },
  infoCard: { padding: vip.spacing.md, gap: vip.spacing.sm, borderRadius: vip.radius.card, backgroundColor: vip.colors.glass },
  body: { color: vip.colors.white, fontSize: 15, lineHeight: 23 },
  emergency: { color: vip.colors.gold, fontWeight: '700' },
  links: { gap: vip.spacing.xs },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: vip.spacing.sm, minHeight: 48, paddingVertical: vip.spacing.sm },
  linkText: { color: vip.colors.gold, fontSize: 15, fontWeight: '600', flex: 1 },
  consentCard: { flexDirection: 'row', alignItems: 'flex-start', gap: vip.spacing.sm, padding: vip.spacing.md, borderRadius: vip.radius.card, borderWidth: 1, borderColor: vip.colors.line, backgroundColor: vip.colors.glass },
  selectedCard: { borderColor: vip.colors.gold },
  checkbox: { width: 28, height: 28, borderWidth: 2, borderColor: vip.colors.gold, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  consentText: { flex: 1, gap: vip.spacing.xs },
  consentTitle: { color: vip.colors.white, fontSize: 16, fontWeight: '700', lineHeight: 24 },
  explanation: { color: vip.colors.muted, fontSize: 14, lineHeight: 22 },
  continueButton: { backgroundColor: vip.colors.gold, minHeight: 54, borderRadius: vip.radius.button, padding: vip.spacing.sm, alignItems: 'center', justifyContent: 'center' },
  continueText: { color: vip.colors.onGold, fontSize: 17, fontWeight: '700' },
  disabled: { opacity: 0.4 },
  error: { color: vip.colors.danger, fontSize: 14, lineHeight: 22 },
});
