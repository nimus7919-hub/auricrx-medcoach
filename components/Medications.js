import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Image, Keyboard, Alert, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import MedicationRefillModal from './MedicationRefillModal';
import DynamicText from '../src/components/DynamicText';
import { useWallpaper } from '../src/contexts/WallpaperContext';

// Medications component moved outside App to prevent remounting
const Medications = ({ theme, meds, setMeds, S, themeKey, lang, userCountry, onNavigateToDashboard, onNavigateToSettings, preloadedPharmacies, preloadedCoords, preloadedCurrency, preloadedFxMeta }) => {
  // Mount/unmount detection
  const mounted = useRef(0);
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor, getSubTextColor, currentWallpaper } = useWallpaper();
  
  // Debug wallpaper theming
  useEffect(() => {
    console.log('🎨 MEDICATIONS DEBUG - Current wallpaper:', currentWallpaper);
    console.log('🎨 MEDICATIONS DEBUG - Card background color:', getCardBackgroundColor());
    console.log('🎨 MEDICATIONS DEBUG - Card text color:', getCardTextColor());
    console.log('🎨 MEDICATIONS DEBUG - Card border color:', getCardBorderColor());
  }, [currentWallpaper, getCardBackgroundColor, getCardTextColor, getCardBorderColor]);
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
      setAddForm({ name:'', strength:'', times:'', status:'taking', startDate:'', endDate:'', notes:'', dosesLeft:'', quantity:'' });
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
  const [addForm, setAddForm] = useState({ name:'', strength:'', times:'', status:'taking', startDate:'', endDate:'', notes:'', dosesLeft:'', quantity:'' });
  const [addTimes, setAddTimes] = useState([]); // array of HH:MM
  const [editTimes, setEditTimes] = useState([]);
  const [showMedTimePicker, setShowMedTimePicker] = useState(false);
  const [timeTarget, setTimeTarget] = useState(null); // 'add' | 'edit'
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateTarget, setDateTarget] = useState(null); // 'add' | 'edit'
  const [dateField, setDateField] = useState(null); // 'startDate' | 'endDate'
  const onMedTimePicked = (_, date) => {
    setShowMedTimePicker(false);
    if (date) {
      const hh = String(date.getHours()).padStart(2,'0');
      const mm = String(date.getMinutes()).padStart(2,'0');
      const t = `${hh}:${mm}`;
      if (timeTarget==='add') setAddTimes(prev => prev.includes(t)? prev : [...prev, t]);
      if (timeTarget==='edit') setEditTimes(prev => prev.includes(t)? prev : [...prev, t]);
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
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ id:'', name:'', strength:'', times:'', status:'taking', startDate:'', endDate:'', notes:'', dosesLeft:'', quantity:'' });

  // Auto-focus name input when modal opens
  useEffect(() => {
    if (showAdd && addMedNameRef.current) {
      setTimeout(() => {
        addMedNameRef.current?.focus();
      }, 100);
    }
  }, [showAdd]);

  const handleAddMed = () => {
    try {
      if (!addForm.name.trim()) return;
      console.log('[MEDICATIONS DEBUG] Adding medication with quantity:', addForm.quantity);
      const newMed = {
        id: `${Date.now()}`,
        name: addForm.name.trim(),
        strength: addForm.strength.trim(),
        status: addForm.status,
        times: addTimes,
        startDate: addForm.startDate,
        endDate: addForm.endDate,
        notes: addForm.notes.trim(),
        dosesLeft: addForm.dosesLeft.trim(),
        quantity: addForm.quantity.trim(),
        lastRefill: null // No refill yet
      };
      console.log('[MEDICATIONS DEBUG] New medication object:', newMed);
      setMeds(prev => [...prev, newMed]);
      setAddForm({ name:'', strength:'', times:'', status:'taking', startDate:'', endDate:'', notes:'', dosesLeft:'', quantity:'' });
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
      console.log('[MEDICATIONS DEBUG] Editing medication with quantity:', editForm.quantity);
      setMeds(prev => prev.map(med => 
        med.id === editForm.id 
          ? { ...med, name: editForm.name.trim(), strength: editForm.strength.trim(), status: editForm.status, times: editTimes, startDate: editForm.startDate, endDate: editForm.endDate, notes: editForm.notes.trim(), dosesLeft: editForm.dosesLeft.trim(), quantity: editForm.quantity.trim() }
          : med
      ));
      console.log('[MEDICATIONS DEBUG] Updated medication with quantity:', editForm.quantity);
      setShowEdit(false);
    } catch (error) {
      console.error('[MEDICATIONS] Error editing medication:', error);
      // Don't close modal on error, let user retry
    }
  };

  const handleDeleteMed = (id) => {
    setMeds(prev => prev.filter(med => med.id !== id));
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
    try {
      // First check if location services are available
      const locationEnabled = await Location.hasServicesEnabledAsync();
      if (!locationEnabled) {
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
      
      // Set up medication info for the refill modal
      const medicationInfo = {
        name: medication.name,
        dosage: medication.strength || 'N/A',
        quantity: medication.quantity || 'N/A',
        lastRefill: medication.lastRefill || S.never || 'Never'
      };
      
      setRefillMed(medicationInfo);
      setShowRefillModal(true);
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

        <TouchableOpacity onPress={onNavigateToSettings} style={{ padding: 8 }}>
          <Image 
            source={require('../assets/dashboard Emojies/settings cog.png')} 
            style={{
              width: 24,
              height: 24,
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: theme.chip,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12
            }}
          >
            <Image source={require('../icon-library/filter-button-screen-med.png')} style={{ width: 22, height: 22, tintColor: theme.text }} />
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
          <View key={med.id} style={[styles.section, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor() }]}>
            {/* Header row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <DynamicText type="card" style={{ fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 4 }}>
                  {med.name}
                </DynamicText>
                <DynamicText type="card" style={{ fontSize: 14, fontFamily: 'Inter_400Regular', opacity: 0.7 }}>
                  {med.strength}
                </DynamicText>
                {med.quantity && (
                  <DynamicText type="card" style={{ fontSize: 12, fontFamily: 'Inter_500Medium', opacity: 0.8, marginTop: 2 }}>
                    {med.quantity}
                  </DynamicText>
                )}
                {/* DEBUG: Show quantity info */}
                {console.log('[MEDICATIONS DEBUG] Rendering medication:', med.name, 'quantity:', med.quantity, 'has quantity:', !!med.quantity)}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    console.log('[MEDICATIONS DEBUG] Editing medication:', med.name, 'quantity:', med.quantity);
                    setEditForm({ ...med, times: med.times.join(', ') });
                    setEditTimes([...med.times]);
                    setShowEdit(true);
                  }}
                  style={{
                    backgroundColor: theme.accent,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8
                  }}
                >
                  <DynamicText type="card" style={{ color: '#ffffff', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
                    {S.edit}
                  </DynamicText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => findNearbyMedications(med)}
                  style={{
                    backgroundColor: '#2dd4bf',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8
                  }}
                >
                  <DynamicText type="card" style={{ color: '#2c2c2c', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
                    {S.refill}
                  </DynamicText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteMed(med.id)}
                  style={{
                    backgroundColor: '#f87171',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8
                  }}
                >
                  <DynamicText type="card" style={{ color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
                    {S.delete}
                  </DynamicText>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Bottom info */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <DynamicText type="sub" style={{ fontSize: 12, fontFamily: 'Inter_400Regular' }}>
                {med.times.join(', ')}
              </DynamicText>
              <DynamicText type="sub" style={{ fontSize: 12, fontFamily: 'Inter_400Regular' }}>
                {med.dosesLeft} {S.dosesLeft}
              </DynamicText>
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
                  placeholder={(() => {
                    const placeholder = S.medicationName;
                    console.log('🎨 PLACEHOLDER DEBUG - medicationName:', placeholder, 'S object:', S);
                    return placeholder;
                  })()}
                  placeholderTextColor={getSubTextColor()}
                  value={addForm.name}
                  onChangeText={(text) => setAddForm(prev => ({ ...prev, name: text }))}
                  style={(() => {
                    const bgColor = getCardBackgroundColor();
                    const textColor = getCardTextColor();
                    const borderColor = getCardBorderColor();
                    const placeholderColor = getSubTextColor();
                    console.log('🎨 TextInput DEBUG - bgColor:', bgColor, 'textColor:', textColor, 'borderColor:', borderColor, 'placeholderColor:', placeholderColor);
                    return {
                      backgroundColor: bgColor,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      color: textColor,
                      fontFamily: 'Inter_400Regular',
                      borderWidth: 1,
                      borderColor: borderColor
                    };
                  })()}
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

                <TextInput
                  placeholder={(() => {
                    const placeholder = S.strengthExample;
                    console.log('🎨 PLACEHOLDER DEBUG - strengthExample:', placeholder);
                    return placeholder;
                  })()}
                  placeholderTextColor={getSubTextColor()}
                  value={addForm.strength}
                  onChangeText={(text) => setAddForm(prev => ({ ...prev, strength: text }))}
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

                <TouchableOpacity
                  onPress={() => {
                    setTimeTarget('add');
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
                    {addTimes.length > 0 ? addTimes.join(', ') : S.selectTimes}
                  </DynamicText>
                  <DynamicText type="sub">⏰</DynamicText>
                </TouchableOpacity>

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

                <TextInput
                  placeholder="Quantity (e.g., 30 tablets, 1 bottle)"
                  placeholderTextColor={getSubTextColor()}
                  value={addForm.quantity}
                  onChangeText={(text) => {
                    console.log('[MEDICATIONS DEBUG] Quantity input changed:', text);
                    setAddForm(prev => ({ ...prev, quantity: text }));
                  }}
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
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />

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

                <TextInput
                  placeholder={S.strengthExample}
                  placeholderTextColor={getSubTextColor()}
                  value={editForm.strength}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, strength: text }))}
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
                    {editTimes.length > 0 ? editTimes.join(', ') : S.selectTimes}
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

                <TextInput
                  placeholder="Quantity (e.g., 30 tablets, 1 bottle)"
                  placeholderTextColor={getSubTextColor()}
                  value={editForm.quantity}
                  onChangeText={(text) => {
                    console.log('[MEDICATIONS DEBUG] Edit quantity input changed:', text);
                    setEditForm(prev => ({ ...prev, quantity: text }));
                  }}
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
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />

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
                      {S.delete}
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
            is24Hour={true}
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
    </View>
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
