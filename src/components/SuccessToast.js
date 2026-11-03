import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const listeners = new Set();
let sequence = 0;
export function showSuccessToast(message) {
  const notice = { message, id: ++sequence };
  listeners.forEach(listener => listener(notice));
}

export default function SuccessToast() {
  const insets = useSafeAreaInsets();
  const [notice, setNotice] = useState(null);
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    listeners.add(setNotice);
    return () => listeners.delete(setNotice);
  }, []);
  useEffect(() => {
    if (!notice) return;
    progress.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2100),
      Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => { if (finished) setNotice(null); });
    return () => animation.stop();
  }, [notice, progress]);
  if (!notice) return null;
  return (
    <Animated.View pointerEvents="none" style={[styles.position, { top: insets.top + 12, opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }]}>
      <View style={styles.card} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <Feather name="check-circle" size={18} color="#D4AF37" />
        <Text style={styles.text}>{notice.message}</Text>
      </View>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  position: { position: 'absolute', left: 20, right: 20, zIndex: 9999, alignItems: 'center' },
  card: { width: '100%', maxWidth: 480, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, backgroundColor: 'rgba(12, 25, 45, 0.94)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.45)' },
  text: { flex: 1, color: '#F3E9D2', fontSize: 14, lineHeight: 20 },
});
