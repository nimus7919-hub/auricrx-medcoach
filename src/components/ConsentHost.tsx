import React, { useEffect, useState } from 'react';
import { Modal, Text, ScrollView, Button, Alert } from 'react-native';
import ConsentChoices from './ConsentChoices';
import { consentRequest, registerConsentPrompt } from '../services/consentService';
import { loadTermsText, loadPrivacyText } from '../services/legalService';
import authService from '../services/authService';
import * as Notifications from 'expo-notifications';

export default function ConsentHost({ language, user, privacyOpen, onPrivacyClose, onHealthConsentChange }: any) {
  const [visible, setVisible] = useState(false);
  const [choices, setChoices] = useState({ terms: false, privacy: false, health: false });
  const [method, setMethod] = useState('email');
  const [resolvePrompt, setResolvePrompt] = useState<(() => void) | null>(null);
  const [rejectPrompt, setRejectPrompt] = useState<((error: Error) => void) | null>(null);
  const [document, setDocument] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const es = language === 'es';
  useEffect(() => {
    registerConsentPrompt(provider => new Promise<void>((resolve, reject) => {
      setChoices({ terms: false, privacy: false, health: false });
      setMethod(provider); setResolvePrompt(() => resolve); setRejectPrompt(() => reject); setVisible(true);
    }));
    return () => registerConsentPrompt(undefined);
  }, []);
  useEffect(() => {
    if (!user) { setVisible(false); onHealthConsentChange(false); return; }
    let active = true;
    setVisible(true);
    setChoices({ terms: false, privacy: false, health: false });
    onHealthConsentChange(false);
    consentRequest().then(current => {
      if (active && (!current.health || !current.terms || !current.privacy)) {
        setChoices({ terms: false, privacy: false, health: false }); setVisible(true);
      } else if (active) { setVisible(false); onHealthConsentChange(true); }
    }).catch(e => { if (active) { setError(e.message); setVisible(true); } });
    return () => { active = false; };
  }, [user?.uid]);
  useEffect(() => {
    if (privacyOpen) { setVisible(true); setChoices({ terms: false, privacy: false, health: false }); }
  }, [privacyOpen]);
  const save = async (withdraw = false) => {
    setBusy(true); setError('');
    try {
      await consentRequest('POST', withdraw ? { terms: true, privacy: true, health: false } : choices, method);
      if (withdraw) {
        onHealthConsentChange(false);
        onPrivacyClose();
        setChoices({ terms: false, privacy: false, health: false });
        await Notifications.cancelAllScheduledNotificationsAsync();
        setError(es ? 'Consentimiento retirado. Las funciones de salud están bloqueadas hasta que vuelvas a consentir.' : 'Consent withdrawn. Health features are blocked until you consent again.');
      } else { onHealthConsentChange(choices.health); setVisible(false); onPrivacyClose(); resolvePrompt?.(); setResolvePrompt(null); setRejectPrompt(null); }
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };
  return <Modal visible={visible} onRequestClose={() => {}} animationType="slide">
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: '#161616', padding: 24, paddingTop: 60 }}>
      <Text style={{ color: '#D4AF37', fontSize: 22 }}>{es ? 'Privacidad' : 'Privacy'}</Text>
      {document ? <><Text style={{ color: '#fff' }}>{document}</Text><Button title={es ? 'Volver' : 'Back'} onPress={() => setDocument('')} /></> : <>
        <Button title={es ? "Aviso de Privacidad / Política de Datos de Salud" : "Privacy Notice / Consumer Health Data Privacy Policy"} onPress={async () => setDocument(await loadPrivacyText(language))} />
        <ConsentChoices language={language} value={choices} onChange={setChoices} openLegal={async type => {
          try { setDocument(await (type === 'terms' ? loadTermsText(language) : loadPrivacyText(language))); }
          catch { setError(es ? 'No se pudo abrir el documento.' : 'Could not open document.'); }
        }} />
        <Text style={{ color: '#fff', marginVertical: 12 }}>{es ? 'Términos y aviso requeridos para la cuenta. El consentimiento de salud es necesario antes de usar funciones de salud.' : 'Terms and notice are required for an account. Health consent is needed before using health features.'}</Text>
        <Button title={es ? 'Continuar' : 'Continue'} disabled={busy || !choices.terms || !choices.privacy || (!!user && !choices.health)} onPress={() => save()} />
        {!!user && <Button title={es ? 'Retirar consentimiento de salud' : 'Withdraw health consent'} disabled={busy} onPress={() => save(true)} />}
        {!!user && <Button title={es ? 'Eliminar cuenta' : 'Delete account'} disabled={busy} onPress={() => Alert.alert(
          es ? 'Eliminar cuenta y datos' : 'Delete account and data',
          es ? 'Esta acción es permanente.' : 'This action is permanent.',
          [{ text: es ? 'Cancelar' : 'Cancel', style: 'cancel' }, { text: es ? 'Eliminar' : 'Delete', style: 'destructive', onPress: async () => {
            setBusy(true);
            try { await authService.deleteAccount(); setVisible(false); Alert.alert(es ? 'Cuenta eliminada' : 'Account deleted'); }
            catch (e: any) { setError(e.message); }
            finally { setBusy(false); }
          } }]
        )} />}
        <Button title={es ? 'Cerrar sesión' : 'Sign out'} disabled={busy} onPress={async () => {
          await authService.signOut(); setVisible(false); rejectPrompt?.(new Error('Consent canceled')); setRejectPrompt(null); setResolvePrompt(null);
        }} />
        {!!privacyOpen && <Button title={es ? 'Cerrar' : 'Close'} onPress={() => { setVisible(false); onPrivacyClose(); }} />}
        <Text style={{ color: '#ffb4a8', marginTop: 12 }}>{error}</Text>
      </>}
    </ScrollView>
  </Modal>;
}
