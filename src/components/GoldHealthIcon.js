import React from 'react';
import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function GoldHealthIcon({ name }) {
  const Icon = ['file-export-outline', 'heart-pulse'].includes(name) ? MaterialCommunityIcons : Ionicons;
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#D4AF3766', backgroundColor: '#D4AF3710', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 }}>
    <Icon name={name} size={21} color="#D4AF37" />
  </View>;
}
