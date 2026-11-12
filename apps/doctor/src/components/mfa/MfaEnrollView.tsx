import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../../theme/colors';
import {
  ensureEmailVerified,
  startTotpEnrollment,
  finishTotpEnrollment,
  generateRecoveryCodes,
  type TotpEnrollmentSession,
} from '../../services/doctorMfaService';

type Props = {
  onEnrolled: (recoveryCodes: string[]) => void;
  onError: (message: string) => void;
};

export default function MfaEnrollView({ onEnrolled, onError }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<'verify_email' | 'totp'>('verify_email');
  const [session, setSession] = useState<TotpEnrollmentSession | null>(null);
  const [code, setCode] = useState('');

  const bootstrap = async () => {
    setBusy(true);
    try {
      const email = await ensureEmailVerified();
      if (!email.verified) {
        setPhase('verify_email');
        return;
      }
      const totp = await startTotpEnrollment(t('appName'));
      setSession(totp);
      setPhase('totp');
    } catch (e: any) {
      onError(e?.message || 'mfa_enroll_failed');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmCode = async () => {
    if (!session || code.trim().length < 6) return;
    setBusy(true);
    try {
      await finishTotpEnrollment(session.secret, code);
      const codes = await generateRecoveryCodes();
      onEnrolled(codes);
    } catch (e: any) {
      onError(e?.message || 'mfa_enroll_failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <Text style={styles.brand}>{t('appName')}</Text>
      <Text style={styles.title}>{t('mfa.enroll.title')}</Text>
      <Text style={styles.sub}>{t('mfa.enroll.subtitle')}</Text>

      {busy && !session && phase !== 'verify_email' ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : null}

      {phase === 'verify_email' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('mfa.enroll.verifyEmailTitle')}</Text>
          <Text style={styles.sub}>{t('mfa.enroll.verifyEmailBody')}</Text>
          <Btn label={t('mfa.enroll.resendEmail')} onPress={bootstrap} disabled={busy} />
          <Btn label={t('mfa.enroll.iVerified')} onPress={bootstrap} disabled={busy} />
        </View>
      )}

      {phase === 'totp' && session && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('mfa.enroll.scanTitle')}</Text>
          <Text style={styles.sub}>{t('mfa.enroll.scanBody')}</Text>
          <View style={styles.qrWrap}>
            <QRCode value={session.qrCodeUrl} size={180} backgroundColor="#FFF5E4" color="#080E1B" />
          </View>
          <Text style={styles.sub}>{t('mfa.enroll.manualKey')}</Text>
          <Text style={styles.secret} selectable>
            {session.secretKey}
          </Text>
          <Text style={styles.label}>{t('mfa.enroll.codeLabel')}</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoCapitalize="none"
            placeholderTextColor="#6B6358"
          />
          <Btn label={t('mfa.enroll.confirm')} onPress={confirmCode} disabled={busy || code.trim().length < 6} />
        </View>
      )}
    </ScrollView>
  );
}

function Btn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity style={[styles.btn, disabled && styles.btnDisabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 24, paddingBottom: 48 },
  brand: { color: colors.accent, fontSize: 28, fontWeight: '700', marginBottom: 8 },
  title: { color: colors.text, fontSize: 22, fontWeight: '600', marginBottom: 8 },
  sub: { color: colors.sub, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8 },
  qrWrap: {
    alignSelf: 'center',
    padding: 12,
    backgroundColor: '#FFF5E4',
    borderRadius: 8,
    marginVertical: 16,
  },
  secret: {
    color: colors.accent,
    fontSize: 15,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginBottom: 16,
  },
  label: { color: colors.sub, marginBottom: 6, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#0C1424',
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  btn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: colors.onAccent, fontWeight: '700', fontSize: 15 },
});
