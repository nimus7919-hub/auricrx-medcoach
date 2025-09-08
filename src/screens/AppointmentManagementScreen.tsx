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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import AppointmentService, { Appointment, DoctorContact, AppointmentStats } from '../services/appointmentService';

const { width: screenWidth } = Dimensions.get('window');

interface AppointmentManagementScreenProps {
  onClose: () => void;
  theme?: any;
}

type AppointmentType = 'doctor' | 'lab' | 'pharmacy' | 'specialist' | 'emergency' | 'follow_up' | 'checkup' | 'other';

export default function AppointmentManagementScreen({ onClose, theme }: AppointmentManagementScreenProps) {
  const { t } = useTranslation();
  
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
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: currentTheme.chip,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: currentTheme.text,
      marginBottom: 12,
    },
    sectionDescription: {
      fontSize: 14,
      color: currentTheme.sub,
      marginBottom: 16,
      lineHeight: 20,
    },
    appointmentCard: {
      backgroundColor: currentTheme.chip,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderLeftWidth: 4,
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
      color: currentTheme.text,
      flex: 1,
    },
    appointmentType: {
      fontSize: 12,
      color: currentTheme.sub,
      backgroundColor: currentTheme.card,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    appointmentDetails: {
      fontSize: 14,
      color: currentTheme.text,
      marginBottom: 4,
    },
    appointmentDateTime: {
      fontSize: 12,
      color: currentTheme.sub,
      marginBottom: 4,
    },
    appointmentLocation: {
      fontSize: 12,
      color: currentTheme.sub,
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
      backgroundColor: currentTheme.accent,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    addButtonText: {
      color: currentTheme.text,
      fontSize: 14,
      fontWeight: '600',
    },
    doctorCard: {
      backgroundColor: currentTheme.chip,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    doctorInfo: {
      flex: 1,
    },
    doctorName: {
      fontSize: 14,
      fontWeight: '500',
      color: currentTheme.text,
    },
    doctorSpecialty: {
      fontSize: 12,
      color: currentTheme.sub,
      marginTop: 2,
    },
    doctorContact: {
      fontSize: 12,
      color: currentTheme.sub,
      marginTop: 2,
    },
    primaryBadge: {
      backgroundColor: currentTheme.accent,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    primaryBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: currentTheme.text,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      backgroundColor: currentTheme.chip,
      padding: 12,
      borderRadius: 8,
      flex: 1,
      minWidth: (screenWidth - 48) / 2,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.accent,
    },
    statLabel: {
      fontSize: 12,
      color: currentTheme.sub,
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
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      padding: 24,
      width: '90%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 16,
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: currentTheme.text,
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: currentTheme.chip,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      color: currentTheme.text,
      fontSize: 14,
    },
    pickerButton: {
      backgroundColor: currentTheme.chip,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pickerText: {
      color: currentTheme.text,
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
      backgroundColor: currentTheme.accent,
    },
    modalButtonSecondary: {
      backgroundColor: currentTheme.chip,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    modalButtonTextPrimary: {
      color: currentTheme.text,
    },
    modalButtonTextSecondary: {
      color: currentTheme.sub,
    },
    quickActions: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    quickActionButton: {
      backgroundColor: currentTheme.chip,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      flex: 1,
      alignItems: 'center',
    },
    quickActionText: {
      fontSize: 12,
      color: currentTheme.text,
      fontWeight: '500',
    },
  });
  
  const dynamicStyles = getDynamicStyles();
  const [appointmentService] = useState(() => AppointmentService.getInstance());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [doctorContacts, setDoctorContacts] = useState<DoctorContact[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<AppointmentType>('doctor');
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [appointmentLocation, setAppointmentLocation] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [doctorAddress, setDoctorAddress] = useState('');
  
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
    { value: 'doctor', label: 'Doctor Visit', icon: '👨‍⚕️' },
    { value: 'lab', label: 'Lab Test', icon: '🧪' },
    { value: 'pharmacy', label: 'Pharmacy', icon: '💊' },
    { value: 'specialist', label: 'Specialist', icon: '🏥' },
    { value: 'emergency', label: 'Emergency', icon: '🚨' },
    { value: 'follow_up', label: 'Follow-up', icon: '🔄' },
    { value: 'checkup', label: 'Checkup', icon: '✅' },
    { value: 'other', label: 'Other', icon: '📅' },
  ];

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
      await appointmentService.initialize();
      loadData();
    } catch (error) {
      console.error('Failed to initialize appointment management:', error);
    }
  };

  const loadData = async () => {
    try {
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
    if (!appointmentTitle || !appointmentLocation || !appointmentDate || !appointmentTime) {
      Alert.alert('❌ Error', 'Please fill in all required fields');
      return;
    }

    try {
      const startDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
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
      setShowAddAppointmentModal(false);
      
      loadData();
      triggerHaptic('medium');
      Alert.alert('✅ Success', 'Appointment scheduled successfully!');
    } catch (error) {
      console.error('Failed to add appointment:', error);
      Alert.alert('❌ Error', 'Failed to schedule appointment');
    }
  };

  const addDoctorContact = async () => {
    if (!doctorName || !doctorSpecialty || !doctorPhone || !doctorAddress) {
      Alert.alert('❌ Error', 'Please fill in all required fields');
      return;
    }

    try {
      await appointmentService.addDoctorContact({
        name: doctorName,
        specialty: doctorSpecialty,
        phoneNumber: doctorPhone,
        address: doctorAddress,
        isPrimary: doctorContacts.length === 0 // First doctor is primary
      });

      // Reset form
      setDoctorName('');
      setDoctorSpecialty('');
      setDoctorPhone('');
      setDoctorAddress('');
      setShowAddDoctorModal(false);
      
      loadData();
      triggerHaptic('medium');
      Alert.alert('✅ Success', 'Doctor contact added successfully!');
    } catch (error) {
      console.error('Failed to add doctor contact:', error);
      Alert.alert('❌ Error', 'Failed to add doctor contact');
    }
  };

  const markAppointmentCompleted = async (id: string) => {
    try {
      await appointmentService.markAppointmentCompleted(id);
      loadData();
      triggerHaptic('medium');
      Alert.alert('✅ Success', 'Appointment marked as completed!');
    } catch (error) {
      console.error('Failed to mark appointment completed:', error);
      Alert.alert('❌ Error', 'Failed to update appointment');
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
      case 'scheduled': return 'Scheduled';
      case 'confirmed': return 'Confirmed';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'rescheduled': return 'Rescheduled';
      default: return 'Unknown';
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
      <Text style={dynamicStyles.sectionTitle}>📊 Appointment Overview</Text>
      
      {stats && (
        <View style={dynamicStyles.statsGrid}>
          <View style={dynamicStyles.statCard}>
            <Text style={dynamicStyles.statValue}>{stats.totalAppointments}</Text>
            <Text style={dynamicStyles.statLabel}>Total Appointments</Text>
          </View>
          <View style={dynamicStyles.statCard}>
            <Text style={dynamicStyles.statValue}>{stats.upcomingAppointments}</Text>
            <Text style={dynamicStyles.statLabel}>Upcoming</Text>
          </View>
          <View style={dynamicStyles.statCard}>
            <Text style={dynamicStyles.statValue}>{stats.completedAppointments}</Text>
            <Text style={dynamicStyles.statLabel}>Completed</Text>
          </View>
          <View style={dynamicStyles.statCard}>
            <Text style={dynamicStyles.statValue}>{stats.doctorContacts.length}</Text>
            <Text style={dynamicStyles.statLabel}>Doctors</Text>
          </View>
        </View>
      )}

      <View style={dynamicStyles.quickActions}>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={() => setShowAddAppointmentModal(true)}
        >
          <Text style={dynamicStyles.quickActionText}>📅 Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={() => setShowAddDoctorModal(true)}
        >
          <Text style={dynamicStyles.quickActionText}>👨‍⚕️ Add Doctor</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={dynamicStyles.quickActionButton}
          onPress={loadData}
        >
          <Text style={dynamicStyles.quickActionText}>🔄 Refresh</Text>
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
      <Text style={dynamicStyles.sectionTitle}>📅 Upcoming Appointments</Text>
      <Text style={dynamicStyles.sectionDescription}>
        Your scheduled appointments for the next 30 days.
      </Text>
      
      {upcomingAppointments.slice(0, 5).map(appointment => (
        <View key={appointment.id} style={[
          dynamicStyles.appointmentCard,
          { borderLeftColor: getTypeColor(appointment.type) }
        ]}>
          <View style={dynamicStyles.appointmentHeader}>
            <Text style={dynamicStyles.appointmentTitle}>{appointment.title}</Text>
            <Text style={dynamicStyles.appointmentType}>
              {appointmentTypes.find(t => t.value === appointment.type)?.icon} {appointmentTypes.find(t => t.value === appointment.type)?.label}
            </Text>
          </View>
          
          <Text style={dynamicStyles.appointmentDetails}>
            {appointment.doctorName && `👨‍⚕️ ${appointment.doctorName}`}
          </Text>
          
          <Text style={dynamicStyles.appointmentDateTime}>
            📅 {new Date(appointment.startDate).toLocaleDateString()} at {new Date(appointment.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          
          <Text style={dynamicStyles.appointmentLocation}>
            📍 {appointment.location}
          </Text>
          
          <View style={[
            dynamicStyles.statusBadge,
            { backgroundColor: getStatusColor(appointment.status) }
          ]}>
            <Text style={dynamicStyles.statusText}>
              {getStatusLabel(appointment.status)}
            </Text>
          </View>
        </View>
      ))}
      
      {upcomingAppointments.length === 0 && (
        <Text style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          No upcoming appointments scheduled
        </Text>
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
      <Text style={dynamicStyles.sectionTitle}>👨‍⚕️ Doctor Contacts</Text>
      <Text style={dynamicStyles.sectionDescription}>
        Your healthcare providers and their contact information.
      </Text>
      
      {doctorContacts.map(doctor => (
        <View key={doctor.id} style={dynamicStyles.doctorCard}>
          <View style={dynamicStyles.doctorInfo}>
            <Text style={dynamicStyles.doctorName}>
              {doctor.name} {doctor.isPrimary && '⭐'}
            </Text>
            <Text style={dynamicStyles.doctorSpecialty}>{doctor.specialty}</Text>
            <Text style={dynamicStyles.doctorContact}>📞 {doctor.phoneNumber}</Text>
            <Text style={dynamicStyles.doctorContact}>📍 {doctor.address}</Text>
          </View>
          {doctor.isPrimary && (
            <View style={dynamicStyles.primaryBadge}>
              <Text style={dynamicStyles.primaryBadgeText}>Primary</Text>
            </View>
          )}
        </View>
      ))}
      
      {doctorContacts.length === 0 && (
        <Text style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          No doctor contacts added yet
        </Text>
      )}
    </Animated.View>
  );

  return (
    <LinearGradient colors={[currentTheme.bgStart, currentTheme.bgEnd, '#f0ede8']} style={styles.container}>
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
                source={require('../../assets/AuricRX_home_button.png')} 
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
            <Text style={[styles.title, { color: currentTheme.text }]}>
              📅 Appointment Management
            </Text>
            <Text style={[styles.subtitle, { color: currentTheme.sub }]}>
              Schedule appointments, manage doctor contacts, and track your healthcare visits
            </Text>
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
            <Text style={dynamicStyles.modalTitle}>📅 Schedule Appointment</Text>
            
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Appointment Type</Text>
              <TouchableOpacity
                style={dynamicStyles.pickerButton}
                onPress={() => {
                  Alert.alert(
                    'Select Appointment Type',
                    '',
                    appointmentTypes.map(type => ({
                      text: `${type.icon} ${type.label}`,
                      onPress: () => setSelectedAppointmentType(type.value)
                    }))
                  );
                }}
              >
                <Text style={dynamicStyles.pickerText}>
                  {appointmentTypes.find(t => t.value === selectedAppointmentType)?.icon} {appointmentTypes.find(t => t.value === selectedAppointmentType)?.label}
                </Text>
                <Text style={dynamicStyles.pickerText}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Title *</Text>
              <TextInput
                style={dynamicStyles.textInput}
                placeholder="e.g., Annual Checkup, Blood Test"
                placeholderTextColor={currentTheme.sub}
                value={appointmentTitle}
                onChangeText={setAppointmentTitle}
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Location *</Text>
              <TextInput
                style={dynamicStyles.textInput}
                placeholder="e.g., Dr. Smith's Office, LabCorp"
                placeholderTextColor={currentTheme.sub}
                value={appointmentLocation}
                onChangeText={setAppointmentLocation}
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Date *</Text>
              <TextInput
                style={dynamicStyles.textInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={currentTheme.sub}
                value={appointmentDate}
                onChangeText={setAppointmentDate}
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Time *</Text>
              <TextInput
                style={dynamicStyles.textInput}
                placeholder="HH:MM (24-hour format)"
                placeholderTextColor={currentTheme.sub}
                value={appointmentTime}
                onChangeText={setAppointmentTime}
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[dynamicStyles.textInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Add any notes or special instructions..."
                placeholderTextColor={currentTheme.sub}
                value={appointmentNotes}
                onChangeText={setAppointmentNotes}
                multiline
              />
            </View>

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => setShowAddAppointmentModal(false)}
              >
                <Text style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={addAppointment}
              >
                <Text style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>Schedule</Text>
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
            <Text style={dynamicStyles.modalTitle}>👨‍⚕️ Add Doctor Contact</Text>
            
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Doctor Name *</Text>
              <TextInput
                style={dynamicStyles.textInput}
                placeholder="e.g., Dr. John Smith"
                placeholderTextColor={currentTheme.sub}
                value={doctorName}
                onChangeText={setDoctorName}
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Specialty *</Text>
              <TextInput
                style={dynamicStyles.textInput}
                placeholder="e.g., General Practice, Cardiology"
                placeholderTextColor={currentTheme.sub}
                value={doctorSpecialty}
                onChangeText={setDoctorSpecialty}
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={dynamicStyles.textInput}
                placeholder="e.g., (555) 123-4567"
                placeholderTextColor={currentTheme.sub}
                value={doctorPhone}
                onChangeText={setDoctorPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.inputLabel}>Address *</Text>
              <TextInput
                style={[dynamicStyles.textInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Enter full address..."
                placeholderTextColor={currentTheme.sub}
                value={doctorAddress}
                onChangeText={setDoctorAddress}
                multiline
              />
            </View>

            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSecondary]}
                onPress={() => setShowAddDoctorModal(false)}
              >
                <Text style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextSecondary]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonPrimary]}
                onPress={addDoctorContact}
              >
                <Text style={[dynamicStyles.modalButtonText, dynamicStyles.modalButtonTextPrimary]}>Add Doctor</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
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
