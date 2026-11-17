import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme/colors';

type Props = {
  codes: string[];
  onContinue: () => void;
};

export default function MfaRecoveryCodesView({ codes, onContinue }: Props) {
  const { t } = useTranslation();
  return (
    <ScrollView contentContainerStyle={styles.pad}>
      <Text style={styles.brand}>{t('appName')}</Text>
      <Text style={styles.title}>{t('mfa.codes.title')}</Text>
      <Text style={styles.sub}>{t('mfa.codes.subtitle')}</Text>
      <View style={styles.card}>
        {codes.map((c) => (
          <Text key={c} style={styles.code} selectable>
            {c}
          </Text>
        ))}
      </View>
      <Text style={styles.warn}>{t('mfa.codes.onceWarning')}</Text>
      <TouchableOpacity style={styles.btn} onPress={onContinue}>
        <Text style={styles.btnText}>{t('mfa.codes.savedContinue')}</Text>
      </TouchableOpacity>
    </ScrollView>
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
  },
  code: {
    color: colors.accent,
    fontFamily: 'monospace',
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: 8,
  },
  warn: { color: colors.danger, marginTop: 16, marginBottom: 8, lineHeight: 20 },
  btn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  btnText: { color: colors.onAccent, fontWeight: '700', fontSize: 15 },
});
