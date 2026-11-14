import Modal from '../components/BackModal';
import { useTranslation as useScreenTranslation } from "react-i18next";
import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import KeyboardForm from '../../components/KeyboardForm';
import { vip } from '../theme/vip';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Animated, StatusBar, Platform, Vibration, Dimensions, TextInput, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
import AppointmentService, { Appointment, DoctorContact, AppointmentStats } from '../services/appointmentService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FAB_SCROLL_PADDING } from '../layout/fabLayout';
import { isPreVisitIntakeEnabled } from '../config/preVisitIntake';
import PreVisitIntakeModal from './preVisitIntake/PreVisitIntakeModal';

const { width: screenWidth } = Dimensions.get('window');

interface AppointmentManagementScreenProps {
  onClose: () => void;
  theme?: any;
  S?: any;
}

type AppointmentType = 'doctor' | 'lab' | 'pharmacy' | 'specialist' | 'emergency' | 'follow_up' | 'checkup' | 'other';

export default function AppointmentManagementScreen({ onClose, theme, S }: AppointmentManagementScreenProps) {
  useUILanguage();
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
  const insets = useSafeAreaInsets();
  
  // Use S object for translations, fallback to key if not available
  const { t } = useScreenTranslation();
  
  // Default theme if not provided
  const defaultTheme = {
    card: '#ffffff',
    text: '#2c2c2c',
    sub: '#6b6b6b',
    accent: '#d4af37',
    chip: '#e8e3d8',
    bgStart: '#faf8f5',
    bgEnd: '#f5f2ed',
  };
  
  const currentTheme = theme || defaultTheme;
  
  // Generate dynamic styles based on theme
  const getDynamicStyles = () => StyleSheet.create({
    sectionCard: {
      backgroundColor: getCardBackgroundColor() + 'CC',
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    sectionDescription: {
      fontSize: 13,
      marginBottom: 16,
      lineHeight: 20,
    },
    appointmentCard: {
      backgroundColor: getCardBackgroundColor() + '80',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderLeftWidth: 4,
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    
    
    appointmentType: {
      fontSize: 13,
      backgroundColor: getCardBackgroundColor() + '80',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    
    
    appointmentLocation: {
      fontSize: 13,
    },
    
    
    addButton: {
      backgroundColor: currentTheme.accent + 'CC',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    addButtonText: {
      color: getCardTextColor(),
      fontSize: 13,
      fontWeight: '600',
    },
    doctorCard: {
      backgroundColor: getCardBackgroundColor() + '80',
      padding: 8,
      borderRadius: 6,
      marginBottom: 6,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    doctorInfo: {
      flex: 1,
      paddingRight: 80, // Add padding to account for absolute positioned action buttons
    },
    doctorName: {
      fontSize: 11,
      fontWeight: '500',
    },
    doctorSpecialty: {
      fontSize: 13,
      marginTop: 1,
    },
    doctorContact: {
      fontSize: 13,
      marginTop: 1,
    },
    primaryBadge: {
      backgroundColor: currentTheme.accent + 'CC',
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 3,
      marginLeft: 6,
    },
    primaryBadgeText: {
      fontSize: 9,
      fontWeight: '600',
      color: '#ffffff',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      backgroundColor: getCardBackgroundColor() + '80',
      padding: 12,
      borderRadius: 8,
      flex: 1,
      minWidth: (screenWidth - 48) / 2,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    statLabel: {
      fontSize: 13,
      marginTop: 4,
    },
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: getCardBackgroundColor() + 'F0',
      borderRadius: 12,
      padding: 24,
      width: '90%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '500',
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: getCardBackgroundColor() + '80',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      color: getCardTextColor(),
      fontSize: 13,
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    pickerButton: {
      backgroundColor: getCardBackgroundColor() + '80',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    pickerText: {
      color: getCardTextColor(),
      fontSize: 13,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalButtonPrimary: {
      backgroundColor: currentTheme.accent + 'CC',
    },
    modalButtonSecondary: {
      backgroundColor: getCardBackgroundColor() + '80',
      borderWidth: 1.5,
      borderColor: currentTheme.accent,
    },
    modalButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    modalButtonTextPrimary: {
      color: getCardTextColor(),
    },
    modalButtonTextSecondary: {
      color: getCardTextColor(),
    },
    quickActions: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    quickActionButton: {
      backgroundColor: getCardBackgroundColor() + '80',
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 6,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: getCardBorderColor(),
      minHeight: 50,
    },
    quickActionText: {
      fontSize: 10,
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: 12,
    },
    // New styles for enhanced Add Doctor modal
    modalScrollView: {
      maxHeight: 400,
      marginBottom: 16,
    },
    phoneInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    countryCodeDisplay: {
      backgroundColor: getCardBackgroundColor() + '80',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: getCardBorderColor(),
      minWidth: 60,
      alignItems: 'center',
    },
    countryCodeText: {
      fontSize: 10,
      fontWeight: '500',
      color: getCardTextColor(),
    },
    phoneNumberInput: {
      flex: 1,
    },
    dialingOptions: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 6,
    },
    dialButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 4,
      flex: 1,
      alignItems: 'center',
    },
    dialButtonText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#ffffff',
    },
    // Past appointments modal styles
    pastAppointmentCard: {
      backgroundColor: getCardBackgroundColor() + '80',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    appointmentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    appointmentTitle: {
      fontSize: 10,
      fontWeight: '600',
      flex: 1,
      marginRight: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#ffffff',
    },
    appointmentDetails: {
      fontSize: 10,
      marginBottom: 4,
    },
    appointmentDateTime: {
      fontSize: 10,
      fontWeight: '500',
      marginBottom: 4,
    },
    appointmentNotes: {
      fontSize: 10,
      fontStyle: 'italic',
      marginTop: 4,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 10,
      textAlign: 'center',
    },
    // Search styles
    searchContainer: {
      marginBottom: 16,
    },
    searchInput: {
      backgroundColor: getCardBackgroundColor() + '80',
      color: getCardTextColor(),
      borderWidth: 1,
      borderColor: getCardBorderColor(),
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 10,
    },
    // Delete doctor button styles
    deleteDoctorButton: {
      backgroundColor: '#EF4444' + 'CC',
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#EF4444',
    },
    deleteDoctorButtonText: {
      fontSize: 10,
      color: '#ffffff',
    },
    // Doctor action buttons container
    doctorActionButtons: {
      position: 'absolute',
      top: 6,
      right: 6,
      flexDirection: 'row',
      gap: 3,
      alignItems: 'center',
    },
    // Edit doctor button styles
    editDoctorButton: {
      backgroundColor: vip.colors.goldDark,
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: vip.colors.goldDark,
    },
    editDoctorButtonText: {
      fontSize: 10,
      color: '#ffffff',
    },
    // Country picker styles
    countryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 4,
      borderRadius: 8,
      borderWidth: 1,
    },
    countryFlag: {
      fontSize: 20,
      marginRight: 12,
    },
    countryName: {
      flex: 1,
      fontSize: 10,
      fontWeight: '500',
    },
    countryCode: {
      fontSize: 10,
      fontWeight: '600',
      color: currentTheme.accent,
    },
  });
  
  const dynamicStyles = getDynamicStyles();
  const [appointmentService] = useState(() => {
    try {
      console.log('🔧 Creating Appointment Service instance...');
      if (!AppointmentService || typeof AppointmentService.getInstance !== 'function') {
        console.error('❌ AppointmentService not available or getInstance method missing');
        return null;
      }
      return AppointmentService.getInstance();
    } catch (error) {
      console.error('❌ Failed to create Appointment Service:', error);
      return null;
    }
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [doctorContacts, setDoctorContacts] = useState<DoctorContact[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
  // Optional pre-visit intake (feature-flagged, OFF by default). Offered only AFTER the appointment is saved.
  const preVisitIntakeEnabled = isPreVisitIntakeEnabled();
  const [preVisitIntake, setPreVisitIntake] = useState<null | { mode: 'book' | 'history'; appointmentId: string; justBooked?: Appointment }>(null);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorContact | null>(null);
  const [showPastAppointmentsModal, setShowPastAppointmentsModal] = useState(false);
  const [pastAppointmentsSearch, setPastAppointmentsSearch] = useState('');
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<AppointmentType>('doctor');
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [appointmentLocation, setAppointmentLocation] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  
  // Date and time picker states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [doctorCountryCode, setDoctorCountryCode] = useState('+1');
  const [doctorDialingMethod, setDoctorDialingMethod] = useState<'phone' | 'whatsapp' | 'both'>('both');
  const [doctorAddress, setDoctorAddress] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Haptic feedback
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS === 'ios') {
      const style = type === 'light' ? Haptics.ImpactFeedbackStyle.Light : 
                   type === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : 
                   Haptics.ImpactFeedbackStyle.Heavy;
      Haptics.impactAsync(style);
    } else {
      Vibration.vibrate(type === 'light' ? 50 : type === 'medium' ? 100 : 200);
    }
  };

  const appointmentTypes: { value: AppointmentType; label: string; icon: string }[] = [
    { value: 'doctor', label: t("appointments.doctorVisit"), icon: '👨‍⚕️' },
    { value: 'lab', label: t("appointments.labTest"), icon: '🧪' },
    { value: 'pharmacy', label: t("appointments.pharmacy"), icon: '💊' },
    { value: 'specialist', label: t("appointments.specialist"), icon: '🏥' },
    { value: 'emergency', label: t("appointments.emergency"), icon: '🚨' },
    { value: 'follow_up', label: t("appointments.followUp"), icon: '🔄' },
    { value: 'checkup', label: t("appointments.checkup"), icon: '✅' },
    { value: 'other', label: t("appointments.other"), icon: '📅' },
  ];

  const countryCodes = [
    { code: '+1', country: uiI18n.t("ui.unitedStates_f36d8a"), flag: '🇺🇸' },
    { code: '+52', country: uiI18n.t("ui.mexico_778a03"), flag: '🇲🇽' },
    { code: '+86', country: uiI18n.t("ui.china_79bd55"), flag: '🇨🇳' },
    { code: '+44', country: uiI18n.t("ui.unitedKingdom_5d429f"), flag: '🇬🇧' },
    { code: '+33', country: uiI18n.t("ui.france_a93bbf"), flag: '🇫🇷' },
    { code: '+49', country: uiI18n.t("ui.germany_beb866"), flag: '🇩🇪' },
    { code: '+81', country: uiI18n.t('countryLabels.JP'), flag: '🇯🇵' },
    { code: '+91', country: uiI18n.t("ui.india_32ed4f"), flag: '🇮🇳' },
    { code: '+55', country: uiI18n.t("ui.brazil_7557a7"), flag: '🇧🇷' },
    { code: '+61', country: uiI18n.t('countryLabels.AU'), flag: '🇦🇺' },
    { code: '+34', country: uiI18n.t('countryLabels.ES'), flag: '🇪🇸' },
    { code: '+39', country: uiI18n.t('countryLabels.IT'), flag: '🇮🇹' },
    { code: '+31', country: uiI18n.t('countryLabels.NL'), flag: '🇳🇱' },
    { code: '+46', country: uiI18n.t('countryLabels.SE'), flag: '🇸🇪' },
    { code: '+47', country: uiI18n.t('countryLabels.NO'), flag: '🇳🇴' },
    { code: '+45', country: uiI18n.t('countryLabels.DK'), flag: '🇩🇰' },
    { code: '+41', country: uiI18n.t('countryLabels.CH'), flag: '🇨🇭' },
    { code: '+43', country: uiI18n.t('countryLabels.AT'), flag: '🇦🇹' },
    { code: '+32', country: uiI18n.t('countryLabels.BE'), flag: '🇧🇪' },
    { code: '+351', country: uiI18n.t('countryLabels.PT'), flag: '🇵🇹' },
    { code: '+30', country: uiI18n.t('countryLabels.GR'), flag: '🇬🇷' },
    { code: '+48', country: uiI18n.t('countryLabels.PL'), flag: '🇵🇱' },
    { code: '+420', country: uiI18n.t('countryLabels.CZ'), flag: '🇨🇿' },
    { code: '+36', country: uiI18n.t('countryLabels.HU'), flag: '🇭🇺' },
    { code: '+40', country: uiI18n.t('countryLabels.RO'), flag: '🇷🇴' },
    { code: '+359', country: uiI18n.t('countryLabels.BG'), flag: '🇧🇬' },
    { code: '+385', country: uiI18n.t('countryLabels.HR'), flag: '🇭🇷' },
    { code: '+386', country: uiI18n.t('countryLabels.SI'), flag: '🇸🇮' },
    { code: '+421', country: uiI18n.t('countryLabels.SK'), flag: '🇸🇰' },
    { code: '+370', country: uiI18n.t('countryLabels.LT'), flag: '🇱🇹' },
    { code: '+371', country: uiI18n.t('countryLabels.LV'), flag: '🇱🇻' },
    { code: '+372', country: uiI18n.t('countryLabels.EE'), flag: '🇪🇪' },
    { code: '+353', country: uiI18n.t('countryLabels.IE'), flag: '🇮🇪' },
    { code: '+358', country: uiI18n.t('countryLabels.FI'), flag: '🇫🇮' },
    { code: '+7', country: uiI18n.t('countryLabels.RU'), flag: '🇷🇺' },
    { code: '+380', country: uiI18n.t('countryLabels.UA'), flag: '🇺🇦' },
    { code: '+375', country: uiI18n.t('countryLabels.BY'), flag: '🇧🇾' },
    { code: '+370', country: uiI18n.t('countryLabels.LT'), flag: '🇱🇹' },
    { code: '+371', country: uiI18n.t('countryLabels.LV'), flag: '🇱🇻' },
    { code: '+372', country: uiI18n.t('countryLabels.EE'), flag: '🇪🇪' },
    { code: '+90', country: uiI18n.t('countryLabels.TR'), flag: '🇹🇷' },
    { code: '+20', country: uiI18n.t('countryLabels.EG'), flag: '🇪🇬' },
    { code: '+27', country: uiI18n.t('countryLabels.ZA'), flag: '🇿🇦' },
    { code: '+234', country: uiI18n.t('countryLabels.NG'), flag: '🇳🇬' },
    { code: '+254', country: uiI18n.t('countryLabels.KE'), flag: '🇰🇪' },
    { code: '+233', country: uiI18n.t('countryLabels.GH'), flag: '🇬🇭' },
    { code: '+212', country: uiI18n.t('countryLabels.MA'), flag: '🇲🇦' },
    { code: '+213', country: uiI18n.t('countryLabels.DZ'), flag: '🇩🇿' },
    { code: '+216', country: uiI18n.t('countryLabels.TN'), flag: '🇹🇳' },
    { code: '+218', country: uiI18n.t('countryLabels.LY'), flag: '🇱🇾' },
    { code: '+220', country: uiI18n.t('countryLabels.GM'), flag: '🇬🇲' },
    { code: '+221', country: uiI18n.t('countryLabels.SN'), flag: '🇸🇳' },
    { code: '+222', country: uiI18n.t('countryLabels.MR'), flag: '🇲🇷' },
    { code: '+223', country: uiI18n.t('countryLabels.ML'), flag: '🇲🇱' },
    { code: '+224', country: uiI18n.t('countryLabels.GN'), flag: '🇬🇳' },
    { code: '+225', country: uiI18n.t('countryLabels.CI'), flag: '🇨🇮' },
    { code: '+226', country: uiI18n.t('countryLabels.BF'), flag: '🇧🇫' },
    { code: '+227', country: uiI18n.t('countryLabels.NE'), flag: '🇳🇪' },
    { code: '+228', country: uiI18n.t('countryLabels.TG'), flag: '🇹🇬' },
    { code: '+229', country: uiI18n.t('countryLabels.BJ'), flag: '🇧🇯' },
    { code: '+230', country: uiI18n.t('countryLabels.MU'), flag: '🇲🇺' },
    { code: '+231', country: uiI18n.t('countryLabels.LR'), flag: '🇱🇷' },
    { code: '+232', country: uiI18n.t('countryLabels.SL'), flag: '🇸🇱' },
    { code: '+235', country: uiI18n.t('countryLabels.TD'), flag: '🇹🇩' },
    { code: '+236', country: uiI18n.t('countryLabels.CF'), flag: '🇨🇫' },
    { code: '+237', country: uiI18n.t('countryLabels.CM'), flag: '🇨🇲' },
    { code: '+238', country: uiI18n.t('countryLabels.CV'), flag: '🇨🇻' },
    { code: '+239', country: uiI18n.t('countryLabels.ST'), flag: '🇸🇹' },
    { code: '+240', country: uiI18n.t('countryLabels.GQ'), flag: '🇬🇶' },
    { code: '+241', country: uiI18n.t('countryLabels.GA'), flag: '🇬🇦' },
    { code: '+242', country: uiI18n.t('countryLabels.CG'), flag: '🇨🇬' },
    { code: '+243', country: uiI18n.t('countryLabels.CD'), flag: '🇨🇩' },
    { code: '+244', country: uiI18n.t('countryLabels.AO'), flag: '🇦🇴' },
    { code: '+245', country: uiI18n.t('countryLabels.GW'), flag: '🇬🇼' },
    { code: '+246', country: uiI18n.t('countryLabels.IO'), flag: '🇮🇴' },
    { code: '+248', country: uiI18n.t('countryLabels.SC'), flag: '🇸🇨' },
    { code: '+249', country: uiI18n.t('countryLabels.SD'), flag: '🇸🇩' },
    { code: '+250', country: uiI18n.t('countryLabels.RW'), flag: '🇷🇼' },
    { code: '+251', country: uiI18n.t('countryLabels.ET'), flag: '🇪🇹' },
    { code: '+252', country: uiI18n.t('countryLabels.SO'), flag: '🇸🇴' },
    { code: '+253', country: uiI18n.t('countryLabels.DJ'), flag: '🇩🇯' },
    { code: '+255', country: uiI18n.t('countryLabels.TZ'), flag: '🇹🇿' },
    { code: '+256', country: uiI18n.t('countryLabels.UG'), flag: '🇺🇬' },
    { code: '+257', country: uiI18n.t('countryLabels.BI'), flag: '🇧🇮' },
    { code: '+258', country: uiI18n.t('countryLabels.MZ'), flag: '🇲🇿' },
    { code: '+260', country: uiI18n.t('countryLabels.ZM'), flag: '🇿🇲' },
    { code: '+261', country: uiI18n.t('countryLabels.MG'), flag: '🇲🇬' },
    { code: '+262', country: uiI18n.t('countryLabels.RE'), flag: '🇷🇪' },
    { code: '+263', country: uiI18n.t('countryLabels.ZW'), flag: '🇿🇼' },
    { code: '+264', country: uiI18n.t('countryLabels.NA'), flag: '🇳🇦' },
    { code: '+265', country: uiI18n.t('countryLabels.MW'), flag: '🇲🇼' },
    { code: '+266', country: uiI18n.t('countryLabels.LS'), flag: '🇱🇸' },
    { code: '+267', country: uiI18n.t('countryLabels.BW'), flag: '🇧🇼' },
    { code: '+268', country: uiI18n.t('countryLabels.SZ'), flag: '🇸🇿' },
    { code: '+269', country: uiI18n.t('countryLabels.KM'), flag: '🇰🇲' },
    { code: '+290', country: uiI18n.t('countryLabels.SH'), flag: '🇸🇭' },
    { code: '+291', country: uiI18n.t('countryLabels.ER'), flag: '🇪🇷' },
    { code: '+297', country: uiI18n.t('countryLabels.AW'), flag: '🇦🇼' },
    { code: '+298', country: uiI18n.t('countryLabels.FO'), flag: '🇫🇴' },
    { code: '+299', country: uiI18n.t('countryLabels.GL'), flag: '🇬🇱' },
    { code: '+350', country: uiI18n.t('countryLabels.GI'), flag: '🇬🇮' },
    { code: '+352', country: uiI18n.t('countryLabels.LU'), flag: '🇱🇺' },
    { code: '+354', country: uiI18n.t('countryLabels.IS'), flag: '🇮🇸' },
    { code: '+355', country: uiI18n.t('countryLabels.AL'), flag: '🇦🇱' },
    { code: '+356', country: uiI18n.t('countryLabels.MT'), flag: '🇲🇹' },
    { code: '+357', country: uiI18n.t('countryLabels.CY'), flag: '🇨🇾' },
    { code: '+358', country: uiI18n.t('countryLabels.FI'), flag: '🇫🇮' },
    { code: '+359', country: uiI18n.t('countryLabels.BG'), flag: '🇧🇬' },
    { code: '+370', country: uiI18n.t('countryLabels.LT'), flag: '🇱🇹' },
    { code: '+371', country: uiI18n.t('countryLabels.LV'), flag: '🇱🇻' },
    { code: '+372', country: uiI18n.t('countryLabels.EE'), flag: '🇪🇪' },
    { code: '+373', country: uiI18n.t('countryLabels.MD'), flag: '🇲🇩' },
    { code: '+374', country: uiI18n.t('countryLabels.AM'), flag: '🇦🇲' },
    { code: '+375', country: uiI18n.t('countryLabels.BY'), flag: '🇧🇾' },
    { code: '+376', country: uiI18n.t('countryLabels.AD'), flag: '🇦🇩' },
    { code: '+377', country: uiI18n.t('countryLabels.MC'), flag: '🇲🇨' },
    { code: '+378', country: uiI18n.t('countryLabels.SM'), flag: '🇸🇲' },
    { code: '+380', country: uiI18n.t('countryLabels.UA'), flag: '🇺🇦' },
    { code: '+381', country: uiI18n.t('countryLabels.RS'), flag: '🇷🇸' },
    { code: '+382', country: uiI18n.t('countryLabels.ME'), flag: '🇲🇪' },
    { code: '+383', country: uiI18n.t('countryLabels.XK'), flag: '🇽🇰' },
    { code: '+385', country: uiI18n.t('countryLabels.HR'), flag: '🇭🇷' },
    { code: '+386', country: uiI18n.t('countryLabels.SI'), flag: '🇸🇮' },
    { code: '+387', country: uiI18n.t('countryLabels.BA'), flag: '🇧🇦' },
    { code: '+389', country: uiI18n.t('countryLabels.MK'), flag: '🇲🇰' },
    { code: '+420', country: uiI18n.t('countryLabels.CZ'), flag: '🇨🇿' },
    { code: '+421', country: uiI18n.t('countryLabels.SK'), flag: '🇸🇰' },
    { code: '+423', country: uiI18n.t('countryLabels.LI'), flag: '🇱🇮' },
    { code: '+500', country: uiI18n.t('countryLabels.FK'), flag: '🇫🇰' },
    { code: '+501', country: uiI18n.t('countryLabels.BZ'), flag: '🇧🇿' },
    { code: '+502', country: uiI18n.t('countryLabels.GT'), flag: '🇬🇹' },
    { code: '+503', country: uiI18n.t('countryLabels.SV'), flag: '🇸🇻' },
    { code: '+504', country: uiI18n.t('countryLabels.HN'), flag: '🇭🇳' },
    { code: '+505', country: uiI18n.t('countryLabels.NI'), flag: '🇳🇮' },
    { code: '+506', country: uiI18n.t('countryLabels.CR'), flag: '🇨🇷' },
    { code: '+507', country: uiI18n.t("ui.panama_1ccdfc"), flag: '🇵🇦' },
    { code: '+508', country: uiI18n.t('countryLabels.PM'), flag: '🇵🇲' },
    { code: '+509', country: uiI18n.t('countryLabels.HT'), flag: '🇭🇹' },
    { code: '+590', country: uiI18n.t('countryLabels.GP'), flag: '🇬🇵' },
    { code: '+591', country: uiI18n.t("ui.bolivia_dff286"), flag: '🇧🇴' },
    { code: '+592', country: uiI18n.t('countryLabels.GY'), flag: '🇬🇾' },
    { code: '+593', country: uiI18n.t("ui.ecuador_f95cbe"), flag: '🇪🇨' },
    { code: '+594', country: uiI18n.t('countryLabels.GF'), flag: '🇬🇫' },
    { code: '+595', country: uiI18n.t("ui.paraguay_4be072"), flag: '🇵🇾' },
    { code: '+596', country: uiI18n.t('countryLabels.MQ'), flag: '🇲🇶' },
    { code: '+597', country: uiI18n.t('countryLabels.SR'), flag: '🇸🇷' },
    { code: '+598', country: uiI18n.t("ui.uruguay_3332a9"), flag: '🇺🇾' },
    { code: '+599', country: uiI18n.t('countryLabels.NL'), flag: '🇳🇱' },
    { code: '+670', country: uiI18n.t('countryLabels.TL'), flag: '🇹🇱' },
    { code: '+672', country: uiI18n.t('countryLabels.AQ'), flag: '🇦🇶' },
    { code: '+673', country: uiI18n.t('countryLabels.BN'), flag: '🇧🇳' },
    { code: '+674', country: uiI18n.t('countryLabels.NR'), flag: '🇳🇷' },
    { code: '+675', country: uiI18n.t('countryLabels.PG'), flag: '🇵🇬' },
    { code: '+676', country: uiI18n.t('countryLabels.TO'), flag: '🇹🇴' },
    { code: '+677', country: uiI18n.t('countryLabels.SB'), flag: '🇸🇧' },
    { code: '+678', country: uiI18n.t('countryLabels.VU'), flag: '🇻🇺' },
    { code: '+679', country: uiI18n.t('countryLabels.FJ'), flag: '🇫🇯' },
    { code: '+680', country: uiI18n.t('countryLabels.PW'), flag: '🇵🇼' },
    { code: '+681', country: uiI18n.t('countryLabels.WF'), flag: '🇼🇫' },
    { code: '+682', country: uiI18n.t('countryLabels.CK'), flag: '🇨🇰' },
    { code: '+683', country: uiI18n.t('countryLabels.NU'), flag: '🇳🇺' },
    { code: '+684', country: uiI18n.t('countryLabels.AS'), flag: '🇦🇸' },
    { code: '+685', country: uiI18n.t('countryLabels.WS'), flag: '🇼🇸' },
    { code: '+686', country: uiI18n.t('countryLabels.KI'), flag: '🇰🇮' },
    { code: '+687', country: uiI18n.t('countryLabels.NC'), flag: '🇳🇨' },
    { code: '+688', country: uiI18n.t('countryLabels.TV'), flag: '🇹🇻' },
    { code: '+689', country: uiI18n.t('countryLabels.PF'), flag: '🇵🇫' },
    { code: '+690', country: uiI18n.t('countryLabels.TK'), flag: '🇹🇰' },
    { code: '+691', country: uiI18n.t('countryLabels.FM'), flag: '🇫🇲' },
    { code: '+692', country: uiI18n.t('countryLabels.MH'), flag: '🇲🇭' },
    { code: '+850', country: uiI18n.t('countryLabels.KP'), flag: '🇰🇵' },
    { code: '+852', country: uiI18n.t('countryLabels.HK'), flag: '🇭🇰' },
    { code: '+853', country: uiI18n.t('countryLabels.MO'), flag: '🇲🇴' },
    { code: '+855', country: uiI18n.t('countryLabels.KH'), flag: '🇰🇭' },
    { code: '+856', country: uiI18n.t('countryLabels.LA'), flag: '🇱🇦' },
    { code: '+880', country: uiI18n.t('countryLabels.BD'), flag: '🇧🇩' },
    { code: '+886', country: uiI18n.t('countryLabels.TW'), flag: '🇹🇼' },
    { code: '+960', country: uiI18n.t('countryLabels.MV'), flag: '🇲🇻' },
    { code: '+961', country: uiI18n.t('countryLabels.LB'), flag: '🇱🇧' },
    { code: '+962', country: uiI18n.t('countryLabels.JO'), flag: '🇯🇴' },
    { code: '+963', country: uiI18n.t('countryLabels.SY'), flag: '🇸🇾' },
    { code: '+964', country: uiI18n.t('countryLabels.IQ'), flag: '🇮🇶' },
    { code: '+965', country: uiI18n.t('countryLabels.KW'), flag: '🇰🇼' },
    { code: '+966', country: uiI18n.t('countryLabels.SA'), flag: '🇸🇦' },
    { code: '+967', country: uiI18n.t('countryLabels.YE'), flag: '🇾🇪' },
    { code: '+968', country: uiI18n.t('countryLabels.OM'), flag: '🇴🇲' },
    { code: '+970', country: uiI18n.t('countryLabels.PS'), flag: '🇵🇸' },
    { code: '+971', country: uiI18n.t('countryLabels.AE'), flag: '🇦🇪' },
    { code: '+972', country: uiI18n.t('countryLabels.IL'), flag: '🇮🇱' },
    { code: '+973', country: uiI18n.t('countryLabels.BH'), flag: '🇧🇭' },
    { code: '+974', country: uiI18n.t('countryLabels.QA'), flag: '🇶🇦' },
    { code: '+975', country: uiI18n.t('countryLabels.BT'), flag: '🇧🇹' },
    { code: '+976', country: uiI18n.t('countryLabels.MN'), flag: '🇲🇳' },
    { code: '+977', country: uiI18n.t('countryLabels.NP'), flag: '🇳🇵' },
    { code: '+992', country: uiI18n.t('countryLabels.TJ'), flag: '🇹🇯' },
    { code: '+993', country: uiI18n.t('countryLabels.TM'), flag: '🇹🇲' },
    { code: '+994', country: uiI18n.t('countryLabels.AZ'), flag: '🇦🇿' },
    { code: '+995', country: uiI18n.t('countryLabels.GE'), flag: '🇬🇪' },
    { code: '+996', country: uiI18n.t('countryLabels.KG'), flag: '🇰🇬' },
    { code: '+998', country: uiI18n.t('countryLabels.UZ'), flag: '🇺🇿' },
  ];

  const dialingMethods: { value: DoctorContact['dialingMethod']; label: string; icon: string }[] = [
    { value: 'phone', label: t("appointments.phoneOnly"), icon: '' },
    { value: 'whatsapp', label: t("appointments.whatsappOnly"), icon: '' },
    { value: 'both', label: t("appointments.bothPhoneWhatsapp"), icon: '' },
  ];

  // Date and time picker handlers
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      setAppointmentDate(selectedDate.toLocaleDateString());
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setSelectedTime(selectedTime);
      setAppointmentTime(selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get past appointments (completed, cancelled, and missed) with search filtering
  const getPastAppointments = () => {
    const now = new Date();
    
    const pastAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startDate);
      const isPast = appointmentDate < now;
      const isCompletedOrCancelled = appointment.status === 'completed' || appointment.status === 'cancelled';
      const isScheduledInPast = appointment.status === 'scheduled' && isPast; // Missed appointments
      
      return isPast && (isCompletedOrCancelled || isScheduledInPast);
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
    // Apply search filter if search term exists
    if (pastAppointmentsSearch.trim()) {
      const searchTerm = pastAppointmentsSearch.toLowerCase();
      return pastAppointments.filter(appointment => 
        appointment.title.toLowerCase().includes(searchTerm) ||
        appointment.location.toLowerCase().includes(searchTerm) ||
        (appointment.doctorName && appointment.doctorName.toLowerCase().includes(searchTerm)) ||
        appointment.type.toLowerCase().includes(searchTerm) ||
        (appointment.notes && appointment.notes.toLowerCase().includes(searchTerm))
      );
    }
    
    return pastAppointments;
  };

  useEffect(() => {
    initializeAppointmentManagement();
    
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const initializeAppointmentManagement = async () => {
    try {
      if (!appointmentService) {
        console.error('❌ Appointment service not available, cannot initialize');
        return;
      }
      await appointmentService.initialize();
      loadData();
    } catch (error) {
      console.error('Failed to initialize appointment management:', error);
    }
  };

  const loadData = async () => {
    try {
      if (!appointmentService) {
        console.error('❌ Appointment service not available, cannot load data');
        return;
      }
      const [appointmentsData, upcomingData, doctorsData, statsData] = await Promise.all([
        appointmentService.getAppointments(),
        appointmentService.getUpcomingAppointments(30),
        appointmentService.getDoctorContacts(),
        appointmentService.getAppointmentStats()
      ]);

      setAppointments(appointmentsData);
      setUpcomingAppointments(upcomingData);
      setDoctorContacts(doctorsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load appointment data:', error);
    }
  };

  const addAppointment = async () => {
    if (!appointmentTitle || !appointmentLocation) {
      Alert.alert('❌ ' + t("appointments.error"), t("appointments.fillAllFields"));
      return;
    }

    if (!appointmentService) {
      Alert.alert('❌ ' + t("appointments.error"), t("appointments.appointmentServiceNotAvailable"));
      return;
    }

    try {
      // Combine selected date and time
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(selectedTime.getHours());
      startDateTime.setMinutes(selectedTime.getMinutes());
      startDateTime.setSeconds(0);
      startDateTime.setMilliseconds(0);
      
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration

      const createdAppointment = await appointmentService.createAppointment({
        title: appointmentTitle,
        type: selectedAppointmentType,
        location: appointmentLocation,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        duration: 60,
        notes: appointmentNotes || undefined,
        status: 'scheduled',
        reminderMinutes: [60, 15] // 1 hour and 15 minutes before
      });

      // Reset form
      setAppointmentTitle('');
      setAppointmentLocation('');
      setAppointmentDate('');
      setAppointmentTime('');
      setAppointmentNotes('');
      setSelectedDate(new Date());
      setSelectedTime(new Date());
      setShowAddAppointmentModal(false);
      
      loadData();
      triggerHaptic('medium');
      if (preVisitIntakeEnabled && createdAppointment?.id) {
        // Booking is already saved; the intake offer opens after the confirmation is dismissed.
        Alert.alert('✅ ' + t("appointments.success"), t("appointments.appointmentScheduled"), [
          { text: t("common.ok"), onPress: () => setPreVisitIntake({ mode: 'book', appointmentId: createdAppointment.id, justBooked: createdAppointment }) },
        ]);
      } else {
        Alert.alert('✅ ' + t("appointments.success"), t("appointments.appointmentScheduled"));
      }
    } catch (error) {
      console.error('Failed to add appointment:', error);
      Alert.alert('❌ ' + t("appointments.error"), t("appointments.failedToSchedule"));
    }
  };

  const addDoctorContact = async () => {
    if (!doctorName || !doctorSpecialty || !doctorPhone || !doctorAddress) {
      Alert.alert('❌ ' + t("appointments.error"), t("appointments.fillAllFields"));
      return;
    }

    if (!appointmentService) {
      Alert.alert('❌ ' + t("appointments.error"), t("appointments.appointmentServiceNotAvailable"));
      return;
    }

    try {
      await appointmentService.addDoctorContact({
        name: doctorName,
        specialty: doctorSpecialty,
        phoneNumber: doctorPhone,
        countryCode: doctorCountryCode,
        dialingMethod: doctorDialingMethod,
        email: doctorEmail.trim() || undefined,
        address: doctorAddress,
        isPrimary: doctorContacts.length === 0 // First doctor is primary
      });

      // Reset form
      setDoctorName('');
      setDoctorSpecialty('');
      setDoctorPhone('');
      setDoctorCountryCode('+1');
      setDoctorDialingMethod('both');
      setDoctorAddress('');
      setDoctorEmail('');
      setShowAddDoctorModal(false);
      
      loadData();
      triggerHaptic('medium');
      Alert.alert('✅ ' + t("appointments.success"), t("appointments.doctorContactAdded"));
    } catch (error) {
      console.error('Failed to add doctor contact:', error);
      Alert.alert('❌ ' + t("appointments.error"), t("appointments.failedToAddDoctor"));
    }
  };

  const editDoctorContact = (doctor: DoctorContact) => {
    setEditingDoctor(doctor);
    setDoctorName(doctor.name);
    setDoctorSpecialty(doctor.specialty);
    setDoctorPhone(doctor.phoneNumber);
    setDoctorCountryCode(doctor.countryCode);
    setDoctorDialingMethod(doctor.dialingMethod);
    setDoctorAddress(doctor.address);
    setDoctorEmail(doctor.email || '');
    setShowEditDoctorModal(true);
  };

  const updateDoctorContact = async () => {
    if (!editingDoctor || !doctorName || !doctorSpecialty || !doctorPhone || !doctorAddress) {
      Alert.alert('❌ ' + t("appointments.error"), t("appointments.fillAllFields"));
      return;
    }

    if (!appointmentService) {
      Alert.alert('❌ ' + t("appointments.error"), t("appointments.appointmentServiceNotAvailable"));
      return;
    }

    try {
      await appointmentService.updateDoctorContact(editingDoctor.id, {
        name: doctorName,
        specialty: doctorSpecialty,
        phoneNumber: doctorPhone,
        countryCode: doctorCountryCode,
        dialingMethod: doctorDialingMethod,
        email: doctorEmail.trim() || undefined,
        address: doctorAddress,
        isPrimary: editingDoctor.isPrimary
      });

      // Reset form
      setDoctorName('');
      setDoctorSpecialty('');
      setDoctorPhone('');
      setDoctorCountryCode('+1');
      setDoctorDialingMethod('both');
      setDoctorAddress('');
      setDoctorEmail('');
      setEditingDoctor(null);
      setShowEditDoctorModal(false);
      
      loadData();
      triggerHaptic('medium');
      Alert.alert('✅ ' + t("appointments.success"), t("appointments.doctorContactUpdated"));
    } catch (error) {
      console.error('Failed to update doctor contact:', error);
      Alert.alert('❌ ' + t("appointments.error"), t("appointments.failedToUpdateDoctor"));
    }
  };

  const deleteDoctorContact = async (doctorId: string, doctorName: string) => {
    if (!appointmentService) {
      Alert.alert('❌ ' + t("appointments.error"), t("appointments.appointmentServiceNotAvailable"));
      return;
    }

    Alert.alert(
      t("appointments.deleteDoctorContact"),
      `${t("appointments.deleteDoctorConfirm")}`,
      [
        {
          text: t("common.cancel"),
          style: 'cancel'
        },
        {
          text: t("common.delete"),
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentService.deleteDoctorContact(doctorId);
              loadData();
              triggerHaptic('medium');
              Alert.alert('✅ ' + t("appointments.success"), t("appointments.doctorContactDeleted"));
            } catch (error) {
              console.error('Failed to delete doctor contact:', error);
              Alert.alert('❌ ' + t("appointments.error"), t("appointments.failedToDeleteDoctor"));
            }
          }
        }
      ]
    );
  };

  const markAppointmentCompleted = async (id: string) => {
    if (!appointmentService) {
      Alert.alert('❌ ' + t("appointments.error"), t("appointments.appointmentServiceNotAvailable"));
      return;
    }

    try {
      await appointmentService.markAppointmentCompleted(id);
      loadData();
      triggerHaptic('medium');
      Alert.alert('✅ ' + t("appointments.success"), t("appointments.appointmentCompleted"));
    } catch (error) {
      console.error('Failed to mark appointment completed:', error);
      Alert.alert('❌ ' + t("appointments.error"), t("appointments.failedToUpdate"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#3b82f6'; // blue
      case 'confirmed': return '#10b981'; // green
      case 'completed': return '#6b7280'; // gray
      case 'cancelled': return '#ef4444'; // red
      case 'rescheduled': return '#f59e0b'; // yellow
      default: return '#6b7280'; // gray
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return t("appointments.scheduled");
      case 'confirmed': return t("appointments.confirmed");
      case 'completed': return t("appointments.completed");
      case 'cancelled': return t("appointments.cancelled");
      case 'rescheduled': return t("appointments.rescheduled");
      default: return t("appointments.unknown");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'doctor': return '#3b82f6';
      case 'lab': return '#8b5cf6';
      case 'pharmacy': return '#10b981';
      case 'specialist': return '#f59e0b';
      case 'emergency': return '#ef4444';
      case 'follow_up': return '#06b6d4';
      case 'checkup': return '#84cc16';
      case 'other': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const renderStatsOverview = () => (
    <Animated.View 
      style={[
        dynamicStyles.sectionCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image 
          source={require('../../assets/dashboard Emojies/med stats emoji.png')} 
          style={{ width: 20, height: 20, marginRight: 8 }}
        />
        <DynamicText type="primary" style={dynamicStyles.sectionTitle}>{t("appointments.appointmentOverview")}</DynamicText>
      </View>
      
      {stats && (
        <View style={dynamicStyles.statsGrid}>
          <View style={dynamicStyles.statCard}>
            <DynamicText type="card" style={dynamicStyles.statValue}>{stats?.totalAppointments || 0}</DynamicText>
            <DynamicText type="card" style={dynamicStyles.statLabel}>{t("appointments.totalAppointments")}</DynamicText>
          </View>
          <View style={dynamicStyles.statCard}>
            <DynamicText type="card" style={dynamicStyles.statValue}>{stats?.upcomingAppointments || 0}</DynamicText>
            <DynamicText type="card" style={dynamicStyles.statLabel}>{t("appointments.upcoming")}</DynamicText>
          </View>
          <View style={dynamicStyles.statCard}>
            <DynamicText type="card" style={dynamicStyles.statValue}>{stats?.completedAppointments || 0}</DynamicText>
            <DynamicText type="card" style={dynamicStyles.statLabel}>{t("appointments.completed")}</DynamicText>
          </View>
          <View style={dynamicStyles.statCard}>
            <DynamicText type="card" style={dynamicStyles.statValue}>{doctorContacts.length}</DynamicText>
            <DynamicText type="card" style={dynamicStyles.statLabel}>{t("appointments.doctors")}</DynamicText>
          </View>
        </View>
      )}

      <View style={dynamicStyles.quickActions}>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={() => setShowAddAppointmentModal(true)}
        >
          <DynamicText type="card" style={dynamicStyles.quickActionText}>📅{'\n'}{t("appointments.schedule")}</DynamicText>
        </TouchableOpacity>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={() => setShowAddDoctorModal(true)}
        >
          <DynamicText type="card" style={dynamicStyles.quickActionText}>👨‍⚕️{'\n'}{t("appointments.addDoctor")}</DynamicText>
        </TouchableOpacity>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={loadData}
        >
          <DynamicText type="card" style={dynamicStyles.quickActionText}>🔄{'\n'}{t("appointments.refresh")}</DynamicText>
        </TouchableOpacity>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={() => setShowPastAppointmentsModal(true)}
        >
          <DynamicText type="card" style={dynamicStyles.quickActionText}>📋{'\n'}{t("appointments.pastAppts")}</DynamicText>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderUpcomingAppointments = () => (
    <Animated.View 
      style={[
        dynamicStyles.sectionCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <DynamicText type="primary" style={dynamicStyles.sectionTitle}>📅 {t("appointments.upcomingAppointments")}</DynamicText>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {t("appointments.upcomingAppointmentsDesc")}
      </DynamicText>
      
      {upcomingAppointments.slice(0, 5).map(appointment => (
        <View key={appointment.id} style={[
          dynamicStyles.appointmentCard,
          { borderLeftColor: getTypeColor(appointment.type) }
        ]}>
          <View style={dynamicStyles.appointmentHeader}>
            <DynamicText type="card" style={dynamicStyles.appointmentTitle}>{appointment.title}</DynamicText>
            <DynamicText type="card" style={dynamicStyles.appointmentType}>
              {appointmentTypes.find(t => t.value === appointment.type)?.icon} {appointmentTypes.find(t => t.value === appointment.type)?.label}
            </DynamicText>
          </View>
          
          <DynamicText type="card" style={dynamicStyles.appointmentDetails}>
            {appointment.doctorName && uiI18n.t("healthAnalytics.value", { value1: appointment.doctorName })}
          </DynamicText>
          
          <DynamicText type="card" style={dynamicStyles.appointmentDateTime}>
            📅 {new Date(appointment.startDate).toLocaleDateString()}{uiI18n.t("ui.at")}{new Date(appointment.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </DynamicText>
          
          <DynamicText type="card" style={dynamicStyles.appointmentLocation}>
            📍 {appointment.location}
          </DynamicText>
          
          <View style={[
            dynamicStyles.statusBadge,
            { backgroundColor: getStatusColor(appointment.status) }
          ]}>
            <DynamicText type="card" style={dynamicStyles.statusText}>
              {getStatusLabel(appointment.status)}
            </DynamicText>
          </View>
          {preVisitIntakeEnabled && (
            <TouchableOpacity
              testID={`previsit-intake-entry-${appointment.id}`}
              accessibilityRole="button"
              onPress={() => setPreVisitIntake({ mode: 'history', appointmentId: appointment.id })}
              style={{ alignSelf: 'flex-start', marginTop: 8, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: currentTheme.accent }}
            >
              <DynamicText type="accent" style={{ fontSize: 13, fontWeight: '600' }}>{t("preVisitIntake.entry.openIntake")}</DynamicText>
            </TouchableOpacity>
          )}
        </View>
      ))}
      
      {upcomingAppointments.length === 0 && (
        <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          {t("appointments.noUpcomingAppointments")}
        </DynamicText>
      )}
    </Animated.View>
  );

  const renderDoctorContacts = () => (
    <Animated.View 
      style={[
        dynamicStyles.sectionCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <DynamicText type="primary" style={dynamicStyles.sectionTitle}>👨‍⚕️ {t("appointments.doctorContacts")}</DynamicText>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {t("appointments.doctorContactsDesc")}
      </DynamicText>
      
      {doctorContacts.map(doctor => (
        <View key={doctor.id} style={dynamicStyles.doctorCard}>
          <View style={dynamicStyles.doctorInfo}>
            <DynamicText type="card" style={dynamicStyles.doctorName}>
              {doctor.name} {doctor.isPrimary && '⭐'}
            </DynamicText>
            <DynamicText type="card" style={dynamicStyles.doctorSpecialty}>{doctor.specialty}</DynamicText>
            <DynamicText type="card" style={dynamicStyles.doctorContact}>{doctor.countryCode} {doctor.phoneNumber}</DynamicText>
            {doctor.email && (
              <DynamicText type="card" style={dynamicStyles.doctorContact}>{doctor.email}</DynamicText>
            )}
            <DynamicText type="card" style={dynamicStyles.doctorContact}>{doctor.address}</DynamicText>
            
            {/* Dialing Options */}
            <View style={dynamicStyles.dialingOptions}>
              {(doctor.dialingMethod === uiI18n.t("ui.phone") || doctor.dialingMethod === 'both') && (
                <TouchableOpacity
                  style={[dynamicStyles.dialButton, { backgroundColor: currentTheme.accent + 'CC' }]}
                  onPress={() => {
                    const phoneUrl = `tel:${doctor.countryCode}${doctor.phoneNumber}`;
                    Linking.openURL(phoneUrl).catch(err => console.error('Failed to open phone:', err));
                  }}
                >
                  <DynamicText type="card" style={dynamicStyles.dialButtonText}>{t("appointments.call")}</DynamicText>
                </TouchableOpacity>
              )}
              
              {(doctor.dialingMethod === uiI18n.t("appointments.whatsapp") || doctor.dialingMethod === 'both') && (
                <TouchableOpacity
                  style={[dynamicStyles.dialButton, { backgroundColor: '#25D366' + 'CC' }]}
                  onPress={() => {
                    const whatsappUrl = `https://wa.me/${doctor.countryCode.replace('+', '')}${doctor.phoneNumber}`;
                    Linking.openURL(whatsappUrl).catch(err => console.error('Failed to open WhatsApp:', err));
                  }}
                >
                  <DynamicText type="card" style={dynamicStyles.dialButtonText}>{t("appointments.whatsapp")}</DynamicText>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={dynamicStyles.doctorActionButtons}>
            <TouchableOpacity
              style={dynamicStyles.editDoctorButton}
              onPress={() => editDoctorContact(doctor)}
            >
              <Ionicons name="pencil-outline" size={12} color="#ffffff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={dynamicStyles.deleteDoctorButton}
              onPress={() => deleteDoctorContact(doctor.id, doctor.name)}
            >
              <Ionicons name="trash-outline" size={12} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          {doctor.isPrimary && (
            <View style={dynamicStyles.primaryBadge}>
              <DynamicText type="card" style={dynamicStyles.primaryBadgeText}>{t("appointments.primary")}</DynamicText>
            </View>
          )}
        </View>
      ))}
      
      {doctorContacts.length === 0 && (
        <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          {t("appointments.noDoctorContactsYet")}
        </DynamicText>
      )}
    </Animated.View>
  );

  return (
    <KeyboardForm><View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.container}>
        <ScrollView keyboardShouldPersistTaps="handled" 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: FAB_SCROLL_PADDING }]} 
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                paddingTop: Math.max(insets.top, 0) + 12,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <TouchableOpacity style={styles.homeButton} onPress={onClose}>
              <Image 
                source={require('../../assets/AuricRX_home_button_across_screens.png')} 
                style={styles.homeButtonIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Title */}
          <Animated.View 
            style={[
              styles.titleSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <DynamicText type="primary" style={styles.title}>
              📅 {t("appointments.appointmentManagement")}
            </DynamicText>
            <DynamicText type="secondary" style={styles.subtitle}>
              {t("appointments.appointmentManagementDesc")}
            </DynamicText>
          </Animated.View>

          {/* Stats Overview */}
          {renderStatsOverview()}

          {/* Upcoming Appointments */}
          {renderUpcomingAppointments()}

          {/* Doctor Contacts */}
          {renderDoctorContacts()}
        </ScrollView>
      </View>

      {preVisitIntakeEnabled && preVisitIntake && (
        <PreVisitIntakeModal
          visible
          mode={preVisitIntake.mode}
          initialAppointmentId={preVisitIntake.appointmentId}
          justBookedId={preVisitIntake.justBooked?.id ?? null}
          appointments={
            preVisitIntake.justBooked
              ? [preVisitIntake.justBooked, ...appointments.filter(a => a.id !== preVisitIntake.justBooked?.id)]
              : appointments
          }
          dark={currentTheme?.mode !== 'light'}
          onClose={() => setPreVisitIntake(null)}
        />
      )}

      {/* Add Appointment Modal */}
      <Modal
        visible={showAddAppointmentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddAppointmentModal(false)}
      >
        <KeyboardForm><View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>📅 {t("appointments.scheduleAppointment")}</DynamicText>
            
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} 
              style={dynamicStyles.modalScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("appointments.appointmentType")}</DynamicText>
              <TouchableOpacity
                style={dynamicStyles.pickerButton}
                onPress={() => {
                  Alert.alert(
                    t("appointments.selectAppointmentType"),
                    '',
                    appointmentTypes.map(type => ({
                      text: `${type.icon} ${type.label}`,
                      onPress: () => setSelectedAppointmentType(type.value)
                    }))
                  );
                }}
              >
                <DynamicText type="card" style={dynamicStyles.pickerText}>
                  {appointmentTypes.find(t => t.value === selectedAppointmentType)?.icon} {appointmentTypes.find(t => t.value === selectedAppointmentType)?.label}
                </DynamicText>
                <DynamicText type="card" style={dynamicStyles.pickerText}>▼</DynamicText>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("appointments.title")} *</DynamicText>
              <TextInput
                style={dynamicStyles.textInput}
                placeholder={t("appointments.titlePlaceholder")}
                placeholderTextColor="#ffffff80"
                value={appointmentTitle}
                onChangeText={setAppointmentTitle}
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("appointments.location")} *</DynamicText>
              <TextInput
                style={dynamicStyles.textInput}
                placeholder={t("appointments.locationPlaceholder")}
                placeholderTextColor="#ffffff80"
                value={appointmentLocation}
                onChangeText={setAppointmentLocation}
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("appointments.date")} *</DynamicText>
              <TouchableOpacity
                style={dynamicStyles.pickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <DynamicText type="card" style={dynamicStyles.pickerText}>
                  📅 {appointmentDate || formatDate(selectedDate)}
                </DynamicText>
                <DynamicText type="card" style={dynamicStyles.pickerText}>▼</DynamicText>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("appointments.time")} *</DynamicText>
              <TouchableOpacity
                style={dynamicStyles.pickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <DynamicText type="card" style={dynamicStyles.pickerText}>
                  🕐 {appointmentTime || formatTime(selectedTime)}
                </DynamicText>
                <DynamicText type="card" style={dynamicStyles.pickerText}>▼</DynamicText>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("appointments.notesOptional")}</DynamicText>
              <TextInput
                style={[dynamicStyles.textInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder={t("appointments.notesPlaceholder")}
                placeholderTextColor="#ffffff80"
                value={appointmentNotes}
                onChangeText={setAppointmentNotes}
                multiline
              />
            </View>
            </ScrollView>

            {/* Date and Time Pickers */}
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => setShowAddAppointmentModal(false)}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{t("common.cancel")}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={addAppointment}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>{t("appointments.schedule")}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View></KeyboardForm>
      </Modal>

      {/* Add Doctor Modal */}
      <Modal
        visible={showAddDoctorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddDoctorModal(false)}
      >
        <KeyboardForm><View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>👨‍⚕️ {t("appointments.addDoctorContact")}</DynamicText>
            
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} 
              style={dynamicStyles.modalScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("appointments.doctorName")} *</DynamicText>
                <TextInput
                  style={dynamicStyles.textInput}
                  placeholder={t("appointments.doctorNamePlaceholder")}
                  placeholderTextColor="#ffffff80"
                  value={doctorName}
                  onChangeText={setDoctorName}
                />
              </View>

              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("appointments.specialty")} *</DynamicText>
                <TextInput
                  style={dynamicStyles.textInput}
                  placeholder={`${t("healthAnalytics.enterValue").replace(uiI18n.t("healthAnalytics.value"), '')} ${t("appointments.specialty")}`}
                  placeholderTextColor="#ffffff80"
                  value={doctorSpecialty}
                  onChangeText={setDoctorSpecialty}
                />
              </View>

              {/* Country Code Selection */}
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>🌍 {t("appointments.selectCountry")} *</DynamicText>
                <TouchableOpacity
                  style={dynamicStyles.pickerButton}
                  onPress={() => {
setShowCountryPicker(true)
                  }}
                >
                  <DynamicText type="card" style={dynamicStyles.pickerText}>
                    {countryCodes.find(c => c.code === doctorCountryCode)?.flag} {doctorCountryCode}
                  </DynamicText>
                  <DynamicText type="card" style={dynamicStyles.pickerText}>▼</DynamicText>
                </TouchableOpacity>
              </View>

              {/* {t('phoneNumber')} */}
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("appointments.phoneNumber")} *</DynamicText>
                <View style={dynamicStyles.phoneInputContainer}>
                  <View style={dynamicStyles.countryCodeDisplay}>
                    <DynamicText type="card" style={dynamicStyles.countryCodeText}>{doctorCountryCode}</DynamicText>
                  </View>
                  <TextInput
                    style={[dynamicStyles.textInput, dynamicStyles.phoneNumberInput]}
                    placeholder={`${t("healthAnalytics.enterValue").replace(uiI18n.t("healthAnalytics.value"), '')} ${t("appointments.phoneNumber").replace(uiI18n.t("ui.numeroDe"), '')}`}
                    placeholderTextColor="#ffffff80"
                    value={doctorPhone}
                    onChangeText={setDoctorPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>📧 {t("appointments.doctorEmailAddress")}</DynamicText>
                <TextInput
                  style={dynamicStyles.textInput}
                  placeholder={t("appointments.doctorEmailPlaceholder")}
                  placeholderTextColor="#ffffff80"
                  value={doctorEmail}
                  onChangeText={setDoctorEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Dialing Method Selection */}
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("appointments.dialingMethod")} *</DynamicText>
                <TouchableOpacity
                  style={dynamicStyles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      t("appointments.selectDialingMethod"),
                      t("appointments.howToContactDoctor"),
                      dialingMethods.map(method => ({
                        text: `${method.icon} ${method.label}`,
                        onPress: () => setDoctorDialingMethod(method.value)
                      }))
                    );
                  }}
                >
                  <DynamicText type="card" style={dynamicStyles.pickerText}>
                    {dialingMethods.find(m => m.value === doctorDialingMethod)?.icon} {dialingMethods.find(m => m.value === doctorDialingMethod)?.label}
                  </DynamicText>
                  <DynamicText type="card" style={dynamicStyles.pickerText}>▼</DynamicText>
                </TouchableOpacity>
              </View>

              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("appointments.address")} *</DynamicText>
                <TextInput
                  style={[dynamicStyles.textInput, { height: 60, textAlignVertical: 'top' }]}
                  placeholder={`${t("healthAnalytics.enterValue").replace(uiI18n.t("healthAnalytics.value"), '')} ${t("appointments.address")}`}
                  placeholderTextColor="#ffffff80"
                  value={doctorAddress}
                  onChangeText={setDoctorAddress}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => setShowAddDoctorModal(false)}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{t("common.cancel")}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={addDoctorContact}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>{t("appointments.addDoctor")}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View></KeyboardForm>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal
        visible={showEditDoctorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditDoctorModal(false)}
      >
        <KeyboardForm><View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>✏️ {t("appointments.editDoctorContact")}</DynamicText>
            
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} 
              style={dynamicStyles.modalScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("appointments.doctorName")} *</DynamicText>
                <TextInput
                  style={dynamicStyles.textInput}
                  placeholder={t("appointments.doctorNamePlaceholder")}
                  placeholderTextColor="#ffffff80"
                  value={doctorName}
                  onChangeText={setDoctorName}
                />
              </View>

              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("appointments.specialty")} *</DynamicText>
                <TextInput
                  style={dynamicStyles.textInput}
                  placeholder={`${t("healthAnalytics.enterValue").replace(uiI18n.t("healthAnalytics.value"), '')} ${t("appointments.specialty")}`}
                  placeholderTextColor="#ffffff80"
                  value={doctorSpecialty}
                  onChangeText={setDoctorSpecialty}
                />
              </View>

              {/* Country Code Selection */}
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>🌍 {t("appointments.selectCountry")} *</DynamicText>
                <TouchableOpacity
                  style={dynamicStyles.pickerButton}
                  onPress={() => {
setShowCountryPicker(true)
                  }}
                >
                  <DynamicText type="card" style={dynamicStyles.pickerText}>
                    {countryCodes.find(c => c.code === doctorCountryCode)?.flag} {doctorCountryCode}
                  </DynamicText>
                  <DynamicText type="card" style={dynamicStyles.pickerText}>▼</DynamicText>
                </TouchableOpacity>
              </View>

              {/* {t('phoneNumber')} */}
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("appointments.phoneNumber")} *</DynamicText>
                <View style={dynamicStyles.phoneInputContainer}>
                  <View style={dynamicStyles.countryCodeDisplay}>
                    <DynamicText type="card" style={dynamicStyles.countryCodeText}>{doctorCountryCode}</DynamicText>
                  </View>
                  <TextInput
                    style={[dynamicStyles.textInput, dynamicStyles.phoneNumberInput]}
                    placeholder={`${t("healthAnalytics.enterValue").replace(uiI18n.t("healthAnalytics.value"), '')} ${t("appointments.phoneNumber").replace(uiI18n.t("ui.numeroDe"), '')}`}
                    placeholderTextColor="#ffffff80"
                    value={doctorPhone}
                    onChangeText={setDoctorPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>📧 {t("appointments.doctorEmailAddress")}</DynamicText>
                <TextInput
                  style={dynamicStyles.textInput}
                  placeholder={t("appointments.doctorEmailPlaceholder")}
                  placeholderTextColor="#ffffff80"
                  value={doctorEmail}
                  onChangeText={setDoctorEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Dialing Method Selection */}
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("appointments.dialingMethod")} *</DynamicText>
                <TouchableOpacity
                  style={dynamicStyles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      t("appointments.selectDialingMethod"),
                      t("appointments.howToContactDoctor"),
                      dialingMethods.map(method => ({
                        text: `${method.icon} ${method.label}`,
                        onPress: () => setDoctorDialingMethod(method.value)
                      }))
                    );
                  }}
                >
                  <DynamicText type="card" style={dynamicStyles.pickerText}>
                    {dialingMethods.find(m => m.value === doctorDialingMethod)?.icon} {dialingMethods.find(m => m.value === doctorDialingMethod)?.label}
                  </DynamicText>
                  <DynamicText type="card" style={dynamicStyles.pickerText}>▼</DynamicText>
                </TouchableOpacity>
              </View>

              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t("appointments.address")} *</DynamicText>
                <TextInput
                  style={[dynamicStyles.textInput, { height: 60, textAlignVertical: 'top' }]}
                  placeholder={`${t("healthAnalytics.enterValue").replace(uiI18n.t("healthAnalytics.value"), '')} ${t("appointments.address")}`}
                  placeholderTextColor="#ffffff80"
                  value={doctorAddress}
                  onChangeText={setDoctorAddress}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => {
                  setShowEditDoctorModal(false);
                  setEditingDoctor(null);
                }}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{t("common.cancel")}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={updateDoctorContact}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>{t("appointments.updateDoctor")}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View></KeyboardForm>
      </Modal>

      {/* Past Appointments Modal */}
      <Modal
        visible={showPastAppointmentsModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowPastAppointmentsModal(false);
          setPastAppointmentsSearch('');
        }}
      >
        <KeyboardForm><View style={dynamicStyles.modalOverlay}>
          <View style={[dynamicStyles.modalContent, { maxHeight: '80%' }]}><ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled contentContainerStyle={{ paddingBottom: 24 }} style={{ flexShrink: 1 }}>
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>📋 {t("appointments.pastAppointments")}</DynamicText>
            
            {/* Search Input */}
            <View style={dynamicStyles.searchContainer}>
              <TextInput
                style={dynamicStyles.searchInput}
                placeholder={t("appointments.searchPastAppointments")}
                placeholderTextColor="#ffffff80"
                value={pastAppointmentsSearch}
                onChangeText={setPastAppointmentsSearch}
              />
            </View>
            
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled" 
              style={dynamicStyles.modalScrollView}
              showsVerticalScrollIndicator={true}
            >
              {getPastAppointments().length === 0 ? (
                <View style={dynamicStyles.emptyState}>
                  <DynamicText type="secondary" style={dynamicStyles.emptyStateText}>
                    {pastAppointmentsSearch.trim() ? 
                      `${t("appointments.noAppointmentsFound")}` : 
                      t("appointments.noPastAppointments")
                    }
                  </DynamicText>
                </View>
              ) : (
                getPastAppointments().map((appointment) => (
                  <View key={appointment.id} style={dynamicStyles.pastAppointmentCard}>
                    <View style={dynamicStyles.appointmentHeader}>
                      <DynamicText type="card" style={dynamicStyles.appointmentTitle}>
                        {appointmentTypes.find(t => t.value === appointment.type)?.icon} {appointment.title}
                      </DynamicText>
                      <View style={[
                        dynamicStyles.statusBadge,
                        { 
                          backgroundColor: appointment.status === 'completed' ? '#10B981' + 'CC' : '#EF4444' + 'CC',
                          borderColor: appointment.status === 'completed' ? '#10B981' : '#EF4444'
                        }
                      ]}>
                        <DynamicText type="card" style={dynamicStyles.statusText}>
                          {appointment.status === uiI18n.t("appointments.completed") ? uiI18n.t("healthAnalytics.value", { value1: t("appointments.attended") }) : uiI18n.t("healthAnalytics.value", { value1: t("appointments.missed") })}
                        </DynamicText>
                      </View>
                    </View>
                    
                    <DynamicText type="card" style={dynamicStyles.appointmentDetails}>
                      📍 {appointment.location}
                    </DynamicText>
                    
                    {appointment.doctorName && (
                      <DynamicText type="card" style={dynamicStyles.appointmentDetails}>
                        👨‍⚕️ {appointment.doctorName}
                      </DynamicText>
                    )}
                    
                    <DynamicText type="card" style={dynamicStyles.appointmentDateTime}>
                      📅 {new Date(appointment.startDate).toLocaleDateString()}{uiI18n.t("ui.at")}{new Date(appointment.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </DynamicText>
                    
                    {appointment.notes && (
                      <DynamicText type="card" style={dynamicStyles.appointmentNotes}>
                        📝 {appointment.notes}
                      </DynamicText>
                    )}
                  </View>
                ))
              )}
            </ScrollView>

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => {
                  setShowPastAppointmentsModal(false);
                  setPastAppointmentsSearch('');
                }}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{t("appointments.close")}</DynamicText>
              </TouchableOpacity>
            </View>
          </ScrollView></View>
        </View></KeyboardForm>
      </Modal>

      {/* Country Code Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={[dynamicStyles.modalContent, { maxHeight: '80%', width: '95%' }]}>
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>🌍 {t("appointments.selectCountry")}</DynamicText>
            <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { marginBottom: 16 }]}>
              {t("appointments.chooseCountryCode")}
            </DynamicText>
            
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled" 
              style={dynamicStyles.modalScrollView}
              showsVerticalScrollIndicator={true}
            >
              {countryCodes.map((country, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    dynamicStyles.countryItem,
                    { 
                      backgroundColor: doctorCountryCode === country.code 
                        ? currentTheme.accent + 'CC' 
                        : getCardBackgroundColor() + '80',
                      borderColor: doctorCountryCode === country.code 
                        ? currentTheme.accent 
                        : getCardBorderColor()
                    }
                  ]}
                  onPress={() => {
                    setDoctorCountryCode(country.code);
                    setShowCountryPicker(false);
                  }}
                >
                  <DynamicText type="card" style={dynamicStyles.countryFlag}>
                    {country.flag}
                  </DynamicText>
                  <DynamicText type="card" style={dynamicStyles.countryName}>
                    {country.country}
                  </DynamicText>
                  <DynamicText type="card" style={dynamicStyles.countryCode}>
                    {country.code}
                  </DynamicText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => setShowCountryPicker(false)}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{t("common.cancel")}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View></KeyboardForm>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  homeButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -65,
  },
  homeButtonIcon: {
    width: 180,
    height: 70,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
});
