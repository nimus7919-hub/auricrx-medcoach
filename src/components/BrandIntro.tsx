import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { darkColors as c, goldGradient } from '../theme/colors';

/** One 2.65s sequence per app launch; no auth/network work is gated by this view. */
export default function BrandIntro({ language = 'es', onComplete }: { language?: string; onComplete: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const done = useRef(false);
  const complete = useRef(onComplete);
  complete.current = onComplete;
  const [reduced, setReduced] = useState(true); // Static until the OS preference is known.
  const es = language.startsWith('es');
  const finish = () => { if (!done.current) { done.current = true; complete.current(); } };
  useEffect(() => {
    let mounted = true;
    let animation: Animated.CompositeAnimation | undefined;
    const stopMotion = (enabled: boolean) => {
      if (!mounted || done.current) return;
      setReduced(enabled);
      animation?.stop();
      if (enabled) progress.setValue(1);
      else {
        progress.setValue(0);
        animation = Animated.timing(progress, { toValue: 1, duration: 2350, easing: Easing.linear, useNativeDriver: true });
        animation.start();
      }
    };
    AccessibilityInfo.isReduceMotionEnabled().then(stopMotion).catch(() => stopMotion(true));
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', stopMotion);
    const timer = setTimeout(finish, 2650);
    return () => { mounted = false; clearTimeout(timer); animation?.stop(); subscription.remove(); };
  }, [progress]);
  const split = progress.interpolate({ inputRange: [0, 0.35, 0.58, 1], outputRange: [0, 0, 19, 19] });
  const reveal = progress.interpolate({ inputRange: [0, 0.4, 0.65, 1], outputRange: [0, 0, 1, 1] });
  return (
    <Pressable style={styles.screen} onPress={finish} accessibilityRole="button" accessibilityLabel={es ? 'Omitir introducci?n' : 'Skip introduction'}>
      <LinearGradient colors={[c.bg, c.bgEnd, c.bg]} style={StyleSheet.absoluteFill} />
      <View style={styles.mark} accessible accessibilityLabel="AURIC">
        <Text allowFontScaling={false} style={styles.letters}>AU</Text>
        <Animated.View style={{ width: 64, height: 36, marginHorizontal: 12, flexDirection: 'row', transform: reduced ? [] : [{ perspective: 600 }, { rotateY: progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: ['0deg', '360deg', '360deg'] }) }, { rotateZ: progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: ['-24deg', '0deg', '0deg'] }) }] }}>
          {[0, 1].map(side => <Animated.View key={side} style={{ width: 32, height: 36, overflow: 'hidden', borderWidth: 1, borderColor: c.accent, borderTopLeftRadius: side ? 0 : 20, borderBottomLeftRadius: side ? 0 : 20, borderTopRightRadius: side ? 20 : 0, borderBottomRightRadius: side ? 20 : 0, transform: [{ translateX: side ? split : Animated.multiply(split, -1) }] }}>
            <LinearGradient colors={side ? [c.card, c.muted] : goldGradient} style={{ flex: 1 }} />
          </Animated.View>)}
          <Animated.Text style={[styles.rx, { opacity: reduced ? 1 : reveal }]}>Rx</Animated.Text>
        </Animated.View>
        <Text allowFontScaling={false} style={styles.letters}>RIC</Text>
      </View>
      <Animated.View style={{ opacity: reduced ? 1 : reveal, alignItems: 'center', marginTop: 36, overflow: 'hidden', maxWidth: '100%' }}>
        <Text style={styles.wordmark}>AuricRX MedCoach</Text>
        <Text style={styles.tagline}>{es ? 'Tu salud, en modo VIP.' : 'Your health, VIP mode.'}</Text>
        {!reduced && <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { width: 55, transform: [{ translateX: progress.interpolate({ inputRange: [0, 0.6, 0.95, 1], outputRange: [-80, -80, 340, 340] }) }, { skewX: '-18deg' }] }]}>
          <LinearGradient colors={['transparent', 'rgba(255,240,194,0.45)', 'transparent']} style={{ flex: 1 }} />
        </Animated.View>}
      </Animated.View>
      <Text style={styles.skip}>{es ? 'Toca para continuar' : 'Tap to continue'}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  mark: { flexDirection: 'row', alignItems: 'center' },
  letters: { color: c.text, fontSize: 38, fontWeight: '600', letterSpacing: 3 },
  rx: { position: 'absolute', left: 20, top: 8, color: c.accent, fontSize: 16, fontWeight: '700' },
  wordmark: { color: c.accent, fontSize: 26, fontWeight: '700', textAlign: 'center' },
  tagline: { color: c.text, fontSize: 16, textAlign: 'center', marginTop: 12 },
  skip: { position: 'absolute', bottom: 48, color: c.sub, fontSize: 13 },
});
