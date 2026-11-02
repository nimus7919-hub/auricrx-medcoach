import { gold as GOLD, darkColors } from '../theme/colors';
import React, { useEffect, useState } from "react";
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
  ActivityIndicator,
} from "react-native";

// Expo:
import { LinearGradient } from "expo-linear-gradient";

import SignUpForm from "./SignUpForm";
import GoogleAuthButton, { googleAuthText } from "../components/GoogleAuthButton";
import authService from '../services/authService';
import { loadPrivacyText, loadTermsText } from '../services/legalService';

/** ====== GOLD PALETTE ====== */


const { width: SCREEN_W } = Dimensions.get("window");

export default function SignInScreen({ navigation, onAuthSuccess, onClose, onLanguageChange, resetToSignIn, onResubscribe }: any) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpForm, setShowSignUpForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalModalTitle, setLegalModalTitle] = useState('');
  const [legalModalContent, setLegalModalContent] = useState('');
  const [legalModalLoading, setLegalModalLoading] = useState(false);

  // Reset to sign-in form when resetToSignIn is called
  useEffect(() => {
    if (resetToSignIn > 0) {
      console.log('🔄 Resetting to sign-in form');
      setShowSignUpForm(false);
    }
  }, [resetToSignIn]);

  const onSignIn = async () => {
    if (!email || !pw) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      console.log({ email, pw, staySignedIn });
      if (onAuthSuccess) {
        await onAuthSuccess({ email, password: pw, isSignUp: false, staySignedIn });
      }
    } catch (error) {
      console.error('❌ Auth error in SignInScreen:', error);
      // Log crash for debugging
      try {
        const CrashLogger = require('../../utils/crashLogger').default;
        CrashLogger.logError(error, {
          context: 'sign_in',
          email: email ? email.substring(0, 3) + '***' : 'none',
          hasStaySignedIn: staySignedIn,
        }).catch(e => console.error('Failed to log crash:', e));
      } catch (e) {
        console.error('Failed to import CrashLogger:', e);
      }
      Alert.alert('Error', 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) return;
    setGoogleLoading(true);
    try {
      const result = await authService.signInWithGoogle();
      if (!result.success) {
        Alert.alert('Error', result.error || googleAuthText(selectedLanguage).error);
        return;
      }
      await onAuthSuccess({ provider: 'google', user: result.user });
    } catch (error) {
      Alert.alert('Error', googleAuthText(selectedLanguage).error);
    } finally {
      setGoogleLoading(false);
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
        continueWithApple: "iOS Coming Soon",
        continueWithGoogle: "G   Continue with Google",
        staySignedIn: "Stay signed in",
        legalPrefix: "By signing in, you agree to our ",
        legalConnector: " and ",
        legalSuffix: ".",
        termsOfService: "Terms of Service",
        privacyPolicy: "Privacy Policy",
        close: "Close",
        loadingDocument: "Loading legal document...",
        resubscribe: "Resubscribe"
      },
      es: {
        email: "Correo",
        password: "Contraseña",
        signIn: "Iniciar Sesión",
        signUp: "Registrarse",
        dontHaveAccount: "¿No tienes una cuenta?",
        continueWithApple: "iOS Próximamente",
        continueWithGoogle: "G   Continuar con Google",
        staySignedIn: "Mantenerme conectado",
        legalPrefix: "Al iniciar sesión aceptas nuestros ",
        legalConnector: " y nuestra ",
        legalSuffix: ".",
        termsOfService: "Términos de Servicio",
        privacyPolicy: "Política de Privacidad",
        close: "Cerrar",
        loadingDocument: "Cargando documento legal...",
        resubscribe: "Reactivar Suscripción"
      },
      pt: {
        email: "Email",
        password: "Senha",
        signIn: "Entrar",
        signUp: "Cadastrar",
        dontHaveAccount: "Não tem uma conta?",
        continueWithApple: "iOS Em Breve",
        continueWithGoogle: "G   Continuar com Google",
        staySignedIn: "Manter-me conectado",
        legalPrefix: "Ao fazer login, você concorda com nossos ",
        legalConnector: " e nossa ",
        legalSuffix: ".",
        termsOfService: "Termos de Serviço",
        privacyPolicy: "Política de Privacidade",
        close: "Fechar",
        loadingDocument: "Carregando documento legal...",
        resubscribe: "Reativar Assinatura"
      },
      fr: {
        email: "Email",
        password: "Mot de passe",
        signIn: "Se connecter",
        signUp: "S'inscrire",
        dontHaveAccount: "Vous n'avez pas de compte ?",
        continueWithApple: "iOS Bientôt Disponible",
        continueWithGoogle: "G   Continuer avec Google",
        staySignedIn: "Rester connecté",
        legalPrefix: "En vous connectant, vous acceptez nos ",
        legalConnector: " et notre ",
        legalSuffix: ".",
        termsOfService: "Conditions d'utilisation",
        privacyPolicy: "Politique de confidentialité",
        close: "Fermer",
        loadingDocument: "Chargement du document légal...",
        resubscribe: "Réabonner"
      },
      de: {
        email: "E-Mail",
        password: "Passwort",
        signIn: "Anmelden",
        signUp: "Registrieren",
        dontHaveAccount: "Haben Sie kein Konto?",
        continueWithApple: "iOS Bald Verfügbar",
        continueWithGoogle: "G   Mit Google fortfahren",
        staySignedIn: "Angemeldet bleiben",
        legalPrefix: "Durch die Anmeldung stimmen Sie unseren ",
        legalConnector: " und unserer ",
        legalSuffix: " zu.",
        termsOfService: "Nutzungsbedingungen",
        privacyPolicy: "Datenschutzerklärung",
        close: "Schließen",
        loadingDocument: "Rechtlichen Text laden...",
        resubscribe: "Erneut Abonnieren"
      },
      zh: {
        email: "邮箱",
        password: "密码",
        signIn: "登录",
        signUp: "注册",
        dontHaveAccount: "没有账户？",
        continueWithApple: "iOS 即将推出",
        continueWithGoogle: "G   使用 Google 继续",
        staySignedIn: "保持登录",
        legalPrefix: "登录即表示您同意我们的",
        legalConnector: "和",
        legalSuffix: "。",
        termsOfService: "服务条款",
        privacyPolicy: "隐私政策",
        close: "关闭",
        loadingDocument: "正在加载法律文档...",
        resubscribe: "重新订阅"
      }
    };
    return translations[lang as keyof typeof translations] || translations.en;
  };

  const t = getTranslations(selectedLanguage);

  const handleOpenLegal = async (type: 'terms' | 'privacy') => {
    try {
      setLegalModalVisible(true);
      setLegalModalLoading(true);
      setLegalModalContent('');
      if (type === 'terms') {
        setLegalModalTitle(t.termsOfService);
        const content = await loadTermsText(selectedLanguage);
        setLegalModalContent(content);
      } else {
        setLegalModalTitle(t.privacyPolicy);
        const content = await loadPrivacyText(selectedLanguage);
        setLegalModalContent(content);
      }
    } catch (error) {
      console.error('Failed to load legal document:', error);
      Alert.alert('Error', 'Unable to load legal document. Please try again later.');
      setLegalModalVisible(false);
    } finally {
      setLegalModalLoading(false);
    }
  };

  const handleCloseLegalModal = () => {
    setLegalModalVisible(false);
    setLegalModalContent('');
  };

  if (showSignUpForm) {
    return (
      <SignUpForm 
        onGoogleSuccess={onAuthSuccess}
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
        <Modal
          visible={legalModalVisible}
          transparent
          animationType="slide"
          onRequestClose={handleCloseLegalModal}
        >
          <View style={styles.legalModalBackdrop}>
            <View style={styles.legalModalContainer}>
              <View style={styles.legalModalHeader}>
                <Text style={styles.legalModalTitle}>{legalModalTitle}</Text>
                <TouchableOpacity onPress={handleCloseLegalModal}>
                  <Text style={styles.legalModalClose}>{t.close}</Text>
                </TouchableOpacity>
              </View>
              {legalModalLoading ? (
                <View style={styles.legalModalLoadingContainer}>
                  <ActivityIndicator size="large" color={GOLD.a400} />
                  <Text style={styles.legalModalLoadingText}>{t.loadingDocument}</Text>
                </View>
              ) : (
                <ScrollView style={styles.legalModalScroll} showsVerticalScrollIndicator>
                  <Text style={styles.legalModalText}>{legalModalContent}</Text>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

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



        {/* ===== Header (logo/title) ===== */}
        <View style={styles.header}>
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
            <View style={styles.passwordContainer}>
              <TextInput
                value={pw}
                onChangeText={setPw}
                placeholder={t.password}
                placeholderTextColor="#CBA24F"
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
              />
              <TouchableOpacity
                onPressIn={() => setShowPassword(true)}
                onPressOut={() => setShowPassword(false)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeIcon}>👁</Text>
              </TouchableOpacity>
            </View>
          </GoldOutline>

          <View style={{ height: 18 }} />

          {/* Stay Signed In Toggle */}
          <View style={styles.staySignedInContainer}>
            <TouchableOpacity 
              style={styles.staySignedInToggle}
              onPress={() => setStaySignedIn(!staySignedIn)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox, 
                { backgroundColor: staySignedIn ? GOLD.a500 : 'transparent' }
              ]}>
                {staySignedIn && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.staySignedInText}>{t.staySignedIn}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 16 }} />

          <GoldButton 
            title={loading ? "Loading..." : t.signIn} 
            onPress={onSignIn} 
            disabled={loading || googleLoading}
          />

          <GoogleAuthButton language={selectedLanguage} loading={googleLoading}
            disabled={loading || googleLoading} onPress={handleGoogleSignIn} />
          <View style={{ height: 20 }} />

          {/* Resubscribe Button - Shows when subscription is cancelled/expired */}
          {onResubscribe && (
            <>
              <TouchableOpacity
                onPress={onResubscribe}
                style={styles.resubscribeButton}
                activeOpacity={0.8}
              >
                <Text style={styles.resubscribeText}>
                  {t.resubscribe || 'Resubscribe'}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 16 }} />
            </>
          )}

          <View style={styles.signUpContainer}>
            <Text style={styles.signUp}>
              {t.dontHaveAccount}{" "}
              <Text 
                style={styles.signUpLink}
                onPress={() => { if (!loading && !googleLoading) setShowSignUpForm(true); }}
              >
                {t.signUp}
              </Text>
            </Text>
          </View>

          <View style={{ height: 18 }} />
          <Text style={styles.legalText}>
            {t.legalPrefix}
            <Text style={styles.legalLink} onPress={() => handleOpenLegal('terms')}>
              {t.termsOfService}
            </Text>
            {t.legalConnector}
            <Text style={styles.legalLink} onPress={() => handleOpenLegal('privacy')}>
              {t.privacyPolicy}
            </Text>
            {t.legalSuffix}
          </Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- Top slit that shines down like a cone onto the logo ---------- */
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

function GoldRow({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  if (onPress) {
    return (
      <TouchableOpacity style={styles.goldRow} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }
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
  safe: { flex: 1, backgroundColor: darkColors.bg },
  container: { flex: 1, backgroundColor: darkColors.bg, alignItems: "center" },

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
    color: darkColors.text,
    borderRadius: 16,
    backgroundColor: darkColors.card,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkColors.card,
    borderRadius: 16,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: darkColors.text,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 20,
    opacity: 0.5,
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
  rowText: { color: darkColors.text, fontSize: 15 },

  signUpContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  signUp: { 
    color: darkColors.text, 
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
  resubscribeButton: {
    backgroundColor: GOLD.a500,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GOLD.y600,
    shadowColor: GOLD.a500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  resubscribeText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },

  legal: { color: "#AAAAAA", textAlign: "center", fontSize: 12, lineHeight: 18 },
  
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // Stay Signed In styles
  staySignedInContainer: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  staySignedInToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: GOLD.a500,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  staySignedInText: {
    color: '#CBA24F',
    fontSize: 14,
    fontWeight: '500',
  },
  legalText: {
    color: '#CBA24F',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  legalLink: {
    color: GOLD.a300,
    textDecorationLine: 'underline',
  },
  legalModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  legalModalContainer: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 16,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(252, 211, 77, 0.3)'
  },
  legalModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  legalModalTitle: {
    color: GOLD.a200,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  legalModalClose: {
    color: GOLD.a400,
    fontSize: 14,
  },
  legalModalScroll: {
    maxHeight: '80%',
  },
  legalModalText: {
    color: '#F1DDA5',
    fontSize: 12,
    lineHeight: 18,
  },
  legalModalLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  legalModalLoadingText: {
    color: '#E9C978',
    marginTop: 12,
    fontSize: 12,
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
    color: darkColors.text,
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
