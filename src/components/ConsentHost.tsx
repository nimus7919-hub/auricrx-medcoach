import { getRegion } from '../services/region';
import { useRegion } from '../providers/RegionProvider';
import { US_POLICIES } from '../legal/usPolicies';
import Modal from './BackModal';
import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import KeyboardForm from '../../components/KeyboardForm';
import React, { useEffect, useRef, useState } from 'react';
import { Text, ScrollView, TouchableOpacity, View, StyleSheet, Alert } from 'react-native';
import { vip } from '../theme/vip';
import ConsentChoices from './ConsentChoices';
import { consentRequest, registerConsentPrompt, readCachedConsent, hasCurrentConsent } from '../services/consentService';
import { loadTermsText, loadPrivacyText } from '../services/legalService';
import authService from '../services/authService';
import * as Notifications from 'expo-notifications';

function ConsentButton({ title, disabled, onPress, primary = false, destructive = false }: any) {
  useUILanguage();
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !!disabled }}
    disabled={disabled} onPress={onPress}
    style={[styles.button, primary && styles.primaryButton, disabled && styles.disabledButton]}>
    <Text style={[styles.buttonText, primary && styles.primaryText, destructive && styles.destructiveText]}>{title}</Text>
  </TouchableOpacity>;
}

export default function ConsentHost({ language, user, privacyOpen, onPrivacyClose, onHealthConsentChange }: any) {
  useUILanguage();
  const { region } = useRegion();
  const [visible, setVisible] = useState(false);
  const [choices, setChoices] = useState({ terms: false, privacy: false, health: false, share: false });
  const [method, setMethod] = useState('email');
  const [resolvePrompt, setResolvePrompt] = useState<(() => void) | null>(null);
  const [rejectPrompt, setRejectPrompt] = useState<((error: Error) => void) | null>(null);
  const [document, setDocument] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const checkRevision = useRef(0);
  const es = language === 'es';
  useEffect(() => {
    registerConsentPrompt(provider => new Promise<void>((resolve, reject) => {
      setChoices({ terms: false, privacy: false, health: false, share: false });
      setMethod(provider); setResolvePrompt(() => resolve); setRejectPrompt(() => reject); setVisible(true);
    }));
    return () => registerConsentPrompt(undefined);
  }, []);
  useEffect(() => {
    if (!user) { setVisible(false); onHealthConsentChange(false); return; }
    let active = true;
    const revision = ++checkRevision.current;
    setVisible(false);
    setError('');
    setChoices({ terms: false, privacy: false, health: false, share: false });
    onHealthConsentChange(false);
    const isCurrent = () => active && checkRevision.current === revision;
    const check = async () => {
      if (getRegion() !== 'US' && await readCachedConsent(user.uid)) {
        if (!isCurrent()) return;
        onHealthConsentChange(true);
      }
      const current = await consentRequest();
      if (!isCurrent()) return;
      const accepted = hasCurrentConsent(current);
      onHealthConsentChange(accepted);
      if (!accepted) {
        setChoices({ terms: false, privacy: false, health: false, share: false }); setVisible(true);
      }
    };
    // An unavailable server is not evidence of missing consent; retain cached access
    // or the loading view and retry without displaying the consent form.
    let retry: ReturnType<typeof setTimeout>;
    const run = () => { check().catch(() => {
      if (isCurrent()) retry = setTimeout(run, 5000);
    }); };
    run();
    return () => { active = false; clearTimeout(retry); };
  }, [user?.uid, region]);
  useEffect(() => {
    if (privacyOpen) { setVisible(true); setChoices({ terms: false, privacy: false, health: false, share: false }); }
  }, [privacyOpen]);
  const save = async (withdraw = false) => {
    checkRevision.current += 1;
    setBusy(true); setError('');
    try {
      await consentRequest('POST', withdraw ? { terms: true, privacy: true, health: false, share: false } : choices, method);
      if (withdraw) {
        onHealthConsentChange(false);
        onPrivacyClose();
        setChoices({ terms: false, privacy: false, health: false, share: false });
        await Notifications.cancelAllScheduledNotificationsAsync();
        setError(uiI18n.t("localized.ConsentHost.save.text85"));
      } else { onHealthConsentChange(choices.health && (getRegion() !== 'US' || choices.share)); setVisible(false); onPrivacyClose(); resolvePrompt?.(); setResolvePrompt(null); setRejectPrompt(null); }
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };
  return <Modal visible={visible} onRequestClose={() => {
    if (document) { setDocument(''); return; }
    setVisible(false);
    onPrivacyClose();
    rejectPrompt?.(new Error(uiI18n.t('ui.consentCanceled')));
    setRejectPrompt(null); setResolvePrompt(null);
    // Cancel required consent without granting access to protected screens.
    if (user && !privacyOpen) void authService.signOut();
  }} animationType="slide">
    <KeyboardForm><ScrollView keyboardShouldPersistTaps="handled" style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{uiI18n.t("localized.ConsentHost.text93")}</Text>
      {document ? <><Text style={styles.document}>{document}</Text><ConsentButton title={uiI18n.t("localized.ConsentHost.text94")} onPress={() => setDocument('')} /></> : <>
        <ConsentButton title={uiI18n.t("localized.ConsentHost.text95")} onPress={async () => setDocument(await loadPrivacyText(language))} />
        {getRegion() === 'US' && <ConsentButton title="Consumer Health Data Privacy Policy" onPress={() => setDocument(US_POLICIES['Consumer Health Data Privacy Policy'])} />}
        <ConsentChoices language={language} value={choices} onChange={setChoices} openLegal={async type => {
          try { setDocument(await (type === 'terms' ? loadTermsText(language) : loadPrivacyText(language))); }
          catch { setError(uiI18n.t("localized.ConsentHost.text98")); }
        }} />
        <Text style={styles.description}>{uiI18n.t("localized.ConsentHost.text100")}</Text>
        <ConsentButton primary title={uiI18n.t("localized.ConsentHost.text101")} disabled={busy || !choices.terms || !choices.privacy || (!!user && (!choices.health || (getRegion() === 'US' && !choices.share)))} onPress={() => save()} />
        {!!user && <ConsentButton title={uiI18n.t("localized.ConsentHost.text102")} disabled={busy} onPress={() => save(true)} />}
        {!!user && <ConsentButton destructive title={uiI18n.t("localized.ConsentHost.text103")} disabled={busy} onPress={() => Alert.alert(
          uiI18n.t("localized.ConsentHost.text104"),
          uiI18n.t("localized.ConsentHost.text105"),
          [{ text: uiI18n.t("localized.ConsentHost.item0.text.text106"), style: 'cancel' }, { text: uiI18n.t("localized.ConsentHost.item1.text.text106"), style: 'destructive', onPress: async () => {
            setBusy(true);
            try { await authService.deleteAccount(); setVisible(false); Alert.alert(uiI18n.t("localized.ConsentHost.item1.onPress.text108")); }
            catch (e: any) { setError(e.message); }
            finally { setBusy(false); }
          } }]
        )} />}
        <ConsentButton title={uiI18n.t("localized.ConsentHost.text113")} disabled={busy} onPress={async () => {
          await authService.signOut(); setVisible(false); rejectPrompt?.(new Error(uiI18n.t("ui.consentCanceled"))); setRejectPrompt(null); setResolvePrompt(null);
        }} />
        {!!privacyOpen && <ConsentButton title={uiI18n.t("localized.ConsentHost.text116")} onPress={() => { setVisible(false); onPrivacyClose(); }} />}
        <Text style={styles.error}>{error}</Text>
      </>}
    </View>
    </ScrollView></KeyboardForm>
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
