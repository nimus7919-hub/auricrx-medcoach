import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  StyleSheet,
  Animated,
  StatusBar,
  Platform,
  Vibration,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DynamicText from '../components/DynamicText';
import { useWallpaper } from '../contexts/WallpaperContext';
import SmartNotificationService, { LocationReminder, WeatherAlert } from '../services/smartNotifications';

interface SmartNotificationsScreenProps {
  onClose: () => void;
  theme?: any;
  S?: any; // Translation helper
}

export default function SmartNotificationsScreen({ onClose, theme, S }: SmartNotificationsScreenProps) {
  const { getCardBackgroundColor, getCardBorderColor } = useWallpaper();
  
  // Create translation function from S object
  const t = (key: string) => {
    if (S && typeof S === 'object' && S[key]) {
      return S[key];
    }
    return key; // fallback to key if translation not found
  };
  
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
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: getCardBorderColor(),
    },
    settingLabel: {
      fontSize: 16,
      flex: 1,
    },
    settingDescription: {
      fontSize: 12,
      marginTop: 4,
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
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
    reminderItem: {
      backgroundColor: getCardBackgroundColor() + '80',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    reminderInfo: {
      flex: 1,
    },
    reminderName: {
      fontSize: 14,
      fontWeight: '500',
    },
    reminderDetails: {
      fontSize: 12,
      marginTop: 2,
    },
    deleteButton: {
      backgroundColor: '#dc2626' + 'CC',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    deleteButtonText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '600',
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
      fontSize: 14,
      borderWidth: 1,
      borderColor: getCardBorderColor(),
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
      color: '#ffffff',
    },
    modalButtonTextSecondary: {
      color: '#ffffff',
    },
    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    statusText: {
      fontSize: 14,
    },
  });
  
  const dynamicStyles = getDynamicStyles();
  const [smartService] = useState(() => {
    try {
      console.log('🔧 Creating Smart Notifications Service instance...');
      if (!SmartNotificationService) {
        console.error('❌ SmartNotificationService not available');
        return null;
      }
      return SmartNotificationService.getInstance();
    } catch (error) {
      console.error('❌ Failed to create Smart Notifications Service:', error);
      return null;
    }
  });
  const [locationReminders, setLocationReminders] = useState<LocationReminder[]>([]);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLocationInputModal, setShowLocationInputModal] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [locationInput, setLocationInput] = useState({ name: '', message: '' });
  
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

  useEffect(() => {
    initializeSmartNotifications();
    
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

  const initializeSmartNotifications = async () => {
    try {
      if (!smartService) {
        console.error('Smart service not available');
        return;
      }
      await smartService.initialize();
      setIsInitialized(true);
      loadData();
    } catch (error) {
      console.error('Failed to initialize smart notifications:', error);
    }
  };

  const loadData = () => {
    if (!smartService) {
      console.error('Smart service not available for loading data');
      return;
    }
    setLocationReminders(smartService.getLocationReminders());
    setWeatherAlerts(smartService.getWeatherAlerts());
  };

  const addLocationReminder = async () => {
    console.log('🔍 Location reminder button pressed');
    
    if (!smartService) {
      console.error('❌ Smart service not available');
      Alert.alert('❌ ' + t('error'), t('smartServiceNotAvailable'));
      return;
    }
    
    console.log('✅ Smart service available, showing prompt');
    
    // Check if Alert.prompt is available (it's not available on Android)
    if (Platform.OS === 'android') {
      // For Android, use custom modal
      setLocationInput({ name: '', message: '' });
      setShowLocationInputModal(true);
      return;
    }
    
    Alert.prompt(
      '📍 ' + t('addLocationReminder'),
      t('enterLocationName'),
      async (name) => {
        console.log('📍 Location name entered:', name);
        if (!name) return;
        
        Alert.prompt(
          '📝 ' + t('reminderMessage'),
          t('reminderMessagePrompt'),
          async (message) => {
            console.log('📝 Message entered:', message);
            if (!message) return;
            
            try {
              console.log('🔄 Creating location reminder...');
              // For demo purposes, using mock coordinates
              // In real implementation, you'd get these from a map picker
              const newReminder = await smartService.addLocationReminder({
                name,
                latitude: 20.5530108, // Mock coordinates
                longitude: -100.3204757,
                radius: 100, // 100 meters
                message,
                enabled: true
              });
              
              console.log('✅ Location reminder created:', newReminder);
              setLocationReminders(prev => [...prev, newReminder]);
              triggerHaptic('medium');
              Alert.alert('✅ ' + t('success'), t('locationReminderAdded'));
            } catch (error) {
              console.error('Failed to add location reminder:', error);
              Alert.alert('❌ ' + t('error'), t('failedToAddLocationReminder'));
            }
          }
        );
      }
    );
  };

  const addWeatherAlert = async () => {
    if (!smartService) {
      Alert.alert('❌ ' + t('error'), t('smartServiceNotAvailable'));
      return;
    }
    
    setShowWeatherModal(true);
  };

  const createWeatherAlert = async (condition: 'pollen' | 'temperature' | 'humidity' | 'air_quality', message: string) => {
    if (!smartService) {
      Alert.alert('❌ ' + t('error'), t('smartServiceNotAvailable'));
      return;
    }
    
    try {
      const newAlert = await smartService.addWeatherAlert({
        medicationId: 'general', // For general health alerts
        weatherCondition: condition,
        threshold: condition === 'pollen' ? 3 : condition === 'temperature' ? 30 : condition === 'humidity' ? 80 : 3,
        message,
        enabled: true
      });
      
      setWeatherAlerts(prev => [...prev, newAlert]);
      triggerHaptic('medium');
      Alert.alert('✅ ' + t('success'), t('weatherAlertAdded'));
    } catch (error) {
      console.error('Failed to add weather alert:', error);
      Alert.alert('❌ ' + t('error'), t('failedToAddWeatherAlert'));
    }
  };

  const deleteLocationReminder = async (id: string) => {
    triggerHaptic('heavy');
    Alert.alert(
      '🗑️ ' + t('deleteReminder'),
      t('deleteReminderConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              if (smartService) {
                await smartService.deleteLocationReminder(id);
              }
              setLocationReminders(prev => prev.filter(r => r.id !== id));
              triggerHaptic('medium');
            } catch (error) {
              console.error('Failed to delete location reminder:', error);
              Alert.alert('❌ ' + t('error'), t('failedToDeleteReminder'));
            }
          }
        }
      ]
    );
  };

  const handleLocationInputSubmit = async () => {
    if (!locationInput.name.trim() || !locationInput.message.trim()) {
      Alert.alert('❌ ' + t('error'), t('fillBothFields'));
      return;
    }

    try {
      console.log('🔄 Creating location reminder from modal...');
      const newReminder = await smartService.addLocationReminder({
        name: locationInput.name.trim(),
        latitude: 20.5530108, // Mock coordinates
        longitude: -100.3204757,
        radius: 100, // 100 meters
        message: locationInput.message.trim(),
        enabled: true
      });
      
      console.log('✅ Location reminder created:', newReminder);
      setLocationReminders(prev => [...prev, newReminder]);
      setShowLocationInputModal(false);
      setLocationInput({ name: '', message: '' });
      triggerHaptic('medium');
      Alert.alert('✅ ' + t('success'), t('reminderAdded'));
    } catch (error) {
      console.error('Failed to add location reminder:', error);
      Alert.alert('❌ ' + t('error'), t('failedToAddReminder'));
    }
  };

  const getWeatherAlertName = (condition: string) => {
    switch (condition) {
      case 'pollen': return t('pollenAlert');
      case 'temperature': return t('temperatureAlert');
      case 'humidity': return t('humidityAlert');
      case 'air_quality': return t('airQualityAlert');
      default: return condition.charAt(0).toUpperCase() + condition.slice(1) + ' Alert';
    }
  };

  const deleteWeatherAlert = async (id: string) => {
    triggerHaptic('heavy');
    Alert.alert(
      '🗑️ ' + t('deleteAlert'),
      t('deleteAlertConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              if (smartService) {
                await smartService.deleteWeatherAlert(id);
              }
              setWeatherAlerts(prev => prev.filter(a => a.id !== id));
              triggerHaptic('medium');
            } catch (error) {
              console.error('Failed to delete weather alert:', error);
              Alert.alert('❌ ' + t('error'), t('failedToDeleteAlert'));
            }
          }
        }
      ]
    );
  };

  const renderLocationReminders = () => (
    <Animated.View 
      style={[
        dynamicStyles.sectionCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <DynamicText type="primary" style={dynamicStyles.sectionTitle}>📍 {t('locationBasedReminders')}</DynamicText>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {t('locationBasedRemindersDesc')}
      </DynamicText>
      
      {locationReminders.length > 0 ? (
        locationReminders.map(reminder => (
          <View key={reminder.id} style={dynamicStyles.reminderItem}>
            <View style={dynamicStyles.reminderInfo}>
              <DynamicText type="card" style={dynamicStyles.reminderName}>{reminder.name}</DynamicText>
              <DynamicText type="card" style={dynamicStyles.reminderDetails}>
                {reminder.radius}m radius • {reminder.enabled ? t('active') : t('disabled')}
              </DynamicText>
            </View>
            <TouchableOpacity
              style={dynamicStyles.deleteButton}
              onPress={() => deleteLocationReminder(reminder.id)}
            >
              <DynamicText type="card" style={dynamicStyles.deleteButtonText}>🗑️</DynamicText>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          {t('noLocationReminders')}
        </DynamicText>
      )}
      
      <TouchableOpacity
        style={dynamicStyles.addButton}
        onPress={addLocationReminder}
      >
        <DynamicText type="card" style={dynamicStyles.addButtonText}>+ {t('addLocationReminder')}</DynamicText>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderWeatherAlerts = () => (
    <Animated.View 
      style={[
        dynamicStyles.sectionCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <DynamicText type="primary" style={dynamicStyles.sectionTitle}>🌤️ {t('weatherBasedAlerts')}</DynamicText>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {t('weatherBasedAlertsDesc')}
      </DynamicText>
      
      {weatherAlerts.length > 0 ? (
        weatherAlerts.map(alert => (
          <View key={alert.id} style={dynamicStyles.reminderItem}>
            <View style={dynamicStyles.reminderInfo}>
              <DynamicText type="card" style={dynamicStyles.reminderName}>
                {alert.weatherCondition === 'pollen' ? '🌼' : 
                 alert.weatherCondition === 'temperature' ? '🌡️' :
                 alert.weatherCondition === 'humidity' ? '💧' : '🌫️'} 
                {getWeatherAlertName(alert.weatherCondition)}
              </DynamicText>
              <DynamicText type="card" style={dynamicStyles.reminderDetails}>
                {t('threshold')}: {alert.threshold} • {alert.enabled ? t('active') : t('disabled')}
              </DynamicText>
            </View>
            <TouchableOpacity
              style={dynamicStyles.deleteButton}
              onPress={() => deleteWeatherAlert(alert.id)}
            >
              <DynamicText type="card" style={dynamicStyles.deleteButtonText}>🗑️</DynamicText>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <DynamicText type="secondary" style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          {t('noWeatherAlerts')}
        </DynamicText>
      )}
      
      <TouchableOpacity
        style={dynamicStyles.addButton}
        onPress={addWeatherAlert}
      >
        <DynamicText type="card" style={dynamicStyles.addButtonText}>+ {t('addWeatherAlert')}</DynamicText>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSmartFeatures = () => (
    <Animated.View 
      style={[
        dynamicStyles.sectionCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <DynamicText type="primary" style={dynamicStyles.sectionTitle}>🧠 {t('smartFeatures')}</DynamicText>
      <DynamicText type="secondary" style={dynamicStyles.sectionDescription}>
        {t('smartFeaturesDesc')}
      </DynamicText>
      
      <View style={dynamicStyles.settingRow}>
        <View style={{ flex: 1 }}>
          <DynamicText type="card" style={dynamicStyles.settingLabel}>{t('smartRefillPredictions')}</DynamicText>
          <DynamicText type="card" style={dynamicStyles.settingDescription}>
            {t('smartRefillPredictionsDesc')}
          </DynamicText>
        </View>
        <Switch
          value={true}
          onValueChange={() => triggerHaptic('light')}
          trackColor={{ false: currentTheme.chip, true: currentTheme.accent }}
          thumbColor={currentTheme.card}
        />
      </View>
      
      <View style={dynamicStyles.settingRow}>
        <View style={{ flex: 1 }}>
          <DynamicText type="card" style={dynamicStyles.settingLabel}>{t('intelligentTiming')}</DynamicText>
          <DynamicText type="card" style={dynamicStyles.settingDescription}>
            {t('intelligentTimingDesc')}
          </DynamicText>
        </View>
        <Switch
          value={true}
          onValueChange={() => triggerHaptic('light')}
          trackColor={{ false: currentTheme.chip, true: currentTheme.accent }}
          thumbColor={currentTheme.card}
        />
      </View>
      
      <View style={dynamicStyles.settingRow}>
        <View style={{ flex: 1 }}>
          <DynamicText type="card" style={dynamicStyles.settingLabel}>{t('contextAwareReminders')}</DynamicText>
          <DynamicText type="card" style={dynamicStyles.settingDescription}>
            {t('contextAwareRemindersDesc')}
          </DynamicText>
        </View>
        <Switch
          value={true}
          onValueChange={() => triggerHaptic('light')}
          trackColor={{ false: currentTheme.chip, true: currentTheme.accent }}
          thumbColor={currentTheme.card}
        />
      </View>
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
              🧠 {t('smartNotifications')}
            </DynamicText>
            <DynamicText type="secondary" style={styles.subtitle}>
              {t('smartNotificationsDesc')}
            </DynamicText>
          </Animated.View>

          {/* Status */}
          <Animated.View 
            style={[
              dynamicStyles.statusIndicator,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={[
              dynamicStyles.statusDot,
              { backgroundColor: isInitialized ? '#10b981' : '#ef4444' }
            ]} />
            <DynamicText type="primary" style={dynamicStyles.statusText}>
              {isInitialized ? t('smartNotificationsActive') : t('initializing')}
            </DynamicText>
          </Animated.View>

          {/* Smart Features */}
          {renderSmartFeatures()}

          {/* Location Reminders */}
          {renderLocationReminders()}

          {/* Weather Alerts */}
          {renderWeatherAlerts()}
        </ScrollView>
      </View>

      {/* Custom Location Input Modal for Android */}
      <Modal
        visible={showLocationInputModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLocationInputModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: getCardBackgroundColor() + 'F0' }]}>
            <DynamicText type="primary" style={styles.modalTitle}>
              📍 {t('addLocationReminderTitle')}
            </DynamicText>
            
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: getCardBackgroundColor() + '80', 
                color: '#ffffff',
                borderColor: getCardBorderColor() 
              }]}
              placeholder={t('locationNamePlaceholder')}
              placeholderTextColor="#ffffff80"
              value={locationInput.name}
              onChangeText={(text) => setLocationInput(prev => ({ ...prev, name: text }))}
            />
            
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: getCardBackgroundColor() + '80', 
                color: '#ffffff',
                borderColor: getCardBorderColor() 
              }]}
              placeholder={t('reminderMessagePlaceholder')}
              placeholderTextColor="#ffffff80"
              value={locationInput.message}
              onChangeText={(text) => setLocationInput(prev => ({ ...prev, message: text }))}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: getCardBackgroundColor() + '80' }]}
                onPress={() => setShowLocationInputModal(false)}
              >
                <DynamicText type="card" style={styles.modalButtonText}>{t('cancel')}</DynamicText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: currentTheme.accent + 'CC' }]}
                onPress={handleLocationInputSubmit}
              >
                <DynamicText type="card" style={[styles.modalButtonText, { color: '#fff' }]}>{t('add')}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Weather Alert Modal */}
      <Modal
        visible={showWeatherModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWeatherModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: getCardBackgroundColor() + 'F0' }]}>
            <DynamicText type="primary" style={styles.modalTitle}>
              🌤️ {t('addWeatherAlertTitle')}
            </DynamicText>
            
            <DynamicText type="secondary" style={[styles.modalDescription, { marginBottom: 20 }]}>
              {t('chooseWeatherCondition')}
            </DynamicText>
            
            <TouchableOpacity
              style={[styles.weatherOption, { backgroundColor: getCardBackgroundColor() + '80', borderColor: getCardBorderColor() }]}
              onPress={() => {
                setShowWeatherModal(false);
                createWeatherAlert('pollen', t('pollenMessage'));
              }}
            >
              <DynamicText type="card" style={styles.weatherOptionText}>🌼 {t('highPollen')}</DynamicText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.weatherOption, { backgroundColor: getCardBackgroundColor() + '80', borderColor: getCardBorderColor() }]}
              onPress={() => {
                setShowWeatherModal(false);
                createWeatherAlert('temperature', t('temperatureMessage'));
              }}
            >
              <DynamicText type="card" style={styles.weatherOptionText}>🌡️ {t('extremeTemperature')}</DynamicText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.weatherOption, { backgroundColor: getCardBackgroundColor() + '80', borderColor: getCardBorderColor() }]}
              onPress={() => {
                setShowWeatherModal(false);
                createWeatherAlert('humidity', t('humidityMessage'));
              }}
            >
              <DynamicText type="card" style={styles.weatherOptionText}>💧 {t('highHumidity')}</DynamicText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.weatherOption, { backgroundColor: getCardBackgroundColor() + '80', borderColor: getCardBorderColor() }]}
              onPress={() => {
                setShowWeatherModal(false);
                createWeatherAlert('air_quality', t('airQualityMessage'));
              }}
            >
              <DynamicText type="card" style={styles.weatherOptionText}>🌫️ {t('poorAirQuality')}</DynamicText>
            </TouchableOpacity>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: getCardBackgroundColor() + '80' }]}
                onPress={() => setShowWeatherModal(false)}
              >
                <DynamicText type="card" style={styles.modalButtonText}>{t('cancel')}</DynamicText>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: 16,
    textAlign: 'center',
  },
  weatherOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  weatherOptionText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
