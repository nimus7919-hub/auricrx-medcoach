import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme/colors';
import { unlockWithBiometrics } from '../../services/doctorSessionUnlock';

type Props = {
  onUnlocked: () => void;
  onUsePassword: () => void;
  onError: (message: string) => void;
};

export default function BiometricUnlockView({ onUnlocked, onUsePassword, onError }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const unlock = async () => {
    setBusy(true);
    try {
      const ok = await unlockWithBiometrics(t('mfa.biometric.prompt'), t('mfa.biometric.fallback'));
      if (ok) onUnlocked();
      else onError(t('mfa.biometric.failed'));
    } catch (e: any) {
      onError(e?.message || t('mfa.biometric.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.pad}>
      <Text style={styles.brand}>{t('appName')}</Text>
      <Text style={styles.title}>{t('mfa.biometric.title')}</Text>
      <Text style={styles.sub}>{t('mfa.biometric.subtitle')}</Text>
      {busy ? <ActivityIndicator color={colors.accent} /> : null}
      <TouchableOpacity style={[styles.btn, busy && styles.btnDisabled]} onPress={unlock} disabled={busy}>
        <Text style={styles.btnText}>{t('mfa.biometric.unlock')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkBtn} onPress={onUsePassword} disabled={busy}>
        <Text style={styles.linkText}>{t('mfa.biometric.usePassword')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { flex: 1, padding: 24, justifyContent: 'center' },
  brand: { color: colors.accent, fontSize: 28, fontWeight: '700', marginBottom: 8 },
  title: { color: colors.text, fontSize: 22, fontWeight: '600', marginBottom: 8 },
  sub: { color: colors.sub, fontSize: 14, lineHeight: 20, marginBottom: 24 },
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
