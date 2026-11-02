import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import copy from '../legal/consentCheckboxText.json';
import { ConsentChoices as Choices } from '../services/consentService';

export default function ConsentChoices({ language, value, onChange, openLegal }: {
  language: string; value: Choices; onChange: (value: Choices) => void;
  openLegal: (type: 'terms' | 'privacy') => void;
}) {
  const t = language === 'es' ? copy.es : copy.en;
  return <View>{(['terms', 'privacy', 'health'] as const).map(key => <View key={key} style={{ marginVertical: 8 }}>
    <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: value[key] }}
      onPress={() => onChange({ ...value, [key]: !value[key] })} style={{ flexDirection: 'row', gap: 10 }}>
      <Text style={{ color: '#D4AF37' }}>{value[key] ? '☑' : '☐'}</Text>
      <Text style={{ color: '#E9C978', flex: 1 }}>{t[key]}</Text>
    </TouchableOpacity>
    {key !== 'health' && <TouchableOpacity onPress={() => openLegal(key)}><Text style={{ color: '#D4AF37', textDecorationLine: 'underline', padding: 8 }}>{language === 'es' ? 'Leer documento' : 'Read document'}</Text></TouchableOpacity>}
  </View>)}</View>;
}
