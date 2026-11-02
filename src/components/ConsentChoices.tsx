import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { vip } from '../theme/vip';
import { Feather } from '@expo/vector-icons';
import copy from '../legal/consentCheckboxText.json';
import { ConsentChoices as Choices } from '../services/consentService';

export default function ConsentChoices({ language, value, onChange, openLegal }: {
  language: string; value: Choices; onChange: (value: Choices) => void;
  openLegal: (type: 'terms' | 'privacy') => void;
}) {
  const t = language === 'es' ? copy.es : copy.en;
  return <View>{(['terms', 'privacy', 'health'] as const).map(key => <View key={key} style={{ marginVertical: 8 }}>
    <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: value[key] }}
      onPress={() => onChange({ ...value, [key]: !value[key] })} style={{ flexDirection: 'row', gap: vip.spacing.sm, paddingVertical: vip.spacing.sm, minHeight: 48 }}>
      <Feather name={value[key] ? 'check-square' : 'square'} size={24} color={vip.colors.gold} />
      <Text style={{ color: vip.colors.white, flex: 1, fontSize: 15, lineHeight: 23 }}>{t[key]}</Text>
    </TouchableOpacity>
    {key !== 'health' && <TouchableOpacity onPress={() => openLegal(key)}><Text style={{ color: vip.colors.gold, textDecorationLine: 'underline', padding: 8 }}>{language === 'es' ? 'Leer documento' : 'Read document'}</Text></TouchableOpacity>}
  </View>)}</View>;
}
