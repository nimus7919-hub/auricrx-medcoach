/**
 * Patient-app Doctor linking + Bitácora (Phase 1).
 * Doctor clinical UI lives in apps/doctor (AuricRX Médicos).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
import DoctorModeService from '../services/doctorModeService';
import BitacoraScreen from './BitacoraScreen';
import {
  CONSENT_CATEGORIES,
  PATIENT_REQUEST_TYPES,
  type ConsentCategory,
  type PatientDoctorLink,
  type PatientRequestType,
} from '../doctor';

type ViewMode = 'hub' | 'bitacora' | 'links' | 'enterCode' | 'message';

export default function PatientDoctorLinkScreen({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { getCardBackgroundColor, getCardBorderColor, getAccentColor } = useWallpaper();
  const service = DoctorModeService.getInstance();

  const [view, setView] = useState<ViewMode>('hub');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<PatientDoctorLink[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [enterCode, setEnterCode] = useState('');
  const [auditPreview, setAuditPreview] = useState<string[]>([]);
  const [messageLink, setMessageLink] = useState<PatientDoctorLink | null>(null);
  const [requestType, setRequestType] = useState<PatientRequestType>('general');
  const [messageBody, setMessageBody] = useState('');
  const [hoursLines, setHoursLines] = useState<string[]>([]);
  const [lastAutoNotice, setLastAutoNotice] = useState<string | null>(null);

  const cardBg = getCardBackgroundColor();
  const border = getCardBorderColor();
  const accent = getAccentColor();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const l = await service.listLinksForCurrentUser().catch(() => []);
      setLinks(l);
      const audits = await service.listAuditLogs({ max: 10 }).catch(() => []);
      setAuditPreview(
        audits.slice(0, 8).map((a) => `${a.action} · ${new Date(a.createdAt).toLocaleString()}`)
      );
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (view === 'bitacora') {
    return <BitacoraScreen onClose={() => setView('hub')} />;
  }

  const patientLinks = links;

  const handleCreateInvite = async () => {
    setBusy(true);
    try {
      const invite = await service.createInvite('patient');
      setInviteCode(invite.code);
      Alert.alert(
        t('doctorMode.linking.inviteCreated'),
        t('doctorMode.linking.inviteShare', { code: invite.code, minutes: 30 })
      );
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || t('doctorMode.linking.inviteFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleRedeemDoctorInvite = async () => {
    setBusy(true);
    try {
      await service.confirmLinkWithInvite(enterCode, { actingAs: 'patient' });
      setEnterCode('');
      await refresh();
      setView('links');
      Alert.alert(t('common.success'), t('doctorMode.linking.linked'));
    } catch (e: any) {
      const key = e?.message;
      const msg =
        key === 'expired_invite'
          ? t('doctorMode.linking.expired')
          : key === 'invalid_invite'
            ? t('doctorMode.linking.invalid')
            : e?.message || t('doctorMode.linking.linkFailed');
      Alert.alert(t('common.error'), msg);
    } finally {
      setBusy(false);
    }
  };

  const handleConsentToggle = async (link: PatientDoctorLink, category: ConsentCategory, value: boolean) => {
    try {
      const updated = await service.updateConsent(link.id, { [category]: value });
      setLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || t('doctorMode.linking.consentFailed'));
    }
  };

  const handleRevoke = (link: PatientDoctorLink) => {
    Alert.alert(t('doctorMode.linking.revokeTitle'), t('doctorMode.linking.revokeMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('doctorMode.linking.revoke'),
        style: 'destructive',
        onPress: async () => {
          try {
            await service.revokeLink(link.id);
            await refresh();
          } catch (e: any) {
            Alert.alert(t('common.error'), e?.message || t('doctorMode.linking.revokeFailed'));
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: border }]}>
        <DynamicText type="card" style={styles.title}>
          {view === 'hub'
            ? t('doctorMode.patientHub.title')
            : view === 'links'
              ? t('doctorMode.linking.myDoctors')
              : view === 'message'
                ? t('doctorMode.messaging.writeTitle')
                : t('doctorMode.linking.enterCode')}
        </DynamicText>
        <TouchableOpacity onPress={() => (view === 'hub' ? onClose() : setView('hub'))}>
          <DynamicText type="card" style={styles.close}>
            {view === 'hub' ? t('common.close') : t('common.back')}
          </DynamicText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={accent} />
      ) : (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {view === 'hub' && (
            <>
              <DynamicText type="card" style={styles.lead}>
                {t('doctorMode.patientHub.subtitle')}
              </DynamicText>

              <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                <DynamicText type="card" style={styles.sectionTitle}>{t('doctorMode.bitacora.title')}</DynamicText>
                <DynamicText type="card" style={styles.sectionDesc}>{t('doctorMode.bitacora.hubHint')}</DynamicText>
                <ActionBtn label={t('doctorMode.bitacora.open')} accent={accent} onPress={() => setView('bitacora')} />
              </View>

              <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                <DynamicText type="card" style={styles.sectionTitle}>{t('doctorMode.linking.title')}</DynamicText>
                <DynamicText type="card" style={styles.sectionDesc}>{t('doctorMode.linking.hubHint')}</DynamicText>
                <ActionBtn
                  label={t('doctorMode.linking.createPatientInvite')}
                  accent={accent}
                  onPress={handleCreateInvite}
                  disabled={busy}
                />
                <ActionBtn
                  label={t('doctorMode.linking.enterDoctorCode')}
                  accent={accent}
                  onPress={() => setView('enterCode')}
                />
                <ActionBtn
                  label={t('doctorMode.linking.manageLinks')}
                  accent={accent}
                  onPress={() => setView('links')}
                />
                {!!inviteCode && (
                  <DynamicText type="card" style={styles.codeBox}>{inviteCode}</DynamicText>
                )}
              </View>

              <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                <DynamicText type="card" style={styles.sectionTitle}>{t('doctorMode.messaging.writeTitle')}</DynamicText>
                <DynamicText type="card" style={styles.sectionDesc}>{t('doctorMode.messaging.writeHint')}</DynamicText>
                <DynamicText type="card" style={styles.sectionDesc}>{t('doctorMode.messaging.notForEmergencies')}</DynamicText>
                {patientLinks.filter((l) => l.status === 'active').map((link) => (
                  <ActionBtn
                    key={link.id}
                    label={`${t('doctorMode.messaging.writeTitle')}: ${link.doctorDisplayName || link.doctorId.slice(0, 8)}`}
                    accent={accent}
                    onPress={async () => {
                      setMessageLink(link);
                      setLastAutoNotice(null);
                      setMessageBody('');
                      setRequestType('general');
                      setHoursLines(
                        await service.getDoctorOfficeHoursDisplay(
                          link,
                          i18n.language?.startsWith('en') ? 'en' : 'es'
                        )
                      );
                      setView('message');
                    }}
                  />
                ))}
              </View>

              <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
                <DynamicText type="card" style={styles.sectionTitle}>{t('doctorMode.patientHub.audit')}</DynamicText>
                <DynamicText type="card" style={styles.sectionDesc}>{t('doctorMode.patientHub.auditHint')}</DynamicText>
                {auditPreview.length === 0 && (
                  <DynamicText type="card" style={styles.empty}>{t('doctorMode.patientHub.auditEmpty')}</DynamicText>
                )}
                {auditPreview.map((line, i) => (
                  <DynamicText key={i} type="card" style={styles.meta}>{line}</DynamicText>
                ))}
              </View>

              <DynamicText type="card" style={styles.footnote}>
                {t('doctorMode.patientHub.doctorAppNote')}
              </DynamicText>
            </>
          )}

          {view === 'message' && messageLink && (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
              <DynamicText type="card" style={styles.sectionTitle}>{t('doctorMode.messaging.writeTitle')}</DynamicText>
              <DynamicText type="card" style={styles.sectionDesc}>{t('doctorMode.messaging.notForEmergencies')}</DynamicText>
              <DynamicText type="card" style={styles.sectionTitle}>{t('doctorMode.messaging.seeHours')}</DynamicText>
              {hoursLines.map((line, i) => (
                <DynamicText key={i} type="card" style={styles.meta}>{line}</DynamicText>
              ))}
              <DynamicText type="card" style={styles.label}>{t('doctorMode.messaging.requestTypes.general')}</DynamicText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {PATIENT_REQUEST_TYPES.map((rt) => (
                  <TouchableOpacity
                    key={rt}
                    onPress={() => setRequestType(rt)}
                    style={[
                      styles.typeChip,
                      { borderColor: border },
                      requestType === rt && { backgroundColor: accent },
                    ]}
                  >
                    <DynamicText type="card" style={styles.meta}>
                      {t(`doctorMode.messaging.requestTypes.${rt}`)}
                    </DynamicText>
                  </TouchableOpacity>
                ))}
              </View>
              <DynamicText type="card" style={styles.label}>{t('doctorMode.messaging.body')}</DynamicText>
              <TextInput
                value={messageBody}
                onChangeText={setMessageBody}
                multiline
                style={[styles.input, { borderColor: border, minHeight: 80 }]}
                placeholderTextColor="#8a8070"
              />
              {!!lastAutoNotice && (
                <DynamicText type="card" style={styles.sectionDesc}>{lastAutoNotice}</DynamicText>
              )}
              <ActionBtn
                label={t('doctorMode.messaging.send')}
                accent={accent}
                disabled={busy}
                onPress={async () => {
                  setBusy(true);
                  try {
                    const msg = await service.sendStructuredRequest({
                      link: messageLink,
                      requestType,
                      body: messageBody,
                    });
                    if (msg.patientAutoNotice === 'messaging_paused') {
                      setLastAutoNotice(t('doctorMode.messaging.pausedNotice'));
                    } else if (msg.patientAutoNotice === 'queued_outside_office_hours') {
                      setLastAutoNotice(t('doctorMode.messaging.queuedNotice'));
                    } else {
                      setLastAutoNotice(null);
                    }
                    setMessageBody('');
                    Alert.alert(t('common.success'), t('doctorMode.messaging.sent'));
                  } catch (e: any) {
                    Alert.alert(t('common.error'), e?.message || t('doctorMode.messaging.sendFailed'));
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </View>
          )}

          {view === 'enterCode' && (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
              <DynamicText type="card" style={styles.sectionDesc}>
                {t('doctorMode.linking.enterDoctorHint')}
              </DynamicText>
              <DynamicText type="card" style={styles.label}>{t('doctorMode.linking.code')}</DynamicText>
              <TextInput
                value={enterCode}
                onChangeText={setEnterCode}
                autoCapitalize="characters"
                style={[styles.input, { borderColor: border }]}
                placeholderTextColor="#8a8070"
              />
              <ActionBtn
                label={t('doctorMode.linking.confirm')}
                accent={accent}
                onPress={handleRedeemDoctorInvite}
                disabled={busy}
              />
            </View>
          )}

          {view === 'links' && (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
              <DynamicText type="card" style={styles.sectionDesc}>
                {t('doctorMode.linking.consentHint')}
              </DynamicText>
              {patientLinks.filter((l) => l.status === 'active' || l.status === 'revoked').length === 0 && (
                <DynamicText type="card" style={styles.empty}>{t('doctorMode.linking.noLinks')}</DynamicText>
              )}
              {patientLinks.map((link) => (
                <View key={link.id} style={[styles.linkBlock, { borderColor: border }]}>
                  <DynamicText type="card" style={styles.meta}>
                    {t('doctorMode.linking.doctorLabel')}: {link.doctorDisplayName || link.doctorId.slice(0, 8)}
                  </DynamicText>
                  <DynamicText type="card" style={styles.meta}>
                    {t('doctorMode.linking.status')}: {t(`doctorMode.linking.statuses.${link.status}`)}
                  </DynamicText>
                  {CONSENT_CATEGORIES.map((cat) => (
                    <View key={cat} style={styles.switchRow}>
                      <DynamicText type="card" style={styles.switchLabel}>
                        {t(`doctorMode.consent.${cat}`)}
                      </DynamicText>
                      <Switch
                        value={!!link.consent?.[cat]}
                        onValueChange={(v) => handleConsentToggle(link, cat, v)}
                        disabled={link.status !== 'active'}
                        trackColor={{ true: accent }}
                      />
                    </View>
                  ))}
                  {link.status === 'active' && (
                    <ActionBtn label={t('doctorMode.linking.revoke')} accent="#c45c5c" onPress={() => handleRevoke(link)} />
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ActionBtn({
  label,
  accent,
  onPress,
  disabled,
}: {
  label: string;
  accent: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: accent, opacity: disabled ? 0.5 : 1 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <DynamicText type="card" style={styles.actionText}>{label}</DynamicText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080E1B' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: '700', flex: 1, paddingRight: 8 },
  close: { fontSize: 16, opacity: 0.85 },
  content: { flex: 1, padding: 16 },
  lead: { fontSize: 14, opacity: 0.85, marginBottom: 14, lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  sectionDesc: { fontSize: 13, opacity: 0.78, marginBottom: 10, lineHeight: 18 },
  meta: { fontSize: 13, opacity: 0.85, marginBottom: 4 },
  empty: { opacity: 0.7, marginVertical: 8 },
  footnote: { fontSize: 12, opacity: 0.7, lineHeight: 18, marginBottom: 24 },
  codeBox: { marginTop: 10, fontSize: 22, fontWeight: '700', letterSpacing: 2, textAlign: 'center' },
  actionBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  actionText: { color: '#17130B', fontWeight: '700', fontSize: 14 },
  label: { fontSize: 12, marginBottom: 4, opacity: 0.85 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    color: '#FFF5E4',
    fontSize: 15,
    marginBottom: 8,
  },
  linkBlock: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  switchLabel: { fontSize: 13, flex: 1, paddingRight: 8 },
  typeChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
});
