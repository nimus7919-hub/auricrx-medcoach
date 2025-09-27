import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Platform,
  SafeAreaView,
  LayoutChangeEvent,
  Dimensions,
  Image,
  Alert,
  ScrollView,
  FlatList,
  Modal,
  KeyboardAvoidingView,
} from "react-native";

// Expo:
import { LinearGradient } from "expo-linear-gradient";

import MaskedView from "@react-native-masked-view/masked-view";
import Svg, { Rect, Defs, RadialGradient, Stop, Polygon } from "react-native-svg";
import SignUpForm from "./SignUpForm";

/** ====== GOLD PALETTE ====== */
const GOLD = {
  hi: "#FFF3D2",
  a200: "#FDE68A",
  a300: "#FCD34D",
  y400: "#FACC15",
  a400: "#FBBF24",
  a500: "#F59E0B",
  y600: "#CA8A04",
};

const { width: SCREEN_W } = Dimensions.get("window");

export default function SignInScreen({ navigation, onAuthSuccess, onClose, onLanguageChange }: any) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showSignUpForm, setShowSignUpForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // where is the logo? (to aim the beam)
  const [logoBox, setLogoBox] = useState<{ y: number; h: number }>({ y: 160, h: 56 });
  const onLogoLayout = (e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    setLogoBox({ y, h: height });
  };

  // Animations
  const slitSheen = useRef(new Animated.Value(0)).current;  // sheen moves L→R
  const beamPulse = useRef(new Animated.Value(0)).current;  // wash opacity pulse

  useEffect(() => {
    Animated.loop(
      Animated.timing(slitSheen, { toValue: 1, duration: 3200, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(beamPulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(beamPulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [slitSheen, beamPulse]);

  const sheenTranslateX = slitSheen.interpolate({ inputRange: [0, 1], outputRange: [-120, 120] });
  const beamOpacity = beamPulse.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.18] });

  // where the beam fades out (aim near the bottom of the logo)
  const BEAM_END_Y = Math.max(100, logoBox.y + logoBox.h * 0.6);

  const onSignIn = async () => {
    if (!email || !pw) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      console.log({ email, pw });
      if (onAuthSuccess) {
        await onAuthSuccess({ email, password: pw, isSignUp: false });
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (userData: any) => {
    if (onAuthSuccess) {
      await onAuthSuccess({ ...userData, isSignUp: true });
    }
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setShowLanguageDropdown(false);
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'en': return 'English';
      case 'es': return 'Español';
      case 'pt': return 'Português';
      case 'fr': return 'Français';
      case 'de': return 'Deutsch';
      case 'zh': return '中文';
      default: return 'English';
    }
  };

  // Translation system
  const getTranslations = (lang: string) => {
    const translations = {
      en: {
        email: "Email",
        password: "Password",
        signIn: "Sign In",
        signUp: "Sign Up",
        dontHaveAccount: "Don't have an account?",
        continueWithApple: "🍎 Continue with Apple",
        continueWithGoogle: "G   Continue with Google",
        legal: "By signing in, you agree to our Terms of Service and Privacy Policy"
      },
      es: {
        email: "Correo",
        password: "Contraseña",
        signIn: "Iniciar Sesión",
        signUp: "Registrarse",
        dontHaveAccount: "¿No tienes una cuenta?",
        continueWithApple: "🍎 Continuar con Apple",
        continueWithGoogle: "G   Continuar con Google",
        legal: "Al iniciar sesión, aceptas nuestros Términos de Servicio y Política de Privacidad"
      },
      pt: {
        email: "Email",
        password: "Senha",
        signIn: "Entrar",
        signUp: "Cadastrar",
        dontHaveAccount: "Não tem uma conta?",
        continueWithApple: "🍎 Continuar com Apple",
        continueWithGoogle: "G   Continuar com Google",
        legal: "Ao fazer login, você concorda com nossos Termos de Serviço e Política de Privacidade"
      },
      fr: {
        email: "Email",
        password: "Mot de passe",
        signIn: "Se connecter",
        signUp: "S'inscrire",
        dontHaveAccount: "Vous n'avez pas de compte ?",
        continueWithApple: "🍎 Continuer avec Apple",
        continueWithGoogle: "G   Continuer avec Google",
        legal: "En vous connectant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité"
      },
      de: {
        email: "E-Mail",
        password: "Passwort",
        signIn: "Anmelden",
        signUp: "Registrieren",
        dontHaveAccount: "Haben Sie kein Konto?",
        continueWithApple: "🍎 Mit Apple fortfahren",
        continueWithGoogle: "G   Mit Google fortfahren",
        legal: "Durch die Anmeldung stimmen Sie unseren Nutzungsbedingungen und Datenschutzrichtlinien zu"
      },
      zh: {
        email: "邮箱",
        password: "密码",
        signIn: "登录",
        signUp: "注册",
        dontHaveAccount: "没有账户？",
        continueWithApple: "🍎 使用 Apple 继续",
        continueWithGoogle: "G   使用 Google 继续",
        legal: "登录即表示您同意我们的服务条款和隐私政策"
      }
    };
    return translations[lang] || translations.en;
  };

  const t = getTranslations(selectedLanguage);

  if (showSignUpForm) {
    return (
      <SignUpForm 
        onSignUp={handleSignUp} 
        onClose={() => setShowSignUpForm(false)}
        selectedLanguage={selectedLanguage}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* === Language Dropdown === */}
        <View style={styles.languageContainer} pointerEvents="box-none">
          <TouchableOpacity 
            style={styles.languageSelector}
            onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
            activeOpacity={0.8}
          >
            <Text style={styles.languageSelectorText}>
              {getLanguageLabel(selectedLanguage)}
            </Text>
            <Text style={styles.languageSelectorIcon}>
              {showLanguageDropdown ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          
          <Modal
            visible={showLanguageDropdown}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowLanguageDropdown(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowLanguageDropdown(false)}
            >
              <View style={styles.languageDropdown}>
                <FlatList
                  style={styles.languageList}
                  contentContainerStyle={styles.languageListContent}
                  data={[
                    { key: 'en', label: 'English' },
                    { key: 'es', label: 'Español' },
                    { key: 'pt', label: 'Português' },
                    { key: 'fr', label: 'Français' },
                    { key: 'de', label: 'Deutsch' },
                    { key: 'zh', label: '中文' }
                  ]}
                  renderItem={({ item }) => (
                    <LanguageOption 
                      language={item.key} 
                      label={item.label} 
                      isSelected={selectedLanguage === item.key} 
                      onPress={() => handleLanguageChange(item.key)} 
                    />
                  )}
                  keyExtractor={(item) => item.key}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                  scrollEnabled={true}
                  bounces={false}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        </View>

        {/* === Cone-shaped top slit that shines down onto the logo === */}
        <TopSlitOverLogoCone
          width={SCREEN_W}
          endY={BEAM_END_Y}
          sheenTranslateX={sheenTranslateX}
          beamOpacity={beamOpacity}
        />

        {/* ===== Header (logo/title) ===== */}
        <View style={styles.header} onLayout={onLogoLayout}>
          {/* Your actual logo */}
          <Image 
            source={require('../../assets/sign in logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={{ height: 16 }} />
        </View>

        {/* ===== Form ===== */}
        <View style={styles.form}>
          <GoldOutline>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t.email}
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
              placeholder={t.password}
              placeholderTextColor="#CBA24F"
              secureTextEntry
              style={styles.input}
            />
          </GoldOutline>

          <View style={{ height: 18 }} />

          <GoldButton 
            title={loading ? "Loading..." : t.signIn} 
            onPress={onSignIn} 
            disabled={loading}
          />

          <View style={{ height: 16 }} />

          {/* SSO rows */}
          <GoldRow>
            <Text style={styles.rowText}>{t.continueWithApple}</Text>
          </GoldRow>
          <View style={{ height: 12 }} />
          <GoldRow>
            <Text style={styles.rowText}>{t.continueWithGoogle}</Text>
          </GoldRow>

          <View style={{ height: 20 }} />

          <View style={styles.signUpContainer}>
            <Text style={styles.signUp}>
              {t.dontHaveAccount}{" "}
              <Text 
                style={styles.signUpLink}
                onPress={() => setShowSignUpForm(true)}
              >
                {t.signUp}
              </Text>
            </Text>
          </View>

          <View style={{ height: 18 }} />
          <Text style={styles.legal}>
            {t.legal}
          </Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- Top slit that shines down like a cone onto the logo ---------- */
function TopSlitOverLogoCone({
  width,
  endY,
  sheenTranslateX,
  beamOpacity,
}: {
  width: number;
  endY: number; // where the cone should fade out (aim near the logo)
  sheenTranslateX: Animated.AnimatedInterpolation<string | number>;
  beamOpacity: Animated.AnimatedInterpolation<string | number>;
}) {
  // Height of the light container (from top down to end of the beam)
  const h = Math.max(140, Math.floor(endY));

  // Cone geometry: small at the slit, wider toward the logo
  const apexY = 10;                  // just below the slit line
  const apexHalfW = Math.max(8, width * 0.04);
  const baseY = h;
  const baseHalfW = width * 0.35;    // widen as it travels downward

  // Polygon points for the cone (trapezoid)
  const p1x = width / 2 - apexHalfW, p1y = apexY;
  const p2x = width / 2 + apexHalfW, p2y = apexY;
  const p3x = width / 2 + baseHalfW, p3y = baseY;
  const p4x = width / 2 - baseHalfW, p4y = baseY;
  const points = `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}`;

  return (
    <View pointerEvents="none" style={[styles.topLightsContainer, { height: h }]}>
      {/* Thin slit */}
      <LinearGradient
        colors={["transparent", "rgba(255,245,220,0.9)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.slit}
      />
      {/* Moving sparkle across slit */}
      <Animated.View style={[styles.sheenWrapper, { transform: [{ translateX: sheenTranslateX }] }]}>
        <LinearGradient
          colors={["transparent", GOLD.hi, "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.sheen}
        />
      </Animated.View>

      {/* Cone-masked light wash */}
      <MaskedView
        style={[StyleSheet.absoluteFill, { top: 0 }]}
        maskElement={
          <Svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} style={StyleSheet.absoluteFill}>
            {/* Transparent background so only the polygon reveals content */}
            <Rect x="0" y="0" width={width} height={h} fill="transparent" />
            <Polygon points={points} fill="#fff" />
          </Svg>
        }
      >
        {/* Everything inside here is clipped to the cone */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: beamOpacity }]}>
          {/* Vertical wash */}
          <LinearGradient
            colors={["rgba(255,208,128,0.10)", "rgba(255,208,128,0.04)", "transparent"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Radial spotlight that peaks near the logo area */}
          <Svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="spot" cx={width / 2} cy={h * 0.55} r={h * 0.9} gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="rgba(255,208,128,0.12)" />
                <Stop offset="0.4" stopColor="rgba(255,208,128,0.05)" />
                <Stop offset="1" stopColor="rgba(0,0,0,0)" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width={width} height={h} fill="url(#spot)" />
          </Svg>

          {/* Diagonal sweeping sparkle inside the cone */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: -width * 0.2,
              width: width * 0.4,
              height: h,
              transform: [{ rotate: "-10deg" }, { translateX: sheenTranslateX as any }],
              opacity: 0.08,
            }}
          >
            <LinearGradient
              colors={["transparent", "rgba(255,243,210,0.9)", "transparent"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </Animated.View>
      </MaskedView>
    </View>
  );
}

/* ---------- Gold primitives ---------- */

function GoldButton({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.9} 
      style={[styles.goldBtnWrap, disabled && styles.goldBtnDisabled]}
      disabled={disabled}
    >
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

function GoldOutline({ children }: { children: React.ReactNode }) {
  return <View style={styles.goldOutline}>{children}</View>;
}

function GoldRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.goldRow}>{children}</View>;
}

// Language option component for dropdown
function LanguageOption({ language, label, isSelected, onPress }: { 
  language: string; 
  label: string; 
  isSelected: boolean; 
  onPress: () => void; 
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.languageOption, isSelected && styles.languageOptionSelected]}
      activeOpacity={0.8}
    >
      <Text style={[styles.languageOptionText, isSelected && styles.languageOptionTextSelected]}>
        {label}
      </Text>
      {isSelected && (
        <Text style={styles.languageOptionCheck}>✓</Text>
      )}
    </TouchableOpacity>
  );
}

/* ----------------- Styles ----------------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1, backgroundColor: "#000", alignItems: "center" },

  topLightsContainer: { position: "absolute", top: 0, left: 0, right: 0 },
  slit: {
    height: 2,
    width: "86%",
    alignSelf: "center",
    marginTop: 8,
    borderRadius: 999,
    ...shadow(0, 0, 10, "rgba(255,220,140,.8)"),
  },
  sheenWrapper: { position: "absolute", top: 2, left: "50%", width: 120, marginLeft: -60 },
  sheen: { height: 10, borderRadius: 999, opacity: 0.55 },

  header: { marginTop: 100, alignItems: "center", justifyContent: "center", zIndex: 2 },
  logo: { width: 200, height: 200 },

  form: { width: "86%", marginTop: 28 },

  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#E9C978",
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.60)",
  },

  goldBtnWrap: { borderRadius: 18, overflow: "hidden" },
  goldBtnDisabled: { opacity: 0.6 },
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

  signUpContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  signUp: { 
    color: "#E9C978", 
    textAlign: "center", 
    fontSize: 15,
  },
  signUpLink: { 
    color: GOLD.a300, 
    fontWeight: "600",
    fontSize: 15,
    textDecorationLine: "underline",
  },
  signUpLinkActive: { 
    color: GOLD.y400, 
    fontWeight: "700"
  },

  legal: { color: "#AAAAAA", textAlign: "center", fontSize: 12, lineHeight: 18 },
  
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  
  // Language dropdown styles
  languageContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1000,
  },
  languageSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
    ...shadow(0, 4, 12, "rgba(255,176,32,.15)"),
    minWidth: 100,
  },
  languageSelectorText: {
    color: GOLD.y400,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  languageSelectorIcon: {
    color: GOLD.a300,
    fontSize: 10,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 50,
    paddingRight: 12,
  },
  languageDropdown: {
    width: 160,
    height: 140,
    borderRadius: 10,
    backgroundColor: "rgba(10,10,10,0.96)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.38)",
    overflow: "hidden",
  },
  languageList: {
    flexGrow: 0,
  },
  languageListContent: {
    paddingVertical: 2,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 4,
    height: 32, // Much more compact height
    borderBottomWidth: 1,
    borderBottomColor: "rgba(251,191,36,0.1)",
  },
  languageOptionSelected: {
    backgroundColor: "rgba(251,191,36,0.1)",
  },
  languageOptionText: {
    color: "#E9C978",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  languageOptionTextSelected: {
    color: GOLD.y400,
    fontWeight: "600",
  },
  languageOptionCheck: {
    color: GOLD.y400,
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 8,
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
  // Android uses elevation; color handled via borders/gradients
  return { elevation: Math.max(2, Math.min(12, Math.floor(blur / 2))) };
}
