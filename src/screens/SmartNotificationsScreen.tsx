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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import SmartNotificationService, { LocationReminder, WeatherAlert } from '../services/smartNotifications';

interface SmartNotificationsScreenProps {
  onClose: () => void;
  theme?: any;
}

export default function SmartNotificationsScreen({ onClose, theme }: SmartNotificationsScreenProps) {
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
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.chip,
    },
    settingLabel: {
      fontSize: 16,
      color: currentTheme.text,
      flex: 1,
    },
    settingDescription: {
      fontSize: 12,
      color: currentTheme.sub,
      marginTop: 4,
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
    reminderItem: {
      backgroundColor: currentTheme.chip,
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
      color: currentTheme.text,
    },
    reminderDetails: {
      fontSize: 12,
      color: currentTheme.sub,
      marginTop: 2,
    },
    deleteButton: {
      backgroundColor: '#dc2626',
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
      color: currentTheme.text,
    },
  });
  
  const dynamicStyles = getDynamicStyles();
  const [smartService] = useState(() => SmartNotificationService.getInstance());
  const [locationReminders, setLocationReminders] = useState<LocationReminder[]>([]);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
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
      await smartService.initialize();
      setIsInitialized(true);
      loadData();
    } catch (error) {
      console.error('Failed to initialize smart notifications:', error);
    }
  };

  const loadData = () => {
    setLocationReminders(smartService.getLocationReminders());
    setWeatherAlerts(smartService.getWeatherAlerts());
  };

  const addLocationReminder = async () => {
    Alert.prompt(
      '📍 Add Location Reminder',
      'Enter the name of the location (e.g., "CVS Pharmacy", "Dr. Smith\'s Office"):',
      async (name) => {
        if (!name) return;
        
        Alert.prompt(
          '📝 Reminder Message',
          'What should the reminder say when you\'re near this location?',
          async (message) => {
            if (!message) return;
            
            try {
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
              
              setLocationReminders(prev => [...prev, newReminder]);
              triggerHaptic('medium');
              Alert.alert('✅ Success', 'Location reminder added!');
            } catch (error) {
              console.error('Failed to add location reminder:', error);
              Alert.alert('❌ Error', 'Failed to add location reminder');
            }
          }
        );
      }
    );
  };

  const addWeatherAlert = async () => {
    Alert.alert(
      '🌤️ Add Weather Alert',
      'Choose the weather condition to monitor:',
      [
        { text: '🌼 High Pollen', onPress: () => createWeatherAlert('pollen', 'Consider taking allergy medication') },
        { text: '🌡️ Extreme Temperature', onPress: () => createWeatherAlert('temperature', 'Check if you need temperature-sensitive medications') },
        { text: '💧 High Humidity', onPress: () => createWeatherAlert('humidity', 'High humidity may affect your condition') },
        { text: '🌫️ Poor Air Quality', onPress: () => createWeatherAlert('air_quality', 'Consider wearing a mask or staying indoors') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const createWeatherAlert = async (condition: 'pollen' | 'temperature' | 'humidity' | 'air_quality', message: string) => {
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
      Alert.alert('✅ Success', 'Weather alert added!');
    } catch (error) {
      console.error('Failed to add weather alert:', error);
      Alert.alert('❌ Error', 'Failed to add weather alert');
    }
  };

  const deleteLocationReminder = async (id: string) => {
    triggerHaptic('heavy');
    Alert.alert(
      '🗑️ Delete Reminder',
      'Are you sure you want to delete this location reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setLocationReminders(prev => prev.filter(r => r.id !== id));
            triggerHaptic('medium');
          }
        }
      ]
    );
  };

  const deleteWeatherAlert = async (id: string) => {
    triggerHaptic('heavy');
    Alert.alert(
      '🗑️ Delete Alert',
      'Are you sure you want to delete this weather alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setWeatherAlerts(prev => prev.filter(a => a.id !== id));
            triggerHaptic('medium');
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
      <Text style={dynamicStyles.sectionTitle}>📍 Location-Based Reminders</Text>
      <Text style={dynamicStyles.sectionDescription}>
        Get reminded when you're near pharmacies, doctor offices, or other important locations.
      </Text>
      
      {locationReminders.length > 0 ? (
        locationReminders.map(reminder => (
          <View key={reminder.id} style={dynamicStyles.reminderItem}>
            <View style={dynamicStyles.reminderInfo}>
              <Text style={dynamicStyles.reminderName}>{reminder.name}</Text>
              <Text style={dynamicStyles.reminderDetails}>
                {reminder.radius}m radius • {reminder.enabled ? 'Active' : 'Disabled'}
              </Text>
            </View>
            <TouchableOpacity
              style={dynamicStyles.deleteButton}
              onPress={() => deleteLocationReminder(reminder.id)}
            >
              <Text style={dynamicStyles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          No location reminders set up yet
        </Text>
      )}
      
      <TouchableOpacity
        style={dynamicStyles.addButton}
        onPress={addLocationReminder}
      >
        <Text style={dynamicStyles.addButtonText}>+ Add Location Reminder</Text>
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
      <Text style={dynamicStyles.sectionTitle}>🌤️ Weather-Based Alerts</Text>
      <Text style={dynamicStyles.sectionDescription}>
        Get notified when weather conditions might affect your health or medications.
      </Text>
      
      {weatherAlerts.length > 0 ? (
        weatherAlerts.map(alert => (
          <View key={alert.id} style={dynamicStyles.reminderItem}>
            <View style={dynamicStyles.reminderInfo}>
              <Text style={dynamicStyles.reminderName}>
                {alert.weatherCondition === 'pollen' ? '🌼' : 
                 alert.weatherCondition === 'temperature' ? '🌡️' :
                 alert.weatherCondition === 'humidity' ? '💧' : '🌫️'} 
                {alert.weatherCondition.charAt(0).toUpperCase() + alert.weatherCondition.slice(1)} Alert
              </Text>
              <Text style={dynamicStyles.reminderDetails}>
                Threshold: {alert.threshold} • {alert.enabled ? 'Active' : 'Disabled'}
              </Text>
            </View>
            <TouchableOpacity
              style={dynamicStyles.deleteButton}
              onPress={() => deleteWeatherAlert(alert.id)}
            >
              <Text style={dynamicStyles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={[dynamicStyles.sectionDescription, { textAlign: 'center', fontStyle: 'italic' }]}>
          No weather alerts set up yet
        </Text>
      )}
      
      <TouchableOpacity
        style={dynamicStyles.addButton}
        onPress={addWeatherAlert}
      >
        <Text style={dynamicStyles.addButtonText}>+ Add Weather Alert</Text>
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
      <Text style={dynamicStyles.sectionTitle}>🧠 Smart Features</Text>
      <Text style={dynamicStyles.sectionDescription}>
        AI-powered features that learn from your medication patterns and provide intelligent reminders.
      </Text>
      
      <View style={dynamicStyles.settingRow}>
        <View style={{ flex: 1 }}>
          <Text style={dynamicStyles.settingLabel}>Smart Refill Predictions</Text>
          <Text style={dynamicStyles.settingDescription}>
            Predict when you'll need medication refills based on usage patterns
          </Text>
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
          <Text style={dynamicStyles.settingLabel}>Intelligent Timing</Text>
          <Text style={dynamicStyles.settingDescription}>
            Learn your medication schedule and suggest optimal reminder times
          </Text>
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
          <Text style={dynamicStyles.settingLabel}>Context-Aware Reminders</Text>
          <Text style={dynamicStyles.settingDescription}>
            Consider your location, weather, and schedule when sending reminders
          </Text>
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
              🧠 Smart Notifications
            </Text>
            <Text style={[styles.subtitle, { color: currentTheme.sub }]}>
              Intelligent reminders that adapt to your lifestyle and environment
            </Text>
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
            <Text style={dynamicStyles.statusText}>
              {isInitialized ? 'Smart Notifications Active' : 'Initializing...'}
            </Text>
          </Animated.View>

          {/* Smart Features */}
          {renderSmartFeatures()}

          {/* Location Reminders */}
          {renderLocationReminders()}

          {/* Weather Alerts */}
          {renderWeatherAlerts()}
        </ScrollView>
      </View>
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
