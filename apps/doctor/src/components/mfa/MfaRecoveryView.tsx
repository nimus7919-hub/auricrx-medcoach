import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme/colors';
import { redeemRecoveryCode } from '../../services/doctorMfaService';

type Props = {
  email: string;
  password: string;
  onRedeemed: () => void;
  onBack: () => void;
  onError: (message: string) => void;
};

export default function MfaRecoveryView({ email, password, onRedeemed, onBack, onError }: Props) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await redeemRecoveryCode(email, password, code);
      onRedeemed();
    } catch (e: any) {
      onError(e?.message || 'recovery_failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <Text style={styles.brand}>{t('appName')}</Text>
      <Text style={styles.title}>{t('mfa.recovery.title')}</Text>
      <Text style={styles.sub}>{t('mfa.recovery.subtitle')}</Text>
      <Text style={styles.label}>{t('mfa.recovery.codeLabel')}</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholderTextColor="#6B6358"
      />
      <TouchableOpacity style={[styles.btn, busy && styles.btnDisabled]} onPress={submit} disabled={busy || !code.trim()}>
        <Text style={styles.btnText}>{t('mfa.recovery.submit')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkBtn} onPress={onBack} disabled={busy}>
        <Text style={styles.linkText}>{t('common.back')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 24, paddingBottom: 48 },
  brand: { color: colors.accent, fontSize: 28, fontWeight: '700', marginBottom: 8 },
  title: { color: colors.text, fontSize: 22, fontWeight: '600', marginBottom: 8 },
  sub: { color: colors.sub, fontSize: 14, lineHeight: 20, marginBottom: 12 },
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
  linkBtn: { marginTop: 16, alignItems: 'center' },
  linkText: { color: colors.accent, fontWeight: '600' },
});
