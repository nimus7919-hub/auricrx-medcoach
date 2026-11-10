import Modal from '../components/BackModal';
import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import Svg, { Defs, RadialGradient, Stop, Rect, Line, Path } from 'react-native-svg';
import AuricWordmark from '../components/AuricWordmark';
import { vip } from '../theme/vip';
import { showSuccessToast } from '../components/SuccessToast';
import useTranslation from '../hooks/useTranslation';
import { gold as GOLD } from '../theme/colors';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, SafeAreaView, Alert, ScrollView, KeyboardAvoidingView, ActivityIndicator } from 'react-native';

// Expo:
import { LinearGradient } from "expo-linear-gradient";

import SignUpForm from "./SignUpForm";
import GoogleAuthButton, { googleAuthText } from "../components/GoogleAuthButton";
import authService from '../services/authService';
import { loadPrivacyText, loadTermsText } from '../services/legalService';

/** ====== GOLD PALETTE ====== */




export default function SignInScreen({ navigation, onAuthSuccess, onClose, onLanguageChange, resetToSignIn, onResubscribe }: any) {
  useUILanguage();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpForm, setShowSignUpForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { currentLanguage, changeLanguage } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || 'es');
  useEffect(() => { if (currentLanguage) setSelectedLanguage(currentLanguage.split('-')[0]); }, [currentLanguage]);
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
      Alert.alert(uiI18n.t("adminProfile.error"), uiI18n.t("ui.pleaseFillInAllFields"));
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
        }).catch((e: unknown) => console.error('Failed to log crash:', e));
      } catch (e) {
        console.error('Failed to import CrashLogger:', e);
      }
      Alert.alert(uiI18n.t("adminProfile.error"), uiI18n.t("ui.authenticationFailedPleaseTryAgain"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) return;
    setGoogleLoading(true);
    try {
      const result = await authService.signInWithGoogle();
      if (!result.success || !('user' in result)) {
        Alert.alert(uiI18n.t("adminProfile.error"), result.error || googleAuthText(selectedLanguage).error);
        return;
      }
      await onAuthSuccess({ provider: 'google', user: result.user });
    } catch (error) {
      console.error('Google sign-in failed:', error);
      Alert.alert(uiI18n.t("adminProfile.error"), googleAuthText(selectedLanguage).error);
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
    } else {
      changeLanguage(lang);
    }
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'en': return uiI18n.t("settings.languages.en");
      case 'es': return uiI18n.t("settings.languages.es");
      case 'pt': return uiI18n.t("settings.languages.pt");
      case 'fr': return uiI18n.t("settings.languages.fr");
      case 'de': return uiI18n.t("settings.languages.de");
      case 'zh': return '中文';
      default: return uiI18n.t("settings.languages.en");
    }
  };

  // Translation system
  const getTranslations = (lang: string) => {
    
    return uiI18n.t('authSignIn', { lng: lang, returnObjects: true }) as Record<string, string>;
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
      Alert.alert(uiI18n.t("adminProfile.error"), uiI18n.t("ui.unableToLoadLegalDocumentPleaseTryAgainLater"));
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

  const copy = { resetSent: uiI18n.t("localized.SignInScreen.copy.resetSent.text175"), ...(loginCopy[selectedLanguage] || loginCopy.en) };
  return (
    <SafeAreaView style={styles.safe}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 780">
          <Defs><RadialGradient id="halo" cx="50%" cy="20%" rx="42%" ry="22%"><Stop offset="0" stopColor="#AF792D" stopOpacity="0.48"/><Stop offset="1" stopColor={vip.colors.navy} stopOpacity="0"/></RadialGradient></Defs>
          <Rect width="400" height="780" fill={vip.colors.navy}/>
          {Array.from({length: 24}, (_, i) => <Line key={i} x1={-400 + i * 35} y1="610" x2={100 + i * 35} y2="70" stroke={vip.colors.gold} strokeOpacity={i % 4 === 0 ? 0.16 : 0.06} strokeWidth="0.6"/>)}
          <Rect width="400" height="780" fill="url(#halo)"/>
        </Svg>
      </View>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
                <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled" style={styles.legalModalScroll} showsVerticalScrollIndicator>
                  <Text style={styles.legalModalText}>{legalModalContent}</Text>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
        <Modal visible={showLanguageDropdown} transparent animationType="fade" onRequestClose={() => setShowLanguageDropdown(false)}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} accessibilityLabel={t.close} onPress={() => setShowLanguageDropdown(false)}/>
            <View style={styles.languageDropdown} accessibilityViewIsModal>
              {['es', 'en', 'pt', 'fr', 'de', 'zh'].map(lang => <TouchableOpacity key={lang} style={styles.languageOption} accessibilityRole="radio" accessibilityState={{selected: lang === selectedLanguage}} onPress={() => handleLanguageChange(lang)}>
                <Text style={styles.languageOptionText}>{getLanguageLabel(lang)}</Text><Text style={styles.link}>{lang === selectedLanguage ? '?' : lang.toUpperCase()}</Text>
              </TouchableOpacity>)}
            </View>
          </View>
        </Modal>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}><TouchableOpacity accessibilityRole="button" accessibilityLabel={copy.language} style={styles.languageSelector} onPress={() => setShowLanguageDropdown(true)}>
            <Feather name="globe" color={vip.colors.gold} size={19}/><Text style={styles.languageSelectorText}>{selectedLanguage.toUpperCase()}</Text><Feather name="chevron-down" size={15} color={vip.colors.gold}/>
          </TouchableOpacity></View>
          <View style={styles.header}><View style={styles.wordmark}><AuricWordmark/></View><Text style={styles.subtitle}>RX MEDCOACH</Text><Text style={styles.tagline}>{copy.tagline}</Text></View>
          <View style={styles.card}>
            <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFill}/>
            <LinearGradient colors={['rgba(255,235,196,0.035)', 'rgba(3,18,32,0.65)']} style={StyleSheet.absoluteFill}/>
            <GoogleAuthButton variant="vip" language={selectedLanguage} loading={googleLoading} disabled={loading || googleLoading} onPress={handleGoogleSignIn}/>
            <View style={styles.divider}><View style={styles.line}/><Text style={styles.or}>{copy.or}</Text><View style={styles.line}/></View>
            <View style={styles.field}><Feather name="mail" color={vip.colors.gold} size={27}/><View style={styles.fieldBody}><Text style={styles.label}>{copy.email}</Text><TextInput accessibilityLabel={copy.email} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" style={styles.input}/></View></View>
            <View style={styles.field}><Feather name="lock" color={vip.colors.gold} size={28}/><View style={styles.fieldBody}><Text style={styles.label}>{t.password}</Text><TextInput accessibilityLabel={t.password} value={pw} onChangeText={setPw} secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="current-password" style={styles.input}/></View></View>
            <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:8}}>
              <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{checked:staySignedIn}} onPress={() => setStaySignedIn(!staySignedIn)} style={{minHeight:28,justifyContent:'center'}}><Text style={{color:vip.colors.gold,fontSize:11}}>{staySignedIn ? '?' : '?'} {t.staySignedIn}</Text></TouchableOpacity>
              <TouchableOpacity accessibilityLabel={t.password} accessibilityState={{selected:showPassword}} onPressIn={() => setShowPassword(true)} onPressOut={() => setShowPassword(false)} style={{minWidth:32,minHeight:28,alignItems:'center',justifyContent:'center'}}><Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={vip.colors.gold}/></TouchableOpacity>
            </View>
            <TouchableOpacity accessibilityRole="button" disabled={loading || googleLoading} onPress={onSignIn} activeOpacity={0.85} style={[styles.goldButton, (loading || googleLoading) && {opacity: 0.6}]}><LinearGradient colors={['#F7D798', '#C18B3D', '#ECC77E', '#AD752B']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.goldContent}><LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']} style={styles.buttonGloss}/><Text style={styles.goldText}>{loading ? copy.loading : copy.signIn}</Text></LinearGradient></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.forgot} onPress={async () => { if (!email.trim()) { Alert.alert(copy.forgot, copy.resetHelp); return; } const result = await authService.resetPassword(email.trim()); if (result.success) { showSuccessToast(copy.resetSent); } else { Alert.alert(copy.forgot, googleAuthText(selectedLanguage).error); } }}><Text style={styles.link}>{copy.forgot}</Text></TouchableOpacity>
            {onResubscribe && <TouchableOpacity onPress={onResubscribe} style={styles.forgot}><Text style={styles.link}>{t.resubscribe}</Text></TouchableOpacity>}
          </View>
          <Text style={styles.signUp}>{copy.newHere} <Text accessibilityRole="button" style={styles.link} onPress={() => { if (!loading && !googleLoading) setShowSignUpForm(true); }}>{copy.createAccount}</Text></Text>
          <Text style={styles.legal}><Text accessibilityRole="link" onPress={() => handleOpenLegal('terms')}>{copy.terms}</Text> {'·'} <Text accessibilityRole="link" onPress={() => handleOpenLegal('privacy')}>{copy.privacy}</Text></Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const loginCopy: Record<string, any> = { get es() { return uiI18n.t("localized.SignInScreen.loginCopy", { lng: 'es', returnObjects: true }) as any; }, get en() { return uiI18n.t("localized.SignInScreen.loginCopy", { lng: 'en', returnObjects: true }) as any; }, get pt() { return uiI18n.t("localized.SignInScreen.loginCopy", { lng: 'pt', returnObjects: true }) as any; }, get fr() { return uiI18n.t("localized.SignInScreen.loginCopy", { lng: 'fr', returnObjects: true }) as any; }, get de() { return uiI18n.t("localized.SignInScreen.loginCopy", { lng: 'de', returnObjects: true }) as any; }, get zh() { return uiI18n.t("localized.SignInScreen.loginCopy", { lng: 'zh', returnObjects: true }) as any; } };
const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:vip.colors.navy}, container:{flex:1},
  scrollContent:{flexGrow:1,alignItems:'center',paddingHorizontal:vip.spacing.lg,paddingBottom:20},
  topRow:{width:'100%',alignItems:'flex-end',paddingTop:18},
  languageSelector:{flexDirection:'row',alignItems:'center',gap:12,borderWidth:0.7,borderColor:vip.colors.gold,borderRadius:15,paddingHorizontal:13,minHeight:38,backgroundColor:'rgba(15,25,37,0.75)'},
  languageSelectorText:{color:vip.colors.white,fontSize:17},
  header:{width:'100%',maxWidth:320,alignItems:'center',marginTop:62,marginBottom:40},
  wordmark:{width:'100%',aspectRatio:440/128}, subtitle:{color:vip.colors.white,fontSize:20,letterSpacing:6,marginTop:7},
  tagline:{color:vip.colors.gold,fontSize:18,fontStyle:'italic',marginTop:8},
  card:{width:'100%',maxWidth:380,borderWidth:0.7,borderColor:vip.colors.gold,borderRadius:24,padding:22,paddingTop:24,paddingBottom:20,overflow:'hidden',backgroundColor:'rgba(3,16,28,0.78)'},
  divider:{flexDirection:'row',alignItems:'center',gap:9,marginTop:10,marginBottom:8},line:{flex:1,height:0.7,backgroundColor:vip.colors.line},or:{color:vip.colors.white,fontSize:16},
  field:{flexDirection:'row',alignItems:'center',gap:14,marginBottom:16},fieldBody:{flex:1,borderBottomWidth:0.7,borderColor:vip.colors.line},label:{color:vip.colors.white,fontSize:15},input:{color:vip.colors.white,fontSize:16,minHeight:34,paddingVertical:5},
  goldButton:{borderRadius:vip.radius.button,padding:1,borderWidth:1,borderColor:'#F3D399',overflow:'hidden',marginTop:3,backgroundColor:'#A7732D',shadowColor:'#000',shadowOpacity:0.3,shadowRadius:5,shadowOffset:{width:0,height:4},elevation:3},buttonGloss:{position:'absolute',top:0,left:0,right:0,height:'48%',borderRadius:16},goldContent:{minHeight:48,borderRadius:16,alignItems:'center',justifyContent:'center',borderWidth:0.7,borderColor:'#FFE5A2'},goldText:{fontSize:20,color:'#10100E',fontWeight:'600'},
  forgot:{alignItems:'center',paddingTop:14,paddingBottom:0,minHeight:30},link:{color:vip.colors.gold,fontSize:15},signUp:{color:vip.colors.white,fontSize:16,textAlign:'center',marginTop:19},legal:{color:vip.colors.muted,fontSize:12,textAlign:'center',marginTop:22},
  modalOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'center',padding:28},languageDropdown:{backgroundColor:vip.colors.navy,borderColor:vip.colors.gold,borderWidth:1,borderRadius:20,padding:12},languageOption:{minHeight:48,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16},languageOptionText:{color:vip.colors.white,fontSize:17},
  legalModalBackdrop:{flex:1,backgroundColor:'rgba(0,0,0,0.8)',justifyContent:'center',padding:20},legalModalContainer:{backgroundColor:vip.colors.navy,borderRadius:20,padding:20,maxHeight:'85%',borderWidth:1,borderColor:vip.colors.gold},legalModalHeader:{flexDirection:'row',alignItems:'center',marginBottom:16},legalModalTitle:{flex:1,color:vip.colors.gold,fontSize:18},legalModalClose:{color:vip.colors.gold},legalModalLoadingContainer:{padding:24,alignItems:'center'},legalModalLoadingText:{color:vip.colors.white,marginTop:12},legalModalScroll:{flexShrink:1},legalModalText:{color:vip.colors.white,fontSize:14,lineHeight:22},
});
