import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Platform,
  Image,
  SafeAreaView,
} from "react-native";

// Expo:
import { LinearGradient } from "expo-linear-gradient";
// Bare RN (if not using Expo):
// import LinearGradient from "react-native-linear-gradient";

import MaskedView from "@react-native-masked-view/masked-view";
import Svg, { Rect } from "react-native-svg";

/** ====== GOLD PALETTE ====== */
const GOLD = {
  hi: "#FFF3D2",
  a200: "#FDE68A",
  a300: "#FCD34D",
  y400: "#FACC15",
  a400: "#FBBF24",
  a500: "#F59E0B",
  y600: "#CA8A04",
  accent: "#FFB020",
};

export default function MetallicSignInScreen({ navigation, onAuthSuccess, onClose }: any) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  // Animation refs
  const slitSheen = useRef(new Animated.Value(0)).current;   // horizontal shimmer across the slit
  const beamPulse = useRef(new Animated.Value(0)).current;   // opacity/scale pulse of the wash

  useEffect(() => {
    // Sheen sweeps left->right and loops
    Animated.loop(
      Animated.timing(slitSheen, { toValue: 1, duration: 3200, useNativeDriver: true })
    ).start();

    // Beam pulse (opacity/scale) loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(beamPulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(beamPulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [slitSheen, beamPulse]);

  const sheenTranslateX = slitSheen.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  const beamOpacity = beamPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.55],
  });

  const onSignIn = () => {
    // hook to your auth
    console.log({ email, pw });
    if (onAuthSuccess) {
      onAuthSuccess({ email, password: pw });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* ======== Animated Top Slit Light ======== */}
        <View style={styles.topLightsContainer}>
          {/* thin slit line */}
          <LinearGradient
            colors={["transparent", "rgba(255,245,220,0.9)", "transparent"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.slit}
          />
          {/* sweeping sparkle across the slit */}
          <Animated.View
            style={[
              styles.sheenWrapper,
              { transform: [{ translateX: sheenTranslateX }] },
            ]}
          >
            <LinearGradient
              colors={["transparent", GOLD.hi, "transparent"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.sheen}
            />
          </Animated.View>

          {/* downward beam wash (uses SVG to fake a soft radial) */}
          <Animated.View style={[styles.beamWash, { opacity: beamOpacity }]}>
            <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* gradient is simulated by vertical alpha fade in the rect fill */}
              <Rect
                x="0" y="0" width="100" height="100"
                fill="url(#grad)" // not needed; using opacity fade via LinearGradient below (simpler)
              />
            </Svg>
            <LinearGradient
              colors={["rgba(255,208,128,0.32)", "rgba(255,208,128,0.16)", "transparent"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        {/* ======== Logo ======== */}
        <View style={styles.header}>
          {/* Your actual logo */}
          <Image 
            source={require('../../assets/sign in logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={{ height: 16 }} />
        </View>

        {/* ======== Form ======== */}
        <View style={styles.form}>
          <GoldOutline>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#CBA24F"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </GoldOutline>

          <View style={{ height: 14 }} />

          <GoldOutline>
            <TextInput
              value={pw}
              onChangeText={setPw}
              placeholder="Password"
              placeholderTextColor="#CBA24F"
              secureTextEntry
              style={styles.input}
            />
          </GoldOutline>

          <View style={{ height: 18 }} />

          <GoldButton title="Sign In" onPress={onSignIn} />

          <View style={{ height: 16 }} />

          {/* SSO rows */}
          <GoldRow>
            <Text style={styles.rowText}>🍎  Continue with Apple</Text>
          </GoldRow>

          <View style={{ height: 12 }} />

          <GoldRow>
            <Text style={styles.rowText}>G   Continue with Google</Text>
          </GoldRow>

          <View style={{ height: 20 }} />

          <TouchableOpacity onPress={() => navigation?.navigate?.("SignUp")}>
            <Text style={styles.signUp}>Don't have an account? <Text style={{ color: GOLD.a300 }}>Sign Up</Text></Text>
          </TouchableOpacity>

          <View style={{ height: 18 }} />

          <Text style={styles.legal}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

/** ======= Gold components ======= */

// Metallic gold button (gradient + gloss + subtle bevel)
function GoldButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.goldBtnWrap}>
      <LinearGradient
        colors={[GOLD.a300, GOLD.y400, GOLD.a500]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.goldBtn}
      >
        {/* gloss overlay */}
        <LinearGradient
          colors={["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.goldGloss}
        />
        <Text style={styles.goldBtnText}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// Gold outline container with glow (inputs/SSO rows)
function GoldOutline({ children }: { children: React.ReactNode }) {
  return <View style={styles.goldOutline}>{children}</View>;
}

// Gold outline row for SSO
function GoldRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.goldRow}>{children}</View>;
}

// Gradient text for AURIC RX
function GradientText({ text }: { text: string }) {
  return (
    <MaskedView
      maskElement={<Text style={styles.titleMask}>{text}</Text>}
    >
      <LinearGradient
        colors={[GOLD.a200, GOLD.a500]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <Text style={[styles.titleMask, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

/** ======= Styles ======= */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1, backgroundColor: "#000", alignItems: "center" },

  topLightsContainer: { position: "absolute", top: 0, left: 0, right: 0, height: 160 },
  slit: {
    height: 2,
    width: "86%",
    alignSelf: "center",
    marginTop: 8,
    borderRadius: 999,
    ...shadow(0, 0, 10, "rgba(255,220,140,.8)"),
  },
  sheenWrapper: {
    position: "absolute",
    top: 2,
    left: "50%",
    width: 120,
    marginLeft: -60,
  },
  sheen: {
    height: 10,
    borderRadius: 999,
    opacity: 0.55,
  },
  beamWash: {
    ...StyleSheet.absoluteFillObject,
  },

  header: { marginTop: 100, alignItems: "center", justifyContent: "center" },
  logo: { width: 200, height: 200 }, // Your actual logo size

  form: { width: "86%", marginTop: 28 },

  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#E9C978",
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.60)",
  },

  goldBtnWrap: { borderRadius: 18, overflow: "hidden" },
  goldBtn: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    ...shadow(0, 10, 24, "rgba(255,176,32,.18)"),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(251,191,36,.28)",
  },
  goldGloss: {
    position: "absolute",
    left: 1, right: 1, top: 1, height: "50%",
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
    borderBottomLeftRadius: 18, borderBottomRightRadius: 18,
    opacity: 0.12,
  },
  goldBtnText: { color: "#0B0B0B", fontSize: 16, fontWeight: "700" },

  goldOutline: {
    borderRadius: 16,
    padding: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.38)",
    ...shadow(0, 6, 18, "rgba(255,176,32,.12)"),
  },

  goldRow: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.38)",
    ...shadow(0, 6, 18, "rgba(255,176,32,.12)"),
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { color: "#E9C978", fontSize: 15 },

  signUp: { color: "#E9C978", textAlign: "center", fontSize: 15 },

  titleMask: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  legal: {
    color: "#AAAAAA",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
  },
});

/** Cross-platform shadow helper */
function shadow(x: number, y: number, blur: number, color: string) {
  if (Platform.OS === "ios") {
    return {
      shadowColor: color,
      shadowOpacity: 1,
      shadowRadius: blur / 2,
      shadowOffset: { width: x, height: y },
    };
  }
  // Android uses elevation (not colorable); add subtle outer ring via borderColor above
  return { elevation: Math.max(2, Math.min(12, Math.floor(blur / 2))) };
}
