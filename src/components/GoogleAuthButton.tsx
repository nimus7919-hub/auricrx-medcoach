import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const googleAuthText = (language: string) => language === 'es' ? {
  label: 'Continuar con Google', or: 'o', loading: 'Conectando...',
  error: 'No se pudo iniciar sesi\u00f3n con Google. Int\u00e9ntalo de nuevo.',
} : {
  label: 'Continue with Google', or: 'or', loading: 'Connecting...',
  error: 'Google Sign-In failed. Please try again.',
};

export default function GoogleAuthButton({ language, loading, disabled, onPress }: {
  language: string; loading: boolean; disabled: boolean; onPress: () => void;
}) {
  const t = googleAuthText(language);
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
      {language === 'es' ? 'Después de identificarte, revisa los consentimientos antes de crear tu perfil.' : 'After signing in, review consent choices before your profile is created.'}
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
