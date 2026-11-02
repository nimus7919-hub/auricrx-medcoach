import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import AuricWordmark from './AuricWordmark';
import { vip } from '../theme/vip';

/** Runs at the login boundary, with the actual login mounted below the reveal. */
export default function LoginIntro({ enabled, language = 'es', onComplete, children }: {
  enabled: boolean; language?: string; onComplete: () => void; children: React.ReactNode;
}) {
  const pill = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  const callback = useRef(onComplete);
  callback.current = onComplete;
  const done = useRef(false);
  const [visible, setVisible] = useState(enabled);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    pill.stopAnimation();
    reveal.stopAnimation();
    reveal.setValue(1);
    setVisible(false);
    callback.current();
  };

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    let preferenceChanged = false;
    let animation: Animated.CompositeAnimation | undefined;
    const applyPreference = (reduce: boolean) => {
      if (!mounted || done.current) return;
      if (reduce) { animation?.stop(); finish(); return; }
      animation = Animated.sequence([
        Animated.timing(pill, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true }),
        Animated.delay(150),
        Animated.timing(reveal, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]);
      animation.start(({ finished }) => { if (finished && mounted) finish(); });
    };
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', reduce => {
      if (reduce) {
        preferenceChanged = true;
        applyPreference(true);
      }
    });
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!preferenceChanged) applyPreference(reduce);
    }).catch(() => applyPreference(true));
    return () => { mounted = false; animation?.stop(); subscription.remove(); };
  }, [enabled, pill, reveal]);

  const es = language.startsWith('es');
  return <View style={styles.screen}>
    <Animated.View pointerEvents={visible ? 'none' : 'auto'} accessibilityElementsHidden={visible}
      importantForAccessibility={visible ? 'no-hide-descendants' : 'auto'}
      style={[styles.content, { opacity: visible ? reveal : 1, transform: [{ translateY: visible ? reveal.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) : 0 }] }]}>
      {children}
    </Animated.View>
    {visible && <Animated.View style={[StyleSheet.absoluteFill, { opacity: reveal.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [0, -28] }) }] }]}>
      <Pressable onPress={finish} style={styles.intro} accessibilityRole="button" accessibilityLabel={es ? 'Omitir introducción' : 'Skip introduction'}>
        <View style={styles.mark} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <AuricWordmark hidePill />
          {/* Same SVG capsule and coordinates as the static crossbar. */}
          <Animated.View style={[styles.pill, { transform: [
            { translateY: pill.interpolate({ inputRange: [0, 0.15, 0.72, 0.84, 1], outputRange: [-220, -220, 5, -3, 0] }) },
            { rotate: pill.interpolate({ inputRange: [0, 0.15, 0.72, 1], outputRange: ['-180deg', '-180deg', '360deg', '360deg'] }) },
          ] }]}><AuricWordmark pillOnly /></Animated.View>
        </View>
        <Text style={styles.subtitle}>RX MEDCOACH</Text>
        <Text style={styles.skip}>{es ? 'Toca para continuar' : 'Tap to continue'}</Text>
      </Pressable>
    </Animated.View>}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: vip.colors.navy },
  content: { flex: 1 },
  intro: { flex: 1, backgroundColor: vip.colors.navy, alignItems: 'center', justifyContent: 'center', padding: 28 },
  mark: { width: '100%', maxWidth: 440, aspectRatio: 440 / 128 },
  pill: { position: 'absolute', left: `${26.5 / 440 * 100}%`, top: `${81 / 128 * 100}%`, width: `${42.25 / 440 * 100}%`, height: `${12 / 128 * 100}%` },
  subtitle: { color: vip.colors.white, fontSize: 18, letterSpacing: 5, marginTop: 12 },
  skip: { position: 'absolute', bottom: 48, color: vip.colors.gold, fontSize: 13 },
});
