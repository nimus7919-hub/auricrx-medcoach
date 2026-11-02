import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  FlatList,
  Modal,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import authService from '../services/authService';
import GoogleAuthButton, { googleAuthText } from '../components/GoogleAuthButton';
import ConsentChoices from '../components/ConsentChoices';
import { loadPrivacyText, loadTermsText } from '../services/legalService';

// Gold palette
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

interface SignUpFormProps {
  onSignUp: (userData: any) => void;
  onGoogleSuccess: (data: any) => Promise<void>;
  onClose: () => void;
  onLanguageChange?: (lang: string) => void;
  selectedLanguage?: string;
}

export default function SignUpForm({ onGoogleSuccess, onSignUp, onClose, onLanguageChange, selectedLanguage = 'es' }: SignUpFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    age: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(selectedLanguage);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [consents, setConsents] = useState({ terms: false, privacy: false, health: false });
  const agreedToTerms = consents.terms && consents.privacy;
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalModalTitle, setLegalModalTitle] = useState('');
  const [legalModalContent, setLegalModalContent] = useState('');
  const [legalModalLoading, setLegalModalLoading] = useState(false);

  const generateUniqueId = () => {
    return "AUR" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };

  // Country data
  const countries = {
    US: { code: '+1', name: 'United States', flag: '🇺🇸' },
    CA: { code: '+1', name: 'Canada', flag: '🇨🇦' },
    MX: { code: '+52', name: 'Mexico', flag: '🇲🇽' },
    BR: { code: '+55', name: 'Brazil', flag: '🇧🇷' },
    AR: { code: '+54', name: 'Argentina', flag: '🇦🇷' },
    CO: { code: '+57', name: 'Colombia', flag: '🇨🇴' },
    PE: { code: '+51', name: 'Peru', flag: '🇵🇪' },
    CL: { code: '+56', name: 'Chile', flag: '🇨🇱' },
    VE: { code: '+58', name: 'Venezuela', flag: '🇻🇪' },
    EC: { code: '+593', name: 'Ecuador', flag: '🇪🇨' },
    BO: { code: '+591', name: 'Bolivia', flag: '🇧🇴' },
    UY: { code: '+598', name: 'Uruguay', flag: '🇺🇾' },
    PY: { code: '+595', name: 'Paraguay', flag: '🇵🇾' },
    PA: { code: '+507', name: 'Panama', flag: '🇵🇦' },
    FR: { code: '+33', name: 'France', flag: '🇫🇷' },
    DE: { code: '+49', name: 'Germany', flag: '🇩🇪' },
    CN: { code: '+86', name: 'China', flag: '🇨🇳' }
  };

  const getCountryLabel = (countryCode: string) => {
    const country = countries[countryCode];
    return `${country.flag} ${country.name}`;
  };

  // Country phone number length mapping (NSN length excluding country code)
  // Based on ITU-T E.164 standard
  const countryPhoneLengths: Record<string, number> = {
    US: 10,  // United States
    CA: 10,  // Canada
    MX: 10,  // Mexico
    BR: 10,  // Brazil
    AR: 10,  // Argentina
    CO: 10,  // Colombia
    PE: 9,   // Peru
    CL: 9,   // Chile
    VE: 10,  // Venezuela
    EC: 9,   // Ecuador
    GT: 8,   // Guatemala
    CR: 8,   // Costa Rica
    PA: 8,   // Panama
    DO: 10,  // Dominican Republic
    CU: 8,   // Cuba
    BO: 8,   // Bolivia
    PY: 9,   // Paraguay
    UY: 8,   // Uruguay
    SV: 8,   // El Salvador
    HN: 8,   // Honduras
    NI: 8,   // Nicaragua
    PR: 10,  // Puerto Rico
    FR: 9,   // France
    DE: 10,  // Germany
    CN: 11,  // China
  };

  // Common valid TLDs (Top Level Domains)
  const validTLDs = [
    // Generic TLDs
    'com', 'net', 'org', 'edu', 'gov', 'mil', 'int',
    // Country code TLDs (common ones)
    'us', 'uk', 'ca', 'mx', 'br', 'ar', 'co', 'pe', 'cl', 've', 'ec', 'bo', 'uy', 'py', 'pa',
    'fr', 'de', 'es', 'it', 'nl', 'be', 'ch', 'at', 'se', 'no', 'dk', 'fi', 'pl', 'pt', 'ie',
    'au', 'nz', 'jp', 'cn', 'kr', 'in', 'sg', 'my', 'th', 'ph', 'id', 'vn', 'hk', 'tw',
    'za', 'eg', 'ng', 'ke', 'ae', 'sa', 'il', 'tr', 'ru', 'ua', 'gr', 'cz', 'ro', 'hu',
    // New gTLDs (common ones)
    'io', 'ai', 'co', 'tv', 'me', 'app', 'dev', 'tech', 'online', 'site', 'website', 'store',
    'shop', 'blog', 'info', 'biz', 'name', 'pro', 'xyz', 'cloud', 'email', 'mail', 'news',
  ];

  // Common TLD typos and their corrections
  const tldTypos: Record<string, string> = {
    'con': 'com',
    'comn': 'com',
    'cpm': 'com',
    'coom': 'com',
    'comm': 'com',
    'c0m': 'com',
    'net': 'net', // valid, but check for typos
    'nett': 'net',
    'nrt': 'net',
    'org': 'org', // valid, but check for typos
    'orgg': 'org',
    'ogr': 'org',
    'cm': 'com',
    'om': 'com',
    'c': 'com', // single letter, likely typo
  };

  // Validate email format and check for common typos
  const validateEmail = (email: string): { valid: boolean; error?: string } => {
    if (!email.trim()) {
      return { valid: false, error: 'Email is required' };
    }

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }

    // Check for double dots or invalid characters
    if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
      return { valid: false, error: 'Please enter a valid email address' };
    }

    // Parse domain and TLD
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return { valid: false, error: 'Please enter a valid email address' };
    }

    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
      return { valid: false, error: 'Please enter a valid email address' };
    }

    const tld = domainParts[domainParts.length - 1];
    const baseDomain = domainParts.slice(0, -1).join('.');

    // Check for common domain typos (full domain)
    const commonDomains: Record<string, string> = {
      'gmail.comn': 'gmail.com',
      'gmail.co': 'gmail.com',
      'gmail.con': 'gmail.com',
      'gmail.cm': 'gmail.com',
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gmaill.com': 'gmail.com',
      'gmail.coom': 'gmail.com',
      'yahoo.co': 'yahoo.com',
      'yahoo.con': 'yahoo.com',
      'yahoo.comn': 'yahoo.com',
      'yahoo.cm': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'hotmail.co': 'hotmail.com',
      'hotmail.con': 'hotmail.com',
      'hotmail.comn': 'hotmail.com',
      'hotmail.cm': 'hotmail.com',
      'hotmai.com': 'hotmail.com',
      'outlook.co': 'outlook.com',
      'outlook.con': 'outlook.com',
      'outlook.comn': 'outlook.com',
      'outlook.cm': 'outlook.com',
      'outlok.com': 'outlook.com',
      'icloud.co': 'icloud.com',
      'icloud.con': 'icloud.com',
      'icloud.comn': 'icloud.com',
      'aol.co': 'aol.com',
      'aol.con': 'aol.com',
      'aol.comn': 'aol.com',
    };

    // Check for full domain typos first
    if (commonDomains[domain]) {
      const correctDomain = commonDomains[domain];
      return { 
        valid: false, 
        error: `Did you mean ${email.split('@')[0]}@${correctDomain}?` 
      };
    }

    // Validate TLD
    // Check if TLD is too short (likely a typo)
    if (tld.length < 2) {
      return { 
        valid: false, 
        error: `Invalid domain extension. Did you mean ${baseDomain}.com?` 
      };
    }

    // Check for TLD typos
    if (tldTypos[tld]) {
      const correctTLD = tldTypos[tld];
      if (correctTLD !== tld) {
        return { 
          valid: false, 
          error: `Invalid domain extension. Did you mean ${baseDomain}.${correctTLD}?` 
        };
      }
    }

    // Check if TLD is in valid list (case-insensitive)
    const normalizedTLD = tld.toLowerCase();
    if (!validTLDs.includes(normalizedTLD)) {
      // Check if it's a close match to a valid TLD
      const closeMatch = validTLDs.find(validTLD => {
        // Check if TLD is one character off from a valid TLD
        if (normalizedTLD.length === validTLD.length) {
          let diff = 0;
          for (let i = 0; i < normalizedTLD.length; i++) {
            if (normalizedTLD[i] !== validTLD[i]) diff++;
          }
          return diff === 1;
        }
        // Check if TLD has one extra/missing character
        if (Math.abs(normalizedTLD.length - validTLD.length) === 1) {
          const shorter = normalizedTLD.length < validTLD.length ? normalizedTLD : validTLD;
          const longer = normalizedTLD.length > validTLD.length ? normalizedTLD : validTLD;
          return longer.startsWith(shorter) || longer.endsWith(shorter);
        }
        return false;
      });

      if (closeMatch) {
        return { 
          valid: false, 
          error: `Invalid domain extension. Did you mean ${baseDomain}.${closeMatch}?` 
        };
      }

      return { 
        valid: false, 
        error: `Invalid domain extension (.${tld}). Please use a valid domain extension like .com, .net, .org, etc.` 
      };
    }

    return { valid: true };
  };

  // Validate phone number length based on country
  const validatePhoneNumber = (phone: string, countryCode: string): { valid: boolean; error?: string } => {
    if (!phone.trim()) {
      return { valid: false, error: 'Phone number is required' };
    }

    // Remove any non-digit characters for length check
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Get expected length for country
    const expectedLength = countryPhoneLengths[countryCode];
    
    if (!expectedLength) {
      // If country not in list, allow 8-15 digits (international standard)
      if (digitsOnly.length < 8 || digitsOnly.length > 15) {
        return { valid: false, error: 'Please enter a valid phone number (8-15 digits)' };
      }
      return { valid: true };
    }

    // Check if length matches expected length
    if (digitsOnly.length !== expectedLength) {
      return { 
        valid: false, 
        error: `Phone number must be ${expectedLength} digits for ${countries[countryCode]?.name || countryCode}` 
      };
    }

    return { valid: true };
  };

  const formatPhoneNumber = (phone: string, countryCode: string) => {
    const country = countries[countryCode];
    if (!phone) return '';
    
    // Remove any existing country code
    let cleanPhone = phone.replace(/^\+\d{1,3}/, '');
    
    // Add country code
    return `${country.code}${cleanPhone}`;
  };

  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push("At least 8 characters");
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("At least 1 uppercase letter");
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("At least 1 lowercase letter");
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("At least 1 special character");
    }
    
    return errors;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { firstName, lastName, username, email, password, confirmPassword, phoneNumber, age } = formData;
    
    // Age validation
    if (!age.trim()) {
      Alert.alert('Error', t.ageRequired);
      return false;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18) {
      Alert.alert('Error', t.ageRestrictionError);
      return false;
    }
    
    if (!firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert('Error', 'Last name is required');
      return false;
    }
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return false;
    }
    // Email validation with typo checking
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      Alert.alert('Invalid Email', emailValidation.error || 'Please enter a valid email address');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Password is required');
      return false;
    }
    // Check password requirements
    const passwordValidationErrors = validatePassword(password);
    if (passwordValidationErrors.length > 0) {
      Alert.alert('Password Requirements', passwordValidationErrors.join('\n'));
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    // Phone number validation based on country
    const phoneValidation = validatePhoneNumber(phoneNumber, selectedCountry);
    if (!phoneValidation.valid) {
      Alert.alert('Invalid Phone Number', phoneValidation.error || 'Please enter a valid phone number');
      return false;
    }
    if (!agreedToTerms) {
      Alert.alert('Error', t.consentRequired);
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const uniqueId = generateUniqueId();
      const formattedPhone = formatPhoneNumber(formData.phoneNumber, selectedCountry);
      
      const userData = {
        consents,
        ...formData,
        age: parseInt(formData.age, 10),
        phoneNumber: formattedPhone,
        country: selectedCountry,
        uniqueId,
        createdAt: new Date().toISOString(),
      };
      
      console.log('Sign up data:', userData);
      await onSignUp(userData);
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('Error', `Sign up failed: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Update language when prop changes
  React.useEffect(() => {
    setCurrentLanguage(selectedLanguage);
  }, [selectedLanguage]);

  // Translation system for sign-up form
  const getTranslations = (lang: string) => {
    const translations = {
      en: {
        createAccount: "Create Account",
        joinAuricRX: "Join AuricRX today",
        firstName: "First Name",
        lastName: "Last Name",
        username: "Username",
        email: "Email",
        password: "Password",
        confirmPassword: "Re-enter Password",
        phoneNumber: "Phone Number",
        createAccountButton: "Create Account",
        creatingAccount: "Creating Account...",
        cancel: "Cancel",
        passwordRequirements: "Password must contain:",
        enterFirstName: "Enter first name",
        enterLastName: "Enter last name",
        chooseUsername: "Choose a username",
        enterEmail: "Enter your email",
        createPassword: "Create a password",
        confirmPassword: "Confirm your password",
        enterPhone: "Enter your phone number",
        viewTerms: "View Terms of Service",
        viewPrivacy: "View Privacy Policy",
        consentRequired: "You must agree to the Terms of Service and Privacy Policy to continue.",
        termsOfService: "Terms of Service",
        privacyPolicy: "Privacy Policy",
        close: "Close",
        loadingDocument: "Loading legal document...",
        ageRestriction: "To use this app, you must be 18 years or older",
        age: "Age",
        enterAge: "Enter your age",
        ageRequired: "Age is required",
        ageRestrictionError: "You must be at least 18 years old to use this app"
      },
      es: {
        createAccount: "Crear Cuenta",
        joinAuricRX: "Únete a AuricRX hoy",
        firstName: "Nombre",
        lastName: "Apellido",
        username: "Nombre de Usuario",
        email: "Correo",
        password: "Contraseña",
        confirmPassword: "Confirmar Contraseña",
        phoneNumber: "Número de Teléfono",
        createAccountButton: "Crear Cuenta",
        creatingAccount: "Creando Cuenta...",
        cancel: "Cancelar",
        passwordRequirements: "La contraseña debe contener:",
        enterFirstName: "Ingresa tu nombre",
        enterLastName: "Ingresa tu apellido",
        chooseUsername: "Elige un nombre de usuario",
        enterEmail: "Ingresa tu correo",
        createPassword: "Crea una contraseña",
        confirmPassword: "Confirma tu contraseña",
        enterPhone: "Ingresa tu número de teléfono",
        viewTerms: "Ver Términos de Servicio",
        viewPrivacy: "Ver Política de Privacidad",
        consentRequired: "Debes aceptar los Términos de Servicio y la Política de Privacidad para continuar.",
        termsOfService: "Términos de Servicio",
        privacyPolicy: "Política de Privacidad",
        close: "Cerrar",
        loadingDocument: "Cargando documento legal...",
        ageRestriction: "Para usar esta aplicación, debes tener 18 años o más",
        age: "Edad",
        enterAge: "Ingresa tu edad",
        ageRequired: "La edad es requerida",
        ageRestrictionError: "Debes tener al menos 18 años para usar esta aplicación"
      },
      pt: {
        createAccount: "Criar Conta",
        joinAuricRX: "Junte-se ao AuricRX hoje",
        firstName: "Nome",
        lastName: "Sobrenome",
        username: "Nome de Usuário",
        email: "Email",
        password: "Senha",
        confirmPassword: "Confirmar Senha",
        phoneNumber: "Número de Telefone",
        createAccountButton: "Criar Conta",
        creatingAccount: "Criando Conta...",
        cancel: "Cancelar",
        passwordRequirements: "A senha deve conter:",
        enterFirstName: "Digite seu nome",
        enterLastName: "Digite seu sobrenome",
        chooseUsername: "Escolha um nome de usuário",
        enterEmail: "Digite seu email",
        createPassword: "Crie uma senha",
        confirmPassword: "Confirme sua senha",
        enterPhone: "Digite seu número de telefone",
        viewTerms: "Ver Termos de Serviço",
        viewPrivacy: "Ver Política de Privacidade",
        consentRequired: "Você deve aceitar os Termos de Serviço e a Política de Privacidade para continuar.",
        termsOfService: "Termos de Serviço",
        privacyPolicy: "Política de Privacidade",
        close: "Fechar",
        loadingDocument: "Carregando documento legal...",
        ageRestriction: "Para usar este aplicativo, você deve ter 18 anos ou mais",
        age: "Idade",
        enterAge: "Digite sua idade",
        ageRequired: "A idade é obrigatória",
        ageRestrictionError: "Você deve ter pelo menos 18 anos para usar este aplicativo"
      },
      fr: {
        createAccount: "Créer un compte",
        joinAuricRX: "Rejoignez AuricRX aujourd'hui",
        firstName: "Prénom",
        lastName: "Nom de famille",
        username: "Nom d'utilisateur",
        email: "Email",
        password: "Mot de passe",
        confirmPassword: "Confirmer le mot de passe",
        phoneNumber: "Numéro de téléphone",
        createAccountButton: "Créer un compte",
        creatingAccount: "Création du compte...",
        cancel: "Annuler",
        passwordRequirements: "Le mot de passe doit contenir :",
        enterFirstName: "Entrez votre prénom",
        enterLastName: "Entrez votre nom de famille",
        chooseUsername: "Choisissez un nom d'utilisateur",
        enterEmail: "Entrez votre email",
        createPassword: "Créez un mot de passe",
        confirmPassword: "Confirmez votre mot de passe",
        enterPhone: "Entrez votre numéro de téléphone",
        viewTerms: "Voir les Conditions d'utilisation",
        viewPrivacy: "Voir la Politique de confidentialité",
        consentRequired: "Vous devez accepter les Conditions d'utilisation et la Politique de confidentialité pour continuer.",
        termsOfService: "Conditions d'utilisation",
        privacyPolicy: "Politique de confidentialité",
        close: "Fermer",
        loadingDocument: "Chargement du document légal...",
        ageRestriction: "Pour utiliser cette application, vous devez avoir 18 ans ou plus",
        age: "Âge",
        enterAge: "Entrez votre âge",
        ageRequired: "L'âge est requis",
        ageRestrictionError: "Vous devez avoir au moins 18 ans pour utiliser cette application"
      },
      de: {
        createAccount: "Konto erstellen",
        joinAuricRX: "Treten Sie heute AuricRX bei",
        firstName: "Vorname",
        lastName: "Nachname",
        username: "Benutzername",
        email: "E-Mail",
        password: "Passwort",
        confirmPassword: "Passwort bestätigen",
        phoneNumber: "Telefonnummer",
        createAccountButton: "Konto erstellen",
        creatingAccount: "Konto wird erstellt...",
        cancel: "Abbrechen",
        passwordRequirements: "Das Passwort muss enthalten:",
        enterFirstName: "Geben Sie Ihren Vornamen ein",
        enterLastName: "Geben Sie Ihren Nachnamen ein",
        chooseUsername: "Wählen Sie einen Benutzernamen",
        enterEmail: "Geben Sie Ihre E-Mail ein",
        createPassword: "Erstellen Sie ein Passwort",
        confirmPassword: "Bestätigen Sie Ihr Passwort",
        enterPhone: "Geben Sie Ihre Telefonnummer ein",
        viewTerms: "Nutzungsbedingungen anzeigen",
        viewPrivacy: "Datenschutzerklärung anzeigen",
        consentRequired: "Sie müssen den Nutzungsbedingungen und der Datenschutzerklärung zustimmen, um fortzufahren.",
        termsOfService: "Nutzungsbedingungen",
        privacyPolicy: "Datenschutzerklärung",
        close: "Schließen",
        loadingDocument: "Rechtlichen Text laden...",
        ageRestriction: "Um diese App zu verwenden, müssen Sie mindestens 18 Jahre alt sein",
        age: "Alter",
        enterAge: "Geben Sie Ihr Alter ein",
        ageRequired: "Das Alter ist erforderlich",
        ageRestrictionError: "Sie müssen mindestens 18 Jahre alt sein, um diese App zu verwenden"
      },
      zh: {
        createAccount: "创建账户",
        joinAuricRX: "立即加入 AuricRX",
        firstName: "名字",
        lastName: "姓氏",
        username: "用户名",
        email: "邮箱",
        password: "密码",
        confirmPassword: "确认密码",
        phoneNumber: "电话号码",
        createAccountButton: "创建账户",
        creatingAccount: "正在创建账户...",
        cancel: "取消",
        passwordRequirements: "密码必须包含:",
        enterFirstName: "输入名字",
        enterLastName: "输入姓氏",
        chooseUsername: "选择用户名",
        enterEmail: "输入邮箱",
        createPassword: "创建密码",
        confirmPassword: "确认密码",
        enterPhone: "输入电话号码",
        viewTerms: "查看服务条款",
        viewPrivacy: "查看隐私政策",
        consentRequired: "继续操作前必须同意服务条款和隐私政策。",
        termsOfService: "服务条款",
        privacyPolicy: "隐私政策",
        close: "关闭",
        loadingDocument: "正在加载法律文档...",
        ageRestriction: "使用此应用，您必须年满 18 岁",
        age: "年龄",
        enterAge: "请输入您的年龄",
        ageRequired: "年龄是必填项",
        ageRestrictionError: "您必须年满 18 岁才能使用此应用"
      }
    };
    return translations[lang] || translations.en;
  };

  const t = getTranslations(currentLanguage);
  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) return;
    if (!formData.age || Number(formData.age) < 18) {
      Alert.alert('Error', t.ageRestrictionError);
      return;
    }
    setGoogleLoading(true);
    try {
      const result = await authService.signInWithGoogle();
      if (!result.success) {
        Alert.alert('Error', result.error || googleAuthText(currentLanguage).error);
        return;
      }
      await onGoogleSuccess({ provider: 'google', user: result.user });
    } catch (error) {
      Alert.alert('Error', googleAuthText(currentLanguage).error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleOpenLegal = async (type: 'terms' | 'privacy') => {
    try {
      setLegalModalVisible(true);
      setLegalModalLoading(true);
      setLegalModalContent('');
      if (type === 'terms') {
        setLegalModalTitle(t.termsOfService);
        const content = await loadTermsText(currentLanguage);
        setLegalModalContent(content);
      } else {
        setLegalModalTitle(t.privacyPolicy);
        const content = await loadPrivacyText(currentLanguage);
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

  // Password matching validation - memoized to prevent re-renders
  const passwordsMatch = React.useMemo(() => 
    formData.password === formData.confirmPassword && formData.password.length > 0 && formData.confirmPassword.length > 0,
    [formData.password, formData.confirmPassword]
  );
  
  const passwordsDontMatch = React.useMemo(() => 
    formData.password !== formData.confirmPassword && formData.password.length > 0 && formData.confirmPassword.length > 0,
    [formData.password, formData.confirmPassword]
  );

  // Memoize password requirements to prevent flickering
  const passwordRequirements = React.useMemo(() => {
    const password = formData.password;
    return [
      { text: "At least 8 characters", isValid: password.length >= 8 },
      { text: "At least 1 uppercase letter", isValid: /[A-Z]/.test(password) },
      { text: "At least 1 lowercase letter", isValid: /[a-z]/.test(password) },
      { text: "At least 1 special character", isValid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) }
    ];
  }, [formData.password]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Modal
          visible={legalModalVisible}
          animationType="slide"
          transparent
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

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.createAccount}</Text>
          <Text style={styles.subtitle}>{t.joinAuricRX}</Text>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            {/* Age Restriction Notice */}
            <View style={styles.ageRestrictionNotice}>
              <Text style={styles.ageRestrictionText}>{t.ageRestriction}</Text>
            </View>

            <View style={{ height: 16 }} />

            {/* Age Field */}
            <Text style={styles.label}>{t.age}</Text>
            <GoldOutline>
              <TextInput
                value={formData.age}
                onChangeText={(value) => {
                  // Only allow numeric input
                  const numericValue = value.replace(/[^0-9]/g, '');
                  handleInputChange('age', numericValue);
                }}
                placeholder={t.enterAge}
                placeholderTextColor="#CBA24F"
                keyboardType="number-pad"
                style={styles.input}
                maxLength={3}
              />
            </GoldOutline>

            <View style={{ height: 16 }} />

            {/* Name Fields */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>{t.firstName}</Text>
                <GoldOutline>
                  <TextInput
                    value={formData.firstName}
                    onChangeText={(value) => handleInputChange('firstName', value)}
                    placeholder={t.enterFirstName}
                    placeholderTextColor="#CBA24F"
                    style={styles.input}
                  />
                </GoldOutline>
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>{t.lastName}</Text>
                <GoldOutline>
                  <TextInput
                    value={formData.lastName}
                    onChangeText={(value) => handleInputChange('lastName', value)}
                    placeholder={t.enterLastName}
                    placeholderTextColor="#CBA24F"
                    style={styles.input}
                  />
                </GoldOutline>
              </View>
            </View>

            <View style={{ height: 16 }} />

            {/* Username */}
            <Text style={styles.label}>{t.username}</Text>
            <GoldOutline>
              <TextInput
                value={formData.username}
                onChangeText={(value) => handleInputChange('username', value)}
                placeholder={t.chooseUsername}
                placeholderTextColor="#CBA24F"
                autoCapitalize="none"
                style={styles.input}
              />
            </GoldOutline>

            <View style={{ height: 16 }} />

            {/* Email */}
            <Text style={styles.label}>{t.email}</Text>
            <GoldOutline>
              <TextInput
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder={t.enterEmail}
                placeholderTextColor="#CBA24F"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </GoldOutline>

            <View style={{ height: 16 }} />

            {/* Password */}
            <Text style={styles.label}>{t.password}</Text>
            <GoldOutline>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  placeholder={t.createPassword}
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
                  <Text style={styles.eyeIcon}>👁️</Text>
                </TouchableOpacity>
              </View>
            </GoldOutline>
            
            {/* Password Requirements */}
            <Text style={styles.passwordRequirements}>
              {t.passwordRequirements}
            </Text>
            <View style={styles.requirementsList}>
              {passwordRequirements.map((req, idx) => (
                <RequirementItem 
                  key={idx}
                  text={req.text} 
                  isValid={req.isValid} 
                />
              ))}
            </View>

            <View style={{ height: 16 }} />

            {/* Confirm Password */}
            <Text style={styles.label}>{t.confirmPassword}</Text>
            <GoldOutline>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  placeholder={t.confirmPassword}
                  placeholderTextColor="#CBA24F"
                  secureTextEntry={!showConfirmPassword}
                  style={styles.passwordInput}
                />
                <TouchableOpacity
                  onPressIn={() => setShowConfirmPassword(true)}
                  onPressOut={() => setShowConfirmPassword(false)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eyeIcon}>👁️</Text>
                </TouchableOpacity>
              </View>
            </GoldOutline>
            
            {/* Password Match Validation */}
            {passwordsMatch && (
              <View style={styles.passwordMatchContainer}>
                <Text style={styles.passwordMatchIcon}>✓</Text>
                <Text style={styles.passwordMatchText}>Passwords match</Text>
              </View>
            )}
            {passwordsDontMatch && (
              <View style={styles.passwordMismatchContainer}>
                <Text style={styles.passwordMismatchIcon}>✗</Text>
                <Text style={styles.passwordMismatchText}>Passwords do not match</Text>
              </View>
            )}

            <View style={{ height: 16 }} />

            {/* Phone Number */}
            <Text style={styles.label}>{t.phoneNumber}</Text>
            
            {/* Country Selector */}
            <View style={styles.countryContainer} pointerEvents="box-none">
              <TouchableOpacity 
                style={styles.countrySelector}
                onPress={() => setShowCountryDropdown(!showCountryDropdown)}
                activeOpacity={0.8}
              >
                <Text style={styles.countrySelectorText}>
                  {getCountryLabel(selectedCountry)}
                </Text>
                <Text style={styles.countrySelectorIcon}>
                  {showCountryDropdown ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              
              {showCountryDropdown && (
                <View style={styles.countryDropdown}>
                  <ScrollView
                    style={styles.countryList}
                    contentContainerStyle={styles.countryListContent}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                    bounces={false}
                  >
                    {[
                      { key: 'US', label: getCountryLabel('US') },
                      { key: 'CA', label: getCountryLabel('CA') },
                      { key: 'MX', label: getCountryLabel('MX') },
                      { key: 'BR', label: getCountryLabel('BR') },
                      { key: 'AR', label: getCountryLabel('AR') },
                      { key: 'CO', label: getCountryLabel('CO') },
                      { key: 'PE', label: getCountryLabel('PE') },
                      { key: 'CL', label: getCountryLabel('CL') },
                      { key: 'VE', label: getCountryLabel('VE') },
                      { key: 'EC', label: getCountryLabel('EC') },
                      { key: 'BO', label: getCountryLabel('BO') },
                      { key: 'UY', label: getCountryLabel('UY') },
                      { key: 'PY', label: getCountryLabel('PY') },
                      { key: 'PA', label: getCountryLabel('PA') },
                      { key: 'FR', label: getCountryLabel('FR') },
                      { key: 'DE', label: getCountryLabel('DE') },
                      { key: 'CN', label: getCountryLabel('CN') }
                    ].map((item) => (
                      <CountryOption 
                        key={item.key}
                        country={item.key} 
                        label={item.label} 
                        isSelected={selectedCountry === item.key} 
                        onPress={() => {
                          setSelectedCountry(item.key);
                          setShowCountryDropdown(false);
                        }} 
                      />
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            
            <GoldOutline>
              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryCode}>{countries[selectedCountry].code}</Text>
                </View>
                <TextInput
                  value={formData.phoneNumber}
                  onChangeText={(value) => handleInputChange('phoneNumber', value)}
                  placeholder={t.enterPhone}
                  placeholderTextColor="#CBA24F"
                  keyboardType="phone-pad"
                  style={styles.phoneInput}
                />
              </View>
            </GoldOutline>

            <View style={{ height: 16 }} />

            <ConsentChoices language={currentLanguage} value={consents} onChange={setConsents} openLegal={handleOpenLegal} />

            <View style={styles.legalLinksRow}>
              <TouchableOpacity onPress={() => handleOpenLegal('terms')}>
                <Text style={styles.legalLink}>{t.viewTerms}</Text>
              </TouchableOpacity>
              <Text style={styles.legalDivider}>•</Text>
              <TouchableOpacity onPress={() => handleOpenLegal('privacy')}>
                <Text style={styles.legalLink}>{t.viewPrivacy}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 16 }} />

            {/* Buttons */}
            <GoldButton
              title={loading ? t.creatingAccount : t.createAccountButton}
              onPress={handleSignUp}
              disabled={loading || googleLoading || !agreedToTerms}
            />

            <View style={{ height: 16 }} />

            <GoogleAuthButton language={currentLanguage} loading={googleLoading}
              disabled={loading || googleLoading} onPress={handleGoogleSignIn} />
            <TouchableOpacity disabled={loading || googleLoading} onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Gold outline container
function GoldOutline({ children }: { children: React.ReactNode }) {
  return <View style={styles.goldOutline}>{children}</View>;
}

// Password requirement item
function RequirementItem({ text, isValid }: { text: string; isValid: boolean }) {
  return (
    <View style={styles.requirementItem}>
      <Text style={[styles.requirementIcon, { color: isValid ? GOLD.y400 : '#666' }]}>
        {isValid ? '✓' : '○'}
      </Text>
      <Text style={[styles.requirementText, { color: isValid ? GOLD.y400 : '#AAA' }]}>
        {text}
      </Text>
    </View>
  );
}


// Country option component for dropdown
function CountryOption({ country, label, isSelected, onPress }: { 
  country: string; 
  label: string; 
  isSelected: boolean; 
  onPress: () => void; 
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.countryOption, isSelected && styles.countryOptionSelected]}
      activeOpacity={0.8}
    >
      <Text style={[styles.countryOptionText, isSelected && styles.countryOptionTextSelected]}>
        {label}
      </Text>
      {isSelected && (
        <Text style={styles.countryOptionCheck}>✓</Text>
      )}
    </TouchableOpacity>
  );
}

// Gold button component
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: "center",
  },
  title: {
    color: GOLD.y400,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#E9C978",
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  label: {
    color: GOLD.a300,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#E9C978",
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.60)",
  },
  goldOutline: {
    borderRadius: 16,
    padding: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.38)",
    ...shadow(0, 6, 18, "rgba(255,176,32,.12)"),
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
    left: 1,
    right: 1,
    top: 1,
    height: "50%",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    opacity: 0.12,
  },
  goldBtnText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelText: {
    color: "#AAAAAA",
    fontSize: 16,
  },
  ageRestrictionNotice: {
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
    marginBottom: 8,
  },
  ageRestrictionText: {
    color: GOLD.y400,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
  passwordRequirements: {
    color: GOLD.a300,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 8,
  },
  requirementsList: {
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  requirementIcon: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
    width: 20,
  },
  requirementText: {
    fontSize: 13,
    flex: 1,
  },
  
  // Password input styles
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#E9C978",
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.60)",
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  
  // Password validation styles
  passwordMatchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  passwordMatchIcon: {
    color: GOLD.y400,
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 8,
  },
  passwordMatchText: {
    color: GOLD.y400,
    fontSize: 12,
    fontWeight: "500",
  },
  passwordMismatchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  passwordMismatchIcon: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 8,
  },
  passwordMismatchText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "500",
  },
  
  // Country selector styles
  countryContainer: {
    marginBottom: 8,
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
    ...shadow(0, 4, 12, "rgba(255,176,32,.15)"),
    minWidth: 120,
  },
  countrySelectorText: {
    color: GOLD.y400,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  countrySelectorIcon: {
    color: GOLD.a300,
    fontSize: 10,
    marginLeft: 8,
  },
  countryDropdown: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    width: 200,
    height: 220,
    borderRadius: 16,
    backgroundColor: "rgba(10,10,10,0.96)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.38)",
    overflow: "hidden",
    zIndex: 1001,
    elevation: 24,
  },
  countryList: {
    flexGrow: 0,
  },
  countryListContent: {
    paddingVertical: 6,
  },
  countryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 15,
    height: 50, // Fixed height for each option
    borderBottomWidth: 1,
    borderBottomColor: "rgba(251,191,36,0.1)",
  },
  countryOptionSelected: {
    backgroundColor: "rgba(251,191,36,0.1)",
  },
  countryOptionText: {
    color: "#E9C978",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  countryOptionTextSelected: {
    color: GOLD.y400,
    fontWeight: "600",
  },
  countryOptionCheck: {
    color: GOLD.y400,
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 8,
  },
  
  // Phone input styles
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryCodeContainer: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  countryCode: {
    color: GOLD.y400,
    fontSize: 14,
    fontWeight: "600",
    textAlign: 'center',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#E9C978",
    backgroundColor: "rgba(0,0,0,0.60)",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  consentText: {
    color: '#E9C978',
    marginLeft: 10,
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  legalLink: {
    color: GOLD.a300,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  legalDivider: {
    color: '#CBA24F',
    marginHorizontal: 8,
    fontSize: 12,
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
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBA24F',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#CBA24F',
    borderColor: '#CBA24F',
  },
  checkboxUnchecked: {
    backgroundColor: 'transparent',
    borderColor: '#CBA24F',
  },
  checkmark: {
    color: '#0B0B0B',
    fontSize: 14,
    fontWeight: 'bold',
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
  return { elevation: Math.max(2, Math.min(12, Math.floor(blur / 2))) };
}
