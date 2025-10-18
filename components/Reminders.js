import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Image, Platform, Keyboard, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import DynamicText from '../src/components/DynamicText';
import { useWallpaper } from '../src/contexts/WallpaperContext';
import { formatTime } from '../src/utils/time';
import { useTimeFormat } from '../src/hooks/useTimeFormat';

// Reminders component moved outside App to prevent remounting
const Reminders = ({ 
  theme, 
  reminders, 
  setReminders, 
  S, 
  themeKey, 
  onNavigateToDashboard, 
  onNavigateToSettings,
  onAddMedicationFromReminder,
  onAddAppointmentFromReminder
}) => {
  // Mount/unmount detection
  const mounted = useRef(0);
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
  const { timeFormat } = useTimeFormat();
  useEffect(() => {
    mounted.current += 1;
    console.log(`[REMINDERS] MOUNT #${mounted.current}`);
    return () => console.log(`[REMINDERS] UNMOUNT #${mounted.current}`);
  }, []);

  // Keyboard handling to prevent modal closing when input is focused
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setInputFocused(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setInputFocused(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Form state
  const [showAdd, setShowAdd] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState(null);
  const [addForm, setAddForm] = useState({
    name: '',
    time: '',
    type: 'medication',
    frequency: 'daily',
    priority: 'medium',
    startDate: '',
    endDate: '',
    notes: '',
    // Medication-specific fields
    medicationName: '',
    components: [{ strength: '', unit: 'mg' }], // Array for multiple components
    quantity: '',
    quantityUnit: 'tablets',
    // Appointment-specific fields
    address: ''
  });
  
  // Picker states
  const [showPicker, setShowPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showQuantityDropdown, setShowQuantityDropdown] = useState(false);
  const [currentComponentIndex, setCurrentComponentIndex] = useState(0);
  const [dateTarget, setDateTarget] = useState('add');
  const [dateField, setDateField] = useState('startDate');
  
  // Refs
  const reminderNameRef = useRef(null);

  const onPick = (_, date) => {
    setShowPicker(false);
    if (date) {
      const hh = String(date.getHours()).padStart(2,'0');
      const mm = String(date.getMinutes()).padStart(2,'0');
      setAddForm(prev => ({ ...prev, time: `${hh}:${mm}` }));
    }
  };

  const onDatePick = (_, date) => {
    setShowDatePicker(false);
    if (date) {
      const formattedDate = date.toLocaleDateString();
      setAddForm(prev => ({ ...prev, [dateField]: formattedDate }));
    }
  };

  // Reset form when modal opens (only for new reminders)
  useEffect(() => {
    console.log('🔧 useEffect triggered - showAdd:', showAdd, 'editingReminderId:', editingReminderId);
    
    if (showAdd && !editingReminderId) {
      console.log('🔧 Resetting form for new reminder');
      setAddForm({
        name: '',
        time: '',
        type: 'medication',
        frequency: 'daily',
        priority: 'medium',
        startDate: '',
        endDate: '',
        notes: '',
        // Medication-specific fields
        medicationName: '',
        components: [{ strength: '', unit: 'mg' }],
        quantity: '',
        quantityUnit: 'tablets',
        // Appointment-specific fields
        address: ''
      });
    } else if (!showAdd) {
      setInputFocused(false);
      setEditingReminderId(null);
    }
  }, [showAdd, editingReminderId]);

  // Clear type-specific fields when type changes
  const handleTypeChange = (newType) => {
    setAddForm(prev => ({
      ...prev,
      type: newType,
      // Clear medication fields when switching away from medication
      ...(newType !== 'medication' && {
        medicationName: '',
        components: [{ strength: '', unit: 'mg' }],
        quantity: '',
        quantityUnit: 'tablets',
      }),
      // Clear appointment fields when switching away from appointment
      ...(newType !== 'appointment' && {
        address: ''
      })
    }));
  };

  // Component management functions
  const addComponent = () => {
    setAddForm(prev => ({
      ...prev,
      components: [...prev.components, { strength: '', unit: 'mg' }]
    }));
  };

  const removeComponent = (index) => {
    if (addForm.components.length > 1) {
      setAddForm(prev => ({
        ...prev,
        components: prev.components.filter((_, i) => i !== index)
      }));
    }
  };

  const updateComponent = (index, field, value) => {
    setAddForm(prev => ({
      ...prev,
      components: prev.components.map((comp, i) => 
        i === index ? { ...comp, [field]: value } : comp
      )
    }));
  };

  // Route reminder to appropriate card and database
  const routeReminderToCard = async (reminderData) => {
    try {
      if (reminderData.type === 'medication') {
        // Route to medications card
        console.log('📋 Routing medication reminder to medications card:', reminderData);
        
        // Create medication object for medications card
        const medicationData = {
          id: reminderData.id,
          name: reminderData.medicationName || reminderData.name,
          strength: reminderData.components ? 
            reminderData.components.map(comp => `${comp.strength}${comp.unit}`).join('/') : 
            '500mg',
          strengthValue: reminderData.components ? 
            reminderData.components.map(comp => comp.strength).join('/') : 
            '500',
          strengthUnit: reminderData.components ? 
            reminderData.components[0]?.unit || 'mg' : 
            'mg',
          quantity: reminderData.quantity ? `${reminderData.quantity} ${reminderData.quantityUnit}` : '30 tablets',
          quantityValue: reminderData.quantity || '30',
          quantityUnit: reminderData.quantityUnit || 'tablets',
          times: [reminderData.time],
          status: 'taking',
          startDate: reminderData.startDate || new Date().toISOString().split('T')[0],
          endDate: reminderData.endDate || '',
          notes: reminderData.notes || '',
          // Add reminder reference
          reminderId: reminderData.id,
          fromReminder: true
        };

        // Call parent function to add to medications
        if (onAddMedicationFromReminder) {
          await onAddMedicationFromReminder(medicationData);
        }

      } else if (reminderData.type === 'appointment') {
        // Route to appointments card
        console.log('📅 Routing appointment reminder to appointments card:', reminderData);
        
        // Create appointment object for appointments card
        const appointmentData = {
          id: reminderData.id,
          title: reminderData.name,
          type: 'doctor',
          location: reminderData.address || 'TBD',
          startDate: reminderData.startDate || new Date().toISOString(),
          endDate: reminderData.endDate || new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour duration
          duration: 60,
          notes: reminderData.notes || '',
          status: 'scheduled',
          reminderMinutes: [60, 30, 15], // 1 hour, 30 min, 15 min before
          // Add reminder reference
          reminderId: reminderData.id,
          fromReminder: true
        };

        // Call parent function to add to appointments
        if (onAddAppointmentFromReminder) {
          await onAddAppointmentFromReminder(appointmentData);
        }
      }

      console.log('✅ Reminder successfully routed to appropriate card');
    } catch (error) {
      console.error('❌ Failed to route reminder to card:', error);
    }
  };

  // Schedule reminder notification function
  const scheduleReminderNotification = async (name, time24h) => {
    // time24h like "13:45"
    const [hh, mm] = (time24h || '').split(':').map(n => parseInt(n, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;

    const now = new Date();
    const fire = new Date(now);
    fire.setHours(hh, mm, 0, 0);
    if (fire <= now) fire.setDate(fire.getDate() + 1); // schedule for tomorrow if time already passed

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medication Reminder',
          body: name || 'Time to take your medication',
          sound: 'default',
        },
        trigger: fire, // exact datetime
      });
    } catch (e) {
      console.log('schedule error', e);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header with AuricRX home button */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.chip
      }}>
        <TouchableOpacity 
          onPress={onNavigateToDashboard} 
          style={{
            padding: 0,
            backgroundColor: 'transparent',
            marginLeft: -65,
          }}
        >
          <Image 
            source={require('../assets/AuricRX_home_button_across_screens.png')} 
            style={{
              width: 180,
              height: 70,
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <DynamicText type="primary" style={{ 
          fontSize: 16, 
          fontFamily: 'Inter_600SemiBold', 
          position: 'absolute', 
          left: '50%', 
          transform: [{ translateX: -50 }], 
          maxWidth: '60%',
          textAlign: 'center'
        }} numberOfLines={1}>
          {S.reminders}
        </DynamicText>

      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Add Reminder Button */}
        <TouchableOpacity
          onPress={() => setShowAdd(true)}
          style={{
            backgroundColor: theme.accent,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 16
          }}
        >
          <DynamicText type="card" style={{ color: '#ffffff', fontFamily: 'Inter_800ExtraBold', fontSize: 16 }}>
            {S.addReminder}
          </DynamicText>
        </TouchableOpacity>
        {reminders.map(r => (
          <View key={r.id} style={[styles.row, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor() }]}>
            <DynamicText type="card" style={{ fontFamily: 'Inter_700Bold' }}>
              {formatTime(r.time, { format: timeFormat })}
            </DynamicText>
            <DynamicText type="card" style={{ flex: 1, marginLeft: 12, fontFamily: 'Inter_400Regular' }}>{r.name}</DynamicText>
            
            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Edit Button */}
              <TouchableOpacity 
                onPress={() => {
                  console.log('🔧 Loading reminder data for editing:', r);
                  
                  // Load reminder data into form for editing
                  const formData = {
                    name: r.name,
                    time: r.time,
                    type: r.type || 'medication',
                    frequency: r.frequency || 'daily',
                    priority: r.priority || 'medium',
                    startDate: r.startDate || '',
                    endDate: r.endDate || '',
                    notes: r.notes || '',
                    medicationName: r.medicationName || '',
                    components: r.components || [{ strength: '', unit: 'mg' }],
                    quantity: r.quantity || '',
                    quantityUnit: r.quantityUnit || 'tablets',
                    address: r.address || ''
                  };
                  
                  console.log('🔧 Setting form data:', formData);
                  setAddForm(formData);
                  setEditingReminderId(r.id);
                  setShowAdd(true);
                }}
                style={{
                  backgroundColor: '#3B82F6',
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4
                }}
              >
                <DynamicText type="card" style={{ color: '#ffffff', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
                  Edit
                </DynamicText>
              </TouchableOpacity>

              {/* Delete Button */}
              <TouchableOpacity 
                onPress={() => setReminders((all) => all.filter(x => x.id !== r.id))}
                style={{
                  backgroundColor: '#f87171',
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4
                }}
              >
                <DynamicText type="card" style={{ color: '#ffffff', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
                  Delete
                </DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Add Reminder Modal */}
        <Modal 
          visible={showAdd} 
          animationType="slide" 
          transparent 
          presentationStyle="overFullScreen"
          statusBarTranslucent
          onRequestClose={() => {
            setShowAdd(false);
            setInputFocused(false);
            setEditingReminderId(null);
          }}
        >
          {/* Backdrop */}
          <TouchableOpacity 
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }} 
            activeOpacity={1}
            onPress={() => {
              if (!inputFocused && showAdd) {
                setShowAdd(false);
                setInputFocused(false);
                setEditingReminderId(null);
              }
            }}
          >
            {/* Modal Content */}
            <View
              style={{
                backgroundColor: getCardBackgroundColor() + 'CC', 
                borderColor: getCardBorderColor(), 
                marginHorizontal: 16, 
                width: '90%', 
                maxHeight: '85%', 
                padding: 16,
                borderRadius: 18,
                borderWidth: 1
              }}
              onStartShouldSetResponder={() => true}
            >
              <ScrollView 
                contentContainerStyle={{ padding: 12, width: '100%', paddingBottom: 20 }} 
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <DynamicText type="card" style={{ fontSize: 18, fontFamily: 'Inter_800ExtraBold' }}>
                    {editingReminderId ? (S.editReminder || 'Edit Reminder') : (S.addReminder || 'Add Reminder')}
                  </DynamicText>
                  <TouchableOpacity onPress={() => {
                    setShowAdd(false);
                    setInputFocused(false);
                    setEditingReminderId(null);
                  }}>
                    <DynamicText type="sub" style={{ fontSize: 18 }}>✕</DynamicText>
                  </TouchableOpacity>
                </View>

                {/* Reminder Name */}
                <TextInput
                  ref={reminderNameRef}
                  placeholder={S.namePlaceholder || "Reminder Name"}
                  placeholderTextColor={getCardTextColor() + '80'}
                  value={addForm.name}
                  onChangeText={(text) => setAddForm(prev => ({ ...prev, name: text }))}
                  style={{
                    backgroundColor: getCardBackgroundColor(),
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    color: getCardTextColor(),
                    fontFamily: 'Inter_400Regular',
                    borderWidth: 1,
                    borderColor: getCardBorderColor()
                  }}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />

                {/* Time Picker */}
                <TouchableOpacity
                  onPress={() => setShowPicker(true)}
                  style={{
                    backgroundColor: getCardBackgroundColor(),
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: getCardBorderColor()
                  }}
                >
                  <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular' }}>
                    {addForm.time ? formatTime(addForm.time, { format: timeFormat }) : (S.selectTime || "Select Time")}
                  </DynamicText>
                  <DynamicText type="sub">⏰</DynamicText>
                </TouchableOpacity>

                {/* Reminder Type */}
                <View style={{ marginBottom: 12 }}>
                  <DynamicText type="card" style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 8, color: getCardTextColor() }}>
                    {S.reminderType || 'Type'}
                  </DynamicText>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['medication', 'appointment', 'exercise', 'other'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => handleTypeChange(type)}
                        style={{
                          backgroundColor: addForm.type === type ? theme.accent : getCardBackgroundColor(),
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          borderWidth: 1,
                          borderColor: getCardBorderColor(),
                          minWidth: 80
                        }}
                      >
                        <DynamicText 
                          type="card" 
                          style={{ 
                            fontSize: 11,
                            color: addForm.type === type ? '#ffffff' : getCardTextColor(),
                            fontFamily: 'Inter_600SemiBold',
                            textAlign: 'center'
                          }}
                        >
                          {type === 'medication' ? (S.medication || 'Medication') :
                           type === 'appointment' ? (S.appointment || 'Appointment') :
                           type === 'exercise' ? (S.exercise || 'Exercise') :
                           type === 'other' ? (S.other || 'Other') :
                           type.charAt(0).toUpperCase() + type.slice(1)}
                        </DynamicText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Frequency */}
                <View style={{ marginBottom: 12 }}>
                  <DynamicText type="card" style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 8, color: getCardTextColor() }}>
                    {S.frequency || 'Frequency'}
                  </DynamicText>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['daily', 'weekly', 'monthly', 'custom'].map((freq) => (
                      <TouchableOpacity
                        key={freq}
                        onPress={() => setAddForm(prev => ({ ...prev, frequency: freq }))}
                        style={{
                          backgroundColor: addForm.frequency === freq ? theme.accent : getCardBackgroundColor(),
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          borderWidth: 1,
                          borderColor: getCardBorderColor(),
                          minWidth: 70
                        }}
                      >
                        <DynamicText 
                          type="card" 
                          style={{ 
                            fontSize: 11,
                            color: addForm.frequency === freq ? '#ffffff' : getCardTextColor(),
                            fontFamily: 'Inter_600SemiBold',
                            textAlign: 'center'
                          }}
                        >
                          {freq === 'daily' ? (S.daily || 'Daily') :
                           freq === 'weekly' ? (S.weekly || 'Weekly') :
                           freq === 'monthly' ? (S.monthly || 'Monthly') :
                           freq === 'custom' ? (S.custom || 'Custom') :
                           freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </DynamicText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Medication-specific fields */}
                {addForm.type === 'medication' && (
                  <View style={{ marginBottom: 12 }}>
                    <DynamicText type="card" style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 8, color: getCardTextColor() }}>
                      {S.medicationDetails || 'Medication Details'}
                    </DynamicText>
                    
                    {/* Medication Name */}
                    <TextInput
                      placeholder={S.medicationNamePlaceholder || "Medication Name (e.g., Galvus Met)"}
                      placeholderTextColor={getCardTextColor() + '80'}
                      value={addForm.medicationName}
                      onChangeText={(text) => setAddForm(prev => ({ ...prev, medicationName: text }))}
                      style={{
                        backgroundColor: getCardBackgroundColor(),
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        color: getCardTextColor(),
                        fontFamily: 'Inter_400Regular',
                        borderWidth: 1,
                        borderColor: getCardBorderColor()
                      }}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                    />

                    {/* Components */}
                    <View style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <DynamicText type="card" style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: getCardTextColor() }}>
                          {S?.components || 'Components'} ({addForm.components.length})
                        </DynamicText>
                        <TouchableOpacity
                          onPress={addComponent}
                          style={{
                            backgroundColor: theme.accent,
                            borderRadius: 20,
                            width: 32,
                            height: 32,
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <DynamicText type="card" style={{ color: '#ffffff', fontSize: 18, fontFamily: 'Inter_600SemiBold' }}>
                            +
                          </DynamicText>
                        </TouchableOpacity>
                      </View>

                      {addForm.components.map((component, index) => (
                        <View key={index} style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                          {/* Component Number Badge */}
                          <View style={{
                            backgroundColor: theme.accent + '20',
                            borderRadius: 12,
                            width: 32,
                            height: 32,
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}>
                            <DynamicText type="card" style={{ 
                              fontSize: 12, 
                              fontFamily: 'Inter_700Bold', 
                              color: theme.accent 
                            }}>
                              {index + 1}
                            </DynamicText>
                          </View>

                          {/* Strength Input */}
                          <TextInput
                            placeholder={index === 0 ? "50" : "500"}
                            placeholderTextColor={getCardTextColor() + '80'}
                            value={component.strength}
                            onChangeText={(text) => updateComponent(index, 'strength', text)}
                            style={{
                              flex: 1,
                              backgroundColor: getCardBackgroundColor(),
                              borderRadius: 12,
                              padding: 16,
                              color: getCardTextColor(),
                              fontFamily: 'Inter_400Regular',
                              borderWidth: 1,
                              borderColor: getCardBorderColor()
                            }}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="next"
                            keyboardType="numeric"
                          />
                          
                          {/* Unit Dropdown */}
                          <TouchableOpacity
                            onPress={() => {
                              setShowUnitDropdown(true);
                              // Store which component we're updating
                              setCurrentComponentIndex(index);
                            }}
                            style={{
                              backgroundColor: getCardBackgroundColor(),
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: getCardBorderColor(),
                              paddingHorizontal: 12,
                              paddingVertical: 16,
                              minWidth: 70,
                              justifyContent: 'center',
                              alignItems: 'center',
                              flexDirection: 'row',
                              gap: 4
                            }}
                          >
                            <DynamicText 
                              type="card" 
                              style={{ 
                                fontSize: 12,
                                color: getCardTextColor(),
                                fontFamily: 'Inter_600SemiBold'
                              }}
                            >
                              {component.unit}
                            </DynamicText>
                            <DynamicText 
                              type="sub" 
                              style={{ 
                                fontSize: 10,
                                color: getCardTextColor() + '80'
                              }}
                            >
                              ▼
                            </DynamicText>
                          </TouchableOpacity>

                          {/* Remove Component Button */}
                          {addForm.components.length > 1 && (
                            <TouchableOpacity
                              onPress={() => removeComponent(index)}
                              style={{
                                backgroundColor: '#f87171',
                                borderRadius: 20,
                                width: 32,
                                height: 32,
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}
                            >
                              <DynamicText type="card" style={{ color: '#ffffff', fontSize: 16, fontFamily: 'Inter_600SemiBold' }}>
                                ×
                              </DynamicText>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}

                      {/* Component Summary */}
                      {addForm.components.length > 1 && (
                        <View style={{
                          backgroundColor: getCardBackgroundColor() + '50',
                          borderRadius: 8,
                          padding: 12,
                          marginTop: 8,
                          borderWidth: 1,
                          borderColor: getCardBorderColor() + '50'
                        }}>
                          <DynamicText type="card" style={{ 
                            fontSize: 12, 
                            fontFamily: 'Inter_500Medium', 
                            color: getCardTextColor() + '80',
                            textAlign: 'center'
                          }}>
                            {(S.total || 'Total')}: {addForm.components.map(comp => `${comp.strength || '0'}${comp.unit}`).join(' / ')}
                          </DynamicText>
                        </View>
                      )}
                    </View>

                    {/* Quantity */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      <TextInput
                        placeholder="30"
                        placeholderTextColor={getCardTextColor() + '80'}
                        value={addForm.quantity}
                        onChangeText={(text) => setAddForm(prev => ({ ...prev, quantity: text }))}
                        style={{
                          flex: 1,
                          backgroundColor: getCardBackgroundColor(),
                          borderRadius: 12,
                          padding: 16,
                          color: getCardTextColor(),
                          fontFamily: 'Inter_400Regular',
                          borderWidth: 1,
                          borderColor: getCardBorderColor()
                        }}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        keyboardType="numeric"
                      />
                      
                      <TouchableOpacity
                        onPress={() => {
                          setShowQuantityDropdown(true);
                        }}
                        style={{
                          backgroundColor: getCardBackgroundColor(),
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: getCardBorderColor(),
                          paddingHorizontal: 12,
                          paddingVertical: 16,
                          minWidth: 80,
                          justifyContent: 'center',
                          alignItems: 'center',
                          flexDirection: 'row',
                          gap: 4
                        }}
                      >
                        <DynamicText 
                          type="card" 
                          style={{ 
                            fontSize: 12,
                            color: getCardTextColor(),
                            fontFamily: 'Inter_600SemiBold'
                          }}
                        >
                          {addForm.quantityUnit}
                        </DynamicText>
                        <DynamicText 
                          type="sub" 
                          style={{ 
                            fontSize: 10,
                            color: getCardTextColor() + '80'
                          }}
                        >
                          ▼
                        </DynamicText>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Appointment-specific fields */}
                {addForm.type === 'appointment' && (
                  <View style={{ marginBottom: 12 }}>
                    <DynamicText type="card" style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 8, color: getCardTextColor() }}>
                      {S.appointmentDetails || 'Appointment Details'}
                    </DynamicText>
                    
                    {/* Address */}
                    <TextInput
                      placeholder={S.addressPlaceholder || "Address (Optional)"}
                      placeholderTextColor={getCardTextColor() + '80'}
                      value={addForm.address}
                      onChangeText={(text) => setAddForm(prev => ({ ...prev, address: text }))}
                      style={{
                        backgroundColor: getCardBackgroundColor(),
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        color: getCardTextColor(),
                        fontFamily: 'Inter_400Regular',
                        borderWidth: 1,
                        borderColor: getCardBorderColor()
                      }}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                    />
                  </View>
                )}

                {/* Start Date */}
                <TouchableOpacity
                  onPress={() => {
                    setDateField('startDate');
                    setShowDatePicker(true);
                  }}
                  style={{
                    backgroundColor: getCardBackgroundColor(),
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: getCardBorderColor()
                  }}
                >
                  <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular' }}>
                    {addForm.startDate || (S.startDateOptional || "Start Date (Optional)")}
                  </DynamicText>
                  <DynamicText type="sub">📅</DynamicText>
                </TouchableOpacity>

                {/* End Date */}
                <TouchableOpacity
                  onPress={() => {
                    setDateField('endDate');
                    setShowDatePicker(true);
                  }}
                  style={{
                    backgroundColor: getCardBackgroundColor(),
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: getCardBorderColor()
                  }}
                >
                  <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular' }}>
                    {addForm.endDate || (S.endDateOptional || "End Date (Optional)")}
                  </DynamicText>
                  <DynamicText type="sub">📅</DynamicText>
                </TouchableOpacity>

                {/* Notes */}
                <TextInput
                  placeholder={S.notesOptional || "Notes (Optional)"}
                  placeholderTextColor={getCardTextColor() + '80'}
                  value={addForm.notes}
                  onChangeText={(text) => setAddForm(prev => ({ ...prev, notes: text }))}
                  style={{
                    backgroundColor: getCardBackgroundColor(),
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                    color: getCardTextColor(),
                    fontFamily: 'Inter_400Regular',
                    borderWidth: 1,
                    borderColor: getCardBorderColor()
                  }}
                  multiline
                  numberOfLines={3}
                  autoCapitalize="sentences"
                  autoCorrect={true}
                  returnKeyType="default"
                />

                {/* Save Button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: theme.accent,
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: 'center'
                  }}
                  onPress={async () => {
                    if (!addForm.name || !addForm.time) return;
                    
                    const reminderData = { 
                      id: editingReminderId || `${Date.now()}`,
                      name: addForm.name,
                      time: addForm.time,
                      type: addForm.type,
                      frequency: addForm.frequency,
                      priority: addForm.priority,
                      startDate: addForm.startDate,
                      endDate: addForm.endDate,
                      notes: addForm.notes,
                      // Include type-specific fields
                      ...(addForm.type === 'medication' && {
                        medicationName: addForm.medicationName,
                        components: addForm.components,
                        quantity: addForm.quantity,
                        quantityUnit: addForm.quantityUnit
                      }),
                      ...(addForm.type === 'appointment' && {
                        address: addForm.address
                      })
                    };

                    if (editingReminderId) {
                      // Update existing reminder
                      setReminders(r => r.map(item => item.id === editingReminderId ? reminderData : item));
                    } else {
                      // Add new reminder
                      setReminders(r => [...r, reminderData]);
                    }

                    // Route to appropriate card and database
                    await routeReminderToCard(reminderData);
                    
                    // Schedule notification
                    await scheduleReminderNotification(addForm.name, addForm.time);
                    
                    // Reset form and close modal
                    setShowAdd(false);
                    setInputFocused(false);
                    setEditingReminderId(null);
                  }}
                >
                  <DynamicText type="card" style={{ color: '#ffffff', fontFamily: 'Inter_800ExtraBold', fontSize: 16 }}>
                    {editingReminderId ? (S.updateReminder || "Update Reminder") : (S.addReminder || "Add Reminder")}
                  </DynamicText>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker 
            value={new Date()} 
            mode="date" 
            display="default" 
            onChange={onDatePick} 
          />
        )}

        {/* Time Picker */}
        {showPicker && (
          <DateTimePicker 
            value={new Date()} 
            mode="time" 
            is24Hour={timeFormat === '24h'} 
            display="default" 
            onChange={onPick} 
          />
        )}

        {/* Unit Dropdown Modal */}
        <Modal
          visible={showUnitDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowUnitDropdown(false)}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
            activeOpacity={1}
            onPress={() => setShowUnitDropdown(false)}
          >
            <View
              style={{
                backgroundColor: getCardBackgroundColor(),
                borderRadius: 12,
                padding: 16,
                marginHorizontal: 32,
                minWidth: 200,
                borderWidth: 1,
                borderColor: getCardBorderColor()
              }}
              onStartShouldSetResponder={() => true}
            >
              <DynamicText type="card" style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 12, color: getCardTextColor() }}>
                {S?.selectUnit || 'Select Unit'}
              </DynamicText>
              {['mg', 'g', 'ml', 'tablets', 'capsules', 'units'].map((unit) => (
                <TouchableOpacity
                  key={unit}
                  onPress={() => {
                    updateComponent(currentComponentIndex, 'unit', unit);
                    setShowUnitDropdown(false);
                  }}
                  style={{
                    backgroundColor: addForm.components[currentComponentIndex]?.unit === unit ? theme.accent : 'transparent',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 4
                  }}
                >
                  <DynamicText 
                    type="card" 
                    style={{ 
                      fontSize: 14,
                      color: addForm.components[currentComponentIndex]?.unit === unit ? '#ffffff' : getCardTextColor(),
                      fontFamily: 'Inter_500Medium'
                    }}
                  >
                    {S?.units?.[unit] || unit}
                  </DynamicText>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Quantity Dropdown Modal */}
        <Modal
          visible={showQuantityDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQuantityDropdown(false)}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
            activeOpacity={1}
            onPress={() => setShowQuantityDropdown(false)}
          >
            <View
              style={{
                backgroundColor: getCardBackgroundColor(),
                borderRadius: 12,
                padding: 16,
                marginHorizontal: 32,
                minWidth: 200,
                borderWidth: 1,
                borderColor: getCardBorderColor()
              }}
              onStartShouldSetResponder={() => true}
            >
              <DynamicText type="card" style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 12, color: getCardTextColor() }}>
                {S?.selectQuantityUnit || 'Select Quantity Unit'}
              </DynamicText>
              {['tablets', 'capsules', 'ml', 'mg', 'g', 'units', 'pills'].map((unit) => (
                <TouchableOpacity
                  key={unit}
                  onPress={() => {
                    setAddForm(prev => ({ ...prev, quantityUnit: unit }));
                    setShowQuantityDropdown(false);
                  }}
                  style={{
                    backgroundColor: addForm.quantityUnit === unit ? theme.accent : 'transparent',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 4
                  }}
                >
                  <DynamicText 
                    type="card" 
                    style={{ 
                      fontSize: 14,
                      color: addForm.quantityUnit === unit ? '#ffffff' : getCardTextColor(),
                      fontFamily: 'Inter_500Medium'
                    }}
                  >
                    {S?.units?.[unit] || unit}
                  </DynamicText>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  form: { 
    borderWidth: 2, 
    borderRadius: 16, 
    padding: 12, 
    marginBottom: 16 
  },
  input: { 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12, 
    fontSize: 16 
  },
  btn: { 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  btnText: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  row: { 
    borderWidth: 2, 
    padding: 12, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
    marginBottom: 12
  },
});

export default Reminders;
