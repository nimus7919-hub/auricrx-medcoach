import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useDynamicTheme } from '../hooks/useDynamicTheme';
import { useTranslation } from 'react-i18next';
interface LoadingScreenProps { onLoadingComplete?: () => void; isCheckingAuth?: boolean; onAuthCheckComplete?: () => void; }
export default function LoadingScreen(_props: LoadingScreenProps) {
  useUILanguage();
  const c = useDynamicTheme();
  const { t } = useTranslation();
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
    <View style={{ backgroundColor: c.card, borderColor: c.chip, borderWidth: 1, borderRadius: 24, padding: 32, alignItems: 'center' }}>
      <Text style={{ color: c.accent, fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 20 }}>{uiI18n.t("ai.auricrxMedCoach")}</Text>
      <ActivityIndicator color={c.accent} size="large" />
      <Text accessibilityLiveRegion="polite" style={{ color: c.text, marginTop: 20, textAlign: 'center' }}>{t('common.loading')}</Text>
    </View>
  </View>;
}
