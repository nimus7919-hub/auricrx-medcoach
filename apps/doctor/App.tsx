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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import './src/i18n';
import { colors } from './src/theme/colors';
import DoctorAppService from './src/services/doctorAppService';
import RawChart from './src/components/RawChart';
import {
  isDoctorEntitled,
  type DoctorProfile,
  type PatientDoctorLink,
  type BitacoraEntry,
  type DoctorAlertLimit,
  type AlertReadingType,
  type AlertComparator,
  canDoctorReadCategory,
} from '@auricrx/doctor-core';

type Screen = 'auth' | 'home' | 'profile' | 'patients' | 'patient' | 'link';

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
  const [specialty, setSpecialty] = useState('');
  const [cedula, setCedula] = useState('');

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

  useEffect(() => {
    const unsub = service.watchAuth(async (user) => {
      setUserEmail(user?.email || null);
      if (!user) {
        setScreen('auth');
        setProfile(null);
        setReady(true);
        return;
      }
      const p = await service.getDoctorProfile().catch(() => null);
      setProfile(p);
      if (p) {
        setDisplayName(p.displayName);
        setSpecialty(p.specialty);
        setCedula(p.cedulaNumber);
      }
      setScreen('home');
      setReady(true);
    });
    return unsub;
  }, [service]);

  const refreshPatients = async () => {
    const list = await service.listPatients().catch(() => []);
    setPatients(list);
  };

  const handleSignIn = async () => {
    setBusy(true);
    try {
      await service.signIn(email, password);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || 'auth_failed');
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
    if (!displayName.trim() || !specialty.trim() || !cedula.trim()) {
      Alert.alert(t('common.error'), t('doctorMode.onboarding.required'));
      return;
    }
    setBusy(true);
    try {
      const p = await service.saveDoctorProfile({ displayName, specialty, cedulaNumber: cedula });
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
      const p = await service.submitCedulaVerification();
      setProfile(p);
      Alert.alert(t('doctorMode.verification.title'), t(`doctorMode.verification.status.${p.verificationStatus}`));
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

      {screen === 'home' && (
        <ScrollView style={styles.content}>
          {header(t('appName'), () => service.signOut())}
          <Text style={styles.lead}>{userEmail}</Text>
          {!isDoctorEntitled(profile) && (
            <Text style={styles.warn}>{t('doctorMode.gate.needVerifiedPlan')}</Text>
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
            <Text style={styles.meta}>
              {t('doctorMode.plan.label')}:{' '}
              {profile?.doctorPlan ? t('doctorMode.plan.active') : t('doctorMode.plan.inactive')}
            </Text>
            <GoldButton label={t('doctorMode.onboarding.edit')} onPress={() => setScreen('profile')} />
            <GoldButton label={t('doctorMode.verification.submit')} onPress={handleVerify} disabled={busy} />
            <GoldButton
              label={profile?.doctorPlan ? t('doctorMode.plan.mockDisable') : t('doctorMode.plan.mockEnable')}
              onPress={handlePlan}
              disabled={busy}
            />
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
          <GoldButton label={t('common.signOut')} onPress={() => service.signOut()} />
        </ScrollView>
      )}

      {screen === 'profile' && (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {header(t('doctorMode.onboarding.title'), () => setScreen('home'))}
          <Card>
            <Field label={t('doctorMode.onboarding.name')} value={displayName} onChangeText={setDisplayName} />
            <Field label={t('doctorMode.onboarding.specialty')} value={specialty} onChangeText={setSpecialty} />
            <Field label={t('doctorMode.onboarding.cedula')} value={cedula} onChangeText={setCedula} />
            <GoldButton label={t('doctorMode.onboarding.save')} onPress={handleSaveProfile} disabled={busy} />
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
            {busy && <ActivityIndicator color={colors.accent} />}
            <RawChart
              title={t('doctorMode.bitacora.systolic')}
              unit="mmHg"
              points={entries
                .filter((e) => e.type === 'blood_pressure' && e.systolic != null)
                .slice(0, 20)
                .reverse()
                .map((e) => ({ value: e.systolic as number }))}
            />
            <RawChart
              title={t('doctorMode.bitacora.glucose')}
              unit="mg/dL"
              points={entries
                .filter((e) => e.type === 'glucose' && e.glucoseMgDl != null)
                .slice(0, 20)
                .reverse()
                .map((e) => ({ value: e.glucoseMgDl as number }))}
            />
            <RawChart
              title={t('doctorMode.bitacora.weight')}
              unit="kg"
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
});
