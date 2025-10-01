import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Animated,
  StatusBar,
  Platform,
  Vibration,
  Dimensions,
  Modal,
  TextInput,
  Image,
  Linking,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
import AppointmentService, { Appointment, DoctorContact, AppointmentStats } from '../services/appointmentService';

const { width: screenWidth } = Dimensions.get('window');

interface AppointmentManagementScreenProps {
  onClose: () => void;
  theme?: any;
  S?: any;
}

type AppointmentType = 'doctor' | 'lab' | 'pharmacy' | 'specialist' | 'emergency' | 'follow_up' | 'checkup' | 'other';

export default function AppointmentManagementScreen({ onClose, theme, S }: AppointmentManagementScreenProps) {
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
  
  // Use S object for translations, fallback to key if not available
  const t = (key: string) => S?.[key] || key;
  
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
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
    },
    sectionDescription: {
      fontSize: 14,
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
    appointmentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    appointmentTitle: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
    },
    appointmentType: {
      fontSize: 12,
      backgroundColor: getCardBackgroundColor() + '80',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    appointmentDetails: {
      fontSize: 14,
      marginBottom: 4,
    },
    appointmentDateTime: {
      fontSize: 12,
      marginBottom: 4,
    },
    appointmentLocation: {
      fontSize: 12,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
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
      fontSize: 14,
      fontWeight: '600',
    },
    doctorCard: {
      backgroundColor: getCardBackgroundColor() + '80',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    doctorInfo: {
      flex: 1,
    },
    doctorName: {
      fontSize: 14,
      fontWeight: '500',
    },
    doctorSpecialty: {
      fontSize: 12,
      marginTop: 2,
    },
    doctorContact: {
      fontSize: 12,
      marginTop: 2,
    },
    primaryBadge: {
      backgroundColor: currentTheme.accent + 'CC',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    primaryBadgeText: {
      fontSize: 10,
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
      fontSize: 24,
      fontWeight: 'bold',
    },
    statLabel: {
      fontSize: 12,
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
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: getCardBackgroundColor() + '80',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      color: getCardTextColor(),
      fontSize: 14,
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
      fontSize: 14,
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
    },
    modalButtonText: {
      fontSize: 16,
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
      fontSize: 14,
      fontWeight: '500',
      color: '#ffffff',
    },
    phoneNumberInput: {
      flex: 1,
    },
    dialingOptions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    dialButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      flex: 1,
      alignItems: 'center',
    },
    dialButtonText: {
      fontSize: 12,
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
      fontSize: 16,
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
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
    },
    appointmentDetails: {
      fontSize: 14,
      marginBottom: 4,
    },
    appointmentDateTime: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 4,
    },
    appointmentNotes: {
      fontSize: 14,
      fontStyle: 'italic',
      marginTop: 4,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyStateText: {
      fontSize: 16,
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
      fontSize: 14,
    },
    // Delete doctor button styles
    deleteDoctorButton: {
      backgroundColor: '#EF4444' + 'CC',
      borderRadius: 14,
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#EF4444',
    },
    deleteDoctorButtonText: {
      fontSize: 14,
      color: '#ffffff',
    },
    // Doctor action buttons container
    doctorActionButtons: {
      position: 'absolute',
      top: 8,
      right: 8,
      flexDirection: 'row',
      gap: 4,
      alignItems: 'center',
    },
    // Edit doctor button styles
    editDoctorButton: {
      backgroundColor: '#3B82F6' + 'CC',
      borderRadius: 14,
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#3B82F6',
    },
    editDoctorButtonText: {
      fontSize: 14,
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
      fontSize: 16,
      fontWeight: '500',
    },
    countryCode: {
      fontSize: 14,
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
    { value: 'doctor', label: t('doctorVisit'), icon: '👨‍⚕️' },
    { value: 'lab', label: t('labTest'), icon: '🧪' },
    { value: 'pharmacy', label: t('pharmacy'), icon: '💊' },
    { value: 'specialist', label: t('specialist'), icon: '🏥' },
    { value: 'emergency', label: t('emergency'), icon: '🚨' },
    { value: 'follow_up', label: t('followUp'), icon: '🔄' },
    { value: 'checkup', label: t('checkup'), icon: '✅' },
    { value: 'other', label: t('other'), icon: '📅' },
  ];

  const countryCodes = [
    { code: '+1', country: '🇺🇸 United States', flag: '🇺🇸' },
    { code: '+52', country: '🇲🇽 Mexico', flag: '🇲🇽' },
    { code: '+86', country: '🇨🇳 China', flag: '🇨🇳' },
    { code: '+44', country: '🇬🇧 United Kingdom', flag: '🇬🇧' },
    { code: '+33', country: '🇫🇷 France', flag: '🇫🇷' },
    { code: '+49', country: '🇩🇪 Germany', flag: '🇩🇪' },
    { code: '+81', country: '🇯🇵 Japan', flag: '🇯🇵' },
    { code: '+91', country: '🇮🇳 India', flag: '🇮🇳' },
    { code: '+55', country: '🇧🇷 Brazil', flag: '🇧🇷' },
    { code: '+61', country: '🇦🇺 Australia', flag: '🇦🇺' },
    { code: '+34', country: '🇪🇸 Spain', flag: '🇪🇸' },
    { code: '+39', country: '🇮🇹 Italy', flag: '🇮🇹' },
    { code: '+31', country: '🇳🇱 Netherlands', flag: '🇳🇱' },
    { code: '+46', country: '🇸🇪 Sweden', flag: '🇸🇪' },
    { code: '+47', country: '🇳🇴 Norway', flag: '🇳🇴' },
    { code: '+45', country: '🇩🇰 Denmark', flag: '🇩🇰' },
    { code: '+41', country: '🇨🇭 Switzerland', flag: '🇨🇭' },
    { code: '+43', country: '🇦🇹 Austria', flag: '🇦🇹' },
    { code: '+32', country: '🇧🇪 Belgium', flag: '🇧🇪' },
    { code: '+351', country: '🇵🇹 Portugal', flag: '🇵🇹' },
    { code: '+30', country: '🇬🇷 Greece', flag: '🇬🇷' },
    { code: '+48', country: '🇵🇱 Poland', flag: '🇵🇱' },
    { code: '+420', country: '🇨🇿 Czech Republic', flag: '🇨🇿' },
    { code: '+36', country: '🇭🇺 Hungary', flag: '🇭🇺' },
    { code: '+40', country: '🇷🇴 Romania', flag: '🇷🇴' },
    { code: '+359', country: '🇧🇬 Bulgaria', flag: '🇧🇬' },
    { code: '+385', country: '🇭🇷 Croatia', flag: '🇭🇷' },
    { code: '+386', country: '🇸🇮 Slovenia', flag: '🇸🇮' },
    { code: '+421', country: '🇸🇰 Slovakia', flag: '🇸🇰' },
    { code: '+370', country: '🇱🇹 Lithuania', flag: '🇱🇹' },
    { code: '+371', country: '🇱🇻 Latvia', flag: '🇱🇻' },
    { code: '+372', country: '🇪🇪 Estonia', flag: '🇪🇪' },
    { code: '+353', country: '🇮🇪 Ireland', flag: '🇮🇪' },
    { code: '+358', country: '🇫🇮 Finland', flag: '🇫🇮' },
    { code: '+7', country: '🇷🇺 Russia', flag: '🇷🇺' },
    { code: '+380', country: '🇺🇦 Ukraine', flag: '🇺🇦' },
    { code: '+375', country: '🇧🇾 Belarus', flag: '🇧🇾' },
    { code: '+370', country: '🇱🇹 Lithuania', flag: '🇱🇹' },
    { code: '+371', country: '🇱🇻 Latvia', flag: '🇱🇻' },
    { code: '+372', country: '🇪🇪 Estonia', flag: '🇪🇪' },
    { code: '+90', country: '🇹🇷 Turkey', flag: '🇹🇷' },
    { code: '+20', country: '🇪🇬 Egypt', flag: '🇪🇬' },
    { code: '+27', country: '🇿🇦 South Africa', flag: '🇿🇦' },
    { code: '+234', country: '🇳🇬 Nigeria', flag: '🇳🇬' },
    { code: '+254', country: '🇰🇪 Kenya', flag: '🇰🇪' },
    { code: '+233', country: '🇬🇭 Ghana', flag: '🇬🇭' },
    { code: '+212', country: '🇲🇦 Morocco', flag: '🇲🇦' },
    { code: '+213', country: '🇩🇿 Algeria', flag: '🇩🇿' },
    { code: '+216', country: '🇹🇳 Tunisia', flag: '🇹🇳' },
    { code: '+218', country: '🇱🇾 Libya', flag: '🇱🇾' },
    { code: '+220', country: '🇬🇲 Gambia', flag: '🇬🇲' },
    { code: '+221', country: '🇸🇳 Senegal', flag: '🇸🇳' },
    { code: '+222', country: '🇲🇷 Mauritania', flag: '🇲🇷' },
    { code: '+223', country: '🇲🇱 Mali', flag: '🇲🇱' },
    { code: '+224', country: '🇬🇳 Guinea', flag: '🇬🇳' },
    { code: '+225', country: '🇨🇮 Ivory Coast', flag: '🇨🇮' },
    { code: '+226', country: '🇧🇫 Burkina Faso', flag: '🇧🇫' },
    { code: '+227', country: '🇳🇪 Niger', flag: '🇳🇪' },
    { code: '+228', country: '🇹🇬 Togo', flag: '🇹🇬' },
    { code: '+229', country: '🇧🇯 Benin', flag: '🇧🇯' },
    { code: '+230', country: '🇲🇺 Mauritius', flag: '🇲🇺' },
    { code: '+231', country: '🇱🇷 Liberia', flag: '🇱🇷' },
    { code: '+232', country: '🇸🇱 Sierra Leone', flag: '🇸🇱' },
    { code: '+235', country: '🇹🇩 Chad', flag: '🇹🇩' },
    { code: '+236', country: '🇨🇫 Central African Republic', flag: '🇨🇫' },
    { code: '+237', country: '🇨🇲 Cameroon', flag: '🇨🇲' },
    { code: '+238', country: '🇨🇻 Cape Verde', flag: '🇨🇻' },
    { code: '+239', country: '🇸🇹 São Tomé and Príncipe', flag: '🇸🇹' },
    { code: '+240', country: '🇬🇶 Equatorial Guinea', flag: '🇬🇶' },
    { code: '+241', country: '🇬🇦 Gabon', flag: '🇬🇦' },
    { code: '+242', country: '🇨🇬 Republic of the Congo', flag: '🇨🇬' },
    { code: '+243', country: '🇨🇩 Democratic Republic of the Congo', flag: '🇨🇩' },
    { code: '+244', country: '🇦🇴 Angola', flag: '🇦🇴' },
    { code: '+245', country: '🇬🇼 Guinea-Bissau', flag: '🇬🇼' },
    { code: '+246', country: '🇮🇴 British Indian Ocean Territory', flag: '🇮🇴' },
    { code: '+248', country: '🇸🇨 Seychelles', flag: '🇸🇨' },
    { code: '+249', country: '🇸🇩 Sudan', flag: '🇸🇩' },
    { code: '+250', country: '🇷🇼 Rwanda', flag: '🇷🇼' },
    { code: '+251', country: '🇪🇹 Ethiopia', flag: '🇪🇹' },
    { code: '+252', country: '🇸🇴 Somalia', flag: '🇸🇴' },
    { code: '+253', country: '🇩🇯 Djibouti', flag: '🇩🇯' },
    { code: '+255', country: '🇹🇿 Tanzania', flag: '🇹🇿' },
    { code: '+256', country: '🇺🇬 Uganda', flag: '🇺🇬' },
    { code: '+257', country: '🇧🇮 Burundi', flag: '🇧🇮' },
    { code: '+258', country: '🇲🇿 Mozambique', flag: '🇲🇿' },
    { code: '+260', country: '🇿🇲 Zambia', flag: '🇿🇲' },
    { code: '+261', country: '🇲🇬 Madagascar', flag: '🇲🇬' },
    { code: '+262', country: '🇷🇪 Réunion', flag: '🇷🇪' },
    { code: '+263', country: '🇿🇼 Zimbabwe', flag: '🇿🇼' },
    { code: '+264', country: '🇳🇦 Namibia', flag: '🇳🇦' },
    { code: '+265', country: '🇲🇼 Malawi', flag: '🇲🇼' },
    { code: '+266', country: '🇱🇸 Lesotho', flag: '🇱🇸' },
    { code: '+267', country: '🇧🇼 Botswana', flag: '🇧🇼' },
    { code: '+268', country: '🇸🇿 Swaziland', flag: '🇸🇿' },
    { code: '+269', country: '🇰🇲 Comoros', flag: '🇰🇲' },
    { code: '+290', country: '🇸🇭 Saint Helena', flag: '🇸🇭' },
    { code: '+291', country: '🇪🇷 Eritrea', flag: '🇪🇷' },
    { code: '+297', country: '🇦🇼 Aruba', flag: '🇦🇼' },
    { code: '+298', country: '🇫🇴 Faroe Islands', flag: '🇫🇴' },
    { code: '+299', country: '🇬🇱 Greenland', flag: '🇬🇱' },
    { code: '+350', country: '🇬🇮 Gibraltar', flag: '🇬🇮' },
    { code: '+352', country: '🇱🇺 Luxembourg', flag: '🇱🇺' },
    { code: '+354', country: '🇮🇸 Iceland', flag: '🇮🇸' },
    { code: '+355', country: '🇦🇱 Albania', flag: '🇦🇱' },
    { code: '+356', country: '🇲🇹 Malta', flag: '🇲🇹' },
    { code: '+357', country: '🇨🇾 Cyprus', flag: '🇨🇾' },
    { code: '+358', country: '🇫🇮 Finland', flag: '🇫🇮' },
    { code: '+359', country: '🇧🇬 Bulgaria', flag: '🇧🇬' },
    { code: '+370', country: '🇱🇹 Lithuania', flag: '🇱🇹' },
    { code: '+371', country: '🇱🇻 Latvia', flag: '🇱🇻' },
    { code: '+372', country: '🇪🇪 Estonia', flag: '🇪🇪' },
    { code: '+373', country: '🇲🇩 Moldova', flag: '🇲🇩' },
    { code: '+374', country: '🇦🇲 Armenia', flag: '🇦🇲' },
    { code: '+375', country: '🇧🇾 Belarus', flag: '🇧🇾' },
    { code: '+376', country: '🇦🇩 Andorra', flag: '🇦🇩' },
    { code: '+377', country: '🇲🇨 Monaco', flag: '🇲🇨' },
    { code: '+378', country: '🇸🇲 San Marino', flag: '🇸🇲' },
    { code: '+380', country: '🇺🇦 Ukraine', flag: '🇺🇦' },
    { code: '+381', country: '🇷🇸 Serbia', flag: '🇷🇸' },
    { code: '+382', country: '🇲🇪 Montenegro', flag: '🇲🇪' },
    { code: '+383', country: '🇽🇰 Kosovo', flag: '🇽🇰' },
    { code: '+385', country: '🇭🇷 Croatia', flag: '🇭🇷' },
    { code: '+386', country: '🇸🇮 Slovenia', flag: '🇸🇮' },
    { code: '+387', country: '🇧🇦 Bosnia and Herzegovina', flag: '🇧🇦' },
    { code: '+389', country: '🇲🇰 North Macedonia', flag: '🇲🇰' },
    { code: '+420', country: '🇨🇿 Czech Republic', flag: '🇨🇿' },
    { code: '+421', country: '🇸🇰 Slovakia', flag: '🇸🇰' },
    { code: '+423', country: '🇱🇮 Liechtenstein', flag: '🇱🇮' },
    { code: '+500', country: '🇫🇰 Falkland Islands', flag: '🇫🇰' },
    { code: '+501', country: '🇧🇿 Belize', flag: '🇧🇿' },
    { code: '+502', country: '🇬🇹 Guatemala', flag: '🇬🇹' },
    { code: '+503', country: '🇸🇻 El Salvador', flag: '🇸🇻' },
    { code: '+504', country: '🇭🇳 Honduras', flag: '🇭🇳' },
    { code: '+505', country: '🇳🇮 Nicaragua', flag: '🇳🇮' },
    { code: '+506', country: '🇨🇷 Costa Rica', flag: '🇨🇷' },
    { code: '+507', country: '🇵🇦 Panama', flag: '🇵🇦' },
    { code: '+508', country: '🇵🇲 Saint Pierre and Miquelon', flag: '🇵🇲' },
    { code: '+509', country: '🇭🇹 Haiti', flag: '🇭🇹' },
    { code: '+590', country: '🇬🇵 Guadeloupe', flag: '🇬🇵' },
    { code: '+591', country: '🇧🇴 Bolivia', flag: '🇧🇴' },
    { code: '+592', country: '🇬🇾 Guyana', flag: '🇬🇾' },
    { code: '+593', country: '🇪🇨 Ecuador', flag: '🇪🇨' },
    { code: '+594', country: '🇬🇫 French Guiana', flag: '🇬🇫' },
    { code: '+595', country: '🇵🇾 Paraguay', flag: '🇵🇾' },
    { code: '+596', country: '🇲🇶 Martinique', flag: '🇲🇶' },
    { code: '+597', country: '🇸🇷 Suriname', flag: '🇸🇷' },
    { code: '+598', country: '🇺🇾 Uruguay', flag: '🇺🇾' },
    { code: '+599', country: '🇳🇱 Netherlands Antilles', flag: '🇳🇱' },
    { code: '+670', country: '🇹🇱 East Timor', flag: '🇹🇱' },
    { code: '+672', country: '🇦🇶 Antarctica', flag: '🇦🇶' },
    { code: '+673', country: '🇧🇳 Brunei', flag: '🇧🇳' },
    { code: '+674', country: '🇳🇷 Nauru', flag: '🇳🇷' },
    { code: '+675', country: '🇵🇬 Papua New Guinea', flag: '🇵🇬' },
    { code: '+676', country: '🇹🇴 Tonga', flag: '🇹🇴' },
    { code: '+677', country: '🇸🇧 Solomon Islands', flag: '🇸🇧' },
    { code: '+678', country: '🇻🇺 Vanuatu', flag: '🇻🇺' },
    { code: '+679', country: '🇫🇯 Fiji', flag: '🇫🇯' },
    { code: '+680', country: '🇵🇼 Palau', flag: '🇵🇼' },
    { code: '+681', country: '🇼🇫 Wallis and Futuna', flag: '🇼🇫' },
    { code: '+682', country: '🇨🇰 Cook Islands', flag: '🇨🇰' },
    { code: '+683', country: '🇳🇺 Niue', flag: '🇳🇺' },
    { code: '+684', country: '🇦🇸 American Samoa', flag: '🇦🇸' },
    { code: '+685', country: '🇼🇸 Samoa', flag: '🇼🇸' },
    { code: '+686', country: '🇰🇮 Kiribati', flag: '🇰🇮' },
    { code: '+687', country: '🇳🇨 New Caledonia', flag: '🇳🇨' },
    { code: '+688', country: '🇹🇻 Tuvalu', flag: '🇹🇻' },
    { code: '+689', country: '🇵🇫 French Polynesia', flag: '🇵🇫' },
    { code: '+690', country: '🇹🇰 Tokelau', flag: '🇹🇰' },
    { code: '+691', country: '🇫🇲 Micronesia', flag: '🇫🇲' },
    { code: '+692', country: '🇲🇭 Marshall Islands', flag: '🇲🇭' },
    { code: '+850', country: '🇰🇵 North Korea', flag: '🇰🇵' },
    { code: '+852', country: '🇭🇰 Hong Kong', flag: '🇭🇰' },
    { code: '+853', country: '🇲🇴 Macau', flag: '🇲🇴' },
    { code: '+855', country: '🇰🇭 Cambodia', flag: '🇰🇭' },
    { code: '+856', country: '🇱🇦 Laos', flag: '🇱🇦' },
    { code: '+880', country: '🇧🇩 Bangladesh', flag: '🇧🇩' },
    { code: '+886', country: '🇹🇼 Taiwan', flag: '🇹🇼' },
    { code: '+960', country: '🇲🇻 Maldives', flag: '🇲🇻' },
    { code: '+961', country: '🇱🇧 Lebanon', flag: '🇱🇧' },
    { code: '+962', country: '🇯🇴 Jordan', flag: '🇯🇴' },
    { code: '+963', country: '🇸🇾 Syria', flag: '🇸🇾' },
    { code: '+964', country: '🇮🇶 Iraq', flag: '🇮🇶' },
    { code: '+965', country: '🇰🇼 Kuwait', flag: '🇰🇼' },
    { code: '+966', country: '🇸🇦 Saudi Arabia', flag: '🇸🇦' },
    { code: '+967', country: '🇾🇪 Yemen', flag: '🇾🇪' },
    { code: '+968', country: '🇴🇲 Oman', flag: '🇴🇲' },
    { code: '+970', country: '🇵🇸 Palestine', flag: '🇵🇸' },
    { code: '+971', country: '🇦🇪 United Arab Emirates', flag: '🇦🇪' },
    { code: '+972', country: '🇮🇱 Israel', flag: '🇮🇱' },
    { code: '+973', country: '🇧🇭 Bahrain', flag: '🇧🇭' },
    { code: '+974', country: '🇶🇦 Qatar', flag: '🇶🇦' },
    { code: '+975', country: '🇧🇹 Bhutan', flag: '🇧🇹' },
    { code: '+976', country: '🇲🇳 Mongolia', flag: '🇲🇳' },
    { code: '+977', country: '🇳🇵 Nepal', flag: '🇳🇵' },
    { code: '+992', country: '🇹🇯 Tajikistan', flag: '🇹🇯' },
    { code: '+993', country: '🇹🇲 Turkmenistan', flag: '🇹🇲' },
    { code: '+994', country: '🇦🇿 Azerbaijan', flag: '🇦🇿' },
    { code: '+995', country: '🇬🇪 Georgia', flag: '🇬🇪' },
    { code: '+996', country: '🇰🇬 Kyrgyzstan', flag: '🇰🇬' },
    { code: '+998', country: '🇺🇿 Uzbekistan', flag: '🇺🇿' },
  ];

  const dialingMethods = [
    { value: 'phone', label: t('phoneOnly'), icon: '' },
    { value: 'whatsapp', label: t('whatsappOnly'), icon: '' },
    { value: 'both', label: t('bothPhoneWhatsapp'), icon: '' },
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
      Alert.alert('❌ ' + t('error'), t('fillAllFields'));
      return;
    }

    if (!appointmentService) {
      Alert.alert('❌ ' + t('error'), t('appointmentServiceNotAvailable'));
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

      await appointmentService.createAppointment({
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
      Alert.alert('✅ ' + t('success'), t('appointmentScheduled'));
    } catch (error) {
      console.error('Failed to add appointment:', error);
      Alert.alert('❌ ' + t('error'), t('failedToSchedule'));
    }
  };

  const addDoctorContact = async () => {
    if (!doctorName || !doctorSpecialty || !doctorPhone || !doctorAddress) {
      Alert.alert('❌ ' + t('error'), t('fillAllFields'));
      return;
    }

    if (!appointmentService) {
      Alert.alert('❌ ' + t('error'), t('appointmentServiceNotAvailable'));
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
      Alert.alert('✅ ' + t('success'), t('doctorContactAdded'));
    } catch (error) {
      console.error('Failed to add doctor contact:', error);
      Alert.alert('❌ ' + t('error'), t('failedToAddDoctor'));
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
      Alert.alert('❌ ' + t('error'), t('fillAllFields'));
      return;
    }

    if (!appointmentService) {
      Alert.alert('❌ ' + t('error'), t('appointmentServiceNotAvailable'));
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
      Alert.alert('✅ ' + t('success'), t('doctorContactUpdated'));
    } catch (error) {
      console.error('Failed to update doctor contact:', error);
      Alert.alert('❌ ' + t('error'), t('failedToUpdateDoctor'));
    }
  };

  const deleteDoctorContact = async (doctorId: string, doctorName: string) => {
    if (!appointmentService) {
      Alert.alert('❌ ' + t('error'), t('appointmentServiceNotAvailable'));
      return;
    }

    Alert.alert(
      '🗑️ ' + t('deleteDoctorContact'),
      `${t('deleteDoctorConfirm')}`,
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentService.deleteDoctorContact(doctorId);
              loadData();
              triggerHaptic('medium');
              Alert.alert('✅ ' + t('success'), t('doctorContactDeleted'));
            } catch (error) {
              console.error('Failed to delete doctor contact:', error);
              Alert.alert('❌ ' + t('error'), t('failedToDeleteDoctor'));
            }
          }
        }
      ]
    );
  };

  const markAppointmentCompleted = async (id: string) => {
    if (!appointmentService) {
      Alert.alert('❌ ' + t('error'), t('appointmentServiceNotAvailable'));
      return;
    }

    try {
      await appointmentService.markAppointmentCompleted(id);
      loadData();
      triggerHaptic('medium');
      Alert.alert('✅ ' + t('success'), t('appointmentCompleted'));
    } catch (error) {
      console.error('Failed to mark appointment completed:', error);
      Alert.alert('❌ ' + t('error'), t('failedToUpdate'));
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
      case 'scheduled': return t('scheduled');
      case 'confirmed': return t('confirmed');
      case 'completed': return t('completed');
      case 'cancelled': return t('cancelled');
      case 'rescheduled': return t('rescheduled');
      default: return t('unknown');
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
      <DynamicText type="primary" style={dynamicStyles.sectionTitle}>📊 {t('appointmentOverview')}</DynamicText>
      
      {stats && (
        <View style={dynamicStyles.statsGrid}>
          <View style={dynamicStyles.statCard}>
            <DynamicText type="card" style={dynamicStyles.statValue}>{stats?.totalAppointments || 0}</DynamicText>
            <DynamicText type="card" style={dynamicStyles.statLabel}>{t('totalAppointments')}</DynamicText>
          </View>
          <View style={dynamicStyles.statCard}>
            <DynamicText type="card" style={dynamicStyles.statValue}>{stats?.upcomingAppointments || 0}</DynamicText>
            <DynamicText type="card" style={dynamicStyles.statLabel}>{t('upcoming')}</DynamicText>
          </View>
          <View style={dynamicStyles.statCard}>
            <DynamicText type="card" style={dynamicStyles.statValue}>{stats?.completedAppointments || 0}</DynamicText>
            <DynamicText type="card" style={dynamicStyles.statLabel}>{t('completed')}</DynamicText>
          </View>
          <View style={dynamicStyles.statCard}>
            <DynamicText type="card" style={dynamicStyles.statValue}>{doctorContacts.length}</DynamicText>
            <DynamicText type="card" style={dynamicStyles.statLabel}>{t('doctors')}</DynamicText>
          </View>
        </View>
      )}

      <View style={dynamicStyles.quickActions}>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={() => setShowAddAppointmentModal(true)}
        >
          <DynamicText type="card" style={dynamicStyles.quickActionText}>📅{'\n'}{t('schedule')}</DynamicText>
        </TouchableOpacity>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={() => setShowAddDoctorModal(true)}
        >
          <DynamicText type="card" style={dynamicStyles.quickActionText}>👨‍⚕️{'\n'}{t('addDoctor')}</DynamicText>
        </TouchableOpacity>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={loadData}
        >
          <DynamicText type="card" style={dynamicStyles.quickActionText}>🔄{'\n'}{t('refresh')}</DynamicText>
        </TouchableOpacity>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={() => setShowPastAppointmentsModal(true)}
        >
          <DynamicText type="card" style={dynamicStyles.quickActionText}>📋{'\n'}{t('pastAppts')}</DynamicText>
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
      <DynamicText type="primary" style={dynamicStyles.sectionTitle}>📅 {t('upcomingAppointments')}</DynamicText>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {t('upcomingAppointmentsDesc')}
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
            {appointment.doctorName && `👨‍⚕️ ${appointment.doctorName}`}
          </DynamicText>
          
          <DynamicText type="card" style={dynamicStyles.appointmentDateTime}>
            📅 {new Date(appointment.startDate).toLocaleDateString()} at {new Date(appointment.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        </View>
      ))}
      
      {upcomingAppointments.length === 0 && (
        <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          {t('noUpcomingAppointments')}
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
      <DynamicText type="primary" style={dynamicStyles.sectionTitle}>👨‍⚕️ {t('doctorContacts')}</DynamicText>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {t('doctorContactsDesc')}
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
              {(doctor.dialingMethod === 'phone' || doctor.dialingMethod === 'both') && (
                <TouchableOpacity
                  style={[dynamicStyles.dialButton, { backgroundColor: currentTheme.accent + 'CC' }]}
                  onPress={() => {
                    const phoneUrl = `tel:${doctor.countryCode}${doctor.phoneNumber}`;
                    Linking.openURL(phoneUrl).catch(err => console.error('Failed to open phone:', err));
                  }}
                >
                  <DynamicText type="card" style={dynamicStyles.dialButtonText}>{t('call')}</DynamicText>
                </TouchableOpacity>
              )}
              
              {(doctor.dialingMethod === 'whatsapp' || doctor.dialingMethod === 'both') && (
                <TouchableOpacity
                  style={[dynamicStyles.dialButton, { backgroundColor: '#25D366' + 'CC' }]}
                  onPress={() => {
                    const whatsappUrl = `https://wa.me/${doctor.countryCode.replace('+', '')}${doctor.phoneNumber}`;
                    Linking.openURL(whatsappUrl).catch(err => console.error('Failed to open WhatsApp:', err));
                  }}
                >
                  <DynamicText type="card" style={dynamicStyles.dialButtonText}>{t('whatsapp')}</DynamicText>
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
              <DynamicText type="card" style={dynamicStyles.editDoctorButtonText}>✏️</DynamicText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={dynamicStyles.deleteDoctorButton}
              onPress={() => deleteDoctorContact(doctor.id, doctor.name)}
            >
              <DynamicText type="card" style={dynamicStyles.deleteDoctorButtonText}>🗑️</DynamicText>
            </TouchableOpacity>
          </View>
          
          {doctor.isPrimary && (
            <View style={dynamicStyles.primaryBadge}>
              <DynamicText type="card" style={dynamicStyles.primaryBadgeText}>{t('primary')}</DynamicText>
            </View>
          )}
        </View>
      ))}
      
      {doctorContacts.length === 0 && (
        <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          {t('noDoctorContactsYet')}
        </DynamicText>
      )}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View 
            style={[
              styles.header,
              {
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
              📅 {t('appointmentManagement')}
            </DynamicText>
            <DynamicText type="secondary" style={styles.subtitle}>
              {t('appointmentManagementDesc')}
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

      {/* Add Appointment Modal */}
      <Modal
        visible={showAddAppointmentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddAppointmentModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>📅 {t('scheduleAppointment')}</DynamicText>
            
            <ScrollView 
              style={dynamicStyles.modalScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('appointmentType')}</DynamicText>
              <TouchableOpacity
                style={dynamicStyles.pickerButton}
                onPress={() => {
                  Alert.alert(
                    t('selectAppointmentType'),
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
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('title')} *</DynamicText>
              <TextInput
                style={dynamicStyles.textInput}
                placeholder={t('titlePlaceholder')}
                placeholderTextColor="#ffffff80"
                value={appointmentTitle}
                onChangeText={setAppointmentTitle}
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('location')} *</DynamicText>
              <TextInput
                style={dynamicStyles.textInput}
                placeholder={t('locationPlaceholder')}
                placeholderTextColor="#ffffff80"
                value={appointmentLocation}
                onChangeText={setAppointmentLocation}
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('date')} *</DynamicText>
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
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('time')} *</DynamicText>
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
              <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('notesOptional')}</DynamicText>
              <TextInput
                style={[dynamicStyles.textInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder={t('notesPlaceholder')}
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
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{t('cancel')}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={addAppointment}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>{t('schedule')}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Doctor Modal */}
      <Modal
        visible={showAddDoctorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddDoctorModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>👨‍⚕️ {t('addDoctorContact')}</DynamicText>
            
            <ScrollView 
              style={dynamicStyles.modalScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('doctorName')} *</DynamicText>
                <TextInput
                  style={dynamicStyles.textInput}
                  placeholder={t('doctorNamePlaceholder')}
                  placeholderTextColor="#ffffff80"
                  value={doctorName}
                  onChangeText={setDoctorName}
                />
              </View>

              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('specialty')} *</DynamicText>
                <TextInput
                  style={dynamicStyles.textInput}
                  placeholder={t('specialtyPlaceholder')}
                  placeholderTextColor="#ffffff80"
                  value={doctorSpecialty}
                  onChangeText={setDoctorSpecialty}
                />
              </View>

              {/* Country Code Selection */}
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>🌍 {t('selectCountry')} *</DynamicText>
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
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('phoneNumber')} *</DynamicText>
                <View style={dynamicStyles.phoneInputContainer}>
                  <View style={dynamicStyles.countryCodeDisplay}>
                    <DynamicText type="card" style={dynamicStyles.countryCodeText}>{doctorCountryCode}</DynamicText>
                  </View>
                  <TextInput
                    style={[dynamicStyles.textInput, dynamicStyles.phoneNumberInput]}
                    placeholder={t('enterPhoneNumber')}
                    placeholderTextColor="#ffffff80"
                    value={doctorPhone}
                    onChangeText={setDoctorPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>📧 {t('doctorEmailAddress')}</DynamicText>
                <TextInput
                  style={dynamicStyles.textInput}
                  placeholder={t('doctorEmailPlaceholder')}
                  placeholderTextColor="#ffffff80"
                  value={doctorEmail}
                  onChangeText={setDoctorEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Dialing Method Selection */}
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('dialingMethod')} *</DynamicText>
                <TouchableOpacity
                  style={dynamicStyles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      t('selectDialingMethod'),
                      t('howToContactDoctor'),
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
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('address')} *</DynamicText>
                <TextInput
                  style={[dynamicStyles.textInput, { height: 60, textAlignVertical: 'top' }]}
                  placeholder={t('addressPlaceholder')}
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
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{t('cancel')}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={addDoctorContact}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>{t('addDoctor')}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal
        visible={showEditDoctorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditDoctorModal(false)}
      >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>✏️ {t('editDoctorContact')}</DynamicText>
            
            <ScrollView 
              style={dynamicStyles.modalScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('doctorName')} *</DynamicText>
                <TextInput
                  style={dynamicStyles.textInput}
                  placeholder={t('doctorNamePlaceholder')}
                  placeholderTextColor="#ffffff80"
                  value={doctorName}
                  onChangeText={setDoctorName}
                />
              </View>

              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('specialty')} *</DynamicText>
                <TextInput
                  style={dynamicStyles.textInput}
                  placeholder={t('specialtyPlaceholder')}
                  placeholderTextColor="#ffffff80"
                  value={doctorSpecialty}
                  onChangeText={setDoctorSpecialty}
                />
              </View>

              {/* Country Code Selection */}
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>🌍 {t('selectCountry')} *</DynamicText>
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
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('phoneNumber')} *</DynamicText>
                <View style={dynamicStyles.phoneInputContainer}>
                  <View style={dynamicStyles.countryCodeDisplay}>
                    <DynamicText type="card" style={dynamicStyles.countryCodeText}>{doctorCountryCode}</DynamicText>
                  </View>
                  <TextInput
                    style={[dynamicStyles.textInput, dynamicStyles.phoneNumberInput]}
                    placeholder={t('enterPhoneNumber')}
                    placeholderTextColor="#ffffff80"
                    value={doctorPhone}
                    onChangeText={setDoctorPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>📧 {t('doctorEmailAddress')}</DynamicText>
                <TextInput
                  style={dynamicStyles.textInput}
                  placeholder={t('doctorEmailPlaceholder')}
                  placeholderTextColor="#ffffff80"
                  value={doctorEmail}
                  onChangeText={setDoctorEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Dialing Method Selection */}
              <View style={dynamicStyles.inputGroup}>
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('dialingMethod')} *</DynamicText>
                <TouchableOpacity
                  style={dynamicStyles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      t('selectDialingMethod'),
                      t('howToContactDoctor'),
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
                <DynamicText type="card" style={dynamicStyles.inputLabel}>{t('address')} *</DynamicText>
                <TextInput
                  style={[dynamicStyles.textInput, { height: 60, textAlignVertical: 'top' }]}
                  placeholder={t('addressPlaceholder')}
                  placeholderTextColor="#ffffff80"
                  value={doctorAddress}
                  onChangeText={setDoctorAddress}
                  multiline
                />
              </View>
            </ScrollView>

            <View style={dynamicStyles.modalActions}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => {
                  setShowEditDoctorModal(false);
                  setEditingDoctor(null);
                }}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{t('cancel')}</DynamicText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={updateDoctorContact}
              >
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>{t('updateDoctor')}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
        <View style={dynamicStyles.modalOverlay}>
          <View style={[dynamicStyles.modalContent, { maxHeight: '80%' }]}>
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>📋 {t('pastAppointments')}</DynamicText>
            
            {/* Search Input */}
            <View style={dynamicStyles.searchContainer}>
              <TextInput
                style={dynamicStyles.searchInput}
                placeholder={t('searchPastAppointments')}
                placeholderTextColor="#ffffff80"
                value={pastAppointmentsSearch}
                onChangeText={setPastAppointmentsSearch}
              />
            </View>
            
            <ScrollView 
              style={dynamicStyles.modalScrollView}
              showsVerticalScrollIndicator={true}
            >
              {getPastAppointments().length === 0 ? (
                <View style={dynamicStyles.emptyState}>
                  <DynamicText type="secondary" style={dynamicStyles.emptyStateText}>
                    {pastAppointmentsSearch.trim() ? 
                      `${t('noAppointmentsFound')}` : 
                      t('noPastAppointments')
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
                          {appointment.status === 'completed' ? `✅ ${t('attended')}` : `❌ ${t('missed')}`}
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
                      📅 {new Date(appointment.startDate).toLocaleDateString()} at {new Date(appointment.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{t('close')}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
            <DynamicText type="primary" style={dynamicStyles.modalTitle}>🌍 {t('selectCountry')}</DynamicText>
            <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { marginBottom: 16 }]}>
              {t('chooseCountryCode')}
            </DynamicText>
            
            <ScrollView 
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
                <DynamicText type="card" style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>{t('cancel')}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
