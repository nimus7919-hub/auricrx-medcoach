import { getRegion } from '../services/region';
import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { vip } from '../theme/vip';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ConsentChoices as Choices } from '../services/consentService';

export default function ConsentChoices({ language, value, onChange, openLegal }: {
  language: string; value: Choices; onChange: (value: Choices) => void;
  openLegal: (type: 'terms' | 'privacy') => void;
}) {
  useUILanguage();
  const { t: translate } = useTranslation();
  const t = translate('consentChoices', { returnObjects: true }) as Record<string, string>;
  return <View>{(getRegion() === 'US' ? ['terms', 'privacy', 'health', 'share'] as const : ['terms', 'privacy', 'health'] as const).map(key => <View key={key} style={{ marginVertical: 8 }}>
    <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: value[key] }}
      onPress={() => onChange({ ...value, [key]: !value[key] })} style={{ flexDirection: 'row', gap: vip.spacing.sm, paddingVertical: vip.spacing.sm, minHeight: 48 }}>
      <Feather name={value[key] ? 'check-square' : 'square'} size={24} color={vip.colors.gold} />
      <Text style={{ color: vip.colors.white, flex: 1, fontSize: 15, lineHeight: 23 }}>{getRegion() === 'US' && key === 'health' ? 'I consent to collection and processing of my health data.' : getRegion() === 'US' && key === 'share' ? 'I separately consent to sharing health data with OpenAI (chat), Firebase/Google, Render, and Neon (authentication, hosting and sync).' : t[key]}</Text>
    </TouchableOpacity>
    {(key === 'terms' || key === 'privacy') && <TouchableOpacity onPress={() => openLegal(key)}><Text style={{ color: vip.colors.gold, textDecorationLine: 'underline', padding: 8 }}>{uiI18n.t("localized.ConsentChoices.text22")}</Text></TouchableOpacity>}
  </View>)}</View>;
}
