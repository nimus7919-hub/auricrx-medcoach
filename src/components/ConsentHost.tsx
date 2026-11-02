import React, { useEffect, useState } from 'react';
import { Modal, Text, ScrollView, TouchableOpacity, View, StyleSheet, Alert } from 'react-native';
import { vip } from '../theme/vip';
import ConsentChoices from './ConsentChoices';
import { consentRequest, registerConsentPrompt } from '../services/consentService';
import { loadTermsText, loadPrivacyText } from '../services/legalService';
import authService from '../services/authService';
import * as Notifications from 'expo-notifications';

function ConsentButton({ title, disabled, onPress, primary = false, destructive = false }: any) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !!disabled }}
    disabled={disabled} onPress={onPress}
    style={[styles.button, primary && styles.primaryButton, disabled && styles.disabledButton]}>
    <Text style={[styles.buttonText, primary && styles.primaryText, destructive && styles.destructiveText]}>{title}</Text>
  </TouchableOpacity>;
}

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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{es ? 'Privacidad' : 'Privacy'}</Text>
      {document ? <><Text style={styles.document}>{document}</Text><ConsentButton title={es ? 'Volver' : 'Back'} onPress={() => setDocument('')} /></> : <>
        <ConsentButton title={es ? "Aviso de Privacidad / Política de Datos de Salud" : "Privacy Notice / Consumer Health Data Privacy Policy"} onPress={async () => setDocument(await loadPrivacyText(language))} />
        <ConsentChoices language={language} value={choices} onChange={setChoices} openLegal={async type => {
          try { setDocument(await (type === 'terms' ? loadTermsText(language) : loadPrivacyText(language))); }
          catch { setError(es ? 'No se pudo abrir el documento.' : 'Could not open document.'); }
        }} />
        <Text style={styles.description}>{es ? 'Términos y aviso requeridos para la cuenta. El consentimiento de salud es necesario antes de usar funciones de salud.' : 'Terms and notice are required for an account. Health consent is needed before using health features.'}</Text>
        <ConsentButton primary title={es ? 'Continuar' : 'Continue'} disabled={busy || !choices.terms || !choices.privacy || (!!user && !choices.health)} onPress={() => save()} />
        {!!user && <ConsentButton title={es ? 'Retirar consentimiento de salud' : 'Withdraw health consent'} disabled={busy} onPress={() => save(true)} />}
        {!!user && <ConsentButton destructive title={es ? 'Eliminar cuenta' : 'Delete account'} disabled={busy} onPress={() => Alert.alert(
          es ? 'Eliminar cuenta y datos' : 'Delete account and data',
          es ? 'Esta acción es permanente.' : 'This action is permanent.',
          [{ text: es ? 'Cancelar' : 'Cancel', style: 'cancel' }, { text: es ? 'Eliminar' : 'Delete', style: 'destructive', onPress: async () => {
            setBusy(true);
            try { await authService.deleteAccount(); setVisible(false); Alert.alert(es ? 'Cuenta eliminada' : 'Account deleted'); }
            catch (e: any) { setError(e.message); }
            finally { setBusy(false); }
          } }]
        )} />}
        <ConsentButton title={es ? 'Cerrar sesión' : 'Sign out'} disabled={busy} onPress={async () => {
          await authService.signOut(); setVisible(false); rejectPrompt?.(new Error('Consent canceled')); setRejectPrompt(null); setResolvePrompt(null);
        }} />
        {!!privacyOpen && <ConsentButton title={es ? 'Cerrar' : 'Close'} onPress={() => { setVisible(false); onPrivacyClose(); }} />}
        <Text style={styles.error}>{error}</Text>
      </>}
    </View>
    </ScrollView>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: vip.colors.navy },
  content: { flexGrow: 1, padding: vip.spacing.md, paddingTop: 60, paddingBottom: vip.spacing.xl },
  card: { width: '100%', maxWidth: 640, alignSelf: 'center', backgroundColor: vip.colors.glass,
    borderColor: vip.colors.line, borderWidth: 1, borderRadius: vip.radius.card, padding: vip.spacing.md },
  title: { color: vip.colors.goldLight, fontSize: 28, fontWeight: '700', marginBottom: vip.spacing.md },
  document: { color: vip.colors.white, fontSize: 16, lineHeight: 25, marginBottom: vip.spacing.md },
  description: { color: vip.colors.white, fontSize: 14, lineHeight: 22, marginVertical: vip.spacing.sm },
  button: { minHeight: 48, padding: vip.spacing.sm, marginTop: vip.spacing.sm,
    borderWidth: 1, borderColor: vip.colors.line, borderRadius: vip.radius.button, backgroundColor: vip.colors.glass,
    alignItems: 'center', justifyContent: 'center' },
  primaryButton: { backgroundColor: vip.colors.gold },
  disabledButton: { opacity: 0.45 },
  buttonText: { color: vip.colors.goldLight, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  primaryText: { color: vip.colors.onGold },
  destructiveText: { color: vip.colors.danger },
  error: { color: vip.colors.danger, marginTop: vip.spacing.sm, lineHeight: 22 },
});
