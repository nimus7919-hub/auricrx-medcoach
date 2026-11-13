import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MultiFactorResolver } from 'firebase/auth';
import { colors } from '../../theme/colors';
import {
  hintsFromResolver,
  resolveTotpSignIn,
  TotpMultiFactorGenerator,
  PhoneMultiFactorGenerator,
} from '../../services/doctorMfaService';

type Props = {
  resolver: MultiFactorResolver;
  email: string;
  password: string;
  onSuccess: () => void;
  onUseRecovery: () => void;
  onError: (message: string) => void;
};

export default function MfaChallengeView({
  resolver,
  onSuccess,
  onUseRecovery,
  onError,
}: Props) {
  const { t } = useTranslation();
  const hints = useMemo(() => hintsFromResolver(resolver), [resolver]);
  const totpHint = hints.find((h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID);
  const phoneHint = hints.find((h) => h.factorId === PhoneMultiFactorGenerator.FACTOR_ID);
  const [selected, setSelected] = useState<'totp' | 'phone'>(totpHint ? 'totp' : phoneHint ? 'phone' : 'totp');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      if (selected === 'totp') {
        if (!totpHint) throw new Error('totp_not_enrolled');
        await resolveTotpSignIn(resolver, totpHint.uid, code);
        onSuccess();
        return;
      }
      // SMS challenge needs a Recaptcha ApplicationVerifier (web) or native phone MFA.
      onError(t('mfa.challenge.smsNativeHint'));
    } catch (e: any) {
      onError(e?.message || 'mfa_challenge_failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <Text style={styles.brand}>{t('appName')}</Text>
      <Text style={styles.title}>{t('mfa.challenge.title')}</Text>
      <Text style={styles.sub}>{t('mfa.challenge.subtitle')}</Text>

      <View style={styles.row}>
        {!!totpHint && (
          <Chip
            label={t('mfa.challenge.totp')}
            active={selected === 'totp'}
            onPress={() => setSelected('totp')}
          />
        )}
        {!!phoneHint && (
          <Chip
            label={t('mfa.challenge.sms')}
            active={selected === 'phone'}
            onPress={() => setSelected('phone')}
          />
        )}
      </View>

      {selected === 'totp' && (
        <>
          <Text style={styles.label}>{t('mfa.challenge.codeLabel')}</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoCapitalize="none"
            placeholderTextColor="#6B6358"
          />
          <Btn label={t('mfa.challenge.verify')} onPress={submit} disabled={busy || code.trim().length < 6} />
        </>
      )}

      {selected === 'phone' && (
        <View style={styles.card}>
          <Text style={styles.sub}>{t('mfa.challenge.smsNativeHint')}</Text>
          <Text style={styles.sub}>{t('mfa.challenge.smsPreferTotp')}</Text>
        </View>
      )}

      <Btn label={t('mfa.challenge.useRecovery')} onPress={onUseRecovery} disabled={busy} />
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.sub, fontWeight: '600' },
  chipTextActive: { color: colors.onAccent },
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
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
