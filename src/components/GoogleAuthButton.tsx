import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { vip } from '../theme/vip';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const googleAuthText = (_language: string) => ({
  label: uiI18n.t('googleAuth.label'),
  or: uiI18n.t('googleAuth.or'),
  loading: uiI18n.t('googleAuth.loading'),
  error: uiI18n.t('googleAuth.error'),
});

export default function GoogleAuthButton({ language, loading, disabled, onPress, variant }: {
  variant?: 'vip'; language: string; loading: boolean; disabled: boolean; onPress: () => void;
}) {
  useUILanguage();
  const t = googleAuthText(language);
  if (variant === 'vip') return <TouchableOpacity accessibilityRole="button" accessibilityLabel={t.label} accessibilityState={{disabled, busy: loading}} disabled={disabled} onPress={onPress} activeOpacity={0.9} style={{borderRadius:99,backgroundColor:vip.colors.white,minHeight:49,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:15,paddingHorizontal:12,opacity:disabled ? 0.6 : 1}}>
    {loading ? <ActivityIndicator color="#4285F4"/> : <Svg width={29} height={29} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.36Z"/>
      <Path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.41l-3.23-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z"/>
      <Path fill="#FBBC05" d="M6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.06a10 10 0 0 0 0 9.02Z"/>
      <Path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.49l3.34 2.59A6 6 0 0 1 12 5.96Z"/>
    </Svg>}
    <Text style={{color:'#202124',fontSize:18,fontWeight:'500',flexShrink:1}}>{loading ? t.loading : t.label}</Text>
  </TouchableOpacity>;
  return <View>
    <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>{t.or}</Text><View style={styles.line} /></View>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={t.label}
      accessibilityState={{ disabled, busy: loading }} disabled={disabled} onPress={onPress}
      activeOpacity={0.9} style={[styles.button, disabled && { opacity: 0.6 }]}>
      <LinearGradient colors={['#FCD34D', '#FACC15', '#F59E0B']} style={styles.content}>
        {loading ? <ActivityIndicator color="#0B0B0B" /> : <FontAwesome name="google" size={20} color="#0B0B0B" />}
        <Text style={styles.label}>{loading ? t.loading : t.label}</Text>
      </LinearGradient>
    </TouchableOpacity>
    <Text style={{ color: '#E9C978', fontSize: 12, marginTop: 8 }}>
      {uiI18n.t("localized.GoogleAuthButton.text43")}
    </Text>
  </View>;
}
const styles = StyleSheet.create({
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(251,191,36,0.38)' },
  or: { color: '#E9C978', marginHorizontal: 12 },
  button: { borderRadius: 18, overflow: 'hidden' },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 12 },
  label: { color: '#0B0B0B', fontSize: 16, fontWeight: '700' },
});
