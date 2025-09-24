import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Image, Keyboard, Alert, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import MedicationRefillModal from './MedicationRefillModal';

// Medications component moved outside App to prevent remounting
const Medications = ({ theme, meds, setMeds, S, themeKey, lang, userCountry, onNavigateToDashboard, onNavigateToSettings }) => {
  // Mount/unmount detection
  const mounted = useRef(0);
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
      setAddForm({ name:'', strength:'', times:'', status:'taking', startDate:'', endDate:'', notes:'', dosesLeft:'' });
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
  const [addForm, setAddForm] = useState({ name:'', strength:'', times:'', status:'taking', startDate:'', endDate:'', notes:'', dosesLeft:'' });
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
  const [editForm, setEditForm] = useState({ id:'', name:'', strength:'', times:'', status:'taking', startDate:'', endDate:'', notes:'', dosesLeft:'' });

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
      const newMed = {
        id: `${Date.now()}`,
        name: addForm.name.trim(),
        strength: addForm.strength.trim(),
        status: addForm.status,
        times: addTimes,
        startDate: addForm.startDate,
        endDate: addForm.endDate,
        notes: addForm.notes.trim(),
        dosesLeft: addForm.dosesLeft.trim()
      };
      setMeds(prev => [...prev, newMed]);
      setAddForm({ name:'', strength:'', times:'', status:'taking', startDate:'', endDate:'', notes:'', dosesLeft:'' });
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
      setMeds(prev => prev.map(med => 
        med.id === editForm.id 
          ? { ...med, name: editForm.name.trim(), strength: editForm.strength.trim(), status: editForm.status, times: editTimes, startDate: editForm.startDate, endDate: editForm.endDate, notes: editForm.notes.trim(), dosesLeft: editForm.dosesLeft.trim() }
          : med
      ));
      setShowEdit(false);
    } catch (error) {
      console.error('[MEDICATIONS] Error editing medication:', error);
      // Don't close modal on error, let user retry
    }
  };

  const handleDeleteMed = (id) => {
    setMeds(prev => prev.filter(med => med.id !== id));
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
        lastRefill: medication.lastRefill || 'Never'
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
    <LinearGradient colors={[theme.bgStart, theme.bgEnd]} style={{ flex: 1 }}>
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

        <Text style={{ 
          color: theme.text, 
          fontSize: 18, 
          fontFamily: 'Inter_800ExtraBold', 
          position: 'absolute', 
          left: '50%', 
          transform: [{ translateX: -50 }], 
          maxWidth: '60%' 
        }} numberOfLines={1}>
          {S.medications}
        </Text>

        <TouchableOpacity onPress={onNavigateToSettings} style={{ padding: 8 }}>
          <Text style={{ fontSize: 18, color: theme.accent }}>⚙️</Text>
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
            <Text style={{ color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }}>
              {S.addMedication}
            </Text>
          </TouchableOpacity>
        </View>

        {filteredMeds.map(med => (
          <View key={med.id} style={{
            backgroundColor: theme.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: theme.chip
          }}>
            {/* Header row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 4 }}>
                  {med.name}
                </Text>
                <Text style={{ color: theme.sub, fontSize: 14, fontFamily: 'Inter_400Regular' }}>
                  {med.strength}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
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
                  <Text style={{ color: '#ffffff', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
                    {S.edit}
                  </Text>
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
                  <Text style={{ color: '#2c2c2c', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
                    {S.refill}
                  </Text>
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
                  <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
                    {S.delete}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Bottom info */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: theme.sub, fontSize: 12, fontFamily: 'Inter_400Regular' }}>
                {med.times.join(', ')}
              </Text>
              <Text style={{ color: theme.sub, fontSize: 12, fontFamily: 'Inter_400Regular' }}>
                {med.dosesLeft} {S.dosesLeft}
              </Text>
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
              style={{ backgroundColor: theme.card, borderRadius: 18, padding: 20, marginHorizontal: 16, borderWidth: 1, borderColor: theme.chip, width: '90%', maxHeight: '80%' }}
              onStartShouldSetResponder={() => true} // Prevent touches from bubbling up to the backdrop
            >
              <ScrollView 
                contentContainerStyle={{ padding: 16, width: '100%' }} 
                keyboardShouldPersistTaps="always"
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: theme.text, fontSize: 18, fontFamily: 'Inter_800ExtraBold' }}>
                    {S.addMedication}
                  </Text>
                  <TouchableOpacity onPress={() => {
                    console.log('[AddMedicationModal] X button pressed');
                    setShowAdd(false);
                    setInputFocused(false);
                  }}>
                    <Text style={{ color: theme.sub, fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  ref={addMedNameRef}
                  placeholder={S.medicationName}
                  placeholderTextColor={theme.sub}
                  value={addForm.name}
                  onChangeText={(text) => setAddForm(prev => ({ ...prev, name: text }))}
                  style={{
                    backgroundColor: theme.chip,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    color: theme.text,
                    fontFamily: 'Inter_400Regular'
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

                <TextInput
                  placeholder={S.strengthExample}
                  placeholderTextColor={theme.sub}
                  value={addForm.strength}
                  onChangeText={(text) => setAddForm(prev => ({ ...prev, strength: text }))}
                  style={{
                    backgroundColor: theme.chip,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    color: theme.text,
                    fontFamily: 'Inter_400Regular'
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
                    backgroundColor: theme.chip,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: theme.text, fontFamily: 'Inter_400Regular' }}>
                    {addTimes.length > 0 ? addTimes.join(', ') : S.selectTimes}
                  </Text>
                  <Text style={{ color: theme.sub }}>⏰</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setDateTarget('add');
                    setDateField('startDate');
                    setShowDatePicker(true);
                  }}
                  style={{
                    backgroundColor: theme.chip,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: theme.text, fontFamily: 'Inter_400Regular' }}>
                    {addForm.startDate || S.startDate}
                  </Text>
                  <Text style={{ color: theme.sub }}>📅</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setDateTarget('add');
                    setDateField('endDate');
                    setShowDatePicker(true);
                  }}
                  style={{
                    backgroundColor: theme.chip,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: theme.text, fontFamily: 'Inter_400Regular' }}>
                    {addForm.endDate || S.endDateOptional}
                  </Text>
                  <Text style={{ color: theme.sub }}>📅</Text>
                </TouchableOpacity>

                <TextInput
                  placeholder={S.notesOptional}
                  placeholderTextColor={theme.sub}
                  value={addForm.notes}
                  onChangeText={(text) => setAddForm(prev => ({ ...prev, notes: text }))}
                  style={{
                    backgroundColor: theme.chip,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    color: theme.text,
                    fontFamily: 'Inter_400Regular'
                  }}
                  multiline
                  numberOfLines={3}
                  autoCapitalize="sentences"
                  autoCorrect={true}
                  returnKeyType="default"
                />

                {/* Status Selection */}
                <Text style={{ color: theme.text, fontFamily: 'Inter_600SemiBold', marginBottom: 8, marginTop: 8 }}>
                  {S.status}
                </Text>
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
                        backgroundColor: addForm.status === status.key ? status.color : theme.chip,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 12,
                        margin: 4,
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ fontSize: 16, marginRight: 4 }}>{status.emoji}</Text>
                      <Text style={{ 
                        color: addForm.status === status.key ? '#2c2c2c' : theme.text, 
                        fontFamily: 'Inter_600SemiBold',
                        fontSize: 14
                      }}>
                        {status.label}
                      </Text>
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
                  <Text style={{ color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }}>
                    {S.add}
                  </Text>
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
              style={{ backgroundColor: theme.card, borderRadius: 18, padding: 20, marginHorizontal: 16, borderWidth: 1, borderColor: theme.chip, width: '90%', maxHeight: '80%' }}
              onStartShouldSetResponder={() => true}
            >
              <ScrollView 
                contentContainerStyle={{ padding: 16, width: '100%' }} 
                keyboardShouldPersistTaps="always"
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: theme.text, fontSize: 18, fontFamily: 'Inter_800ExtraBold' }}>
                    {S.editMedication}
                  </Text>
                  <TouchableOpacity onPress={() => {
                    console.log('[EditMedicationModal] X button pressed');
                    setShowEdit(false);
                  }}>
                    <Text style={{ color: theme.sub, fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  placeholder={S.medicationName}
                  placeholderTextColor={theme.sub}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                  style={{
                    backgroundColor: theme.chip,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    color: theme.text,
                    fontFamily: 'Inter_400Regular'
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />

                <TextInput
                  placeholder={S.strengthExample}
                  placeholderTextColor={theme.sub}
                  value={editForm.strength}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, strength: text }))}
                  style={{
                    backgroundColor: theme.chip,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    color: theme.text,
                    fontFamily: 'Inter_400Regular'
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
                    backgroundColor: theme.chip,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: theme.text, fontFamily: 'Inter_400Regular' }}>
                    {editTimes.length > 0 ? editTimes.join(', ') : S.selectTimes}
                  </Text>
                  <Text style={{ color: theme.sub }}>⏰</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setDateTarget('edit');
                    setDateField('startDate');
                    setShowDatePicker(true);
                  }}
                  style={{
                    backgroundColor: theme.chip,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: theme.text, fontFamily: 'Inter_400Regular' }}>
                    {editForm.startDate || S.startDate}
                  </Text>
                  <Text style={{ color: theme.sub }}>📅</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setDateTarget('edit');
                    setDateField('endDate');
                    setShowDatePicker(true);
                  }}
                  style={{
                    backgroundColor: theme.chip,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: theme.text, fontFamily: 'Inter_400Regular' }}>
                    {editForm.endDate || S.endDateOptional}
                  </Text>
                  <Text style={{ color: theme.sub }}>📅</Text>
                </TouchableOpacity>

                <TextInput
                  placeholder={S.notesOptional}
                  placeholderTextColor={theme.sub}
                  value={editForm.notes}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, notes: text }))}
                  style={{
                    backgroundColor: theme.chip,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    color: theme.text,
                    fontFamily: 'Inter_400Regular'
                  }}
                  multiline
                  numberOfLines={3}
                  autoCapitalize="sentences"
                  autoCorrect={true}
                  returnKeyType="default"
                />

                {/* Status Selection for Edit */}
                <Text style={{ color: theme.text, fontFamily: 'Inter_600SemiBold', marginBottom: 8, marginTop: 8 }}>
                  {S.status}
                </Text>
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
                        backgroundColor: editForm.status === status.key ? status.color : theme.chip,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 12,
                        margin: 4,
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ fontSize: 16, marginRight: 4 }}>{status.emoji}</Text>
                      <Text style={{ 
                        color: editForm.status === status.key ? '#2c2c2c' : theme.text, 
                        fontFamily: 'Inter_600SemiBold',
                        fontSize: 14
                      }}>
                        {status.label}
                      </Text>
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
                    <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold' }}>
                      {S.delete}
                    </Text>
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
                    <Text style={{ color: '#ffffff', fontFamily: 'Inter_800ExtraBold' }}>
                      {S.saveBtn}
                    </Text>
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
          />
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default Medications;
