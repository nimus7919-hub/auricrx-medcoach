import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Image, Keyboard, Alert, Linking, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import MedicationRefillModal from './MedicationRefillModal';
import DynamicText from '../src/components/DynamicText';
import { useWallpaper } from '../src/contexts/WallpaperContext';
import { formatTime } from '../src/utils/time';
import { useTimeFormat } from '../src/hooks/useTimeFormat';

// Medications component moved outside App to prevent remounting
const Medications = ({ theme, meds, setMeds, S, themeKey, lang, userCountry, user, onNavigateToDashboard, preloadedPharmacies, preloadedCoords, preloadedCurrency, preloadedFxMeta, reminders, setReminders }) => {
  // Mount/unmount detection
  const mounted = useRef(0);
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor, getSubTextColor, currentWallpaper } = useWallpaper();
  const { timeFormat } = useTimeFormat();
  
  // Helper function to convert unit to sentence case
  const toSentenceCase = (str) => {
    if (!str) return '';
    const s = String(str).trim();
    if (s.length === 0) return '';
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  };
  
  // Unit options for strength and quantity (sorted alphabetically)
  const strengthUnits = [
    '% v/v', '% w/v', '% w/w', 'FTU', 'IU', 'IU/mL', 'L', 'U', 'U/kg', 'U/mL', 'U/hour',
    'Actuations', 'Drops', 'G', 'Mcg', 'Mcg/kg', 'Mcg/kg/min', 'Mcg/hour', 'Mcg/mL',
    'Mg', 'Mg/kg', 'Mg/m²', 'Mg/day', 'Mg/hour', 'Mg/mL', 'Mg/5mL', 'ML', 'ML/hour',
    'MEq', 'MEq/L', 'Mmol', 'Mmol/L', 'Puffs', 'Units', 'USP units'
  ];
  
  const quantityUnits = [
    'Ampule', 'Ampules', 'Bottle', 'Bottles', 'Box', 'Boxes', 'Capsule', 'Capsules',
    'Drop', 'Drops', 'Pack', 'Packs', 'Piece', 'Pieces', 'Puff', 'Puffs', 'Pump', 'Pumps',
    'Sachet', 'Sachets', 'Strip', 'Strips', 'Suppository', 'Suppositories',
    'Tablet', 'Tablets', 'Unit', 'Units', 'Vial', 'Vials'
  ];
  
  useEffect(() => {
    mounted.current += 1;
    console.log(`[MEDICATIONS] MOUNT #${mounted.current}`);
    console.log('🔍 Medications component - lang:', lang);
    return () => console.log(`[MEDICATIONS] UNMOUNT #${mounted.current}`);
  }, []);

  useEffect(() => {
    console.log(`[MEDICATIONS] showAdd ->`, showAdd);
  }, [showAdd]);

  const [showFilterModal, setShowFilterModal] = useState(false);
  // Refill modal state
  const [refillMed, setRefillMed] = useState(null);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showRefillLoading, setShowRefillLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  console.log('[MEDICATIONS] Component rendering, showAdd:', showAdd, 'inputFocused:', inputFocused);
  const [buttonPressed, setButtonPressed] = useState(false);
  
  // Debug function to track modal state changes with debounce
  const debugSetShowAdd = (value) => {
    console.log('[MEDICATIONS] setShowAdd called with:', value, 'current showAdd:', showAdd, 'inputFocused:', inputFocused);
    
    // Prevent closing modal when input is focused
    if (value === false && inputFocused) {
      console.log('[MEDICATIONS] Preventing modal close - input is focused');
      return;
    }
    
    // Prevent rapid state changes that could cause modal flickering
    if (value === true && showAdd === true) {
      console.log('Preventing duplicate modal open');
      return;
    }
    if (value === false && showAdd === false) {
      console.log('Preventing duplicate modal close');
      return;
    }
    
    // Add a small delay to prevent race conditions
    setTimeout(() => {
      console.log('[MEDICATIONS] Actually setting showAdd to:', value);
      setShowAdd(value);
    }, 50);
  };
  const [filter, setFilter] = useState('all');
  const [detailMed, setDetailMed] = useState(null);
  const addMedNameRef = useRef(null);

  // Reset form when modal opens and track modal state changes
  useEffect(() => {
    console.log('[MEDICATIONS] Modal state changed - showAdd:', showAdd);
    if (showAdd) {
      setAddForm({ 
        name:'', 
        components: [{ strength: '', unit: 'Mg' }], // Multi-component system
        times:'', 
        status:'taking', 
        startDate:'', 
        endDate:'', 
        notes:'', 
        dosesLeft:'', 
        quantityValue:'', 
        quantityUnit:'tablet',
        isSingleComponent: true // Default to single component
      });
    } else {
      setInputFocused(false); // Reset input focus when modal closes
    }
  }, [showAdd]);

  // Add keyboard event listeners to prevent modal from closing due to keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      console.log('[MEDICATIONS] Keyboard shown - preventing modal close');
      setInputFocused(true);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      console.log('[MEDICATIONS] Keyboard hidden');
      // Don't immediately set inputFocused to false, let the input onBlur handle it
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [holdUntil, setHoldUntil] = useState('');
  const [addForm, setAddForm] = useState({ 
    name:'', 
    components: [{ strength: '', unit: 'Mg' }], // Multi-component system
    times:'', 
    status:'taking', 
    startDate:'', 
    endDate:'', 
    notes:'', 
    dosesLeft:'', 
    quantityValue:'', 
    quantityUnit:'tablet',
    isSingleComponent: true // Default to single component (multi unchecked)
  });
  const [addTimes, setAddTimes] = useState([]); // array of HH:MM
  const [editTimes, setEditTimes] = useState([]);
  const [showMedTimePicker, setShowMedTimePicker] = useState(false);
  const [timeTarget, setTimeTarget] = useState(null); // 'add' | 'edit'
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateTarget, setDateTarget] = useState(null); // 'add' | 'edit'
  const [dateField, setDateField] = useState(null); // 'startDate' | 'endDate'
  
  // Component management states
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [currentComponentIndex, setCurrentComponentIndex] = useState(0);
  const onMedTimePicked = (_, date) => {
    setShowMedTimePicker(false);
    if (date) {
      const hh = String(date.getHours()).padStart(2,'0');
      const mm = String(date.getMinutes()).padStart(2,'0');
      const t = `${hh}:${mm}`;
      if (timeTarget==='add') {
        // Always replace existing times with the new selection for simplicity
        setAddTimes([t]);
      }
      if (timeTarget==='edit') {
        setEditTimes(prev => prev.includes(t)? prev : [...prev, t]);
      }
    }
    setTimeTarget(null);
  };

  const onDatePicked = (_, date) => {
    setShowDatePicker(false);
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      if (dateTarget === 'add') {
        setAddForm(prev => ({ ...prev, [dateField]: dateString }));
      }
      if (dateTarget === 'edit') {
        setEditForm(prev => ({ ...prev, [dateField]: dateString }));
      }
    }
    setDateTarget(null);
    setDateField(null);
  };

  // Component management functions
  const addComponent = () => {
    setAddForm(prev => ({
      ...prev,
      components: [...prev.components, { strength: '', unit: 'Mg' }]
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

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ 
    id:'', 
    name:'', 
    strengthValue:'', 
    strengthUnit:'Mg', 
    times:'', 
    status:'taking', 
    startDate:'', 
    endDate:'',
    isSingleComponent: true, 
    notes:'', 
    dosesLeft:'', 
    quantityValue:'', 
    quantityUnit:'Tablet' 
  });

  // Unit dropdown states
  const [showStrengthUnitDropdown, setShowStrengthUnitDropdown] = useState(false);
  const [showQuantityUnitDropdown, setShowQuantityUnitDropdown] = useState(false);
  const [showEditStrengthUnitDropdown, setShowEditStrengthUnitDropdown] = useState(false);
  const [showEditQuantityUnitDropdown, setShowEditQuantityUnitDropdown] = useState(false);

  // Refs for unit buttons to measure their position
  const strengthUnitButtonRef = useRef(null);
  const quantityUnitButtonRef = useRef(null);
  const editStrengthUnitButtonRef = useRef(null);
  const editQuantityUnitButtonRef = useRef(null);

  // State to store layout of unit buttons
  const [strengthUnitButtonLayout, setStrengthUnitButtonLayout] = useState(null);
  const [quantityUnitButtonLayout, setQuantityUnitButtonLayout] = useState(null);
  const [editStrengthUnitButtonLayout, setEditStrengthUnitButtonLayout] = useState(null);
  const [editQuantityUnitButtonLayout, setEditQuantityUnitButtonLayout] = useState(null);

  // Auto-focus name input when modal opens
  useEffect(() => {
    if (showAdd && addMedNameRef.current) {
      setTimeout(() => {
        addMedNameRef.current?.focus();
      }, 100);
    }
  }, [showAdd]);

  // Note: Medications are now handled locally via AsyncStorage only
  // Database is only used when user explicitly saves a new medication

  const handleAddMed = async () => {
    try {
      if (!addForm.name.trim()) return;
      console.log('[MEDICATIONS DEBUG] Adding medication with quantity:', addForm.quantity);
      
      const newMed = {
        id: `${Date.now()}`,
        name: addForm.name.trim(),
        strength: addForm.components ? 
          addForm.components.map(comp => `${comp.strength}${comp.unit}`).join('/') : 
          '500mg',
        strengthValue: addForm.components ? 
          addForm.components.map(comp => comp.strength).join('/') : 
          '500',
        strengthUnit: addForm.components ? 
          addForm.components[0]?.unit || 'Mg' : 
          'Mg',
        status: addForm.status,
        times: addTimes,
        startDate: addForm.startDate,
        endDate: addForm.endDate,
        notes: addForm.notes.trim(),
        dosesLeft: addForm.dosesLeft.trim(),
        quantity: `${addForm.quantityValue.trim()} ${addForm.quantityUnit}`.trim(),
        quantityValue: addForm.quantityValue.trim(),
        quantityUnit: addForm.quantityUnit,
        remainingQuantity: addForm.quantityValue ? addForm.quantityValue : '0',
        lastRefill: null, // No refill yet
        isSingleComponent: addForm.isSingleComponent // Single or multi-component flag
      };
      
      console.log('[MEDICATIONS DEBUG] New medication object:', newMed);
      
      // Save to local state first for immediate UI update
      setMeds(prev => [...prev, newMed]);
      
      // Save to database if user is authenticated
      if (user && user.uid) {
        try {
          const response = await fetch('https://auricrx-medcoach.onrender.com/api/medications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.uid,
              medicationName: newMed.name,
              strengthValue: newMed.strengthValue,
              strengthUnit: newMed.strengthUnit,
              components: addForm.components,
              status: newMed.status,
              times: newMed.times,
              startDate: newMed.startDate,
              endDate: newMed.endDate,
              notes: newMed.notes,
              dosesLeft: newMed.dosesLeft,
              quantityValue: newMed.quantityValue,
              quantityUnit: newMed.quantityUnit,
              lastRefill: newMed.lastRefill,
              isSingleComponent: newMed.isSingleComponent
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('✅ Medication saved to database:', result.medication.id);
            
            // Update local medication with database ID
            setMeds(prev => prev.map(med => 
              med.id === newMed.id ? { ...med, dbId: result.medication.id } : med
            ));
          } else {
            console.error('❌ Failed to save medication to database:', response.status);
            console.log('📱 Medication saved locally but not synced to server');
          }
        } catch (dbError) {
          console.error('❌ Database save error:', dbError);
          console.log('📱 Medication saved locally but not synced to server');
          // Don't fail the entire operation if database save fails
        }
      } else {
        console.log('⚠️ User not authenticated, medication saved locally only');
      }
      
      setAddForm({ 
        name:'', 
        components: [{ strength: '', unit: 'Mg' }], // Multi-component system
        times:'', 
        status:'taking', 
        startDate:'', 
        endDate:'', 
        notes:'', 
        dosesLeft:'', 
        quantityValue:'', 
        quantityUnit:'tablet',
        isSingleComponent: true // Reset to default
      });
      setAddTimes([]);
      // Close modal immediately after successful add
      setShowAdd(false);
      setInputFocused(false);
      console.log('[MEDICATIONS] Medication added successfully, modal closed');
    } catch (error) {
      console.error('[MEDICATIONS] Error adding medication:', error);
      // Don't close modal on error, let user retry
    }
  };

  const handleEditMed = () => {
    try {
      if (!editForm.name.trim()) return;
      console.log('[MEDICATIONS DEBUG] Editing medication with quantity:', editForm.quantityValue, editForm.quantityUnit);
      setMeds(prev => prev.map(med => 
        med.id === editForm.id 
          ? { 
              ...med, 
              name: editForm.name.trim(), 
              strength: `${editForm.strengthValue.trim()} ${editForm.strengthUnit}`.trim(),
              strengthValue: editForm.strengthValue.trim(),
              strengthUnit: editForm.strengthUnit,
              status: editForm.status, 
              times: editTimes, 
              startDate: editForm.startDate, 
              endDate: editForm.endDate, 
              notes: editForm.notes.trim(), 
              dosesLeft: editForm.dosesLeft.trim(), 
              quantity: `${editForm.quantityValue.trim()} ${editForm.quantityUnit}`.trim(),
              quantityValue: editForm.quantityValue.trim(),
              quantityUnit: editForm.quantityUnit
            }
          : med
      ));
      console.log('[MEDICATIONS DEBUG] Updated medication with quantity:', editForm.quantityValue, editForm.quantityUnit);
      setShowEdit(false);
    } catch (error) {
      console.error('[MEDICATIONS] Error editing medication:', error);
      // Don't close modal on error, let user retry
    }
  };

  const handleDeleteMed = async (id) => {
    // Find the medication to check if it was created from a reminder
    const medToDelete = meds.find(med => med.id === id);
    
    // Delete the medication from local state first for immediate UI update
    setMeds(prev => prev.filter(med => med.id !== id));
    
    // If this medication was created from a reminder, also delete the reminder
    if (medToDelete?.fromReminder && medToDelete?.reminderId && setReminders) {
      console.log('🗑️ Also deleting corresponding reminder:', medToDelete.reminderId);
      setReminders(prev => prev.filter(r => r.id !== medToDelete.reminderId));
    }
    
    // Sync deletion to cloud if user is authenticated and medication has database ID
    if (user && user.uid && (medToDelete?.dbId || medToDelete?.id)) {
      try {
        const medicationId = medToDelete.dbId || medToDelete.id;
        const response = await fetch(`https://auricrx-medcoach.onrender.com/api/medications?userId=${user.uid}&medicationId=${medicationId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          console.log('✅ Medication deleted from database:', medicationId);
        } else {
          console.error('❌ Failed to delete medication from database:', response.status);
          console.log('📱 Medication deleted locally but not synced to server');
        }
      } catch (dbError) {
        console.error('❌ Database delete error:', dbError);
        console.log('📱 Medication deleted locally but not synced to server');
        // Don't fail the entire operation if database delete fails
      }
    } else {
      console.log('⚠️ User not authenticated or medication has no database ID, medication deleted locally only');
    }
  };

  // Handle refill completion - update lastRefill date
  const handleRefillComplete = (medicationName) => {
    const currentDate = new Date().toLocaleDateString();
    setMeds(prev => prev.map(med => 
      med.name === medicationName 
        ? { ...med, lastRefill: currentDate }
        : med
    ));
    console.log('[MEDICATIONS DEBUG] Refill completed for:', medicationName, 'Date:', currentDate);
  };

  // Refill medication function
  const findNearbyMedications = async (medication) => {
    // Haptic feedback to confirm button press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Show loading overlay IMMEDIATELY
    setShowRefillLoading(true);
    
    // Small delay to ensure loading modal renders before heavy processing
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Set up medication info for the refill modal
    const medicationInfo = {
      name: medication.name,
      dosage: medication.strength || 'N/A',
      quantity: medication.quantity || 'N/A',
      quantityUnit: medication.quantityUnit || undefined, // Only include if explicitly set (avoid defaulting to 'tablet')
      lastRefill: medication.lastRefill || S.never || 'Never',
      isSingleComponent: medication.isSingleComponent !== undefined ? medication.isSingleComponent : true // Default to true for existing meds
    };
    
    console.log('🔍 [MEDICATIONS] Refill button pressed for:', medication.name);
    console.log('🔍 [MEDICATIONS] medication.isSingleComponent (from saved data):', medication.isSingleComponent);
    console.log('🔍 [MEDICATIONS] medicationInfo.isSingleComponent (being passed to modal):', medicationInfo.isSingleComponent);
    
    // Show main modal and hide loading overlay
    setRefillMed(medicationInfo);
    setShowRefillModal(true);
    setShowRefillLoading(false);
    
    // The modal will handle location checks and loading internally
    try {
      // First check if location services are available
      const locationEnabled = await Location.hasServicesEnabledAsync();
      if (!locationEnabled) {
        // Modal is already open, just show alert
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to find nearby pharmacies.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Modal is already open, just show alert
        Alert.alert(
          'Location Permission Required',
          'This app needs location permission to find nearby pharmacies. Please grant permission in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }
      
      // Get current position with timeout
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000, // 10 second timeout
        maximumAge: 300000 // 5 minutes
      });
    } catch (error) {
      console.error('Error finding nearby medications:', error);
      
      // Provide specific error messages based on error type
      if (error.message.includes('location services')) {
        Alert.alert(
          'Location Services Unavailable',
          'Please enable location services in your device settings and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      } else if (error.message.includes('timeout')) {
        Alert.alert(
          'Location Timeout',
          'Getting your location is taking too long. Please check your GPS signal and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please check your device settings and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    }
  };

  // Hold date modal
  const [showHoldDate, setShowHoldDate] = useState(false);

  const filteredMeds = meds.filter(med => {
    if (filter === 'all') return true;
    return med.status === filter;
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
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
          {S.medications}
        </DynamicText>

      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }} 
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: getCardBorderColor(),
              backgroundColor: getCardBackgroundColor(),
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12
            }}
          >
            <Image source={require('../icon-library/filter-button-screen-med.png')} style={{ width: 22, height: 22, tintColor: getCardTextColor() }} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (buttonPressed) {
                console.log('Button press ignored - already pressed');
                return;
              }
              setButtonPressed(true);
              debugSetShowAdd(true);
              setTimeout(() => setButtonPressed(false), 500);
            }}
            style={{
              flex: 1,
              backgroundColor: theme.accent,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              alignItems: 'center'
            }}
          >
            <DynamicText type="card" style={{ color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }}>
              {S.addMedication}
            </DynamicText>
          </TouchableOpacity>
        </View>

        {/* DEBUG: Show current medications */}
        {console.log('[MEDICATIONS DEBUG] Current medications array:', meds.map(m => ({ name: m.name, quantity: m.quantity })))}
        
        {filteredMeds.map(med => (
          <View key={med.id} style={[styles.section, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), padding: 12 }]}>
            {/* Header row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <DynamicText type="card" style={{ fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 2 }}>
                  {med.name}
                </DynamicText>
                <DynamicText type="card" style={{ fontSize: 13, fontFamily: 'Inter_400Regular', opacity: 0.7 }}>
                  {med.strength}
                </DynamicText>
                {med.quantity && (
                  <DynamicText type="card" style={{ fontSize: 11, fontFamily: 'Inter_500Medium', opacity: 0.8, marginTop: 1 }}>
                    {med.quantity}
                  </DynamicText>
                )}
                <DynamicText type="sub" style={{ fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 }}>
                  {med.times.map(time => formatTime(time, { format: timeFormat })).join(', ')}
                </DynamicText>
                {/* DEBUG: Show quantity info */}
                {console.log('[MEDICATIONS DEBUG] Rendering medication:', med.name, 'quantity:', med.quantity, 'has quantity:', !!med.quantity)}
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => {
                    console.log('[MEDICATIONS DEBUG] Editing medication:', med.name, 'quantity:', med.quantity);
                    setEditForm({ 
                      ...med, 
                      times: med.times.join(', '),
                      strengthValue: med.strengthValue || med.strength?.split(' ')[0] || '',
                      strengthUnit: toSentenceCase(med.strengthUnit || med.strength?.split(' ').slice(1).join(' ') || 'Mg'),
                      quantityValue: med.quantityValue || med.quantity?.split(' ')[0] || '',
                      quantityUnit: toSentenceCase(med.quantityUnit || med.quantity?.split(' ').slice(1).join(' ') || 'Tablet')
                    });
                    setEditTimes([...med.times]);
                    setShowEdit(true);
                  }}
                  style={{
                    backgroundColor: theme.accent,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 6
                  }}
                >
                  <DynamicText type="card" style={{ color: '#ffffff', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
                    {S.editMed}
                  </DynamicText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => findNearbyMedications(med)}
                  style={{
                    backgroundColor: '#2dd4bf',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 6
                  }}
                >
                  <DynamicText type="card" style={{ color: '#2c2c2c', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
                    {S.refill}
                  </DynamicText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteMed(med.id)}
                  style={{
                    backgroundColor: '#f87171',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 6
                  }}
                >
                  <DynamicText type="card" style={{ color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
                    {S.deleteMed}
                  </DynamicText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Counter and Took Button Row - Compact Corner */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <DynamicText type="card" style={{ fontSize: 10, fontFamily: 'Inter_500Medium', opacity: 0.8, marginRight: 4 }}>
                  {parseFloat(med.remainingQuantity || med.quantity?.replace(/[^\d.]/g, '') || '0')} {S?.left || 'left'}
                </DynamicText>
                <TextInput
                  placeholder="0"
                  placeholderTextColor={getSubTextColor()}
                  value={med.tookAmount || ''}
                  onChangeText={(text) => {
                    setMeds(prev => prev.map(m => 
                      m.id === med.id 
                        ? { ...m, tookAmount: text }
                        : m
                    ));
                  }}
                  style={{
                    backgroundColor: getCardBackgroundColor(),
                    borderRadius: 4,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderWidth: 1,
                    borderColor: getCardBorderColor(),
                    width: 30,
                    height: 20,
                    fontSize: 10,
                    color: getCardTextColor(),
                    fontFamily: 'Inter_500Medium',
                    textAlign: 'center'
                  }}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <TouchableOpacity
                  onPress={() => {
                    const amount = parseFloat(med.tookAmount || '0');
                    if (amount > 0) {
                      const currentRemaining = parseFloat(med.remainingQuantity || med.quantity?.replace(/[^\d.]/g, '') || '0');
                      const newRemaining = Math.max(0, currentRemaining - amount);
                      setMeds(prev => prev.map(m => 
                        m.id === med.id 
                          ? { ...m, remainingQuantity: `${newRemaining}`, tookAmount: '' }
                          : m
                      ));
                    }
                  }}
                  style={{
                    backgroundColor: '#2196F3',
                    borderRadius: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderWidth: 1,
                    borderColor: '#2196F3',
                    height: 20
                  }}
                >
                  <DynamicText type="card" style={{ color: '#fff', fontSize: 8, fontFamily: 'Inter_600SemiBold' }}>
                    {S?.took || 'Took'}
                  </DynamicText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* Add Medication Modal */}
        <Modal 
          visible={showAdd} 
          animationType="slide" 
          transparent 
          presentationStyle="overFullScreen"
          statusBarTranslucent
          onShow={() => console.log('[AddMedicationModal] onShow')}
          onDismiss={() => console.log('[AddMedicationModal] onDismiss')}
          onRequestClose={() => {
            console.log('[AddMedicationModal] onRequestClose called');
            setShowAdd(false);
            setInputFocused(false);
          }}
        >
          {/* Backdrop: closes on outside press */}
          <TouchableOpacity 
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }} 
            activeOpacity={1} // Ensure it's tappable
            onPress={() => {
              console.log('[AddMedicationModal] Backdrop pressed, inputFocused:', inputFocused);
              // Add additional safety checks
              if (!inputFocused && showAdd) { // Only close if no input is focused and modal is actually open
                console.log('[AddMedicationModal] Closing modal via backdrop');
                setShowAdd(false);
                setInputFocused(false);
              } else {
                console.log('[AddMedicationModal] Preventing backdrop close - input focused or modal not open');
              }
            }}
          >
            {/* Modal Content Container */}
            <View
              style={[styles.section, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), marginHorizontal: 16, width: '90%', maxHeight: '80%', padding: 20 }]}
              onStartShouldSetResponder={() => true} // Prevent touches from bubbling up to the backdrop
            >
              <ScrollView 
                contentContainerStyle={{ padding: 16, width: '100%' }} 
                keyboardShouldPersistTaps="always"
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <DynamicText type="card" style={{ fontSize: 18, fontFamily: 'Inter_800ExtraBold' }}>
                    {S.addMedication}
                  </DynamicText>
                  <TouchableOpacity onPress={() => {
                    console.log('[AddMedicationModal] X button pressed');
                    setShowAdd(false);
                    setInputFocused(false);
                  }}>
                    <DynamicText type="sub" style={{ fontSize: 18 }}>✕</DynamicText>
                  </TouchableOpacity>
                </View>

                <TextInput
                  ref={addMedNameRef}
                  placeholder={S.medicationName}
                  placeholderTextColor={getSubTextColor()}
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
                  onFocus={() => {
                    console.log('Input focused');
                    setInputFocused(true);
                  }}
                  onBlur={() => {
                    console.log('Input blurred');
                    // Add a small delay before setting inputFocused to false
                    // This prevents the modal from closing immediately when switching between inputs
                    setTimeout(() => {
                      setInputFocused(false);
                    }, 100);
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />

                {/* Components */}
                <View style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <DynamicText type="card" style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: getCardTextColor() }}>
                        {S?.components || 'Components'} ({addForm.components.length})
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
                    {/* Only show Add Component button when multi is checked */}
                    {!addForm.isSingleComponent && (
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

                      {/* Strength Input */}
                      <TextInput
                        placeholder=""
                        placeholderTextColor={getSubTextColor()}
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
                          {toSentenceCase(component.unit)}
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

                      {/* Remove Component Button - only show in multi mode */}
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

                  {/* Component Summary - only show in multi mode */}
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
                        Total: {addForm.components.map(comp => `${comp.strength || '0'}${comp.unit}`).join(' / ')}
                      </DynamicText>
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setTimeTarget('add');
                      setShowMedTimePicker(true);
                    }}
                    style={{
                      backgroundColor: getCardBackgroundColor(),
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: getCardBorderColor(),
                      flex: 1
                    }}
                  >
                    <DynamicText type="card" style={{ fontFamily: 'Inter_400Regular' }}>
                      {addTimes.length > 0 ? addTimes.map(time => formatTime(time, { format: timeFormat })).join(', ') : S.selectTimes}
                    </DynamicText>
                    <DynamicText type="sub">⏰</DynamicText>
                  </TouchableOpacity>
                  
                  {addTimes.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setAddTimes([])}
                      style={{
                        backgroundColor: '#f87171',
                        borderRadius: 8,
                        padding: 8,
                        width: 32,
                        height: 32,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <DynamicText type="card" style={{ color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' }}>
                        ×
                      </DynamicText>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setDateTarget('add');
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
                    {addForm.startDate || S.startDate}
                  </DynamicText>
                  <DynamicText type="sub">📅</DynamicText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setDateTarget('add');
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
                    {addForm.endDate || S.endDateOptional}
                  </DynamicText>
                  <DynamicText type="sub">📅</DynamicText>
                </TouchableOpacity>

                <TextInput
                  placeholder={S.notesOptional}
                  placeholderTextColor={getSubTextColor()}
                  value={addForm.notes}
                  onChangeText={(text) => setAddForm(prev => ({ ...prev, notes: text }))}
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
                  multiline
                  numberOfLines={3}
                  autoCapitalize="sentences"
                  autoCorrect={true}
                  returnKeyType="default"
                />

                {/* Quantity Value and Unit */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <TextInput
                    placeholder=""
                    placeholderTextColor={getSubTextColor()}
                    value={addForm.quantityValue}
                    onChangeText={(text) => {
                      console.log('[MEDICATIONS DEBUG] Quantity input changed:', text);
                      setAddForm(prev => ({ ...prev, quantityValue: text }));
                    }}
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
                    ref={quantityUnitButtonRef}
                    onPress={() => {
                      quantityUnitButtonRef.current?.measureInWindow((x, y, width, height) => {
                        setQuantityUnitButtonLayout({ x, y, width, height });
                      });
                      setShowQuantityUnitDropdown(true);
                    }}
                    style={{
                      backgroundColor: getCardBackgroundColor(),
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: getCardBorderColor(),
                      paddingHorizontal: 16,
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
                        fontSize: 14,
                        color: getCardTextColor(),
                        fontFamily: 'Inter_600SemiBold'
                      }}
                    >
                      {toSentenceCase(addForm.quantityUnit)}
                    </DynamicText>
                    <DynamicText 
                      type="sub" 
                      style={{ 
                        fontSize: 12,
                        color: getSubTextColor()
                      }}
                    >
                      ▼
                    </DynamicText>
                  </TouchableOpacity>
                </View>

                {/* Status Selection */}
                <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold', marginBottom: 8, marginTop: 8 }}>
                  {S.status}
                </DynamicText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                  {[
                    { key: 'taking', label: S.taking, emoji: '💊', color: '#2dd4bf' },
                    { key: 'onhold', label: S.onHold, emoji: '⏸️', color: '#fbbf24' },
                    { key: 'stopped', label: S.stopped, emoji: '⛔', color: '#f87171' }
                  ].map(status => (
                    <TouchableOpacity
                      key={status.key}
                      onPress={() => setAddForm(prev => ({ ...prev, status: status.key }))}
                      style={{
                        backgroundColor: addForm.status === status.key ? status.color : getCardBackgroundColor(),
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 12,
                        margin: 4,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: getCardBorderColor()
                      }}
                    >
                      <DynamicText type="card" style={{ fontSize: 16, marginRight: 4 }}>{status.emoji}</DynamicText>
                      <DynamicText type="card" style={{ 
                        color: addForm.status === status.key ? '#2c2c2c' : getCardTextColor(), 
                        fontFamily: 'Inter_600SemiBold',
                        fontSize: 14
                      }}>
                        {status.label}
                      </DynamicText>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleAddMed}
                  style={{
                    backgroundColor: theme.accent,
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                    marginTop: 8
                  }}
                >
                  <DynamicText type="card" style={{ color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }}>
                    {S.add}
                  </DynamicText>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Edit Medication Modal */}
        <Modal 
          visible={showEdit} 
          animationType="slide" 
          transparent 
          presentationStyle="overFullScreen"
          statusBarTranslucent
          onRequestClose={() => {
            console.log('[EditMedicationModal] onRequestClose called');
            setShowEdit(false);
          }}
        >
          <TouchableOpacity 
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }} 
            activeOpacity={1}
            onPress={() => {
              console.log('[EditMedicationModal] Backdrop pressed');
              setShowEdit(false);
            }}
          >
            <View
              style={[styles.section, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), marginHorizontal: 16, width: '90%', maxHeight: '80%', padding: 20 }]}
              onStartShouldSetResponder={() => true}
            >
              <ScrollView 
                contentContainerStyle={{ padding: 16, width: '100%' }} 
                keyboardShouldPersistTaps="always"
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <DynamicText type="card" style={{ fontSize: 18, fontFamily: 'Inter_800ExtraBold' }}>
                    {S.editMedication}
                  </DynamicText>
                  <TouchableOpacity onPress={() => {
                    console.log('[EditMedicationModal] X button pressed');
                    setShowEdit(false);
                  }}>
                    <DynamicText type="sub" style={{ fontSize: 18 }}>✕</DynamicText>
                  </TouchableOpacity>
                </View>

                <TextInput
                  placeholder={S.medicationName}
                  placeholderTextColor={getSubTextColor()}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
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
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />

                {/* Strength Value and Unit */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <TextInput
                    placeholder=""
                    placeholderTextColor={getSubTextColor()}
                    value={editForm.strengthValue}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, strengthValue: text }))}
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
                    ref={editStrengthUnitButtonRef}
                    onPress={() => {
                      editStrengthUnitButtonRef.current?.measureInWindow((x, y, width, height) => {
                        setEditStrengthUnitButtonLayout({ x, y, width, height });
                      });
                      setShowEditStrengthUnitDropdown(true);
                    }}
                    style={{
                      backgroundColor: getCardBackgroundColor(),
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: getCardBorderColor(),
                      paddingHorizontal: 16,
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
                        fontSize: 14,
                        color: getCardTextColor(),
                        fontFamily: 'Inter_600SemiBold'
                      }}
                    >
                      {editForm.strengthUnit}
                    </DynamicText>
                    <DynamicText 
                      type="sub" 
                      style={{ 
                        fontSize: 12,
                        color: getSubTextColor()
                      }}
                    >
                      ▼
                    </DynamicText>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setTimeTarget('edit');
                    setShowMedTimePicker(true);
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
                    {editTimes.length > 0 ? editTimes.map(time => formatTime(time, { format: timeFormat })).join(', ') : S.selectTimes}
                  </DynamicText>
                  <DynamicText type="sub">⏰</DynamicText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setDateTarget('edit');
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
                    {editForm.startDate || S.startDate}
                  </DynamicText>
                  <DynamicText type="sub">📅</DynamicText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setDateTarget('edit');
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
                    {editForm.endDate || S.endDateOptional}
                  </DynamicText>
                  <DynamicText type="sub">📅</DynamicText>
                </TouchableOpacity>

                <TextInput
                  placeholder={S.notesOptional}
                  placeholderTextColor={getSubTextColor()}
                  value={editForm.notes}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, notes: text }))}
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
                  multiline
                  numberOfLines={3}
                  autoCapitalize="sentences"
                  autoCorrect={true}
                  returnKeyType="default"
                />

                {/* Quantity Value and Unit */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  <TextInput
                    placeholder=""
                    placeholderTextColor={getSubTextColor()}
                    value={editForm.quantityValue}
                    onChangeText={(text) => {
                      console.log('[MEDICATIONS DEBUG] Edit quantity input changed:', text);
                      setEditForm(prev => ({ ...prev, quantityValue: text }));
                    }}
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
                    ref={editQuantityUnitButtonRef}
                    onPress={() => {
                      editQuantityUnitButtonRef.current?.measureInWindow((x, y, width, height) => {
                        setEditQuantityUnitButtonLayout({ x, y, width, height });
                      });
                      setShowEditQuantityUnitDropdown(true);
                    }}
                    style={{
                      backgroundColor: getCardBackgroundColor(),
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: getCardBorderColor(),
                      paddingHorizontal: 16,
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
                        fontSize: 14,
                        color: getCardTextColor(),
                        fontFamily: 'Inter_600SemiBold'
                      }}
                    >
                      {toSentenceCase(editForm.quantityUnit)}
                    </DynamicText>
                    <DynamicText 
                      type="sub" 
                      style={{ 
                        fontSize: 12,
                        color: getSubTextColor()
                      }}
                    >
                      ▼
                    </DynamicText>
                  </TouchableOpacity>
                </View>

                {/* Status Selection for Edit */}
                <DynamicText type="card" style={{ fontFamily: 'Inter_600SemiBold', marginBottom: 8, marginTop: 8 }}>
                  {S.status}
                </DynamicText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                  {[
                    { key: 'taking', label: S.taking, emoji: '💊', color: '#2dd4bf' },
                    { key: 'onhold', label: S.onHold, emoji: '⏸️', color: '#fbbf24' },
                    { key: 'stopped', label: S.stopped, emoji: '⛔', color: '#f87171' }
                  ].map(status => (
                    <TouchableOpacity
                      key={status.key}
                      onPress={() => setEditForm(prev => ({ ...prev, status: status.key }))}
                      style={{
                        backgroundColor: editForm.status === status.key ? status.color : getCardBackgroundColor(),
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 12,
                        margin: 4,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: getCardBorderColor()
                      }}
                    >
                      <DynamicText type="card" style={{ fontSize: 16, marginRight: 4 }}>{status.emoji}</DynamicText>
                      <DynamicText type="card" style={{ 
                        color: editForm.status === status.key ? '#2c2c2c' : getCardTextColor(), 
                        fontFamily: 'Inter_600SemiBold',
                        fontSize: 14
                      }}>
                        {status.label}
                      </DynamicText>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setMeds(prev => prev.filter(med => med.id !== editForm.id));
                      setShowEdit(false);
                    }}
                    style={{
                      backgroundColor: '#f87171',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: 'center',
                      flex: 1,
                      marginRight: 8
                    }}
                  >
                    <DynamicText type="card" style={{ color: '#fff', fontFamily: 'Inter_700Bold' }}>
                      {S.deleteMed}
                    </DynamicText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleEditMed}
                    style={{
                      backgroundColor: theme.accent,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: 'center',
                      flex: 1,
                      marginLeft: 8
                    }}
                  >
                    <DynamicText type="card" style={{ color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }}>
                      {S.saveBtn}
                    </DynamicText>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Time Picker */}
        {showMedTimePicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            is24Hour={timeFormat === '24h'}
            display="default"
            onChange={onMedTimePicked}
          />
        )}

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="default"
            onChange={onDatePicked}
          />
        )}

        {/* Medication Refill Modal */}
        {refillMed && (
          <MedicationRefillModal
            visible={showRefillModal}
            onClose={() => {
              setShowRefillModal(false);
              setRefillMed(null);
            }}
            medication={refillMed}
            strings={S}
            lang={lang}
            userCountry={userCountry}
            onRefillComplete={handleRefillComplete}
            preloadedPharmacies={preloadedPharmacies}
            preloadedCoords={preloadedCoords}
            preloadedCurrency={preloadedCurrency}
            preloadedFxMeta={preloadedFxMeta}
          />
        )}

      </ScrollView>

      {/* Dropdown Components - Render at the very end */}
      <StrengthUnitDropdown
        visible={showStrengthUnitDropdown}
        units={strengthUnits}
        selectedUnit={addForm.strengthUnit}
        onSelect={(unit) => setAddForm(prev => ({ ...prev, strengthUnit: unit }))}
        onClose={() => setShowStrengthUnitDropdown(false)}
        theme={theme}
        getCardBackgroundColor={getCardBackgroundColor}
        getCardBorderColor={getCardBorderColor}
        getCardTextColor={getCardTextColor}
        buttonLayout={strengthUnitButtonLayout}
      />

      {/* Component Unit Dropdown */}
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
              maxWidth: 300,
              maxHeight: '70%',
              borderWidth: 1,
              borderColor: getCardBorderColor()
            }}
            onStartShouldSetResponder={() => true}
          >
            <DynamicText type="card" style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 12, color: getCardTextColor() }}>
              {S?.selectUnit || 'Select Unit'}
            </DynamicText>
            <ScrollView>
              {strengthUnits.map((unit) => (
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
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <QuantityUnitDropdown
        visible={showQuantityUnitDropdown}
        units={quantityUnits}
        selectedUnit={addForm.quantityUnit}
        onSelect={(unit) => setAddForm(prev => ({ ...prev, quantityUnit: unit }))}
        onClose={() => setShowQuantityUnitDropdown(false)}
        theme={theme}
        getCardBackgroundColor={getCardBackgroundColor}
        getCardBorderColor={getCardBorderColor}
        getCardTextColor={getCardTextColor}
        buttonLayout={quantityUnitButtonLayout}
      />

      {/* Edit Dropdown Components */}
      <StrengthUnitDropdown
        visible={showEditStrengthUnitDropdown}
        units={strengthUnits}
        selectedUnit={editForm.strengthUnit}
        onSelect={(unit) => setEditForm(prev => ({ ...prev, strengthUnit: unit }))}
        onClose={() => setShowEditStrengthUnitDropdown(false)}
        theme={theme}
        getCardBackgroundColor={getCardBackgroundColor}
        getCardBorderColor={getCardBorderColor}
        getCardTextColor={getCardTextColor}
        buttonLayout={editStrengthUnitButtonLayout}
      />

      <QuantityUnitDropdown
        visible={showEditQuantityUnitDropdown}
        units={quantityUnits}
        selectedUnit={editForm.quantityUnit}
        onSelect={(unit) => setEditForm(prev => ({ ...prev, quantityUnit: unit }))}
        onClose={() => setShowEditQuantityUnitDropdown(false)}
        theme={theme}
        getCardBackgroundColor={getCardBackgroundColor}
        getCardBorderColor={getCardBorderColor}
        getCardTextColor={getCardTextColor}
        buttonLayout={editQuantityUnitButtonLayout}
      />

      {/* Refill Loading Overlay - Outside ScrollView */}
      {showRefillLoading && (
        <View 
          key="refill-loading-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}>
          <View style={{
            backgroundColor: theme.cardBg,
            borderRadius: 12,
            padding: 20,
            alignItems: 'center',
            justifyContent: 'center',
            width: 240,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}>
            <Image
              source={require('../assets/dashboard Emojies/standard pill emoji.png')}
              style={{ width: 36, height: 36, marginBottom: 10 }}
            />
            <ActivityIndicator 
              key={Date.now()}
              size="large" 
              color={theme.accent} 
              animating={true}
              hidesWhenStopped={false}
              style={{ marginVertical: 10 }}
            />
            <Text style={{
              fontSize: 14,
              fontFamily: 'Inter_600SemiBold',
              marginBottom: 4,
              textAlign: 'center',
              color: theme.text,
            }}>
              {S?.searchingPharmacies || 'Searching for pharmacies...'}
            </Text>
            <Text style={{
              fontSize: 11,
              textAlign: 'center',
              color: theme.subtext,
            }}>
              {S?.pleaseWait || 'Please wait'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Dropdown components using Modal for top-level rendering
const StrengthUnitDropdown = ({ visible, units, selectedUnit, onSelect, onClose, theme, getCardBackgroundColor, getCardBorderColor, getCardTextColor, buttonLayout }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={{
          position: 'absolute',
          top: buttonLayout ? buttonLayout.y + buttonLayout.height - 22 : 200,
          left: buttonLayout ? buttonLayout.x : 60,
          width: buttonLayout ? buttonLayout.width : 200,
          backgroundColor: getCardBackgroundColor(),
          borderRadius: 8,
          borderWidth: 1,
          borderColor: getCardBorderColor(),
          maxHeight: 150,
          elevation: 100,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
        }}>
          <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={false}>
            {units.map((unit, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  onSelect(unit);
                  onClose();
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderBottomWidth: index < units.length - 1 ? 0.5 : 0,
                  borderBottomColor: getCardBorderColor(),
                  backgroundColor: selectedUnit === unit ? theme.accent + '20' : 'transparent'
                }}
              >
                <DynamicText 
                  type="card" 
                  style={{ 
                    fontSize: 12,
                    color: selectedUnit === unit ? theme.accent : getCardTextColor(),
                    fontFamily: selectedUnit === unit ? 'Inter_600SemiBold' : 'Inter_400Regular'
                  }}
                >
                  {unit}
                </DynamicText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const QuantityUnitDropdown = ({ visible, units, selectedUnit, onSelect, onClose, theme, getCardBackgroundColor, getCardBorderColor, getCardTextColor, buttonLayout }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={{
          position: 'absolute',
          top: buttonLayout ? buttonLayout.y + buttonLayout.height - 22 : 550,
          left: buttonLayout ? buttonLayout.x : 60,
          width: buttonLayout ? buttonLayout.width : 200,
          backgroundColor: getCardBackgroundColor(),
          borderRadius: 8,
          borderWidth: 1,
          borderColor: getCardBorderColor(),
          maxHeight: 150,
          elevation: 100,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
        }}>
          <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={false}>
            {units.map((unit, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  onSelect(unit);
                  onClose();
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderBottomWidth: index < units.length - 1 ? 0.5 : 0,
                  borderBottomColor: getCardBorderColor(),
                  backgroundColor: selectedUnit === unit ? theme.accent + '20' : 'transparent'
                }}
              >
                <DynamicText 
                  type="card" 
                  style={{ 
                    fontSize: 12,
                    color: selectedUnit === unit ? theme.accent : getCardTextColor(),
                    fontFamily: selectedUnit === unit ? 'Inter_600SemiBold' : 'Inter_400Regular'
                  }}
                >
                  {unit}
                </DynamicText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#333333'
  }
});

export default Medications;
