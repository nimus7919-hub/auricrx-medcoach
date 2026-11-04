import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import i18n from '../i18n';
import { getRegion, initializeRegion, subscribeRegion, setRegion, hasUSStartupConsent, saveUSStartupConsent } from '../services/region';
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
  useEffect(() => {
    const unsubscribe = subscribeRegion(value => { update(value); setConsented(hasUSStartupConsent()); });
    initializeRegion().then(async value => { if (value === 'US') { await stopLocationTasks(); if (!hasUSStartupConsent()) { try { await require('expo-notifications').cancelAllScheduledNotificationsAsync(); } catch {} } } update(value); setConsented(hasUSStartupConsent()); setReady(true); }).catch(() => setError('Unable to load region preferences. Restart to retry.'));
    return unsubscribe;
  }, []);
  const changeRegion = async value => { await setRegion(value); if (value === 'US') await stopLocationTasks(); await i18n.changeLanguage(value === 'US' ? 'en' : 'es'); };
  const context = { region, changeRegion, withdraw: () => setConsented(false) };
  return <Context.Provider value={context}>{!ready ? <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /><Text>{error}</Text></View> : region === 'US' && !consented ? <USStartupConsent onSaved={() => setConsented(true)} /> : children}</Context.Provider>;
}
function USStartupConsent({ onSaved }) {
  const { changeRegion } = useRegion();
  const [choices, setChoices] = useState({ terms: false, collect: false, share: false, adult: false });
  const [document, setDocument] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const labels = { terms: 'I agree to the Terms and Privacy Policy.', collect: 'I consent to collection and processing of my health data (medications, documents, herbs, and wellness entries).', share: 'I separately consent to sharing health data with OpenAI for chat and Firebase/Google, Render, and Neon for authentication, hosting, and synchronization.', adult: 'I confirm that I am 18 or older.' };
  return <ScrollView style={{ flex: 1, backgroundColor: '#101B2A' }} contentContainerStyle={{ padding: 24, paddingTop: 60, gap: 18 }}>
    <Text style={{ color: '#E7C777', fontSize: 24 }}>AuricRX MedCoach - United States</Text>
    <Text style={{ color: 'white' }}>{notices.global}</Text>
    {Object.keys(US_POLICIES).map(key => <TouchableOpacity key={key} accessibilityRole="link" onPress={() => setDocument(US_POLICIES[key])}><Text style={{ color: '#E7C777' }}>{key}</Text></TouchableOpacity>)}
    {!!document && <Text style={{ color: 'white' }}>{document}</Text>}
    {Object.keys(labels).map(key => <TouchableOpacity key={key} accessibilityRole="checkbox" accessibilityState={{ checked: choices[key] }} onPress={() => setChoices(prev => ({ ...prev, [key]: !prev[key] }))} style={{ paddingVertical: 12 }}><Text style={{ color: 'white' }}>{choices[key] ? '[x]' : '[ ]'} {labels[key]}</Text></TouchableOpacity>)}
    <Text style={{ color: 'white' }}>Separate choices, unticked by default. This beta requires collection and processor sharing to enable its cloud features. You may decline and return to region selection. Withdraw in Settings; existing cloud data can be deleted through account deletion.</Text>
    <TouchableOpacity accessibilityRole="button" disabled={busy || Object.values(choices).some(value => !value)} onPress={async () => { setBusy(true); try { await saveUSStartupConsent(choices); onSaved(); } catch { setError('Consent could not be saved. Please retry.'); } finally { setBusy(false); } }}><Text style={{ color: '#E7C777', opacity: Object.values(choices).every(Boolean) ? 1 : 0.4 }}>Continue</Text></TouchableOpacity>
    <TouchableOpacity onPress={() => changeRegion('MX')}><Text style={{ color: '#E7C777' }}>Región: México</Text></TouchableOpacity>
    <Text style={{ color: '#FFAAAA' }}>{error}</Text>
  </ScrollView>;
}
