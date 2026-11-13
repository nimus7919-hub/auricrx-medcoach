import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MultiFactorResolver } from 'firebase/auth';
import './src/i18n';
import { colors } from './src/theme/colors';
import DoctorAppService from './src/services/doctorAppService';
import RawChart from './src/components/RawChart';
import MfaEnrollView from './src/components/mfa/MfaEnrollView';
import MfaChallengeView from './src/components/mfa/MfaChallengeView';
import MfaRecoveryView from './src/components/mfa/MfaRecoveryView';
import MfaRecoveryCodesView from './src/components/mfa/MfaRecoveryCodesView';
import BiometricUnlockView from './src/components/mfa/BiometricUnlockView';
import {
  getEnrolledFactors,
  hasTotpEnrolled,
  isMfaRequiredError,
  resolverFromError,
} from './src/services/doctorMfaService';
import {
  canUseBiometricUnlock,
  clearUnlockSession,
  isSessionUnlocked,
  markSessionLocked,
  needsFullMfaAgain,
  recordFullMfaSignIn,
  tokenHasSecondFactor,
} from './src/services/doctorSessionUnlock';
import {
  isDoctorEntitled,
  type DoctorProfile,
  type PatientDoctorLink,
  type BitacoraEntry,
  type DoctorAlertLimit,
  type AlertReadingType,
  type AlertComparator,
  type MorningDigestItem,
  type PreVisitOnePager,
  type AppointmentRequest,
  type CalendarAgendaResult,
  canDoctorReadCategory,
  formatInTimeZone,
  DEFAULT_OFFICE_HOURS,
  formatDescriptiveAlertMessage,
  normalizeOfficeHours,
  hhMmFromMinutes,
  minutesFromHhMm,
  type DoctorPatientMessage,
  type DoctorQuickAction,
} from '@auricrx/doctor-core';

type Screen =
  | 'auth'
  | 'mfaEnroll'
  | 'mfaChallenge'
  | 'mfaRecovery'
  | 'mfaCodes'
  | 'biometric'
  | 'home'
  | 'profile'
  | 'patients'
  | 'patient'
  | 'link'
  | 'digest'
  | 'agenda'
  | 'officeHours'
  | 'preVisit'
  | 'appointment'
  | 'inbox'
  | 'adminReview';

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon→Sun for editor

function windowsToEditorText(hours: ReturnType<typeof normalizeOfficeHours>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of WEEKDAY_ORDER) {
    const wins = hours.windowsByDay[String(d)] || [];
    out[String(d)] = wins
      .map((w) => `${hhMmFromMinutes(w.startMinutes)}-${hhMmFromMinutes(w.endMinutes)}`)
      .join(', ');
  }
  return out;
}

function editorTextToWindows(dayTexts: Record<string, string>): Record<string, Array<{ startMinutes: number; endMinutes: number }>> {
  const windowsByDay: Record<string, Array<{ startMinutes: number; endMinutes: number }>> = {};
  for (const [day, text] of Object.entries(dayTexts)) {
    const parts = String(text || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const windows = [];
    for (const part of parts) {
      const [a, b] = part.split('-').map((s) => s.trim());
      const start = minutesFromHhMm(a || '');
      const end = minutesFromHhMm(b || '');
      if (start == null || end == null || end <= start) continue;
      windows.push({ startMinutes: start, endMinutes: end });
    }
    if (windows.length) windowsByDay[day] = windows;
  }
  return windowsByDay;
}

export default function App() {
  const { t, i18n } = useTranslation();
  const service = DoctorAppService.getInstance();

  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('auth');
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [legalFullName, setLegalFullName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [country, setCountry] = useState<'MX' | 'US'>('MX');
  const [cedula, setCedula] = useState('');
  const [specialtyCedula, setSpecialtyCedula] = useState('');
  const [npiNumber, setNpiNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseState, setLicenseState] = useState('');
  const [identityLaunchUrl, setIdentityLaunchUrl] = useState<string | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const [patients, setPatients] = useState<PatientDoctorLink[]>([]);
  const [selected, setSelected] = useState<PatientDoctorLink | null>(null);
  const [entries, setEntries] = useState<BitacoraEntry[]>([]);
  const [limits, setLimits] = useState<DoctorAlertLimit[]>([]);
  const [meds, setMeds] = useState<Array<{ name: string; strength?: string }>>([]);
  const [adherence, setAdherence] = useState<Array<{ name: string; adherenceRate?: number }>>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [patientCode, setPatientCode] = useState('');
  const [limitType, setLimitType] = useState<AlertReadingType>('systolic');
  const [limitCmp, setLimitCmp] = useState<AlertComparator>('gt');
  const [limitValue, setLimitValue] = useState('150');

  const [digest, setDigest] = useState<MorningDigestItem[]>([]);
  const [agenda, setAgenda] = useState<CalendarAgendaResult | null>(null);
  const [preVisit, setPreVisit] = useState<PreVisitOnePager | null>(null);
  const [apptDraft, setApptDraft] = useState<AppointmentRequest | null>(null);
  const [apptMessage, setApptMessage] = useState('');
  const [apptSlot1, setApptSlot1] = useState('');
  const [officeTz, setOfficeTz] = useState(DEFAULT_OFFICE_HOURS.timeZone);
  const [officePaused, setOfficePaused] = useState(false);
  const [officeDayTexts, setOfficeDayTexts] = useState<Record<string, string>>(() =>
    windowsToEditorText(DEFAULT_OFFICE_HOURS)
  );
  const [inbox, setInbox] = useState<DoctorPatientMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [authHint, setAuthHint] = useState<string | null>(null);

  useEffect(() => {
    void markSessionLocked();
  }, []);

  useEffect(() => {
    const unsub = service.watchAuth(async (user) => {
      setUserEmail(user?.email || null);
      if (!user) {
        setScreen('auth');
        setProfile(null);
        setMfaResolver(null);
        setReady(true);
        return;
      }

      // Mandatory TOTP enrollment before any patient data screens.
      const factors = getEnrolledFactors(user);
      if (!factors.length || !hasTotpEnrolled(user)) {
        setScreen('mfaEnroll');
        setReady(true);
        return;
      }

      const hasMfaClaim = await tokenHasSecondFactor();
      if (!hasMfaClaim) {
        // Enrolled but current token was not issued with a second factor.
        await clearUnlockSession();
        await service.signOut();
        setAuthHint(t('mfa.auth.needSecondFactor'));
        setScreen('auth');
        setReady(true);
        return;
      }

      if (await needsFullMfaAgain()) {
        await clearUnlockSession();
        await service.signOut();
        setAuthHint(t('mfa.auth.sessionExpired'));
        setScreen('auth');
        setReady(true);
        return;
      }

      if (!(await isSessionUnlocked()) && (await canUseBiometricUnlock())) {
        setScreen('biometric');
        setReady(true);
        return;
      }

      const p = await service.getDoctorProfile().catch(() => null);
      setProfile(p);
      try {
        const token = await user.getIdTokenResult();
        setIsAdminUser(token.claims?.admin === true);
      } catch {
        setIsAdminUser(false);
      }
      if (p) {
        setDisplayName(p.displayName);
        setLegalFullName(p.legalFullName || p.displayName || '');
        setSpecialty(p.specialty);
        setCountry(p.country === 'US' ? 'US' : 'MX');
        setCedula(p.cedulaNumber || '');
        setSpecialtyCedula(p.specialtyCedulaNumber || '');
        setNpiNumber(p.npiNumber || '');
        setLicenseNumber(p.licenseNumber || '');
        setLicenseState(p.licenseState || '');
        const normalized = normalizeOfficeHours(p.officeHours || undefined);
        setOfficeTz(normalized.timeZone || p.timeZone || DEFAULT_OFFICE_HOURS.timeZone);
        setOfficePaused(normalized.messagingPaused);
        setOfficeDayTexts(windowsToEditorText(normalized));
      }
      setScreen('home');
      setReady(true);
    });
    return unsub;
  }, [service, t]);

  const refreshPatients = async () => {
    const list = await service.listPatients().catch(() => []);
    setPatients(list);
  };

  const handleSignOut = async () => {
    await clearUnlockSession();
    await service.signOut();
    setAuthHint(null);
    setMfaResolver(null);
    setScreen('auth');
  };

  const handleSignIn = async () => {
    setBusy(true);
    setAuthHint(null);
    try {
      await service.signIn(email, password);
      // If MFA is not enrolled, watchAuth routes to enrollment.
      // If enrolled, Firebase throws multi-factor-auth-required (caught below).
      if (hasTotpEnrolled()) {
        await recordFullMfaSignIn();
      }
    } catch (e: any) {
      if (isMfaRequiredError(e)) {
        setMfaResolver(resolverFromError(e));
        setScreen('mfaChallenge');
      } else {
        Alert.alert(t('common.error'), e?.message || 'auth_failed');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    setBusy(true);
    try {
      await service.register(email, password);
      Alert.alert(t('common.success'), t('auth.registerOk'));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || 'register_failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveProfile = async () => {
    const legal = legalFullName.trim() || displayName.trim();
    if (!legal || !specialty.trim()) {
      Alert.alert(t('common.error'), t('doctorMode.onboarding.required'));
      return;
    }
    if (country === 'MX' && !cedula.trim()) {
      Alert.alert(t('common.error'), t('doctorMode.onboarding.required'));
      return;
    }
    if (country === 'US' && (!npiNumber.trim() || !licenseNumber.trim() || !licenseState.trim())) {
      Alert.alert(t('common.error'), t('doctorMode.onboarding.required'));
      return;
    }
    setBusy(true);
    try {
      const p = await service.saveDoctorProfile({
        displayName: displayName.trim() || legal,
        legalFullName: legal,
        specialty,
        country,
        cedulaNumber: cedula,
        specialtyCedulaNumber: specialtyCedula,
        npiNumber,
        licenseNumber,
        licenseState,
      });
      setProfile(p);
      Alert.alert(t('common.success'), t('doctorMode.onboarding.saved'));
      setScreen('home');
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || t('doctorMode.onboarding.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setBusy(true);
    try {
      const { profile: p, result } = await service.submitCedulaVerification();
      setProfile(p);
      const launch = result?.identity?.launchUrl || null;
      setIdentityLaunchUrl(launch);
      Alert.alert(
        t('doctorMode.verification.title'),
        t('doctorMode.verification.queued') +
          '\n' +
          t(`doctorMode.verification.status.${p.verificationStatus}`)
      );
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || t('doctorMode.verification.failed'));
    } finally {
      setBusy(false);
    }
  };

  const handlePlan = async () => {
    setBusy(true);
    try {
      const p = await service.setDoctorPlan(!profile?.doctorPlan, 'mock');
      setProfile(p);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || 'plan_failed');
    } finally {
      setBusy(false);
    }
  };

  const openPatient = async (link: PatientDoctorLink) => {
    if (!isDoctorEntitled(profile)) {
      Alert.alert(t('doctorMode.gate.title'), t('doctorMode.gate.needVerifiedPlan'));
      return;
    }
    setSelected(link);
    setScreen('patient');
    setBusy(true);
    try {
      const [e, l, m, a] = await Promise.all([
        service.listBitacoraForPatient(link),
        service.listAlertLimits(link.patientId),
        service.getSharedMedications(link),
        service.getSharedAdherence(link),
      ]);
      setEntries(e);
      setLimits(l);
      setMeds(m);
      setAdherence(a);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateInvite = async () => {
    setBusy(true);
    try {
      const invite = await service.createDoctorInvite();
      setInviteCode(invite.code);
      Alert.alert(t('doctorMode.linking.inviteCreated'), t('doctorMode.linking.inviteShare', { code: invite.code, minutes: 30 }));
    } catch (e: any) {
      const msg = e?.message === 'doctor_not_ready' ? t('doctorMode.gate.needVerifiedPlan') : e?.message;
      Alert.alert(t('common.error'), msg || t('doctorMode.linking.inviteFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleRedeemPatient = async () => {
    setBusy(true);
    try {
      await service.redeemPatientInvite(patientCode, displayName || profile?.displayName);
      setPatientCode('');
      await refreshPatients();
      Alert.alert(t('common.success'), t('doctorMode.linking.linked'));
      setScreen('patients');
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || t('doctorMode.linking.linkFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveLimit = async () => {
    if (!selected) return;
    const value = Number(limitValue);
    if (!value) {
      Alert.alert(t('common.error'), t('doctorMode.alerts.valueRequired'));
      return;
    }
    setBusy(true);
    try {
      await service.setAlertLimit({
        patientId: selected.patientId,
        readingType: limitType,
        comparator: limitCmp,
        value,
      });
      setLimits(await service.listAlertLimits(selected.patientId));
      Alert.alert(t('common.success'), t('doctorMode.alerts.saved'));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || t('doctorMode.alerts.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const openDigest = async () => {
    if (!isDoctorEntitled(profile)) {
      Alert.alert(t('doctorMode.gate.title'), t('doctorMode.gate.needVerifiedPlan'));
      return;
    }
    setBusy(true);
    setScreen('digest');
    try {
      setDigest(await service.buildExceptionDigest());
    } finally {
      setBusy(false);
    }
  };

  const openAgenda = () => {
    setAgenda(service.getTodayAgendaStub(profile?.timeZone || officeTz));
    setScreen('agenda');
  };

  const openPreVisit = async () => {
    if (!selected) return;
    setBusy(true);
    setScreen('preVisit');
    try {
      setPreVisit(await service.buildPreVisit(selected));
    } finally {
      setBusy(false);
    }
  };

  const openAppointment = () => {
    if (!selected) return;
    setApptDraft(null);
    setApptMessage('');
    setApptSlot1('');
    setScreen('appointment');
  };

  const handleSaveOfficeHours = async () => {
    setBusy(true);
    try {
      const p = await service.saveOfficeHours(
        {
          timeZone: officeTz,
          messagingPaused: officePaused,
          windowsByDay: editorTextToWindows(officeDayTexts),
        },
        officeTz
      );
      setProfile(p);
      Alert.alert(t('common.success'), t('doctorMode.officeHours.saved'));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || 'office_hours_failed');
    } finally {
      setBusy(false);
    }
  };

  const openInbox = async () => {
    if (!isDoctorEntitled(profile)) {
      Alert.alert(t('doctorMode.gate.title'), t('doctorMode.gate.needVerifiedPlan'));
      return;
    }
    setBusy(true);
    setScreen('inbox');
    try {
      setInbox(await service.listNeedsActionInbox());
    } finally {
      setBusy(false);
    }
  };

  const handleQuickReply = async (messageId: string, action: DoctorQuickAction) => {
    setBusy(true);
    try {
      await service.replyToMessage(
        messageId,
        action,
        action === 'text_reply' ? replyText : undefined,
        i18n.language?.startsWith('en') ? 'en' : 'es'
      );
      setReplyText('');
      setInbox(await service.listNeedsActionInbox());
      Alert.alert(t('common.success'), t('doctorMode.messaging.replied'));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || t('doctorMode.messaging.replyFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleExportMessages = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const exported = await service.exportMessageSummaryForPatient(
        selected.patientId,
        i18n.language?.startsWith('en') ? 'en' : 'es'
      );
      Alert.alert(t('doctorMode.messaging.exportTitle'), exported.lines.slice(0, 12).join('\n'));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || t('doctorMode.messaging.exportFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleAiWaitlist = async () => {
    setBusy(true);
    try {
      const p = await service.joinAiInsightsWaitlist();
      setProfile(p);
      Alert.alert(t('doctorMode.aiInsights.title'), t('doctorMode.aiInsights.waitlisted'));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || 'waitlist_failed');
    } finally {
      setBusy(false);
    }
  };

  const limitFor = (readingType: AlertReadingType) =>
    limits.find((l) => l.enabled && l.readingType === readingType)?.value;

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const header = (title: string, back?: () => void) => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity onPress={back || (() => setScreen('home'))}>
        <Text style={styles.headerAction}>{back ? t('common.back') : t('common.close')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      {screen === 'auth' && (
        <ScrollView contentContainerStyle={styles.authPad} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>{t('appName')}</Text>
          <Text style={styles.sub}>{t('auth.hint')}</Text>
          {!!authHint && <Text style={styles.warn}>{authHint}</Text>}
          <Text style={styles.sub}>{t('mfa.auth.requiredNotice')}</Text>
          <Field label={t('common.email')} value={email} onChangeText={setEmail} autoCapitalize="none" />
          <Field label={t('common.password')} value={password} onChangeText={setPassword} secureTextEntry />
          <GoldButton label={t('common.signIn')} onPress={handleSignIn} disabled={busy} />
          <GoldButton label={t('auth.register')} onPress={handleRegister} disabled={busy} />
          <Text style={styles.sub}>{t('auth.needAccount')}</Text>
          <View style={styles.langRow}>
            {['es', 'en', 'pt', 'fr', 'de', 'zh'].map((lng) => (
              <TouchableOpacity key={lng} onPress={() => i18n.changeLanguage(lng)} style={styles.langChip}>
                <Text style={styles.langText}>{lng.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {screen === 'mfaEnroll' && (
        <MfaEnrollView
          onEnrolled={(codes) => {
            setRecoveryCodes(codes);
            setScreen('mfaCodes');
          }}
          onError={(msg) => Alert.alert(t('common.error'), msg)}
        />
      )}

      {screen === 'mfaCodes' && (
        <MfaRecoveryCodesView
          codes={recoveryCodes}
          onContinue={async () => {
            setRecoveryCodes([]);
            await clearUnlockSession();
            await service.signOut();
            setAuthHint(t('mfa.auth.afterEnroll'));
            setScreen('auth');
          }}
        />
      )}

      {screen === 'mfaChallenge' && mfaResolver && (
        <MfaChallengeView
          resolver={mfaResolver}
          email={email}
          password={password}
          onSuccess={() => {
            setMfaResolver(null);
            // watchAuth will advance to home/biometric after MFA token is present
          }}
          onUseRecovery={() => setScreen('mfaRecovery')}
          onError={(msg) => Alert.alert(t('common.error'), msg)}
        />
      )}

      {screen === 'mfaRecovery' && (
        <MfaRecoveryView
          email={email}
          password={password}
          onRedeemed={async () => {
            setMfaResolver(null);
            await clearUnlockSession();
            setAuthHint(t('mfa.recovery.reenrollHint'));
            // MFA cleared server-side; sign in again then enroll
            try {
              await service.signIn(email, password);
            } catch (e: any) {
              Alert.alert(t('common.error'), e?.message || 'auth_failed');
              setScreen('auth');
            }
          }}
          onBack={() => setScreen(mfaResolver ? 'mfaChallenge' : 'auth')}
          onError={(msg) => Alert.alert(t('common.error'), msg)}
        />
      )}

      {screen === 'biometric' && (
        <BiometricUnlockView
          onUnlocked={async () => {
            const p = await service.getDoctorProfile().catch(() => null);
            setProfile(p);
            if (p) {
              setDisplayName(p.displayName);
              setLegalFullName(p.legalFullName || p.displayName || '');
              setSpecialty(p.specialty);
              setCountry(p.country === 'US' ? 'US' : 'MX');
              setCedula(p.cedulaNumber || '');
              setSpecialtyCedula(p.specialtyCedulaNumber || '');
              setNpiNumber(p.npiNumber || '');
              setLicenseNumber(p.licenseNumber || '');
              setLicenseState(p.licenseState || '');
            }
            setScreen('home');
          }}
          onUsePassword={async () => {
            await handleSignOut();
          }}
          onError={(msg) => Alert.alert(t('common.error'), msg)}
        />
      )}

      {screen === 'home' && (
        <ScrollView style={styles.content}>
          {header(t('appName'), () => handleSignOut())}
          <Text style={styles.lead}>{userEmail}</Text>
          {!isDoctorEntitled(profile) && (
            <Text style={styles.warn}>{t('doctorMode.gate.needVerifiedPlan')}</Text>
          )}
          {profile?.verificationStatus === 'expired' && (
            <Text style={styles.warn}>{t('doctorMode.verification.expiredHint')}</Text>
          )}
          <Card>
            <Text style={styles.cardTitle}>{t('doctorMode.onboarding.title')}</Text>
            <Text style={styles.meta}>
              {profile?.displayName || '—'} · {profile?.specialty || '—'}
            </Text>
            <Text style={styles.meta}>
              {t('doctorMode.verification.label')}:{' '}
              {t(`doctorMode.verification.status.${profile?.verificationStatus || 'unverified'}`)}
            </Text>
            {!!profile?.expiresAt && profile.verificationStatus === 'verified' && (
              <Text style={styles.meta}>
                {t('doctorMode.verification.expires', {
                  date: String(profile.expiresAt).slice(0, 10),
                })}
              </Text>
            )}
            {!!profile?.verificationMessage && (
              <Text style={styles.sub}>{profile.verificationMessage}</Text>
            )}
            <Text style={styles.meta}>
              {t('doctorMode.plan.label')}:{' '}
              {profile?.doctorPlan ? t('doctorMode.plan.active') : t('doctorMode.plan.inactive')}
            </Text>
            <Text style={styles.sub}>{t('doctorMode.verification.identityHint')}</Text>
            <GoldButton label={t('doctorMode.onboarding.edit')} onPress={() => setScreen('profile')} />
            <GoldButton label={t('doctorMode.verification.submit')} onPress={handleVerify} disabled={busy} />
            {!!identityLaunchUrl && (
              <GoldButton
                label={t('doctorMode.verification.startIdentity')}
                onPress={() => {
                  void Linking.openURL(identityLaunchUrl);
                }}
              />
            )}
            <GoldButton
              label={profile?.doctorPlan ? t('doctorMode.plan.mockDisable') : t('doctorMode.plan.mockEnable')}
              onPress={handlePlan}
              disabled={busy}
            />
            {isAdminUser && (
              <GoldButton label="Admin review" onPress={() => setScreen('adminReview')} />
            )}
          </Card>
          <Card>
            <Text style={styles.cardTitle}>{t('nav.patients')}</Text>
            <GoldButton
              label={t('doctorMode.doctor.patients')}
              onPress={async () => {
                await refreshPatients();
                setScreen('patients');
              }}
            />
            <GoldButton label={t('doctorMode.linking.createDoctorInvite')} onPress={handleCreateInvite} disabled={busy} />
            {!!inviteCode && <Text style={styles.code}>{inviteCode}</Text>}
            <GoldButton label={t('doctorMode.linking.enterPatientCode')} onPress={() => setScreen('link')} />
          </Card>
          <Card>
            <Text style={styles.cardTitle}>{t('doctorMode.digest.title')}</Text>
            <Text style={styles.sub}>{t('doctorMode.digest.subtitle')}</Text>
            <GoldButton label={t('doctorMode.digest.open')} onPress={openDigest} disabled={busy} />
            <GoldButton label={t('doctorMode.messaging.needsAction')} onPress={openInbox} disabled={busy} />
            <GoldButton label={t('doctorMode.calendar.open')} onPress={openAgenda} />
            <GoldButton
              label={t('doctorMode.officeHours.title')}
              onPress={() => setScreen('officeHours')}
            />
          </Card>
          <Card>
            <Text style={styles.cardTitle}>{t('doctorMode.aiInsights.title')}</Text>
            <Text style={styles.meta}>{t('doctorMode.aiInsights.comingSoon')}</Text>
            <Text style={styles.sub}>{t('doctorMode.aiInsights.body')}</Text>
            <GoldButton
              label={
                profile?.aiInsightsWaitlisted
                  ? t('doctorMode.aiInsights.waitlisted')
                  : t('doctorMode.aiInsights.waitlist')
              }
              onPress={handleAiWaitlist}
              disabled={busy || !!profile?.aiInsightsWaitlisted}
            />
          </Card>
          <Text style={styles.disclaimer}>{t('doctorMode.compliance.disclaimer')}</Text>
          <GoldButton label={t('common.signOut')} onPress={handleSignOut} />
          <Text style={styles.sub}>{t('mfa.home.protected')}</Text>
          <Text style={styles.meta}>{t('mfa.home.smsBackupHint')}</Text>
        </ScrollView>
      )}

      {screen === 'profile' && (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {header(t('doctorMode.onboarding.title'), () => setScreen('home'))}
          <Card>
            <Text style={styles.sub}>{t('doctorMode.onboarding.hint')}</Text>
            <Field label={t('doctorMode.onboarding.name')} value={displayName} onChangeText={setDisplayName} />
            <Field
              label={t('doctorMode.onboarding.legalName')}
              value={legalFullName}
              onChangeText={setLegalFullName}
            />
            <Field label={t('doctorMode.onboarding.specialty')} value={specialty} onChangeText={setSpecialty} />
            <Text style={styles.meta}>{t('doctorMode.onboarding.country')}</Text>
            <View style={styles.countryRow}>
              <TouchableOpacity
                style={[styles.countryChip, country === 'MX' && styles.countryChipOn]}
                onPress={() => setCountry('MX')}
              >
                <Text style={styles.countryChipText}>{t('doctorMode.onboarding.countryMx')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.countryChip, country === 'US' && styles.countryChipOn]}
                onPress={() => setCountry('US')}
              >
                <Text style={styles.countryChipText}>{t('doctorMode.onboarding.countryUs')}</Text>
              </TouchableOpacity>
            </View>
            {country === 'MX' ? (
              <>
                <Field label={t('doctorMode.onboarding.cedula')} value={cedula} onChangeText={setCedula} />
                <Field
                  label={t('doctorMode.onboarding.specialtyCedula')}
                  value={specialtyCedula}
                  onChangeText={setSpecialtyCedula}
                />
              </>
            ) : (
              <>
                <Field label={t('doctorMode.onboarding.npi')} value={npiNumber} onChangeText={setNpiNumber} />
                <Field
                  label={t('doctorMode.onboarding.licenseNumber')}
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                />
                <Field
                  label={t('doctorMode.onboarding.licenseState')}
                  value={licenseState}
                  onChangeText={setLicenseState}
                  autoCapitalize="characters"
                />
              </>
            )}
            <GoldButton label={t('doctorMode.onboarding.save')} onPress={handleSaveProfile} disabled={busy} />
          </Card>
        </ScrollView>
      )}

      {screen === 'adminReview' && (
        <ScrollView style={styles.content}>
          {header('Admin review', () => setScreen('home'))}
          <Card>
            <Text style={styles.cardTitle}>AuricRX Médicos</Text>
            <Text style={styles.sub}>
              Open the web review queue on the API host (requires admin claim + MFA token):
            </Text>
            <Text style={styles.code}>/doctor-admin</Text>
            <Text style={styles.sub}>
              Approve / reject / suspend / revoke with a reason. Evidence (registry + identity) is never
              readable by patients or other doctors.
            </Text>
            <GoldButton
              label="Open doctor-admin"
              onPress={() => {
                const base = (require('./src/config/api') as { API_BASE: string }).API_BASE;
                void Linking.openURL(`${base.replace(/\/$/, '')}/doctor-admin`);
              }}
            />
          </Card>
        </ScrollView>
      )}

      {screen === 'link' && (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {header(t('doctorMode.linking.enterCode'), () => setScreen('home'))}
          <Card>
            <Text style={styles.sub}>{t('doctorMode.linking.enterPatientHint')}</Text>
            <Field label={t('doctorMode.linking.code')} value={patientCode} onChangeText={setPatientCode} autoCapitalize="characters" />
            <GoldButton label={t('doctorMode.linking.confirm')} onPress={handleRedeemPatient} disabled={busy} />
          </Card>
        </ScrollView>
      )}

      {screen === 'patients' && (
        <ScrollView style={styles.content}>
          {header(t('doctorMode.doctor.patients'), () => setScreen('home'))}
          {!isDoctorEntitled(profile) && <Text style={styles.warn}>{t('doctorMode.gate.needVerifiedPlan')}</Text>}
          {patients.length === 0 && <Text style={styles.sub}>{t('doctorMode.doctor.noPatients')}</Text>}
          {patients.map((p) => (
            <TouchableOpacity key={p.id} style={styles.patientRow} onPress={() => openPatient(p)}>
              <Text style={styles.patientName}>{p.patientDisplayName || p.patientId.slice(0, 10)}</Text>
              <Text style={styles.sub}>{t('doctorMode.doctor.tapToOpen')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {screen === 'patient' && selected && (
        <ScrollView style={styles.content}>
          {header(t('doctorMode.doctor.patientDetail'), () => setScreen('patients'))}
          <Card>
            <Text style={styles.cardTitle}>{selected.patientDisplayName || selected.patientId.slice(0, 10)}</Text>
            <Text style={styles.sub}>{t('doctorMode.doctor.rawOnly')}</Text>
            <Text style={styles.disclaimer}>{t('doctorMode.compliance.disclaimerShort')}</Text>
            <GoldButton label={t('doctorMode.preVisit.generate')} onPress={openPreVisit} disabled={busy} />
            <GoldButton label={t('doctorMode.appointmentRequest.title')} onPress={openAppointment} />
            <GoldButton label={t('doctorMode.messaging.exportTitle')} onPress={handleExportMessages} disabled={busy} />
            {busy && <ActivityIndicator color={colors.accent} />}
            <RawChart
              title={t('doctorMode.bitacora.systolic')}
              unit="mmHg"
              doctorLimit={limitFor('systolic')}
              limitLabel={
                limitFor('systolic') != null
                  ? `${t('doctorMode.alerts.types.systolic')}: ${limitFor('systolic')}`
                  : undefined
              }
              points={entries
                .filter((e) => e.type === 'blood_pressure' && e.systolic != null)
                .slice(0, 20)
                .reverse()
                .map((e) => ({ value: e.systolic as number }))}
            />
            <RawChart
              title={t('doctorMode.bitacora.glucose')}
              unit="mg/dL"
              doctorLimit={limitFor('glucose')}
              limitLabel={
                limitFor('glucose') != null
                  ? `${t('doctorMode.alerts.types.glucose')}: ${limitFor('glucose')}`
                  : undefined
              }
              points={entries
                .filter((e) => e.type === 'glucose' && e.glucoseMgDl != null)
                .slice(0, 20)
                .reverse()
                .map((e) => ({ value: e.glucoseMgDl as number }))}
            />
            <RawChart
              title={t('doctorMode.bitacora.weight')}
              unit="kg"
              doctorLimit={limitFor('weight')}
              limitLabel={
                limitFor('weight') != null
                  ? `${t('doctorMode.alerts.types.weight')}: ${limitFor('weight')}`
                  : undefined
              }
              points={entries
                .filter((e) => e.type === 'weight' && e.weightKg != null)
                .slice(0, 20)
                .reverse()
                .map((e) => ({ value: e.weightKg as number }))}
            />
            {entries.map((e) => (
              <View key={e.id} style={styles.entryRow}>
                <Text style={styles.meta}>
                  {t(`doctorMode.bitacora.types.${e.type}`)} · {new Date(e.timestamp).toLocaleString()}
                </Text>
                <Text style={styles.text}>
                  {e.type === 'blood_pressure'
                    ? `${e.systolic}/${e.diastolic}${e.pulse ? ` · ${e.pulse}` : ''}`
                    : e.type === 'glucose'
                      ? `${e.glucoseMgDl} mg/dL`
                      : e.type === 'weight'
                        ? `${e.weightKg} kg`
                        : e.symptomsText}
                </Text>
                {e.type === 'blood_pressure' &&
                  e.systolic != null &&
                  limits
                    .filter((l) => l.enabled && l.readingType === 'systolic')
                    .map((l) => {
                      const crossed =
                        (l.comparator === 'gt' && e.systolic! > l.value) ||
                        (l.comparator === 'gte' && e.systolic! >= l.value) ||
                        (l.comparator === 'lt' && e.systolic! < l.value) ||
                        (l.comparator === 'lte' && e.systolic! <= l.value);
                      if (!crossed) return null;
                      return (
                        <Text key={l.id} style={styles.meta}>
                          {formatDescriptiveAlertMessage({
                            readingType: 'systolic',
                            observedValue: e.systolic!,
                            observedSecondary: e.diastolic,
                            limit: l,
                            locale: i18n.language?.startsWith('en') ? 'en' : 'es',
                          })}
                        </Text>
                      );
                    })}
              </View>
            ))}
          </Card>

          {canDoctorReadCategory(profile, selected, 'medicationList') && (
            <Card>
              <Text style={styles.cardTitle}>{t('doctorMode.consent.medicationList')}</Text>
              <Text style={styles.sub}>{t('doctorMode.doctor.medsSharedHint')}</Text>
              {meds.length === 0 && <Text style={styles.meta}>—</Text>}
              {meds.map((m, i) => (
                <Text key={i} style={styles.text}>
                  {m.name}
                  {m.strength ? ` · ${m.strength}` : ''}
                </Text>
              ))}
            </Card>
          )}

          {canDoctorReadCategory(profile, selected, 'reminderAdherence') && (
            <Card>
              <Text style={styles.cardTitle}>{t('doctorMode.consent.reminderAdherence')}</Text>
              <Text style={styles.sub}>{t('doctorMode.doctor.adherenceSharedHint')}</Text>
              {adherence.length === 0 && <Text style={styles.meta}>—</Text>}
              {adherence.map((a, i) => (
                <Text key={i} style={styles.text}>
                  {a.name}
                  {typeof a.adherenceRate === 'number' ? ` · ${a.adherenceRate}%` : ''}
                </Text>
              ))}
            </Card>
          )}

          <Card>
            <Text style={styles.cardTitle}>{t('doctorMode.alerts.title')}</Text>
            <Text style={styles.sub}>{t('doctorMode.alerts.hint')}</Text>
            <ChipRow
              options={(['systolic', 'diastolic', 'pulse', 'glucose', 'weight'] as AlertReadingType[]).map((rt) => ({
                key: rt,
                label: t(`doctorMode.alerts.types.${rt}`),
              }))}
              value={limitType}
              onChange={setLimitType}
            />
            <ChipRow
              options={(['gt', 'gte', 'lt', 'lte'] as AlertComparator[]).map((c) => ({
                key: c,
                label: t(`doctorMode.alerts.comparators.${c}`),
              }))}
              value={limitCmp}
              onChange={setLimitCmp}
            />
            <Field label={t('doctorMode.alerts.value')} value={limitValue} onChangeText={setLimitValue} keyboardType="numeric" />
            <GoldButton label={t('doctorMode.alerts.save')} onPress={handleSaveLimit} disabled={busy} />
            {limits.filter((l) => l.enabled).map((l) => (
              <Text key={l.id} style={styles.meta}>
                {t(`doctorMode.alerts.types.${l.readingType}`)} {t(`doctorMode.alerts.comparators.${l.comparator}`)}{' '}
                {l.value}
              </Text>
            ))}
          </Card>
        </ScrollView>
      )}

      {screen === 'digest' && (
        <ScrollView style={styles.content}>
          {header(t('doctorMode.digest.title'), () => setScreen('home'))}
          <Text style={styles.sub}>{t('doctorMode.digest.subtitle')}</Text>
          <Text style={styles.disclaimer}>{t('doctorMode.compliance.disclaimerShort')}</Text>
          {busy && <ActivityIndicator color={colors.accent} />}
          {!busy && digest.length === 0 && <Text style={styles.sub}>{t('doctorMode.digest.empty')}</Text>}
          {digest.map((item) => (
            <TouchableOpacity
              key={item.patientId}
              style={styles.patientRow}
              onPress={() => {
                const link = patients.find((p) => p.patientId === item.patientId);
                if (link) void openPatient(link);
              }}
            >
              <Text style={styles.patientName}>{item.patientLabel || item.patientId.slice(0, 10)}</Text>
              <Text style={styles.meta}>{new Date(item.latestAt).toLocaleString()}</Text>
              {item.kinds.map((k) => (
                <Text key={k} style={styles.text}>
                  {t(`doctorMode.digest.kinds.${k}`)}
                </Text>
              ))}
              {item.events.slice(0, 3).map((ev, idx) => (
                <Text key={`${ev.at}-${idx}`} style={styles.meta}>
                  {ev.detail || t(`doctorMode.digest.kinds.${ev.kind}`)}
                </Text>
              ))}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {screen === 'agenda' && (
        <ScrollView style={styles.content}>
          {header(t('doctorMode.calendar.title'), () => setScreen('home'))}
          <Text style={styles.sub}>{t('doctorMode.calendar.subtitle')}</Text>
          {agenda?.warning === 'oauth_stub' && (
            <Text style={styles.warn}>{t('doctorMode.calendar.stubHint')}</Text>
          )}
          {agenda?.warning === 'stale_sync' && (
            <Text style={styles.warn}>{t('doctorMode.calendar.stale')}</Text>
          )}
          {agenda?.warning === 'unavailable' && (
            <Text style={styles.warn}>{t('doctorMode.calendar.unavailable')}</Text>
          )}
          {agenda?.lastSyncedAt && (
            <Text style={styles.meta}>
              {t('doctorMode.calendar.lastSync')}:{' '}
              {formatInTimeZone(agenda.lastSyncedAt, agenda.timeZone, i18n.language?.startsWith('en') ? 'en-US' : 'es-MX')}
            </Text>
          )}
          {agenda?.ok && agenda.appointments.length === 0 && (
            <Text style={styles.sub}>{t('doctorMode.calendar.empty')}</Text>
          )}
          {agenda?.ok &&
            agenda.appointments.map((a) => (
              <View key={a.id} style={styles.patientRow}>
                <Text style={styles.patientName}>{a.title}</Text>
                <Text style={styles.meta}>
                  {formatInTimeZone(a.startIso, agenda.timeZone, i18n.language?.startsWith('en') ? 'en-US' : 'es-MX')}
                  {' — '}
                  {formatInTimeZone(a.endIso, agenda.timeZone, i18n.language?.startsWith('en') ? 'en-US' : 'es-MX')}
                </Text>
              </View>
            ))}
          {!!agenda?.overlaps?.length && (
            <Text style={styles.warn}>{t('doctorMode.calendar.overlap')}</Text>
          )}
        </ScrollView>
      )}

      {screen === 'officeHours' && (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {header(t('doctorMode.officeHours.title'), () => setScreen('home'))}
          <Card>
            <Text style={styles.sub}>{t('doctorMode.officeHours.subtitle')}</Text>
            <Text style={styles.disclaimer}>{t('doctorMode.compliance.notForEmergencies')}</Text>
            <Field label={t('doctorMode.officeHours.timezone')} value={officeTz} onChangeText={setOfficeTz} autoCapitalize="none" />
            <GoldButton
              label={
                officePaused
                  ? t('doctorMode.officeHours.resumeMessaging')
                  : t('doctorMode.officeHours.pauseMessaging')
              }
              onPress={() => setOfficePaused((v) => !v)}
            />
            {officePaused && <Text style={styles.warn}>{t('doctorMode.officeHours.pausedHint')}</Text>}
            <Text style={styles.meta}>{t('doctorMode.officeHours.windowsHint')}</Text>
            {WEEKDAY_ORDER.map((d) => (
              <Field
                key={d}
                label={t(`doctorMode.officeHours.weekdays.${d}`)}
                value={officeDayTexts[String(d)] || ''}
                onChangeText={(v) => setOfficeDayTexts((prev) => ({ ...prev, [String(d)]: v }))}
                autoCapitalize="none"
              />
            ))}
            <GoldButton label={t('common.save')} onPress={handleSaveOfficeHours} disabled={busy} />
          </Card>
        </ScrollView>
      )}

      {screen === 'inbox' && (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {header(t('doctorMode.messaging.needsAction'), () => setScreen('home'))}
          <Text style={styles.sub}>{t('doctorMode.messaging.needsActionHint')}</Text>
          <Text style={styles.disclaimer}>{t('doctorMode.compliance.notForEmergencies')}</Text>
          {profile?.officeHours?.messagingPaused && (
            <Text style={styles.warn}>{t('doctorMode.officeHours.pausedHint')}</Text>
          )}
          <Field label={t('doctorMode.messaging.optionalReply')} value={replyText} onChangeText={setReplyText} />
          {busy && <ActivityIndicator color={colors.accent} />}
          {!busy && inbox.length === 0 && <Text style={styles.sub}>{t('doctorMode.messaging.emptyInbox')}</Text>}
          {inbox.map((m) => (
            <View key={m.id} style={styles.patientRow}>
              <Text style={styles.patientName}>
                {t(`doctorMode.messaging.requestTypes.${m.requestType || 'general'}`)}
              </Text>
              <Text style={styles.meta}>{m.patientId.slice(0, 10)} · {new Date(m.createdAt).toLocaleString()}</Text>
              <Text style={styles.text}>{m.body}</Text>
              <GoldButton
                label={t('doctorMode.messaging.actions.approve_refill')}
                onPress={() => handleQuickReply(m.id, 'approve_refill')}
                disabled={busy}
              />
              <GoldButton
                label={t('doctorMode.messaging.actions.book_visit')}
                onPress={() => handleQuickReply(m.id, 'book_visit')}
                disabled={busy}
              />
              <GoldButton
                label={t('doctorMode.messaging.actions.seen')}
                onPress={() => handleQuickReply(m.id, 'seen')}
                disabled={busy}
              />
              <GoldButton
                label={t('doctorMode.messaging.actions.text_reply')}
                onPress={() => handleQuickReply(m.id, 'text_reply')}
                disabled={busy || !replyText.trim()}
              />
            </View>
          ))}
        </ScrollView>
      )}

      {screen === 'preVisit' && (
        <ScrollView style={styles.content}>
          {header(t('doctorMode.preVisit.title'), () => setScreen('patient'))}
          <Text style={styles.sub}>{t('doctorMode.preVisit.subtitle')}</Text>
          <Text style={styles.disclaimer}>{t('doctorMode.compliance.disclaimerShort')}</Text>
          {busy && <ActivityIndicator color={colors.accent} />}
          {preVisit && (
            <Card>
              <Text style={styles.cardTitle}>{preVisit.patientLabel}</Text>
              <Text style={styles.meta}>{preVisit.generatedAt}</Text>
              <Text style={styles.cardTitle}>{t('doctorMode.preVisit.readings')}</Text>
              {preVisit.readings.map((r) => (
                <Text key={r.type} style={styles.text}>
                  {t(`doctorMode.bitacora.types.${r.type}`)}: {r.count}
                  {r.lastDisplay ? ` · ${r.lastDisplay}` : ''}
                  {r.lastAt ? ` · ${new Date(r.lastAt).toLocaleString()}` : ''}
                </Text>
              ))}
              <Text style={styles.cardTitle}>{t('doctorMode.preVisit.doseLogs')}</Text>
              {preVisit.doseLogs.length === 0 && <Text style={styles.meta}>—</Text>}
              {preVisit.doseLogs.map((d, i) => (
                <Text key={i} style={styles.text}>
                  {d.name}: {t('doctorMode.preVisit.ofLogged', { logged: d.logged, expected: d.expected })}
                </Text>
              ))}
              <Text style={styles.cardTitle}>{t('doctorMode.preVisit.symptoms')}</Text>
              {preVisit.symptomTexts.length === 0 && <Text style={styles.meta}>—</Text>}
              {preVisit.symptomTexts.map((s, i) => (
                <Text key={i} style={styles.text}>
                  {s}
                </Text>
              ))}
              <Text style={styles.cardTitle}>{t('doctorMode.preVisit.questions')}</Text>
              {preVisit.patientQuestions.length === 0 && <Text style={styles.meta}>—</Text>}
              <Text style={styles.cardTitle}>{t('doctorMode.preVisit.documents')}</Text>
              {preVisit.documents.length === 0 && <Text style={styles.meta}>—</Text>}
            </Card>
          )}
        </ScrollView>
      )}

      {screen === 'appointment' && selected && (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {header(t('doctorMode.appointmentRequest.title'), () => setScreen('patient'))}
          <Card>
            <Text style={styles.sub}>{t('doctorMode.appointmentRequest.subtitle')}</Text>
            <Field
              label={t('doctorMode.appointmentRequest.message')}
              value={apptMessage}
              onChangeText={setApptMessage}
            />
            <Field
              label={t('doctorMode.appointmentRequest.proposedTimes')}
              value={apptSlot1}
              onChangeText={setApptSlot1}
              autoCapitalize="none"
            />
            <GoldButton
              label={t('doctorMode.appointmentRequest.draft')}
              disabled={busy}
              onPress={async () => {
                setBusy(true);
                try {
                  const draft = await service.saveAppointmentRequestDraft({
                    patientId: selected.patientId,
                    message: apptMessage || undefined,
                    proposedSlotsIso: apptSlot1 ? [apptSlot1] : [],
                    locale: i18n.language?.startsWith('en') ? 'en' : 'es',
                  });
                  setApptDraft(draft);
                  setApptMessage(draft.message);
                } catch (e: any) {
                  Alert.alert(t('common.error'), e?.message || 'draft_failed');
                } finally {
                  setBusy(false);
                }
              }}
            />
            <GoldButton
              label={t('doctorMode.appointmentRequest.review')}
              disabled={busy || !apptDraft}
              onPress={async () => {
                if (!apptDraft) return;
                setBusy(true);
                try {
                  setApptDraft(await service.reviewAppointmentRequest(apptDraft.id));
                } catch (e: any) {
                  Alert.alert(t('common.error'), e?.message || t('doctorMode.appointmentRequest.needsReview'));
                } finally {
                  setBusy(false);
                }
              }}
            />
            <GoldButton
              label={t('doctorMode.appointmentRequest.send')}
              disabled={busy || !apptDraft || apptDraft.status !== 'pending_doctor_review'}
              onPress={async () => {
                if (!apptDraft) return;
                setBusy(true);
                try {
                  const sent = await service.sendAppointmentRequest(apptDraft.id);
                  setApptDraft(sent);
                  Alert.alert(t('common.success'), t('doctorMode.appointmentRequest.sent'));
                } catch (e: any) {
                  Alert.alert(t('common.error'), e?.message || t('doctorMode.appointmentRequest.needsReview'));
                } finally {
                  setBusy(false);
                }
              }}
            />
            {apptDraft && (
              <Text style={styles.meta}>
                {apptDraft.status} · {apptDraft.id}
              </Text>
            )}
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function GoldButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity style={[styles.btn, disabled && { opacity: 0.5 }]} onPress={onPress} disabled={disabled}>
      <Text style={styles.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'characters' | 'sentences';
  keyboardType?: 'numeric' | 'default';
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        secureTextEntry={props.secureTextEntry}
        autoCapitalize={props.autoCapitalize || 'sentences'}
        keyboardType={props.keyboardType || 'default'}
        style={styles.input}
        placeholderTextColor="#8a8070"
      />
    </View>
  );
}

function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.key}
          onPress={() => onChange(o.key)}
          style={[styles.chip, value === o.key && styles.chipOn]}
        >
          <Text style={[styles.chipText, value === o.key && { color: colors.onAccent }]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  authPad: { padding: 24, paddingTop: 64 },
  brand: { color: colors.accent, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  content: { flex: 1, padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '700', flex: 1, paddingRight: 8 },
  headerAction: { color: colors.sub, fontSize: 15 },
  lead: { color: colors.sub, marginBottom: 10 },
  warn: { color: colors.accent, marginBottom: 10, lineHeight: 18 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  meta: { color: colors.sub, fontSize: 13, marginBottom: 4 },
  text: { color: colors.text, fontSize: 14, marginBottom: 4 },
  sub: { color: colors.sub, fontSize: 13, marginBottom: 10, lineHeight: 18 },
  label: { color: colors.sub, fontSize: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: colors.onAccent, fontWeight: '700', fontSize: 14 },
  code: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: 2, textAlign: 'center', marginTop: 10 },
  patientRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.card,
  },
  patientName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  entryRow: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingVertical: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  chipOn: { backgroundColor: colors.accent },
  chipText: { color: colors.text, fontSize: 12 },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  langChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  langText: { color: colors.sub, fontSize: 11 },
  countryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  countryChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  countryChipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  countryChipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  disclaimer: { color: colors.sub, fontSize: 12, lineHeight: 17, marginBottom: 12, fontStyle: 'italic' },
});
