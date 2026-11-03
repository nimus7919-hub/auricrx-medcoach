import uiI18n from "../src/i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import GrowingTextInput from './GrowingTextInput';
import KeyboardForm from './KeyboardForm';
import MedicationAutocomplete from './MedicationAutocomplete';
import { contributeMedication, medicationFields } from '../src/services/medicationCatalog';
import { useTranslation } from 'react-i18next';
import { vip } from '../src/theme/vip';
import PremiumButton from '../src/components/PremiumButton';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Image, Platform, Keyboard, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { saveReminderNotification, testReminderNotification } from '../src/services/reminderNotifications';
import { parseReminderTime } from '../src/utils/reminderTime';
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
  onAddSupplementFromReminder,
  onAddAppointmentFromReminder,
  meds,
  setMeds
}) => {
  useUILanguage();
  // Mount/unmount detection
  const mounted = useRef(0);
  const { t, i18n } = useTranslation();
  const es = i18n.language?.startsWith('es');
  const [saving, setSaving] = useState(false);
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
    customDays: [], // Array of day names for custom frequency (e.g., ['Monday', 'Wednesday', 'Friday'])
    priority: 'medium',
    startDate: '',
    endDate: '',
    notes: '',
    // Medication-specific fields
    medicationName: '',
    components: [{ strength: '', unit: uiI18n.t("reminders.units.mg") }], // Array for multiple components
    quantity: '',
    quantityUnit: uiI18n.t("medications.quantityUnits.tablets"),
    isSingleComponent: true, // Default to single component
    // Supplement-specific fields
    supplementName: '',
    brand: '',
    dosageValue: '',
    dosageUnit: 'mg',
    quantityValue: '',
    quantityUnit: 'capsules',
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
        customDays: [],
        priority: 'medium',
        startDate: '',
        endDate: '',
        notes: '',
        // Medication-specific fields
        medicationName: '',
        components: [{ strength: '', unit: uiI18n.t("reminders.units.mg") }],
        quantity: '',
        quantityUnit: uiI18n.t("medications.quantityUnits.tablets"),
        isSingleComponent: true, // Default to single component
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
        components: [{ strength: '', unit: uiI18n.t("reminders.units.mg") }],
        quantity: '',
        quantityUnit: uiI18n.t("medications.quantityUnits.tablets"),
        isSingleComponent: true,
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
      components: [...prev.components, { strength: '', unit: uiI18n.t("reminders.units.mg") }]
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

  useEffect(() => {
    if (addForm.isSingleComponent !== false && addForm.components?.filter(c => String(c.name || c.strength || '').trim()).length >= 2) {
      setAddForm(prev => ({ ...prev, isSingleComponent: false }));
    }
  }, [addForm.components, addForm.isSingleComponent]);

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
          components: reminderData.components,
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
          isSingleComponent: reminderData.isSingleComponent !== undefined ? reminderData.isSingleComponent : true,
          times: [reminderData.time],
          status: 'taking',
          startDate: reminderData.startDate || new Date().toISOString().split(uiI18n.t("reminders.tuesdayShort"))[0],
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

      } else if (reminderData.type === 'supplement') {
        // Route to supplements card
        console.log('💊 Routing supplement reminder to supplements card:', reminderData);
        
        // Create supplement object for supplements card
        const supplementData = {
          id: reminderData.id,
          name: reminderData.supplementName || reminderData.name,
          brand: reminderData.brand || '',
          dosage: reminderData.dosageValue && reminderData.dosageUnit ? 
            `${reminderData.dosageValue} ${reminderData.dosageUnit}` : '500 mg',
          dosageValue: reminderData.dosageValue || '500',
          dosageUnit: reminderData.dosageUnit || 'mg',
          quantity: reminderData.quantityValue && reminderData.quantityUnit ? 
            `${reminderData.quantityValue} ${reminderData.quantityUnit}` : '30 capsules',
          quantityValue: reminderData.quantityValue || '30',
          quantityUnit: reminderData.quantityUnit || 'capsules',
          times: [reminderData.time],
          status: 'taking',
          startDate: reminderData.startDate || new Date().toISOString().split(uiI18n.t("reminders.tuesdayShort"))[0],
          endDate: reminderData.endDate || '',
          notes: reminderData.notes || '',
          dosesLeft: '',
          remainingQuantity: reminderData.quantityValue || '30',
          refillSoon: false,
          // Add reminder reference
          reminderId: reminderData.id,
          fromReminder: true
        };

        // Call parent function to add to supplements
        if (onAddSupplementFromReminder) {
          await onAddSupplementFromReminder(supplementData);
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

  // Delete reminder and corresponding medication/appointment
  const handleDeleteReminder = (reminderId) => {
    // Find the reminder to check its type
    const reminderToDelete = reminders.find(r => r.id === reminderId);
    
    // Delete the reminder
    setReminders(prev => prev.filter(r => r.id !== reminderId));
    
    // If this reminder created a medication, also delete the medication
    if (reminderToDelete?.type === 'medication' && setMeds && meds) {
      const correspondingMed = meds.find(med => med.reminderId === reminderId);
      if (correspondingMed) {
        console.log('🗑️ Also deleting corresponding medication:', correspondingMed.id);
        setMeds(prev => prev.filter(med => med.reminderId !== reminderId));
      }
    }
    
    // Note: For appointments, we would do the same if we had access to appointments state
    // This can be added when appointments functionality is fully integrated
  };

  return (
    <KeyboardForm><View style={{ flex: 1 }}>
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

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[{ padding: 16 }, { paddingBottom: 24 }]}>
        {/* Add Reminder Button */}
          <PremiumButton
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
          </PremiumButton>
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
                    customDays: r.customDays || [],
                    priority: r.priority || 'medium',
                    startDate: r.startDate || '',
                    endDate: r.endDate || '',
                    notes: r.notes || '',
                    medicationName: r.medicationName || '',
                    components: r.components || [{ strength: '', unit: uiI18n.t("reminders.units.mg") }],
                    quantity: r.quantity || '',
                    quantityUnit: r.quantityUnit || uiI18n.t("medications.quantityUnits.tablets"),
                    isSingleComponent: r.isSingleComponent !== undefined ? r.isSingleComponent : true,
                    address: r.address || ''
                  };
                  
                  console.log('🔧 Setting form data:', formData);
                  setAddForm(formData);
                  setEditingReminderId(r.id);
                  setShowAdd(true);
                }}
                style={{
                  backgroundColor: vip.colors.goldDark,
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4
                }}
              >
                <DynamicText type="card" style={{ color: '#ffffff', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>{uiI18n.t("medications.edit")}</DynamicText>
              </TouchableOpacity>

              {/* Delete Button */}
              <TouchableOpacity 
                onPress={() => handleDeleteReminder(r.id)}
                style={{
                  backgroundColor: '#f87171',
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4
                }}
              >
                <DynamicText type="card" style={{ color: '#ffffff', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>{uiI18n.t("ai.delete")}</DynamicText>
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
          <KeyboardForm><TouchableOpacity 
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
                contentContainerStyle={[{ padding: 12, width: '100%', paddingBottom: 20 }, { paddingBottom: 24 }]} 
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <DynamicText type="card" style={{ fontSize: 18, fontFamily: 'Inter_800ExtraBold' }}>
                    {editingReminderId ? (S.editReminder || uiI18n.t("reminders.editReminder")) : (S.addReminder || uiI18n.t("reminders.addReminder"))}
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
                <MedicationAutocomplete
                  onSelect={med => setAddForm(prev => ({ ...prev, ...medicationFields(med), name: med.name, medicationName: med.name }))}
                  enabled={addForm.type === 'medication'}
                  ref={reminderNameRef}
                  placeholder={S.namePlaceholder || uiI18n.t("ui.reminderName")}
                  placeholderTextColor={getCardTextColor() + '80'}
                  value={addForm.name}
                  onChangeText={(text) => setAddForm(prev => ({ ...prev, name: text, selectedMedicationName: null }))}
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
                    {addForm.time ? formatTime(addForm.time, { format: timeFormat }) : (S.selectTime || uiI18n.t("reminders.selectTime"))}
                  </DynamicText>
                  <DynamicText type="sub">⏰</DynamicText>
                </TouchableOpacity>

                {/* Reminder Type */}
                <View style={{ marginBottom: 12 }}>
                  <DynamicText type="card" style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 8, color: getCardTextColor() }}>
                    {S.reminderType || uiI18n.t("reminders.type")}
                  </DynamicText>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['medication', 'supplement', 'appointment', 'exercise', 'other'].map((type) => (
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
                          {type === uiI18n.t("reminders.medication") ? (S.medication || uiI18n.t("reminders.medication")) :
                           type === uiI18n.t("reminders.appointment") ? (S.appointment || uiI18n.t("reminders.appointment")) :
                           type === uiI18n.t("reminders.exercise") ? (S.exercise || uiI18n.t("reminders.exercise")) :
                           type === uiI18n.t("reminders.other") ? (S.other || uiI18n.t("reminders.other")) :
                           type.charAt(0).toUpperCase() + type.slice(1)}
                        </DynamicText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Frequency */}
                <View style={{ marginBottom: 12 }}>
                  <DynamicText type="card" style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 8, color: getCardTextColor() }}>
                    {S.frequency || uiI18n.t("reminders.frequency")}
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
                          {freq === uiI18n.t("healthProfile.daily") ? (S.daily || uiI18n.t("healthProfile.daily")) :
                           freq === uiI18n.t("healthProfile.weekly") ? (S.weekly || uiI18n.t("healthProfile.weekly")) :
                           freq === uiI18n.t("ai.monthly") ? (S.monthly || uiI18n.t("ai.monthly")) :
                           freq === uiI18n.t("healthProfile.custom") ? (S.custom || uiI18n.t("healthProfile.custom")) :
                           freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </DynamicText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Custom Days Selection (only show when frequency is 'custom') */}
                {addForm.frequency === uiI18n.t("healthProfile.custom") && (
                  <View style={{ marginBottom: 12 }}>
                    <DynamicText type="card" style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 8, color: getCardTextColor() }}>
                      {S.selectDays || uiI18n.t("reminders.selectDays")}
                    </DynamicText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                      {[
                        { full: uiI18n.t("reminders.monday"), shortKey: 'mondayShort' },
                        { full: uiI18n.t("reminders.tuesday"), shortKey: 'tuesdayShort' },
                        { full: uiI18n.t("reminders.wednesday"), shortKey: 'wednesdayShort' },
                        { full: uiI18n.t("reminders.thursday"), shortKey: 'thursdayShort' },
                        { full: uiI18n.t("reminders.friday"), shortKey: 'fridayShort' },
                        { full: uiI18n.t("reminders.saturday"), shortKey: 'saturdayShort' },
                        { full: uiI18n.t("reminders.sunday"), shortKey: 'sundayShort' }
                      ].map((day) => {
                        const isSelected = addForm.customDays.includes(day.full);
                        return (
                          <TouchableOpacity
                            key={day.full}
                            onPress={() => {
                              setAddForm(prev => ({
                                ...prev,
                                customDays: isSelected
                                  ? prev.customDays.filter(d => d !== day.full)
                                  : [...prev.customDays, day.full]
                              }));
                            }}
                            style={{
                              backgroundColor: isSelected ? theme.accent : getCardBackgroundColor(),
                              borderRadius: 16,
                              width: 32,
                              height: 32,
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderWidth: 1.5,
                              borderColor: isSelected ? theme.accent : getCardBorderColor()
                            }}
                          >
                            <DynamicText 
                              type="card" 
                              style={{ 
                                fontSize: 14,
                                color: isSelected ? '#ffffff' : getCardTextColor(),
                                fontFamily: 'Inter_700Bold',
                                textAlign: 'center'
                              }}
                            >
                              {S[day.shortKey] || day.full.charAt(0)}
                            </DynamicText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {addForm.customDays.length > 0 && (
                      <DynamicText type="sub" style={{ fontSize: 10, marginTop: 8, color: getCardTextColor() + '80' }}>
                        {S.selected || uiI18n.t("reminders.selected")}: {addForm.customDays.join(', ')}
                      </DynamicText>
                    )}
                  </View>
                )}

                {/* Medication-specific fields */}
                {addForm.type === uiI18n.t("reminders.medication") && (
                  <View style={{ marginBottom: 12 }}>
                    <DynamicText type="card" style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 8, color: getCardTextColor() }}>
                      {S.medicationDetails || uiI18n.t("reminders.medicationDetails")}
                    </DynamicText>
                    
                    {/* Medication Name */}
                    <MedicationAutocomplete
                  onSelect={med => setAddForm(prev => ({ ...prev, ...medicationFields(med), name: med.name, medicationName: med.name }))}
                  enabled={addForm.type === 'medication'}
                      placeholder={S.medicationNamePlaceholder || uiI18n.t("reminders.medicationNamePlaceholder")}
                      placeholderTextColor={getCardTextColor() + '80'}
                      value={addForm.medicationName}
                      onChangeText={(text) => setAddForm(prev => ({ ...prev, medicationName: text, selectedMedicationName: null }))}
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <DynamicText type="card" style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: getCardTextColor() }}>
                            {S?.components || uiI18n.t("medications.components")} ({addForm.components.length})
                          </DynamicText>
                          
                          {/* Compact Multi-Component Checkbox */}
                          <TouchableOpacity
                            onPress={() => setAddForm(prev => ({ ...prev, isSingleComponent: !prev.isSingleComponent }))}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <View style={{
                              width: 16,
                              height: 16,
                              borderRadius: 4,
                              borderWidth: 1.5,
                              borderColor: theme.accent,
                              backgroundColor: !addForm.isSingleComponent ? theme.accent : 'transparent',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                              {!addForm.isSingleComponent && (
                                <DynamicText type="card" style={{ fontSize: 10, color: '#000', lineHeight: 10 }}>✓</DynamicText>
                              )}
                            </View>
                            <DynamicText type="sub" style={{ fontSize: 10 }}>
                              multi
                            </DynamicText>
                          </TouchableOpacity>
                        </View>
                        
                        {!addForm.isSingleComponent && (
                          <PremiumButton
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
                        </PremiumButton>
                        )}
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

                          <GrowingTextInput
                        placeholder={t('medicationAutocomplete.ingredient')}
                        value={component.name || ''}
                        onChangeText={text => updateComponent(index, 'name', text)}
                        style={{ flex: 1, color: getCardTextColor(), borderColor: theme.accent, borderWidth: 1, borderRadius: 12, padding: 12 }}
                      />
                      {/* Strength Input */}
                          <TextInput
                            placeholder=""
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
                          {!addForm.isSingleComponent && addForm.components.length > 1 && (
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
                      {!addForm.isSingleComponent && addForm.components.length > 1 && (
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
                            {(S.total || uiI18n.t("reminders.total"))}: {addForm.components.map(comp => `${comp.strength || '0'}${comp.unit}`).join(' / ')}
                          </DynamicText>
                        </View>
                      )}
                    </View>

                    {/* Quantity */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      <TextInput
                        placeholder=""
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

                {/* Supplement-specific fields */}
                {addForm.type === 'supplement' && (
                  <View style={{ marginBottom: 12 }}>
                    <DynamicText type="card" style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 8, color: getCardTextColor() }}>
                      {uiI18n.t("ui.supplementDetails")}
                    </DynamicText>
                    
                    {/* Supplement Name */}
                    <TextInput
                      placeholder={uiI18n.t("ui.supplementNameEGVitaminD3")}
                      placeholderTextColor={getCardTextColor() + '80'}
                      value={addForm.supplementName}
                      onChangeText={(text) => setAddForm(prev => ({ ...prev, supplementName: text }))}
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

                    {/* Brand (Optional) */}
                    <TextInput
                      placeholder={uiI18n.t("ui.brandOptional")}
                      placeholderTextColor={getCardTextColor() + '80'}
                      value={addForm.brand}
                      onChangeText={(text) => setAddForm(prev => ({ ...prev, brand: text }))}
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

                    {/* Dosage */}
                    <DynamicText type="card" style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 8, color: getCardTextColor() }}>
                      {uiI18n.t("ui.dosagePerServing")}
                    </DynamicText>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      <TextInput
                        placeholder="500"
                        placeholderTextColor={getCardTextColor() + '80'}
                        value={addForm.dosageValue}
                        onChangeText={(text) => setAddForm(prev => ({ ...prev, dosageValue: text }))}
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
                        keyboardType="numeric"
                        returnKeyType="next"
                      />
                      <TextInput
                        placeholder={uiI18n.t("reminders.units.mg")}
                        placeholderTextColor={getCardTextColor() + '80'}
                        value={addForm.dosageUnit}
                        onChangeText={(text) => setAddForm(prev => ({ ...prev, dosageUnit: text }))}
                        style={{
                          width: 80,
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
                        returnKeyType="next"
                      />
                    </View>

                    {/* Quantity */}
                    <DynamicText type="card" style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 8, color: getCardTextColor() }}>
                      {uiI18n.t("ui.quantityInBottlePackage")}
                    </DynamicText>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      <TextInput
                        placeholder="30"
                        placeholderTextColor={getCardTextColor() + '80'}
                        value={addForm.quantityValue}
                        onChangeText={(text) => setAddForm(prev => ({ ...prev, quantityValue: text }))}
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
                        keyboardType="numeric"
                        returnKeyType="done"
                      />
                      <TextInput
                        placeholder={uiI18n.t("reminders.units.capsules")}
                        placeholderTextColor={getCardTextColor() + '80'}
                        value={addForm.quantityUnit}
                        onChangeText={(text) => setAddForm(prev => ({ ...prev, quantityUnit: text }))}
                        style={{
                          width: 110,
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
                        returnKeyType="done"
                      />
                    </View>
                  </View>
                )}

                {/* Appointment-specific fields */}
                {addForm.type === uiI18n.t("reminders.appointment") && (
                  <View style={{ marginBottom: 12 }}>
                    <DynamicText type="card" style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 8, color: getCardTextColor() }}>
                      {S.appointmentDetails || uiI18n.t("reminders.appointmentDetails")}
                    </DynamicText>
                    
                    {/* Address */}
                    <TextInput
                      placeholder={S.addressPlaceholder || uiI18n.t("reminders.addressPlaceholder")}
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
                    {addForm.startDate || (S.startDateOptional || uiI18n.t("reminders.startDateOptional"))}
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
                    {addForm.endDate || (S.endDateOptional || uiI18n.t("reminders.endDateOptional"))}
                  </DynamicText>
                  <DynamicText type="sub">📅</DynamicText>
                </TouchableOpacity>

                {/* Notes */}
                <TextInput
                  placeholder={S.notesOptional || uiI18n.t("healthAnalytics.notesOptional")}
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

                <PremiumButton onPress={async () => {
                  try {
                    await testReminderNotification();
                    Alert.alert(uiI18n.t("localized.Reminders.Reminders.text1253"), uiI18n.t("localized.Reminders.Reminders.text1253"));
                  } catch (error) { Alert.alert(uiI18n.t("localized.Reminders.Reminders.text1254"), error.message); }
                }} style={{ padding: 16, alignItems: 'center' }}>
                  <DynamicText type="card">{uiI18n.t("localized.Reminders.Reminders.text1256")}</DynamicText>
                </PremiumButton>
                {/* Save Button */}
                <PremiumButton
                  style={{
                    backgroundColor: theme.accent,
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: 'center'
                  }}
                  onPress={async () => {
                    if (saving || !addForm.name || !addForm.time) return;
                    setSaving(true);
                    try {
                    if (addForm.type === 'medication') contributeMedication(addForm.medicationName || addForm.name, addForm.components, addForm.selectedMedicationName);
                    
                    const reminderData = { 
                      id: editingReminderId || `${Date.now()}`,
                      name: addForm.name,
                      time: parseReminderTime(addForm.time).normalized,
                      type: addForm.type,
                      frequency: addForm.frequency,
                      customDays: addForm.customDays,
                      priority: addForm.priority,
                      startDate: addForm.startDate,
                      endDate: addForm.endDate,
                      notes: addForm.notes,
                      // Include type-specific fields
                      ...(addForm.type === 'medication' && {
                        medicationName: addForm.medicationName,
                        components: addForm.components,
                        quantity: addForm.quantity,
                        quantityUnit: addForm.quantityUnit,
                        isSingleComponent: addForm.isSingleComponent
                      }),
                      ...(addForm.type === 'supplement' && {
                        supplementName: addForm.supplementName,
                        brand: addForm.brand,
                        dosageValue: addForm.dosageValue,
                        dosageUnit: addForm.dosageUnit,
                        quantityValue: addForm.quantityValue,
                        quantityUnit: addForm.quantityUnit
                      }),
                      ...(addForm.type === 'appointment' && {
                        address: addForm.address
                      })
                    };

                    reminderData.notificationIds = await saveReminderNotification(reminderData);

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
                    // Scheduled successfully before committing the reminder.
                    
                    // Reset form and close modal
                    setShowAdd(false);
                    setInputFocused(false);
                    setEditingReminderId(null);
                    } catch (error) {
                      console.error('[Reminders] save failed', error);
                      Alert.alert(uiI18n.t("localized.Reminders.Reminders.text1326"), error.message);
                    } finally { setSaving(false); }
                  }}
                >
                  <DynamicText type="card" style={{ color: '#ffffff', fontFamily: 'Inter_800ExtraBold', fontSize: 16 }}>
                    {editingReminderId ? (S.updateReminder || uiI18n.t("reminders.updateReminder")) : (S.addReminder || uiI18n.t("reminders.addReminder"))}
                  </DynamicText>
                </PremiumButton>
              </ScrollView>
            </View>
          </TouchableOpacity></KeyboardForm>
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
                {S?.selectUnit || uiI18n.t("healthAnalytics.selectUnit")}
              </DynamicText>
              {[uiI18n.t("reminders.units.mg"), uiI18n.t("reminders.units.g"), uiI18n.t("medications.quantityUnits.ml"), uiI18n.t("medications.quantityUnits.tablets"), uiI18n.t("medications.quantityUnits.capsules"), uiI18n.t("reminders.units.units")].map((unit) => (
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
                {S?.selectQuantityUnit || uiI18n.t("reminders.selectQuantityUnit")}
              </DynamicText>
              {[uiI18n.t("medications.quantityUnits.tablets"), uiI18n.t("medications.quantityUnits.capsules"), uiI18n.t("medications.quantityUnits.ml"), uiI18n.t("reminders.units.mg"), uiI18n.t("reminders.units.g"), uiI18n.t("reminders.units.units"), uiI18n.t("reminders.units.pills")].map((unit) => (
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
    </View></KeyboardForm>
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
